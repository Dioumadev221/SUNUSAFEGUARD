"""État du moteur IA : modèle d'embeddings actif, seuil calibré, LLM, téléchargements.

Au démarrage (`initialize`) :
1. si Ollama répond, les modèles manquants sont téléchargés en arrière-plan
   (`OLLAMA_AUTO_PULL`) ;
2. dès que le modèle d'embeddings répond, les documents sont réindexés avec lui
   et le seuil de pertinence est recalibré ;
3. tant que ce n'est pas prêt, l'assistant fonctionne en recherche lexicale, et
   sans LLM il répond par extraits — jamais d'interruption de service.
"""
import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path

from app.core import ai  # noqa: F401
from app.core.config import get_settings

from embeddings import OllamaEmbedder  # noqa: E402
from llm import OllamaClient  # noqa: E402

log = logging.getLogger("ai")
_lock = threading.RLock()


class AIState:
    def __init__(self):
        self.semantic: OllamaEmbedder | None = None
        self.llm: OllamaClient | None = None
        self.threshold: float | None = None
        self.calibration: dict | None = None
        self.events: list[dict] = []
        self.pulling: set[str] = set()
        self._llm_check: tuple[float, bool] = (0.0, False)

    def llm_ready(self) -> bool:
        """Disponibilité du LLM, mise en cache 30 s pour ne pas interroger Ollama à chaque message."""
        import time

        if self.llm is None:
            return False
        checked_at, ok = self._llm_check
        if time.monotonic() - checked_at > 30:
            ok = self.llm.has_model()
            self._llm_check = (time.monotonic(), ok)
        return ok

    def reset_llm_cache(self) -> None:
        self._llm_check = (0.0, False)

    @property
    def embedder_name(self) -> str:
        return self.semantic.name if self.semantic else "lexical"

    def note(self, message: str, level: str = "info") -> None:
        log.log(logging.WARNING if level == "warning" else logging.INFO, message)
        self.events = (self.events + [{"at": datetime.now(timezone.utc).isoformat(), "level": level, "message": message}])[-30:]

    def snapshot(self) -> dict:
        s = get_settings()
        return {
            "retrieval_mode": "hybride" if self.semantic else "lexical",
            "embedder": self.embedder_name,
            "embedding_provider": s.embedding_provider,
            "threshold": self.threshold,
            "calibration": self.calibration,
            "llm_provider": s.llm_provider,
            "llm_model": s.ollama_model if s.llm_provider == "ollama" else None,
            "llm_ready": self.llm_ready(),
            "pulling": sorted(self.pulling),
            "events": list(reversed(self.events)),
        }


state = AIState()


def _client() -> OllamaClient:
    s = get_settings()
    return OllamaClient(s.ollama_url, s.ollama_model, timeout=s.ollama_timeout)


def _try_semantic() -> OllamaEmbedder | None:
    s = get_settings()
    emb = OllamaEmbedder(s.ollama_url, s.embedding_model)
    try:
        emb.embed(["test"])
        return emb
    except Exception:  # noqa: BLE001
        return None


def _pull(client: OllamaClient, model: str) -> bool:
    with _lock:
        if model in state.pulling:
            return False
        state.pulling.add(model)
    state.note(f"Téléchargement du modèle {model} en cours…")
    ok = client.pull(model)
    with _lock:
        state.pulling.discard(model)
    state.note(f"Modèle {model} {'prêt' if ok else 'non téléchargé (voir les journaux Ollama)'}",
               "info" if ok else "warning")
    state.reset_llm_cache()
    return ok


def activate_semantic(emb: OllamaEmbedder | None) -> None:
    """Change de modèle d'embeddings : réindexe et calibre AVANT de basculer, pour que les
    requêtes en cours restent servies par l'ancien mode avec un seuil cohérent."""
    from app.db.session import SessionLocal
    from app.services import knowledge

    with _lock:
        with SessionLocal() as db:
            n = knowledge.reindex_outdated(db, emb)
        threshold, calibration = _calibrate(emb)
        state.semantic, state.threshold, state.calibration = emb, threshold, calibration
        knowledge.invalidate_cache()
    if n:
        state.note(f"{n} document(s) réindexé(s) avec {emb.name}")
    if emb is not None and calibration.get("outside_max") is not None:
        state.note(f"Recherche hybride active ({emb.name}) · seuil calibré à {threshold} ({calibration['method']})")


def recalibrate() -> None:
    with _lock:
        state.threshold, state.calibration = _calibrate(state.semantic)


def _calibrate(emb: OllamaEmbedder | None) -> tuple[float, dict]:
    from app.services.knowledge import load_chunks

    from evaluation import calibrate_threshold  # noqa: E402
    from pipeline import AssistantPipeline  # noqa: E402

    s = get_settings()
    if s.rag_min_score is not None:
        return s.rag_min_score, {"method": "valeur fixée (RAG_MIN_SCORE)"}
    if emb is None:
        return s.rag_lexical_min_score, {"method": "seuil lexical"}
    testset = json.loads((Path(s.data_dir) / "evaluation" / "rag_testset.json").read_text(encoding="utf-8"))
    chunks = load_chunks(emb.name)
    pipeline = AssistantPipeline(emb, lambda: chunks, lexical_min_score=s.rag_lexical_min_score)
    result = calibrate_threshold(pipeline, testset, default=0.35)
    return result["threshold"], result


def initialize(background: bool = True) -> None:
    s = get_settings()
    client = _client()
    state.llm = client if s.llm_provider == "ollama" else None
    state.reset_llm_cache()
    ollama_up = client.is_available() if (s.llm_provider == "ollama" or s.embedding_provider != "hashing") else False

    emb = _try_semantic() if s.embedding_provider != "hashing" and ollama_up else None
    if s.embedding_provider != "hashing" and not ollama_up:
        state.note(f"Ollama injoignable ({s.ollama_url}) : recherche lexicale et réponses par extraits.", "warning")
    activate_semantic(emb)

    def finish_setup():
        if s.embedding_provider != "hashing" and emb is None and s.ollama_auto_pull:
            if _pull(client, s.embedding_model):
                activate_semantic(_try_semantic())
        if state.llm is not None and not state.llm.has_model() and s.ollama_auto_pull:
            _pull(client, s.ollama_model)

    if ollama_up:
        if background:
            threading.Thread(target=finish_setup, name="ai-setup", daemon=True).start()
        else:
            finish_setup()


def reconnect() -> dict:
    """Relance la détection (après installation d'Ollama, par exemple)."""
    initialize(background=True)
    return state.snapshot()
