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
| 4. Recherche | `rag/retriever.py` | Cosinus ; requêtes wolof enrichies (`multilingual/lexicon.py`) |
| 5. Sélection | `pipeline.py` | Seuil absolu + relatif (≥ 60 % du meilleur score), 2 segments max par document |
| 6. Contexte | `rag/context.py` | Extraits numérotés [1], [2]… |
| 7. Génération | `llm/ollama_client.py` | Prompt système strict ; repli extractif si LLM indisponible |
| 8. Vérification des références | `pipeline.py` | Seules les sources citées sont renvoyées |
| 9. Contrôle final | `safety/output_guard.py` | Promesse de confidentialité, diagnostic, banalisation, faux signalement → réponse remplacée |
| 10. Présentation | `backend/app/api/routes/chat.py` | Sources, bandeau d'urgence, lien annuaire |

Seuls les documents au statut **publié** alimentent l'assistant.

## Séparation des espaces

Chaque dashboard correspond à une permission serveur (`backend/app/core/permissions.py`).
Le frontend masque les espaces non autorisés, mais **c'est l'API qui fait foi** (tests
`test_dashboard_permissions`, `test_partner_isolation`).
