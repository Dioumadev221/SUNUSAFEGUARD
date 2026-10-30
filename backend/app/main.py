import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.responses import Response

from app.core.config import get_settings
from app.core import ai  # noqa: F401  (ajoute ai-engine au PYTHONPATH)
from app.api.routes import auth, chat, directory, knowledge, metrics, monitoring, rag, referrals
from app.db.session import Base, SessionLocal, engine

settings = get_settings()
# Pas de corps de requête dans les journaux (CDC §6.4) : seuls méthode, route et statut.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(
    title="SunuSafeguard AI — API",
    version="0.1.0",
    description="API de la plateforme SunuSafeguard AI (Phase 1 — prototype fonctionnel).",
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
    with LATENCY.labels(request.url.path if not request.url.path.startswith("/api/") else
                        "/".join(request.url.path.split("/")[:3])).time():
        response = await call_next(request)
    REQUESTS.labels("/".join(request.url.path.split("/")[:3]), request.method, response.status_code).inc()
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


for router in (auth.router, chat.router, directory.router, referrals.router, knowledge.router, rag.router,
               metrics.router, monitoring.router):
    app.include_router(router, prefix="/api")


@app.get("/metrics", include_in_schema=False)
def prometheus_metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.on_event("startup")
def startup() -> None:
    # En développement : création des tables + données de démo si la base est vide.
    # En production : utiliser `alembic upgrade head` puis `python -m scripts.seed`.
    if settings.environment == "development":
        from app.services.seed import seed_all

        Base.metadata.create_all(engine)
        with SessionLocal() as db:
            seed_all(db)
