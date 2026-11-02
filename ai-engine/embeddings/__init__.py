from .base import Embedder, cosine
from .hashing import HashingEmbedder
from .ollama import OllamaEmbedder


def get_embedder(provider: str = "hashing", **kwargs) -> Embedder:
    """Fabrique : 'hashing' (local, sans dépendance) ou 'ollama'."""
    if provider == "ollama":
        return OllamaEmbedder(**kwargs)
    return HashingEmbedder()


__all__ = ["Embedder", "HashingEmbedder", "OllamaEmbedder", "cosine", "get_embedder"]
