# SunuSafeguard AI — commandes courantes (Linux/macOS/WSL). Sous Windows sans make : voir README.
PY ?= python
VENV = backend/.venv
BIN = $(VENV)/bin

.PHONY: install backend frontend dev test eval seed docker-up docker-down docker-llm llm-local lint

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

docker-llm:         ## Télécharge les modèles dans le conteneur Ollama (sinon fait au démarrage du backend)
	docker compose up -d ollama
	docker compose exec ollama ollama pull qwen2.5:3b
	docker compose exec ollama ollama pull paraphrase-multilingual

llm-local:          ## Télécharge les modèles dans un Ollama installé sur la machine
	ollama pull qwen2.5:3b
	ollama pull paraphrase-multilingual

docker-down:
	docker compose down
