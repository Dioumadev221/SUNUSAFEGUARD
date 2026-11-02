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
# Doublement du féminin (« seule·e ») et petites tournures fautives fréquentes du modèle.
DOUBLED_FEMININE = re.compile(r"\b(\w+e)·e\b")
FIXES = [
    (re.compile(r"\bque vous pouvez confier\b"), "à qui vous pouvez confier"),
    (re.compile(r"\s*(décrits?|décrites?|mentionnée?s?|présentée?s?)? ?dans le contexte\b"), ""),
    (re.compile(r"\bdérangeé\b"), "dérangée"),
]
# L'annuaire s'appelle « Trouver de l'aide » sur le site : on le nomme comme la personne le voit.
DIRECTORY_PAGE = "la page « Trouver de l'aide »"
DIRECTORY_VERB = re.compile(r"\b(consult|ouvr|contact|voi|utilis|appel)(ez|er|ir) (à |a )?l'annuaire"
                            r"( des services de l'[ÉE]tat| SunuSafeguard| des structures(?: d'aide)?)?", re.I)
DIRECTORY_NOUN = re.compile(r"\bl'annuaire( des services de l'[ÉE]tat| SunuSafeguard| des structures(?: d'aide)?)?", re.I)
# Le modèle ne voit pas l'écran : toute description de bouton ou de position est inventée.
INTERFACE = re.compile(r"\b(bouton|cliquez|cliquer|en haut à|en bas à|à gauche de l'écran|à droite de l'écran|menu)\b", re.I)


def name_directory(text: str) -> str:
    def verb(m: re.Match) -> str:
        word = "Consult" if m.group(1)[0].isupper() else "consult"
        return f"{word}{'er' if m.group(2).lower() in ('er', 'ir') else 'ez'} {DIRECTORY_PAGE}"
    text = DIRECTORY_VERB.sub(verb, text)
    text = DIRECTORY_NOUN.sub(DIRECTORY_PAGE, text)
    return re.sub(r"\b(de|à) la page", lambda m: f"{m.group(1)} la page", text)
# Phrase qui ne se comprend qu'avec la précédente (« Si cela ne fonctionne pas… »).
DEPENDENT_START = re.compile(r"^(si (cela|ca|ce n'est|elle|il)|sinon|ensuite|dans ce cas|puis|apres cela)\b")
IMPERATIVES = {"prends": "prenez", "fais": "faites", "essaie": "essayez", "parle": "parlez", "respire": "respirez",
               "écris": "écrivez", "garde": "gardez", "sois": "soyez", "demande": "demandez", "contacte": "contactez",
               "appelle": "appelez", "consulte": "consultez", "accorde": "accordez", "prévois": "prévoyez",
               "planifie": "planifiez", "va": "allez", "rapproche-toi": "rapprochez-vous", "oublie": "oubliez"}
IMPERATIVE_RE = re.compile(r"(^|[.!?]\s+|,\s*(?:et\s+)?|\bet\s+|\bn')(" + "|".join(map(re.escape, IMPERATIVES)) + r")\b",
                           re.I)
# Impératif de 2e personne en début de phrase ou d'élément de liste (« 1. Essaye de… », « Partage tes… »).
START = r"(^|[.!?:]\s+|\d[.)]\s+|[-•]\s+)"
IRREGULAR_IMPERATIVES = {"prends": "prenez", "fais": "faites", "va": "allez", "sois": "soyez", "écris": "écrivez",
                         "dis": "dites", "mets": "mettez", "bois": "buvez", "prévois": "prévoyez", "fixe-toi": "fixez-vous",
                         "accorde-toi": "accordez-vous", "rapproche-toi": "rapprochez-vous", "repose-toi": "reposez-vous"}
NOT_VERBS = {"une", "cette", "votre", "notre", "chaque", "elle", "comme", "lorsque", "puisque", "quelque", "même",
             "personne", "parce", "presque", "une", "bonne", "autre", "seule", "toute", "aucune", "chose", "comme"}
ER_IMPERATIVE_RE = re.compile(START + r"([A-ZÉÈ][a-zéèêàçï]+e)(?=\s+(de|d'|à|au|aux|des|les|la|le|un|une|avec|vos|votre|"
                              r"quelqu|régulièrement|ce|ces|tes|ta|ton|en|toujours|chaque)\b)")
IRREGULAR_RE = re.compile(START + r"(" + "|".join(map(re.escape, IRREGULAR_IMPERATIVES)) + r")\b", re.I)
TU_LEFT = re.compile(r"\b(tu|te|toi|ton|ta|tes)\b", re.I)


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _sentences(text: str) -> list[str]:
    # Coupe après . ! ? et aux retours à la ligne, en gardant la ponctuation.
    return [s for s in re.split(r"(?<=[.!?])\s+|\n+", text) if s.strip()]


def _is_confrontation(sentence: str) -> bool:
    """Conseil de contacter l'auteur, sauf si c'est ce verbe-là qui est nié (« ne lui écrivez pas »)."""
    t = _norm(sentence)
    for pattern in CONFRONTATION:
        for m in pattern.finditer(t):
            before, after = t[max(0, m.start() - 25):m.start()], t[m.start():m.start() + 40]
            negated = (re.search(r"\b(ne|n')\s*(lui |leur |l')?$", before)
                       or re.search(r"\b(evitez|eviter|sans|refusez)\b[^.!?]*$", before)
                       or re.search(r"^\S+\s+(pas|jamais|plus)\b", after))
            if not negated:
                return True
    return False


def _unknown_acronyms(sentence: str, context: str) -> list[str]:
    found = re.findall(r"\b[A-Z]{2,}[A-Z0-9]*\b", sentence)
    return [a for a in found if a not in KNOWN_ACRONYMS and a not in context]


def _same_case(source: str, repl: str) -> str:
    return repl[:1].upper() + repl[1:] if source[:1].isupper() else repl


def to_vous(text: str) -> str | None:
    """Convertit les formes de tutoiement courantes ; None s'il en reste (phrase à retirer)."""
    text = re.sub(r"\bEncourage-vous à\b", "Je vous encourage à", text)
    text = IMPERATIVE_RE.sub(
        lambda m: m.group(1) + _same_case(m.group(2), IMPERATIVES[m.group(2).lower()]), text)
    text = IRREGULAR_RE.sub(
        lambda m: m.group(1) + _same_case(m.group(2), IRREGULAR_IMPERATIVES[m.group(2).lower()]), text)
    text = ER_IMPERATIVE_RE.sub(
        lambda m: m.group(0) if m.group(2).lower() in NOT_VERBS else m.group(1) + m.group(2) + "z", text)
    for pattern, repl in TU_REPLACEMENTS:
        text = re.sub(pattern, lambda m, r=repl: _same_case(m.group(0), r), text, flags=re.I)
    return None if TU_LEFT.search(text) else text


def clean_answer(text: str, context: str) -> tuple[str | None, list[str]]:
    """Retourne (texte nettoyé ou None, raisons)."""
    reasons, kept = [], []
    text = BROKEN_INCLUSIVE.sub(r"\1", text)
    text = DOUBLED_FEMININE.sub(r"\1", text)
    for pattern, repl in FIXES:
        text = pattern.sub(repl, text)
    text = name_directory(text)
    previous_removed = False
    for line in text.split("\n"):
        parts = []
        for s in _sentences(line):
            reason = ("confrontation" if _is_confrontation(s) else
                      "interface_inventee" if INTERFACE.search(s) else
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
