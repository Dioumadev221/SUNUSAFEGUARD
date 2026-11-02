# Contexte de build : racine du dépôt (voir docker-compose.yml)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend:/app/ai-engine \
    AI_ENGINE_PATH=/app/ai-engine \
    DATA_DIR=/app/data

WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai-engine /app/ai-engine
COPY data /app/data
COPY backend /app/backend

RUN useradd --create-home --uid 1000 sunu && chown -R sunu /app
USER sunu

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"
CMD ["sh", "-c", "alembic upgrade head && python -m app.cli seed && uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers"]
