import httpx


class OllamaEmbedder:
    """Embeddings sémantiques via Ollama.

    Modèle par défaut : `paraphrase-multilingual` (multilingue, ~560 Mo, CPU suffisant) —
    adapté au français et utile pour rapprocher des formulations différentes
    (« parle de mourir » ↔ « idées suicidaires »). Alternative plus lourde : `bge-m3`.
    """

    def __init__(self, base_url: str = "http://127.0.0.1:11434", model: str = "paraphrase-multilingual", timeout: float = 60):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.name = f"ollama:{model}"
        self.dim = 0
        self.timeout = timeout

    def embed(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        # Par lots pour limiter la mémoire côté Ollama.
        for i in range(0, len(texts), 16):
            resp = httpx.post(f"{self.base_url}/api/embed", json={"model": self.model, "input": texts[i : i + 16]},
                              timeout=self.timeout)
            resp.raise_for_status()
            vectors.extend(resp.json()["embeddings"])
        if vectors:
            self.dim = len(vectors[0])
        return vectors
