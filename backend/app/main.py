import asyncio
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.responses import Response

from app.core.config import get_settings
from app.core import ai  # noqa: F401  (ajoute ai-engine au PYTHONPATH)
from app.api.routes import auth, chat, directory, knowledge, metrics, monitoring, rag, referrals, users, voice
from app.core import ratelimit
from app.db.session import Base, SessionLocal, engine

settings = get_settings()
# Pas de corps de requête dans les journaux (CDC §6.4) : seuls méthode, route et statut.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(
    title="SunuSafeguard AI — API",
    version="1.0.0",
    description="API de la plateforme SunuSafeguard AI.",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)
app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_list, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

REQUESTS = Counter("ssg_http_requests_total", "Requêtes HTTP", ["route", "method", "status"])
LATENCY = Histogram("ssg_http_request_seconds", "Latence HTTP", ["route"])


@app.middleware("http")
async def security_headers_and_metrics(request: Request, call_next):
    if (limited := ratelimit.check(request)) is not None:
        return limited
    with LATENCY.labels(request.url.path if not request.url.path.startswith("/api/") else
                        "/".join(request.url.path.split("/")[:3])).time():
        response = await call_next(request)
    REQUESTS.labels("/".join(request.url.path.split("/")[:3]), request.method, response.status_code).inc()
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


for router in (auth.router, users.router, chat.router, directory.router, referrals.router, knowledge.router, rag.router,
               metrics.router, monitoring.router, voice.router):
    app.include_router(router, prefix="/api")


@app.get("/metrics", include_in_schema=False)
def prometheus_metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


async def _daily_purge() -> None:
    """Applique la politique de conservation toutes les 24 h."""
    from app.services.retention import purge

    await asyncio.sleep(60)  # laisse le démarrage (migrations, données) se terminer
    while True:
        try:
            with SessionLocal() as db:
                purge(db)
        except Exception:  # noqa: BLE001
            logging.getLogger("retention").exception("Échec de la purge planifiée")
        await asyncio.sleep(24 * 3600)


@app.on_event("startup")
async def schedule_purge() -> None:
    if settings.environment != "test":
        asyncio.get_running_loop().create_task(_daily_purge())


@app.on_event("startup")
def startup() -> None:
    # En développement : création des tables + données de démo si la base est vide.
    # En production : `alembic upgrade head` puis `python -m app.cli seed` (fait par le Dockerfile).
    if settings.environment in {"development", "test"}:
        from app.services.seed import seed_all

        _reset_dev_schema_if_outdated()
        Base.metadata.create_all(engine)
        with SessionLocal() as db:
            seed_all(db)
    # Détection d'Ollama, téléchargement des modèles manquants, réindexation et calibrage.
    from app.services.ai_state import initialize

    initialize(background=settings.environment != "test")
    # Reconnaissance vocale (optionnelle, requirements-voice.txt) : modèles chargés en arrière-plan.
    if settings.environment != "test":
        import threading

        try:
            from voice.whisper_stt import warm_up
        except ImportError:
            pass
        else:
            threading.Thread(target=lambda: _safe(warm_up), daemon=True).start()


def _safe(fn) -> None:
    try:
        fn()
    except Exception:  # noqa: BLE001
        logging.getLogger("voice").warning("Reconnaissance vocale indisponible (dépendances ou modèles manquants).")


def _reset_dev_schema_if_outdated() -> None:
    """En développement uniquement : si la base locale date d'une version antérieure du schéma
    (colonnes manquantes), elle est recréée avec les données de démonstration."""
    from sqlalchemy import inspect

    inspector = inspect(engine)
    existing = set(inspector.get_table_names())
    for table in Base.metadata.sorted_tables:
        if table.name in existing:
            columns = {c["name"] for c in inspector.get_columns(table.name)}
            if not {c.name for c in table.columns} <= columns:
                logging.getLogger("startup").warning("Schéma local obsolète : base de démonstration recréée.")
                Base.metadata.drop_all(engine)
                return
