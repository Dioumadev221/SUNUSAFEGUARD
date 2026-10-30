# Base de données

Schéma : `backend/app/models/__init__.py`. Migrations : `backend/migrations` (Alembic).

```bash
cd backend
alembic upgrade head                            # applique les migrations
alembic revision --autogenerate -m "message"    # après modification des modèles
python -m app.cli seed                          # données de démonstration
```

Entités du CDC §10 couvertes : Users, Organizations, ServiceAvailability, ReferralRequests,
ReferralEvents, KnowledgeDocuments, KnowledgeVersions, KnowledgeChunks, KnowledgeReviews,
RAGEvaluations, AIModelConfigurations, SafetyRules, SecurityEvents, AggregateMetrics, Reports,
AuditLogs, plus UsageEvents (base anonyme des indicateurs).

**Rôles et permissions** : versionnés dans `backend/app/core/permissions.py` (matrice auditable)
plutôt qu'en tables ; passage en tables prévu avec la gestion avancée des rôles (Phase 3).

## Recherche vectorielle

Les embeddings sont stockés en JSON (portable SQLite/PostgreSQL) et la similarité est calculée en
Python — suffisant pour la base de démonstration. Pour passer à **pgvector** (l'extension est déjà
activée dans `infrastructure/postgres/init.sql`) :

1. Ajouter une colonne `embedding_vec vector(768)` à `knowledge_chunks` (migration Alembic).
2. Remplacer `rag/retriever.search` par une requête `ORDER BY embedding_vec <=> :q LIMIT :k`.
3. Passer à `EMBEDDING_PROVIDER=ollama` (`nomic-embed-text`) puis `python -m app.cli reindex`.
