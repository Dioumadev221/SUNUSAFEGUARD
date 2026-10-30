# SunuSafeguard AI

Plateforme intelligente de soutien psychosocial, d'orientation et de protection — **GREEN T SARL**, Sénégal.

> ⚠️ **Prototype fonctionnel (Phase 1 du cahier des charges).** Les contenus documentaires, les
> structures de l'annuaire et les traductions wolof sont des **données de démonstration** à faire
> valider par des experts habilités. Aucun pilote auprès de personnes vulnérables ne doit démarrer
> avant validation des protocoles de protection (CDC §14, Phase 2).

## Ce qui est livré

| Espace | Contenu | État |
|---|---|---|
| **Interface publique** | Accueil, assistant conversationnel FR/WO, annuaire, mise en relation avec consentement, suivi par code, page confidentialité, **bouton Sortie rapide** (+ Échap ×2), mode sombre par défaut, mobile-first | ✅ |
| **Backend FastAPI** | Auth JWT + RBAC (8 rôles), verrouillage après échecs, 12 familles d'API documentées sur `/api/docs` | ✅ |
| **Moteur IA** (`ai-engine/`) | Détection de langue, classification des besoins, garde-fous déterministes (urgence, prompt injection, hors périmètre, diagnostic), RAG avec sources citées, LLM Ollama + repli extractif, contrôle de sortie | ✅ |
| **Sunu Impact** | KPI, évolution, besoins, langues, canaux, régions, export Excel — seuil N ≥ 5 | ✅ (carte PostGIS : Phase 3) |
| **Sunu Orientation** | Fiches structures, disponibilités + historique, validation, mises en relation, délais | ✅ |
| **Sunu Ressources** | Import PDF/DOCX/TXT, découpage, indexation, workflow de validation, banc d'essai RAG, lacunes, évaluation | ✅ |
| **Sunu Tech** | Qualité IA, latences, garde-fous, état des services, CPU/RAM, journal d'audit, `/metrics` Prometheus | ✅ |
| Voix (STT/TTS wolof) | Interfaces prévues dans `ai-engine/voice` | Phase 4 |

## Démarrage rapide (sans Docker)

Prérequis : **Python 3.11+** et **Node.js 20+**.

**Windows (PowerShell)** :
```powershell
.\scripts\dev.ps1
```

**Linux / macOS / WSL** :
```bash
make install   # une seule fois
make backend   # terminal 1 → http://localhost:8000/api/docs
make frontend  # terminal 2 → http://localhost:5173
```

Au premier démarrage, une base SQLite est créée et remplie avec les données de démonstration
(documents indexés, structures, comptes, activité **synthétique** pour les graphiques).

Sans Ollama, l'assistant fonctionne en **mode repli** : il répond avec les extraits des documents
validés et cite ses sources. Pour activer la génération par LLM :
```bash
ollama pull llama3.1:8b      # puis LLM_PROVIDER=ollama dans .env
```

## Démarrage avec Docker

```bash
cp .env.example .env          # puis changer JWT_SECRET, DATA_ENCRYPTION_KEY, mots de passe
docker compose up -d --build  # http://localhost:8080
make docker-llm               # optionnel : Ollama + modèle
```

## Comptes de démonstration

Mot de passe commun : `SunuDemo2026!` (variable `DEMO_PASSWORD`). **À supprimer en production.**

| E-mail | Rôle | Dashboards |
|---|---|---|
| superadmin@sunusafeguard.local | Super administrateur | Tous |
| impact@sunusafeguard.local / analyste@… | Institutionnel / Analyste | Sunu Impact |
| partenaire@… / social@… | Responsable partenaire / Travailleur social | Sunu Orientation (sa structure uniquement) |
| expert@… / linguiste@… | Expert documentaire / linguistique | Sunu Ressources |
| tech@sunusafeguard.local | Administrateur technique | Sunu Tech |

## Tests

```bash
make test   # 20 tests : garde-fous, langue, RAG, RBAC, isolation partenaires, k-anonymat, consentement, non-stockage des messages
make eval   # évaluation RAG : rappel@4 = 100 %, MRR = 0,85 sur le jeu de démo (10 cas)
```

## Arborescence

```
frontend/        React + TypeScript + Tailwind (Vite)
backend/         FastAPI, SQLAlchemy, Alembic, tests
ai-engine/       llm, rag, embeddings, multilingual, safety, evaluation, voice
infrastructure/  docker, postgres, nginx, monitoring, scripts
data/            knowledge_base, seed, evaluation, fixtures
docs/            architecture, api, security, database, deployment, user-guides
scripts/         démarrage local (Windows / Unix)
```

## Documentation

- [Architecture](docs/architecture/README.md)
- [API](docs/api/README.md)
- [Sécurité et confidentialité](docs/security/README.md)
- [Base de données](docs/database/README.md)
- [Déploiement](docs/deployment/README.md)
- [Charte UI](docs/user-guides/charte-ui.md) · [Guide de démonstration](docs/user-guides/guide-demo.md)

## Points à valider avant toute mise en service

1. Contenus de `data/knowledge_base/` relus par des juristes et professionnel·les psychosociaux.
2. Numéros d'urgence (`data/seed/emergency_contacts.json`) vérifiés.
3. Lexique et messages wolof (`ai-engine/multilingual/lexicon.py`, `ai-engine/llm/fallback.py`) validés par des linguistes.
4. Règles d'urgence (`ai-engine/safety/rules.py`) revues avec des professionnel·les et un protocole validé.
5. Annuaire réel : structures, coordonnées, conventions de partenariat.
6. Analyse d'impact relative à la protection des données (CDC §11.3).
