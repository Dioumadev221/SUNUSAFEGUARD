import httpx


class OllamaEmbedder:
    """Embeddings via un serveur Ollama (ex. `ollama pull nomic-embed-text`)."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "nomic-embed-text", timeout: float = 30):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.name = f"ollama:{model}"
        self.dim = 768
        self.timeout = timeout

    def embed(self, texts: list[str]) -> list[list[float]]:
        resp = httpx.post(
            f"{self.base_url}/api/embed", json={"model": self.model, "input": texts}, timeout=self.timeout
        )
        resp.raise_for_status()
        vectors = resp.json()["embeddings"]
        if vectors:
            self.dim = len(vectors[0])
        return vectors
