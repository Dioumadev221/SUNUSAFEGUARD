"""Pont entre le backend et le dossier `ai-engine/`."""
import sys
from functools import lru_cache

from .config import get_settings

_path = get_settings().ai_engine_path
if _path not in sys.path:
    sys.path.insert(0, _path)

from embeddings import get_embedder  # noqa: E402
from llm import OllamaClient  # noqa: E402

__all__ = ["get_ai_embedder", "get_llm"]


@lru_cache
def get_ai_embedder():
    s = get_settings()
    if s.embedding_provider == "ollama":
        return get_embedder("ollama", base_url=s.ollama_url, model=s.embedding_model)
    return get_embedder("hashing")


@lru_cache
def get_llm() -> OllamaClient | None:
    s = get_settings()
    if s.llm_provider != "ollama":
        return None
    return OllamaClient(s.ollama_url, s.ollama_model)
