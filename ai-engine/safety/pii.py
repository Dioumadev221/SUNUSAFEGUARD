"""Masquage des données personnelles avant toute journalisation (CDC §6.4, §11.1)."""
import re

_PATTERNS = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"), "[email]"),
    # Numéros sénégalais (+221 7X XXX XX XX) et numéros génériques de 8 chiffres ou plus.
    (re.compile(r"(?:\+?221[\s.-]?)?(?:7[05678]|3[03])[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}"), "[téléphone]"),
    (re.compile(r"\b\d[\d\s.-]{7,}\d\b"), "[numéro]"),
]


def scrub_pii(text: str) -> str:
    for pattern, repl in _PATTERNS:
        text = pattern.sub(repl, text)
    return text


def contains_pii(text: str) -> bool:
    return scrub_pii(text) != text
