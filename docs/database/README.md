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
3. Adapter la dimension au modèle actif (`paraphrase-multilingual` : 768).

Chaque segment enregistre le nom de l'embedder qui l'a produit (`embedder`). Au démarrage, les
segments produits par un autre modèle sont réindexés automatiquement ; tant qu'aucun modèle
sémantique n'est disponible, la recherche se fait sur des vecteurs lexicaux calculés en mémoire.
