# SunuSafeguard AI — commandes courantes (Linux/macOS/WSL). Sous Windows sans make : voir README.
PY ?= python
VENV = backend/.venv
BIN = $(VENV)/bin

.PHONY: install backend frontend dev test eval seed docker-up docker-down docker-llm lint

install:            ## Installe les dépendances backend et frontend
	$(PY) -m venv $(VENV)
	$(BIN)/pip install -r backend/requirements.txt
	cd frontend && npm install

backend:            ## Lance l'API sur http://localhost:8000 (docs : /api/docs)
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

frontend:           ## Lance l'interface sur http://localhost:5173
	cd frontend && npm run dev

test:               ## Tests backend + IA, puis vérification TypeScript
	cd backend && .venv/bin/python -m pytest -q
	cd frontend && npm run typecheck

eval:               ## Évaluation du RAG sur data/evaluation/rag_testset.json
	cd backend && .venv/bin/python -m app.cli evaluate

seed:               ## Recharge les données de démonstration
	cd backend && .venv/bin/python -m app.cli seed

docker-up:          ## Démarre la pile complète (http://localhost:8080)
	docker compose up -d --build

docker-llm:         ## Démarre Ollama et télécharge le modèle
	docker compose --profile llm up -d ollama
	docker compose exec ollama ollama pull llama3.1:8b

docker-down:
	docker compose down
