import httpx


class LLMUnavailable(RuntimeError):
    pass


class OllamaClient:
    """Client minimal de l'API Ollama (/api/chat). Aucune donnée n'est journalisée ici."""

    def __init__(self, base_url: str = "http://127.0.0.1:11434", model: str = "qwen2.5:3b", timeout: float = 120):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def is_available(self) -> bool:
        try:
            return httpx.get(f"{self.base_url}/api/tags", timeout=2).status_code == 200
        except httpx.HTTPError:
            return False

    def has_model(self, model: str | None = None) -> bool:
        model = model or self.model
        try:
            tags = httpx.get(f"{self.base_url}/api/tags", timeout=3).json().get("models", [])
        except (httpx.HTTPError, ValueError):
            return False
        names = {m.get("name", "") for m in tags} | {m.get("model", "") for m in tags}
        return model in names or f"{model}:latest" in names

    def pull(self, model: str | None = None, timeout: float = 3600) -> bool:
        """Télécharge un modèle (peut prendre plusieurs minutes)."""
        try:
            resp = httpx.post(f"{self.base_url}/api/pull", json={"model": model or self.model, "stream": False},
                              timeout=timeout)
            return resp.status_code == 200
        except httpx.HTTPError:
            return False

    def chat(self, system: str, user: str, temperature: float = 0.2) -> str:
        try:
            resp = httpx.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "stream": False,
                    # num_predict borne la longueur (et donc le temps de génération sur CPU).
                    "options": {"temperature": temperature, "num_predict": 450},
                    "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                },
                timeout=self.timeout,
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"].strip()
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            raise LLMUnavailable(str(exc)) from exc
