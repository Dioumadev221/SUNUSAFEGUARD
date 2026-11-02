"""Contrôle final de sécurité sur la réponse générée (CDC §6.3, §9.2 étape 9)."""
import re

FORBIDDEN_OUTPUT = [
    # Promesses de confidentialité absolue
    (r"(totalement|absolument|100 ?%) (confidentiel|anonyme|secret)", "promesse_confidentialite"),
    (r"personne ne (le )?saura jamais", "promesse_confidentialite"),
    # Diagnostic
    (r"\btu (es|souffres d'une?) (depression|trouble bipolaire|schizophrenie)\b", "diagnostic"),
    (r"\bvous (etes|souffrez d'une?) (depression|trouble bipolaire|schizophrenie)\b", "diagnostic"),
    # Banalisation de la violence
    (r"(c'est|ce n'est) (normal|pas grave) (qu'il|qu'elle|de) (te|vous) (frappe|batte)", "banalisation"),
    (r"\b(reste|restez) avec (lui|ton mari|votre mari) (pour|malgre)", "banalisation"),
    # Signalement automatique (interdit)
    (r"j'ai (alerte|prevenu|contacte) (la police|les autorites)", "signalement_automatique"),
]


def _norm(text: str) -> str:
    import unicodedata

    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def check_output(answer: str) -> tuple[bool, list[str]]:
    """Retourne (ok, violations)."""
    t = _norm(answer)
    violations = [label for pattern, label in FORBIDDEN_OUTPUT if re.search(pattern, t)]
    return (not violations, violations)
