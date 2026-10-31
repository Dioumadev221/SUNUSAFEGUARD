"""Orchestration de la chaîne IA (CDC §9.2) :

1. Détection de langue        6. Construction du contexte
2. Classification du besoin   7. Génération par le LLM (ou repli)
3. Contrôle de sécurité       8. Vérification des références
4. Recherche documentaire     9. Contrôle final de sécurité
5. Sélection des sources     10. Présentation de la réponse

Aucune donnée de conversation n'est conservée par ce module.
"""
from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from typing import Callable

from embeddings import Embedder, HashingEmbedder
from llm import SYSTEM_PROMPT, LLMUnavailable, OllamaClient, build_user_prompt, extractive_answer, template_message
from multilingual import detect_language, expand_query
from rag import Chunk, build_context, search
from safety import check_input, check_output, classify_need

# Les petits modèles open source ne maîtrisent pas le wolof : on répond en français simple,
# précédé d'une phrase wolof validable (voir llm/fallback.py), plutôt que d'inventer du wolof.
LANG_NAMES = {"fr": "français", "wo": "français simple (la personne a écrit en wolof : phrases très courtes, vocabulaire courant)"}


@dataclass
class PipelineResult:
    answer: str
    language: str
    language_confidence: float
    category: str
    safety_action: str
    safety_reasons: list[str]
    sources: list[dict]
    grounded: bool
    used_llm: bool
    show_emergency: bool
    suggest_directory: bool
    top_score: float
    timings_ms: dict = field(default_factory=dict)
    debug: dict = field(default_factory=dict)


class AssistantPipeline:
    def __init__(
        self,
        embedder: Embedder | None,
        chunk_loader: Callable[[], list[Chunk]],
        llm: OllamaClient | None = None,
        min_score: float = 0.12,
        top_k: int = 4,
        lexical_min_score: float = 0.12,
    ):
        """`embedder` : modèle sémantique (None = recherche lexicale seule).
        `min_score` : seuil en mode hybride ; `lexical_min_score` : seuil en mode lexical."""
        self.embedder = None if isinstance(embedder, HashingEmbedder) else embedder
        self.lexical = HashingEmbedder()
        self.chunk_loader = chunk_loader
        self.llm = llm
        self.hybrid_min_score = min_score if self.embedder else lexical_min_score
        self.lexical_min_score = lexical_min_score
        self.top_k = top_k
        self.mode = "hybride" if self.embedder else "lexical"

    @property
    def min_score(self) -> float:
        return self.hybrid_min_score if self.mode == "hybride" else self.lexical_min_score

    def retrieve(self, question: str, lang: str, top_k: int | None = None, min_score: float = 0.0):
        query = expand_query(question) if lang == "wo" else question
        qlex = self.lexical.embed([query])[0]
        qvec = None
        if self.embedder is not None:
            try:
                qvec = self.embedder.embed([query])[0]
                self.mode = "hybride"
            except Exception:  # noqa: BLE001 — modèle indisponible : repli lexical
                self.mode = "lexical"
        return query, search(qvec, self.chunk_loader(), top_k or self.top_k, min_score, query_lex=qlex)

    def run(self, message: str, debug: bool = False) -> PipelineResult:
        t: dict[str, float] = {}
        start = time.perf_counter()

        lang_info = detect_language(message)
        lang = lang_info["lang"] if lang_info["lang"] != "unknown" else "fr"
        t["language_detection"] = (time.perf_counter() - start) * 1000

        category = classify_need(message)
        decision = check_input(message)
        t["safety_input"] = (time.perf_counter() - start) * 1000 - sum(t.values())

        base = dict(
            language=lang, language_confidence=lang_info["confidence"], category=category,
            safety_action=decision.action, safety_reasons=decision.reasons,
        )

        if decision.blocks_llm:
            return PipelineResult(
                answer=template_message(decision.action, lang), sources=[], grounded=False, used_llm=False,
                show_emergency=False, suggest_directory=decision.action == "out_of_scope", top_score=0.0,
                timings_ms=_round(t), **base,
            )

        r0 = time.perf_counter()
        query, results = self.retrieve(message, lang)
        t["retrieval"] = (time.perf_counter() - r0) * 1000
        top_score = results[0].score if results else 0.0
        # Sources retenues : au-dessus du seuil absolu ET proches du meilleur score (évite les hors-sujets).
        # En situation d'urgence, on n'ajoute un contenu documentaire que s'il est clairement pertinent.
        # (marge fixe en mode hybride : les scores sémantiques ne sont pas à la même échelle).
        urgent_floor = self.min_score + 0.08 if self.mode == "hybride" else self.min_score * 2
        floor = max(urgent_floor if decision.action == "urgent" else self.min_score, top_score * 0.6)
        relevant = [r for r in results if r.score >= floor]
        context, refs = build_context(relevant)
        ref_of = {cid: r["ref"] for r in refs for cid in r["chunk_ids"]}
        relevant = [r for r in relevant if r.chunk.id in ref_of]  # extraits réellement transmis

        prefix = ""
        if decision.action == "urgent":
            prefix = template_message("urgent_third_party" if decision.third_party else "urgent", lang)
        elif decision.action == "redirect_professional":
            prefix = template_message("redirect_professional", lang)

        used_llm = False
        if not relevant and decision.action == "urgent":
            body = ""
        elif not relevant:
            body = template_message("no_source", lang)
        else:
            g0 = time.perf_counter()
            body = None
            if self.llm is not None:
                try:
                    body = self.llm.chat(
                        SYSTEM_PROMPT.format(language=LANG_NAMES.get(lang, "français")),
                        build_user_prompt(message, context),
                    )
                    used_llm = True
                except LLMUnavailable:
                    body = None
            if body is None:
                body = extractive_answer(relevant, lang, ref_of=ref_of)
            elif lang == "wo":
                body = f"{template_message('wolof_intro', lang)}\n\n{body}"
            t["generation"] = (time.perf_counter() - g0) * 1000

        # 8. Vérification des références : on ne garde que les sources citées (ou toutes en mode repli).
        cited = {int(n) for n in re.findall(r"\[(\d+)\]", body)}
        sources = [r for r in refs if r["ref"] in cited] if used_llm and cited else refs
        grounded = bool(sources)

        # 9. Contrôle final de sécurité.
        ok, violations = check_output(body)
        if not ok:
            body = extractive_answer(relevant, lang, ref_of=ref_of) if relevant else template_message("no_source", lang)
            used_llm = False
            base["safety_reasons"] = decision.reasons + [f"output:{v}" for v in violations]

        answer = "\n\n".join(part for part in (prefix, body) if part)
        t["total"] = (time.perf_counter() - start) * 1000
        return PipelineResult(
            answer=answer, sources=sources, grounded=grounded, used_llm=used_llm,
            show_emergency=decision.action == "urgent",
            suggest_directory=decision.action == "urgent" or not grounded or category in {
                "hebergement_protection", "violences_physiques_verbales", "information_juridique"},
            top_score=top_score, timings_ms=_round(t),
            debug={"query": query, "context": context, "retrieval_mode": self.mode} if debug else {}, **base,
        )


def _round(t: dict) -> dict:
    return {k: round(v, 2) for k, v in t.items()}
