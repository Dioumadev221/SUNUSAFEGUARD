from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(ROOT_DIR / ".env", ".env"), extra="ignore")

    app_name: str = "SunuSafeguard AI"
    environment: str = "development"
    database_url: str = f"sqlite:///{ROOT_DIR / 'backend' / 'sunusafeguard.db'}"
    cors_origins: str = "http://localhost:5173,http://localhost:8080"

    # Sécurité
    jwt_secret: str = "change-me-in-production-please-32chars-min"
    jwt_expire_minutes: int = 60
    max_failed_logins: int = 5
    lockout_minutes: int = 15
    # Clé Fernet (base64 32 octets) pour chiffrer les données d'orientation.
    data_encryption_key: str = ""
    demo_password: str = "SunuDemo2026!"

    # IA
    ai_engine_path: str = str(ROOT_DIR / "ai-engine")
    llm_provider: str = "ollama"          # ollama | none
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    embedding_provider: str = "hashing"   # hashing | ollama
    embedding_model: str = "nomic-embed-text"
    rag_min_score: float = 0.12
    rag_top_k: int = 4

    # Confidentialité
    k_anonymity_threshold: int = 5
    data_dir: str = str(ROOT_DIR / "data")

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
