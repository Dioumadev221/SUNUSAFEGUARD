import httpx


class LLMUnavailable(RuntimeError):
    pass


class OllamaClient:
    """Client minimal de l'API Ollama (/api/chat). Aucune donnée n'est journalisée ici."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.1:8b", timeout: float = 60):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def is_available(self) -> bool:
        try:
            return httpx.get(f"{self.base_url}/api/tags", timeout=2).status_code == 200
        except httpx.HTTPError:
            return False

    def chat(self, system: str, user: str, temperature: float = 0.2) -> str:
        try:
            resp = httpx.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "stream": False,
                    "options": {"temperature": temperature},
                    "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                },
                timeout=self.timeout,
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"].strip()
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            raise LLMUnavailable(str(exc)) from exc
