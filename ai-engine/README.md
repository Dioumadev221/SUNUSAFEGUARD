# ai-engine — Moteur IA de SunuSafeguard AI

Bibliothèque Python indépendante du backend. Le backend l'importe en ajoutant
ce dossier au `PYTHONPATH` (voir `backend/app/core/ai.py` et le `Dockerfile`).

| Module | Rôle (CDC §9.2) |
|---|---|
| `multilingual/` | Détection de langue (fr / wo), lexique d'expansion wolof → français |
| `safety/` | Garde-fous **déterministes** : urgence, prompt injection, hors périmètre, filtrage des données personnelles, contrôle de sortie |
| `embeddings/` | Embeddings locaux (hachage, sans dépendance) ou via Ollama |
| `rag/` | Extraction de texte, découpage, recherche vectorielle, construction du contexte |
| `llm/` | Client Ollama, prompts système, réponse de repli extractive |
| `evaluation/` | Évaluation du RAG sur un jeu de tests documenté |
| `voice/` | Interfaces STT / TTS (Phase 4, non implémentées) |
| `pipeline.py` | Orchestration des 10 étapes de la chaîne |

Chaîne : détection de langue → classification → contrôle de sécurité → recherche
documentaire → sélection des sources → contexte → génération → vérification des
références → contrôle final → présentation.

Si le LLM est indisponible ou si aucune source n'est suffisante, la chaîne
répond par un **comportement de repli** (extrait des sources validées, ou
message honnête + orientation), jamais par une réponse inventée.
