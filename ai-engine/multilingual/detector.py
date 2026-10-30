"""Détection de langue légère français / wolof.

Heuristique par marqueurs lexicaux : suffisante pour le prototype (Phase 1),
à remplacer par un modèle évalué sur un jeu de tests validé par des linguistes.
"""
import re
import unicodedata

# Mots fréquents et peu ambigus du wolof (orthographe CLAD et variantes courantes).
WOLOF_MARKERS = {
    "naka", "nanga", "def", "mangi", "maa", "dama", "dafa", "dafay", "dafa", "yow", "man",
    "moo", "ndax", "lan", "lu", "lou", "nan", "nanu", "fan", "fu", "foo", "kan", "kooku",
    "dimbal", "dimbali", "yoon", "yoonu", "jàmm", "jamm", "jërëjëf", "jerejef", "waaw",
    "deedeet", "baax", "bëgg", "begg", "xam", "xamul", "mën", "men", "mënul", "naay", "naa",
    "sama", "sa", "seen", "sunu", "jëkkër", "jekker", "jabar", "doom", "kër", "ker",
    "tey", "démb", "demb", "ëllëg", "dangay", "damay", "ragal", "tiit", "metti", "dóor",
    "door", "dóor", "xeex", "wax", "waxal", "nit", "ñu", "nu", "ak", "ci", "la", "dañu",
    "amul", "am", "dara", "lool", "rekk", "itam", "gëm", "fexe", "soxla", "wallu",
}
FRENCH_MARKERS = {
    "je", "tu", "il", "elle", "nous", "vous", "ils", "le", "la", "les", "un", "une", "des",
    "est", "suis", "mon", "ma", "mes", "que", "qui", "quoi", "pour", "avec", "dans", "pas",
    "comment", "pourquoi", "aide", "aider", "besoin", "peux", "puis", "veux", "mari", "et",
    "ou", "sur", "par", "mais", "très", "j'ai", "c'est", "être", "avoir", "faire",
}
# Mots présents dans les deux listes : ne comptent pas.
_AMBIGUOUS = WOLOF_MARKERS & FRENCH_MARKERS


def _tokens(text: str) -> list[str]:
    text = unicodedata.normalize("NFC", text.lower())
    return re.findall(r"[a-zàâäçéèêëîïôöûùüÿñœæëãẽóõ'’]+", text)


def detect_language(text: str) -> dict:
    """Retourne {"lang": "fr"|"wo"|"unknown", "confidence": float, "scores": {...}}."""
    toks = _tokens(text)
    if not toks:
        return {"lang": "unknown", "confidence": 0.0, "scores": {"fr": 0, "wo": 0}}
    wo = sum(1 for t in toks if t in WOLOF_MARKERS and t not in _AMBIGUOUS)
    fr = sum(1 for t in toks if t in FRENCH_MARKERS and t not in _AMBIGUOUS)
    # Graphies typiquement wolof (ë, ñ, doubles voyelles).
    wo += sum(0.5 for t in toks if re.search(r"ë|ñ|aa|ee|oo|uu|ii", t))
    total = wo + fr
    if total == 0:
        return {"lang": "fr", "confidence": 0.3, "scores": {"fr": 0, "wo": 0}}
    lang = "wo" if wo > fr else "fr"
    return {
        "lang": lang,
        "confidence": round(max(wo, fr) / total, 2),
        "scores": {"fr": fr, "wo": wo},
    }
