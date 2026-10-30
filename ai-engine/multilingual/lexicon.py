"""Lexique d'expansion wolof → français pour la recherche documentaire.

La base documentaire de démonstration est en français : on enrichit la requête
wolof avec des équivalents français pour que la recherche vectorielle retrouve
les bons segments. ⚠️ Lexique provisoire : il DOIT être revu et complété par des
spécialistes du wolof (CDC §9.4) avant toute utilisation publique.
"""
import re

WOLOF_TO_FRENCH: dict[str, str] = {
    "dimbal": "aide aider soutien",
    "dimbali": "aider aide",
    "yoon": "droit loi justice procédure",
    "yoonu": "droit loi chemin procédure",
    "wallu": "secours aide urgence",
    "soxla": "besoin",
    "jëkkër": "mari conjoint",
    "jekker": "mari conjoint",
    "jabar": "épouse femme conjointe",
    "dóor": "frapper coups violence physique",
    "door": "frapper coups violence physique",
    "xeex": "dispute violence conflit",
    "ragal": "peur danger",
    "tiit": "peur angoisse stress",
    "metti": "souffrance douleur difficile",
    "xel": "esprit santé mentale",
    "kër": "maison hébergement logement",
    "ker": "maison hébergement logement",
    "xaalis": "argent violence économique",
    "liggéey": "travail emploi",
    "doom": "enfant",
    "jigéen": "femme fille",
    "jigeen": "femme fille",
    "telefon": "téléphone numérique",
    "internet": "internet cyberharcèlement numérique",
    "wér": "santé",
    "wer": "santé",
    "biir": "grossesse santé reproductive",
    "sëy": "mariage",
    "sey": "mariage",
    "fasé": "divorce",
    "mën": "pouvoir possible",
    "naay": "pouvoir",
    "am": "avoir obtenir",
}


def expand_query(text: str) -> str:
    """Ajoute à la requête les équivalents français des mots wolof connus."""
    words = re.findall(r"[\wëñéóàç]+", text.lower())
    extra = [WOLOF_TO_FRENCH[w] for w in words if w in WOLOF_TO_FRENCH]
    return text if not extra else f"{text} {' '.join(extra)}"
