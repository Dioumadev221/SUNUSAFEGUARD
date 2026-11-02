from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
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
    # 127.0.0.1 plutôt que localhost : sous Windows, « localhost » essaie d'abord IPv6 et
    # perd ~2 s par requête quand Ollama n'écoute qu'en IPv4.
    ollama_url: str = "http://127.0.0.1:11434"

    @field_validator("ollama_url")
    @classmethod
    def _ipv4_localhost(cls, v: str) -> str:
        return v.replace("://localhost", "://127.0.0.1")
    ollama_model: str = "qwen2.5:3b"
    ollama_timeout: float = 120
    ollama_auto_pull: bool = True         # télécharge les modèles manquants au démarrage
    embedding_provider: str = "auto"      # auto (Ollama si joignable, sinon lexical) | ollama | hashing
    embedding_model: str = "paraphrase-multilingual"
    rag_min_score: float | None = None    # None = calibrage automatique sur le jeu de tests
    rag_lexical_min_score: float = 0.12   # seuil en mode lexical (sans modèle d'embeddings)
    rag_top_k: int = 4

    # Limitation de débit (requêtes / fenêtre en secondes, par adresse IP hachée)
    rate_limit_chat: str = "30/60"
    rate_limit_login: str = "10/60"

    # Orientations : alerte si une demande transmise n'est pas reçue après N heures
    referral_alert_hours: int = 24

    # Politique de conservation (jours)
    retention_usage_days: int = 395
    retention_security_days: int = 180
    retention_audit_days: int = 730
    retention_referral_days: int = 365

    # Confidentialité
    k_anonymity_threshold: int = 5
    data_dir: str = str(ROOT_DIR / "data")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}

    def production_problems(self) -> list[str]:
        """Réglages incompatibles avec une mise en service : l'API refuse de démarrer tant qu'il en reste."""
        problems = []
        if len(self.jwt_secret) < 32 or "change-me" in self.jwt_secret or "remplacer" in self.jwt_secret:
            problems.append("JWT_SECRET : générer une valeur aléatoire d'au moins 32 caractères")
        if not self.data_encryption_key:
            problems.append("DATA_ENCRYPTION_KEY : générer une clé Fernet")
        if self.database_url.startswith("sqlite"):
            problems.append("DATABASE_URL : utiliser PostgreSQL, pas SQLite")
        if any(o.startswith("http://") and "localhost" not in o for o in self.cors_list) or not self.cors_list:
            problems.append("CORS_ORIGINS : indiquer les adresses https:// du site")
        return problems

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.is_production and (problems := settings.production_problems()):
        raise RuntimeError("Configuration de production incomplète :\n- " + "\n- ".join(problems))
    return settings
