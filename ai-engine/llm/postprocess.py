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
# « ou·e », « et·e » : point médian accroché à un mot qui ne s'accorde pas.
BROKEN_INCLUSIVE = re.compile(r"\b(ou|et|de|des|les|le|la|à|au|aux|en|pour|avec)·e\b")
# Phrase qui ne se comprend qu'avec la précédente (« Si cela ne fonctionne pas… »).
DEPENDENT_START = re.compile(r"^(si (cela|ca|ce n'est|elle|il)|sinon|ensuite|dans ce cas|puis|apres cela)\b")
IMPERATIVES = {"prends": "prenez", "fais": "faites", "essaie": "essayez", "parle": "parlez", "respire": "respirez",
               "écris": "écrivez", "garde": "gardez", "sois": "soyez", "demande": "demandez", "contacte": "contactez",
               "appelle": "appelez", "consulte": "consultez", "accorde": "accordez", "prévois": "prévoyez",
               "planifie": "planifiez", "va": "allez", "rapproche-toi": "rapprochez-vous", "oublie": "oubliez"}
IMPERATIVE_RE = re.compile(r"(^|[.!?]\s+|,\s*(?:et\s+)?|\bet\s+|\bn')(" + "|".join(map(re.escape, IMPERATIVES)) + r")\b",
                           re.I)
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


def _same_case(source: str, repl: str) -> str:
    return repl[:1].upper() + repl[1:] if source[:1].isupper() else repl


def to_vous(text: str) -> str | None:
    """Convertit les formes de tutoiement courantes ; None s'il en reste (phrase à retirer)."""
    if TU_LEFT.search(text) or re.search(r"\b(n'hésite|prends soin)\b", text, re.I):
        text = IMPERATIVE_RE.sub(
            lambda m: m.group(1) + _same_case(m.group(2), IMPERATIVES[m.group(2).lower()]), text)
    for pattern, repl in TU_REPLACEMENTS:
        text = re.sub(pattern, lambda m, r=repl: _same_case(m.group(0), r), text, flags=re.I)
    return None if TU_LEFT.search(text) else text


def clean_answer(text: str, context: str) -> tuple[str | None, list[str]]:
    """Retourne (texte nettoyé ou None, raisons)."""
    reasons, kept = [], []
    text = BROKEN_INCLUSIVE.sub(r"\1", text)
    previous_removed = False
    for line in text.split("\n"):
        parts = []
        for s in _sentences(line):
            reason = ("confrontation" if _is_confrontation(s) else
                      "organisation_inconnue" if _unknown_acronyms(s, context) else
                      "suite_orpheline" if previous_removed and DEPENDENT_START.match(_norm(s.strip())) else None)
            if reason is None:
                vous = to_vous(s)
                reason = "tutoiement" if vous is None else None
                s = vous or s
            previous_removed = reason is not None
            if reason:
                reasons.append(reason)
                continue
            parts.append(s.strip())
        if parts or not line.strip():
            kept.append(" ".join(parts))
    cleaned = re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).strip()
    cleaned = re.sub(r"\s+(ou|et)\s*([.!?])", r"\2", cleaned)  # « … un psychologue ou. »
    cleaned = re.sub(r"(?m)^-\s*$\n?", "", cleaned)
    return (cleaned if len(cleaned) > 40 else None), reasons
