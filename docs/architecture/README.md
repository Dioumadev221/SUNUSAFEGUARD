# Architecture

```
          Navigateur (PWA, mobile-first)
                     │  HTTPS
              ┌──────▼──────┐
              │   Nginx     │  frontend statique + /api → backend
              └──────┬──────┘
              ┌──────▼──────────────────────────────┐
              │ Backend FastAPI (backend/app)        │
              │  routes → services → modèles         │
              │  RBAC côté serveur (core/permissions)│
              └──┬──────────────┬───────────────┬───┘
                 │              │               │
        ┌────────▼───┐   ┌──────▼──────┐  ┌─────▼──────┐
        │ PostgreSQL │   │  ai-engine  │  │   Ollama   │
        │ (+pgvector)│   │  (Python)   │──▶  LLM local │
        └────────────┘   └─────────────┘  └────────────┘
```

## Chaîne IA (CDC §9.2) — `ai-engine/pipeline.py`

| Étape | Module | Remarque |
|---|---|---|
| 1. Détection de langue | `multilingual/detector.py` | Heuristique FR/WO, à remplacer par un modèle évalué |
| 2. Classification | `safety/rules.py::classify_need` | Mots-clés → 7 catégories du CDC, jamais un diagnostic |
| 3. Contrôle de sécurité | `safety/rules.py::check_input` | Règles **déterministes** ; l'urgence prime sur tout |
| 4. Recherche | `rag/retriever.py` | Hybride : 0,75 × cosinus sémantique (Ollama `paraphrase-multilingual`) + 0,25 × lexical ; lexical seul si Ollama absent ; requêtes wolof enrichies (`multilingual/lexicon.py`) |
| 5. Sélection | `pipeline.py` | Seuil absolu **calibré au démarrage** (`evaluation/calibrate.py`, entre questions dans/hors périmètre) + relatif (≥ 60 % du meilleur score), 2 segments max par document |
| 6. Contexte | `rag/context.py` | Extraits numérotés [1], [2]… |
| 7. Génération | `llm/ollama_client.py` | `qwen2.5:3b` par défaut, prompt système strict ; repli extractif si LLM indisponible |
| 8. Vérification des références | `pipeline.py` | Seules les sources citées sont renvoyées |
| 9. Contrôle final | `safety/output_guard.py` | Promesse de confidentialité, diagnostic, banalisation, faux signalement → réponse remplacée |
| 10. Présentation | `backend/app/api/routes/chat.py` | Sources, bandeau d'urgence, lien annuaire |

Seuls les documents au statut **publié** alimentent l'assistant.

L'état du moteur (`backend/app/services/ai_state.py`) est initialisé au démarrage : détection
d'Ollama, téléchargement des modèles manquants en arrière-plan, réindexation des segments produits
par un autre embedder, recalibrage du seuil. `GET /api/monitoring/ai-engine` l'expose ;
`POST /api/monitoring/ai-engine/reconnect` relance la détection.

## Séparation des espaces

Chaque dashboard correspond à une permission serveur (`backend/app/core/permissions.py`).
Le frontend masque les espaces non autorisés, mais **c'est l'API qui fait foi** (tests
`test_dashboard_permissions`, `test_partner_isolation`).
