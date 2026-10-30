"""Embedder local déterministe (hashing trick sur mots + n-grammes de caractères).

Avantages pour le prototype : aucune dépendance, aucun téléchargement de modèle,
reproductible pour les tests. Limite : sémantique faible (pas de synonymie) —
d'où l'expansion lexicale wolof → français et l'option Ollama
(`EMBEDDING_PROVIDER=ollama`, modèle `nomic-embed-text`) pour la suite.
"""
import hashlib
import math
import re
import unicodedata

STOPWORDS = {
    "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "a", "au", "aux", "en",
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles", "me", "te", "se", "ce",
    "que", "qui", "quoi", "est", "sont", "pour", "par", "sur", "dans", "avec", "pas", "ne",
    "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses", "y", "l", "d", "j", "c", "s",
    "qu", "n", "m", "t", "si", "plus", "tres", "comme", "mais", "etre", "avoir", "fait",
}


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _stem(word: str) -> str:
    # Racinisation très simple pour le français (pluriels, féminins, -ment, -tion).
    for suf in ("ements", "ement", "ations", "ation", "euses", "euse", "esse", "ees", "es", "s", "e"):
        if len(word) > len(suf) + 3 and word.endswith(suf):
            return word[: -len(suf)]
    return word


class HashingEmbedder:
    name = "hashing-v1"

    def __init__(self, dim: int = 512):
        self.dim = dim

    def _features(self, text: str) -> list[tuple[str, float]]:
        words = [w for w in re.findall(r"[a-z0-9]+", _normalize(text)) if w not in STOPWORDS]
        feats: list[tuple[str, float]] = []
        for w in words:
            s = _stem(w)
            feats.append(("w:" + s, 1.0))
            padded = f"#{s}#"
            for i in range(len(padded) - 3):
                feats.append(("c:" + padded[i : i + 4], 0.3))
        return feats

    def _embed_one(self, text: str) -> list[float]:
        vec = [0.0] * self.dim
        for feat, weight in self._features(text):
            h = int.from_bytes(hashlib.md5(feat.encode()).digest()[:4], "little")
            vec[h % self.dim] += weight if (h >> 31) & 1 else -weight
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [round(v / norm, 6) for v in vec]

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(t) for t in texts]
