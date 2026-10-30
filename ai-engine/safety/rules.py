"""Garde-fous d'entrée déterministes (CDC §6.3).

Les scénarios critiques sont traités par des règles explicites, auditables et
testées, AVANT tout appel au LLM. Aucune règle ne déclenche de signalement
externe : elles ne font qu'adapter la réponse et proposer des options d'aide.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

RULES_VERSION = "2026.10-phase1"


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text)


# --- Urgence / danger immédiat (FR + quelques expressions wolof à valider) -------
URGENT_PATTERNS = [
    r"\b(me|nous) (tuer|suicider)\b", r"\bsuicid", r"\ben finir\b", r"\bplus envie de vivre\b",
    r"\bje veux mourir\b", r"\bme faire du mal\b", r"\bme blesser\b",
    r"\bva me tuer\b", r"\bmenace de (me )?tuer\b", r"\bdanger (de mort|immediat)\b",
    r"\bil me frappe (maintenant|en ce moment)\b", r"\bje suis enfermee?\b",
    r"\bsequestr", r"\bviol(ee|e)? (maintenant|ce soir|en ce moment)\b",
    r"\bsaignement abondant\b", r"\bperdu connaissance\b",
    # Wolof (provisoire, à valider par des linguistes)
    r"\bdinaa dee\b", r"\bdafay rey\b", r"\bbëgg naa dee\b", r"\bbegg naa dee\b",
    r"\bwallu leen\b", r"\bwallu ma\b",
]

# --- Tentatives de prompt injection ----------------------------------------------
INJECTION_PATTERNS = [
    r"ignore (all |toutes? )?(les |the )?(previous|precedentes?|instructions)",
    r"oublie (toutes? )?(tes|les) (instructions|regles)",
    r"\bsystem prompt\b", r"\bprompt systeme\b", r"\bjailbreak\b", r"\bdan mode\b",
    r"tu es maintenant", r"you are now", r"agis comme si tu n'avais (pas|aucune) regle",
    r"revele (ton|tes|le) (prompt|instructions|configuration)",
    r"<\s*/?\s*(system|assistant)\s*>", r"\bdeveloper mode\b",
]

# --- Demandes clairement hors périmètre -------------------------------------------
OUT_OF_SCOPE_PATTERNS = [
    r"\b(code|programme|script) (python|javascript|java)\b", r"\bbitcoin\b", r"\bcrypto",
    r"\bparis sportifs?\b", r"\bpronostic", r"\brecette de\b", r"\bhoroscope\b",
    r"\bdevoirs? de (maths|physique)\b", r"\bcomment pirater\b",
]

# --- Demandes de diagnostic / prescription (à rediriger vers un professionnel) ----
MEDICAL_PATTERNS = [
    r"\b(quel|quels) (medicament|traitement)s?\b", r"\bdiagnosti", r"\bsuis-je (depressive?|malade|bipolaire)\b",
    r"\bdosage\b", r"\bposologie\b", r"\bavorter seule\b",
]

# Catégories analytiques (CDC §3.2) — jamais présentées comme des diagnostics.
CATEGORIES: dict[str, list[str]] = {
    "ecoute_psychosociale": ["stress", "angoisse", "triste", "tristesse", "seule", "seul", "deprim", "anxi",
                             "dormir", "pleure", "mal-etre", "ecoute", "parler a quelqu", "tiit", "metti", "xel"],
    "violences_physiques_verbales": ["frappe", "coups", "battue", "violence", "insulte", "menace", "gifle",
                                     "door", "xeex", "agress", "viol"],
    "violences_economiques": ["argent", "salaire", "depenses", "prive de", "economique", "xaalis",
                              "travailler", "confisque", "pension"],
    "cyberharcelement": ["internet", "photos", "whatsapp", "facebook", "tiktok", "en ligne", "cyber",
                         "harcel", "message", "numerique", "chantage", "video"],
    "hebergement_protection": ["heberg", "dormir dehors", "chassee", "logement", "abri", "refuge",
                               "quitter la maison", "ker", "partir de chez"],
    "information_juridique": ["droit", "loi", "plainte", "police", "gendarmerie", "tribunal", "avocat",
                              "divorce", "juridique", "justice", "yoon", "certificat medical", "procedure"],
    "sante_reproductive": ["enceinte", "grossesse", "contracep", "menstruation", "sante reproductive", " ist ",
                           "accouch", "biir", "planning familial", "excision", "mutilation"],
}


@dataclass
class SafetyDecision:
    action: str = "allow"          # allow | urgent | refuse_injection | out_of_scope | redirect_professional
    reasons: list[str] = field(default_factory=list)
    rules_version: str = RULES_VERSION

    @property
    def blocks_llm(self) -> bool:
        return self.action in {"refuse_injection", "out_of_scope"}


def _match(patterns: list[str], text: str) -> list[str]:
    return [p for p in patterns if re.search(p, text)]


def check_input(text: str) -> SafetyDecision:
    t = _norm(text)
    if hits := _match(URGENT_PATTERNS, t):
        # L'urgence prime toujours : on ne refuse jamais une personne en danger.
        return SafetyDecision("urgent", hits)
    if hits := _match(INJECTION_PATTERNS, t):
        return SafetyDecision("refuse_injection", hits)
    if hits := _match(OUT_OF_SCOPE_PATTERNS, t):
        return SafetyDecision("out_of_scope", hits)
    if hits := _match(MEDICAL_PATTERNS, t):
        return SafetyDecision("redirect_professional", hits)
    return SafetyDecision("allow")


def classify_need(text: str) -> str:
    """Catégorie de besoin la plus probable (mots-clés), ou 'autre'."""
    t = _norm(text)
    scores = {cat: sum(1 for kw in kws if kw in t) for cat, kws in CATEGORIES.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "autre"
