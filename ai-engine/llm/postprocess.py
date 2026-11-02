"""Nettoyage déterministe des réponses générées.

Un petit modèle ne respecte pas toujours ses consignes. Ces règles retirent, phrase par
phrase, ce qui ne doit jamais atteindre la personne :
- un conseil d'écrire, de parler ou de demander quelque chose à l'auteur des violences ;
- un nom d'organisation (sigle) absent des fiches vérifiées ;
- le tutoiement (converti en vouvoiement, ou réponse rejetée si la conversion est impossible).
"""
from __future__ import annotations

import re
import unicodedata

AUTHOR = r"(votre |ton |l'|son |le |cet |cette )?(ex|ex-mari|ex-conjoint|ex-copain|mari|conjoint|compagnon|copain|partenaire|agresseur|auteur|harceleur|harceleuse)\b"
CONTACT_VERBS = r"(envoye[rz]|ecrive[rz]|ecris|contacte[rz]|appele[rz]|parle[rz]|dites|demande[rz]|explique[rz]|confronte[rz]|affronte[rz]|discute[rz]|negocie[rz])"
CONFRONTATION = [
    re.compile(rf"\b{CONTACT_VERBS}\b[^.!?]{{0,60}}\b(a|avec) {AUTHOR}"),
    re.compile(rf"\b(demandez|demander)[- ]lui\b"),
    re.compile(rf"\b(envoyez|ecrivez)[- ]lui\b"),
]
NEGATION = re.compile(r"\b(ne|n')\s*\w*\s*(pas|jamais|plus)\b|\bevitez\b|\bsans\b")

# Sigles toujours admis (services publics, plateformes, sigles des fiches du projet).
KNOWN_ACRONYMS = {"SAMU", "AJS", "ONG", "OMS", "CEGID", "CLVF", "IST", "VIH", "SIDA", "CDP", "SMS", "PDF", "UNICEF",
                  "DER", "SENELEC", "CEDAF", "BP"}

TU_REPLACEMENTS = [
    (r"\btu n'es\b", "vous n'êtes"), (r"\btu es\b", "vous êtes"), (r"\btu as\b", "vous avez"),
    (r"\btu peux\b", "vous pouvez"), (r"\btu dois\b", "vous devez"), (r"\btu veux\b", "vous voulez"),
    (r"\btu te sens\b", "vous vous sentez"), (r"\btu ressens\b", "vous ressentez"), (r"\btu vis\b", "vous vivez"),
    (r"\btu traverses\b", "vous traversez"), (r"\btu n'as\b", "vous n'avez"), (r"\btu n'hésites\b", "vous n'hésitez"),
    (r"\bn'hésite pas\b", "n'hésitez pas"), (r"\bte stressent\b", "vous stressent"), (r"\bte\b", "vous"),
    (r"\bt'", "vous "), (r"\btoi\b", "vous"), (r"\bton\b", "votre"), (r"\bta\b", "votre"), (r"\btes\b", "vos"),
]
TU_LEFT = re.compile(r"\b(tu|te|toi|ton|ta|tes)\b", re.I)


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _sentences(text: str) -> list[str]:
    # Coupe après . ! ? et aux retours à la ligne, en gardant la ponctuation.
    return [s for s in re.split(r"(?<=[.!?])\s+|\n+", text) if s.strip()]


def _is_confrontation(sentence: str) -> bool:
    t = _norm(sentence)
    return any(p.search(t) for p in CONFRONTATION) and not NEGATION.search(t)


def _unknown_acronyms(sentence: str, context: str) -> list[str]:
    found = re.findall(r"\b[A-Z]{2,}[A-Z0-9]*\b", sentence)
    return [a for a in found if a not in KNOWN_ACRONYMS and a not in context]


def to_vous(text: str) -> str | None:
    """Convertit les formes de tutoiement courantes ; None s'il en reste (réponse à rejeter)."""
    def keep_case(repl):
        return lambda m: repl[:1].upper() + repl[1:] if m.group(0)[:1].isupper() else repl

    for pattern, repl in TU_REPLACEMENTS:
        text = re.sub(pattern, keep_case(repl), text, flags=re.I)
    return None if TU_LEFT.search(text) else text


def clean_answer(text: str, context: str) -> tuple[str | None, list[str]]:
    """Retourne (texte nettoyé ou None, raisons)."""
    reasons, kept = [], []
    for line in text.split("\n"):
        parts = []
        for s in _sentences(line):
            if _is_confrontation(s):
                reasons.append("confrontation")
                continue
            if _unknown_acronyms(s, context):
                reasons.append("organisation_inconnue")
                continue
            parts.append(s.strip())
        if parts or not line.strip():
            kept.append(" ".join(parts))
    cleaned = re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).strip()
    cleaned = re.sub(r"(?m)^-\s*$\n?", "", cleaned)
    vous = to_vous(cleaned)
    if vous is None:
        reasons.append("tutoiement")
        return None, reasons
    return (vous if len(vous) > 40 else None), reasons
