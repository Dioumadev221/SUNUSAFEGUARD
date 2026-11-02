"""Garde-fous d'entrée déterministes (CDC §6.3).

Les scénarios critiques sont traités par des règles explicites, auditables et
testées, AVANT tout appel au LLM. Aucune règle ne déclenche de signalement
externe : elles ne font qu'adapter la réponse et proposer des options d'aide.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

RULES_VERSION = "2026.11-mise-en-service"


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text)


# --- Urgence / danger immédiat (FR + quelques expressions wolof à valider) -------
URGENT_PATTERNS = [
    r"\b(me|nous) (tuer|suicider)\b", r"\bsuicid", r"\ben finir\b", r"\bplus envie de vivre\b",
    r"\bje veux mourir\b", r"\bme faire du mal\b", r"\bme blesser\b",
    # Idées suicidaires d'un proche (« mon amie parle de mourir », « il veut se tuer »)
    r"\bse (tuer|suicider|faire du mal)\b", r"\b(parle|parlait|pense|veut|voulait|envie) (de |a )?(mourir|en finir)\b",
    r"\bidees? (noires|de mort)\b", r"\benvie de mourir\b",
    r"\bva me tuer\b", r"\bmenace de (me )?tuer\b", r"\bdanger (de mort|immediat)\b",
    r"\bil me frappe (maintenant|en ce moment)\b", r"\bje suis enfermee?\b",
    r"\bsequestr", r"\bviol(ee|e)? (maintenant|ce soir|en ce moment)\b",
    r"\bsaignement abondant\b", r"\bperdu connaissance\b",
    # Menace armée ou danger déclaré (« il me menace avec un couteau », « je suis en danger »)
    r"\bmenac\w*\b.{0,25}\b(couteau|arme|machette|coupe-coupe|fusil|pistolet)\b",
    r"\b(couteau|arme|machette|coupe-coupe|fusil|pistolet)\b.{0,30}\b(maintenant|en ce moment|ce soir)\b",
    r"\bje suis en danger\b", r"\ben danger (maintenant|en ce moment|ce soir)\b",
    r"\bpeur pour ma vie\b", r"\bau secours\b",
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
    # Formes plus libres : « ignore tes instructions », « oublie tout ce qu'on t'a dit », « disregard … »
    # (?<!ai ) : « j'ai oublié les consignes du médecin » n'est pas une tentative de détournement.
    r"(?<!ai )(?<!as )\b(ignore[rz]?|oublie[rz]?|neglige[rz]?|contourne[rz]?|desactive[rz]?)\b (\w+ ){0,3}(tes|vos|ton|votre|toutes? tes|toutes? vos)\b.{0,15}\b(instructions?|regles?|consignes?|directives?|restrictions?|garde-fous?|filtres?)\b",
    r"(?<!ai )(?<!as )\b(ignore[rz]?|oublie[rz]?|neglige[rz]?|contourne[rz]?|desactive[rz]?)\b (\w+ ){0,3}(les|ces|toutes? les)\b.{0,15}\b(instructions?|consignes? (precedentes?|du systeme)|directives?|garde-fous?|filtres?)\b",
    r"(?<!ai )\boublie[rz]? (tout|ce qu'on t'a dit)\b",
    r"\b(ignore|disregard|forget|bypass|override)\b.{0,30}\b(instructions?|rules?|guidelines?|prompt|restrictions?)\b",
    r"\b(fais comme si|imagine que|fais semblant) (tu )?(n'avais|n'as|etais) (pas|aucune?|plus)\b.{0,20}\b(regle|limite|filtre)",
    r"\b(act as|pretend (to be|you are))\b",
    # Tentatives d'extraction de données d'autres personnes
    r"\b(donne|liste|montre|affiche|envoie|revele|communique|transmets?)[a-z-]*\b.{0,40}\b(numeros?|telephones?|adresses?|e-?mails?|donnees|conversations?|messages?|mots? de passe|identifiants?|contacts?)\b.{0,30}\b(utilisat\w*|usagere?s?|femmes|victimes|personnes|autres|clientes?|membres|comptes?)\b",
    r"\b(base de donnees|database|dump|sql)\b.{0,30}\b(utilisat\w*|users?|comptes?|contenu|tables?)\b",
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
    "ecoute_psychosociale": ["mourir", "suicid", "idees noires", "en finir", "stress", "angoisse", "triste", "tristesse", "seule", "seul", "deprim", "anxi",
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


# La personne parle d'un proche (adapte le message d'urgence, sans changer la priorité).
THIRD_PARTY_PATTERNS = [
    r"\b(mon|ma|mes) (amie?s?|soeur|frere|fille|fils|mere|pere|cousine?|voisine?|collegue|copine?|enfant|niece|neveu|tante|oncle)\b",
    r"\b(une amie?|un proche|une proche|quelqu'un que je connais)\b",
]
FIRST_PERSON_PATTERNS = [r"\bje (veux|vais|voudrais) (mourir|en finir)\b", r"\b(me|nous) (tuer|suicider|faire du mal)\b",
                         r"\bplus envie de vivre\b", r"\bva me tuer\b", r"\bmenace de (me )?tuer\b"]


@dataclass
class SafetyDecision:
    action: str = "allow"          # allow | urgent | refuse_injection | out_of_scope | redirect_professional
    reasons: list[str] = field(default_factory=list)
    rules_version: str = RULES_VERSION
    third_party: bool = False      # danger concernant un proche

    @property
    def blocks_llm(self) -> bool:
        return self.action in {"refuse_injection", "out_of_scope"}


def _match(patterns: list[str], text: str) -> list[str]:
    return [p for p in patterns if re.search(p, text)]


def check_input(text: str) -> SafetyDecision:
    t = _norm(text)
    if hits := _match(URGENT_PATTERNS, t):
        # L'urgence prime toujours : on ne refuse jamais une personne en danger.
        third = bool(_match(THIRD_PARTY_PATTERNS, t)) and not _match(FIRST_PERSON_PATTERNS, t)
        return SafetyDecision("urgent", hits, third_party=third)
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
