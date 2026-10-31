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
| **Sunu Impact** | KPI, évolution, besoins, langues, canaux, carte des régions, rapports PDF/Excel — seuil N ≥ 5 | ✅ |
| **Sunu Orientation** | Création/édition des fiches, disponibilités + historique, validation, mises en relation, délais, alertes de non-réception, équipe | ✅ |
| **Sunu Ressources** | Import PDF/DOCX/TXT, découpage, indexation, workflow de validation, banc d'essai RAG, lacunes, évaluation | ✅ |
| **Sunu Tech** | Qualité IA, latences, garde-fous, état des services, CPU/RAM, journal d'audit, `/metrics` Prometheus | ✅ |
| **Comptes & accès** | Création de comptes avec mot de passe provisoire, rôles, désactivation, réinitialisation ; un responsable partenaire gère l'équipe de sa structure | ✅ |
| **Sécurité des accès** | Double authentification TOTP (QR code) obligatoire pour les comptes privilégiés, changement de mot de passe, limitation de débit sur chat/connexion | ✅ |
| **Rapports** | Rapport d'impact **PDF** et données Excel, historique | ✅ |
| **Conservation** | Purge automatique toutes les 24 h selon la politique configurée, purge manuelle dans Sunu Tech | ✅ |
| **PWA** | Installable sur téléphone, interface mise en cache (jamais les données) | ✅ |
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

### LLM et embeddings (Ollama)

L'assistant utilise [Ollama](https://ollama.com) pour deux choses :

| Rôle | Modèle par défaut | Variable |
|---|---|---|
| Génération des réponses | `qwen2.5:3b` (~2 Go) | `OLLAMA_MODEL` |
| Embeddings sémantiques (FR + wolof approximatif) | `paraphrase-multilingual` (~0,6 Go) | `EMBEDDING_MODEL` |

Installer Ollama (Windows : `winget install Ollama.Ollama`), puis lancer le backend : les modèles
manquants sont **téléchargés automatiquement en arrière-plan** (`OLLAMA_AUTO_PULL=true`), les
documents sont réindexés et le seuil de pertinence est **recalibré** sur le jeu de tests.
Pour tout faire d'un coup et voir l'état : `python -m app.cli ai-status` (dans `backend/`).

La recherche est **hybride** : 75 % similarité sémantique + 25 % lexicale. Sans Ollama,
l'assistant reste en service : recherche lexicale seule et **réponses par extraits** des documents
validés, toujours sourcées. L'état du moteur (mode, modèle, seuil, téléchargements) est visible
dans Sunu Tech → Performance RAG & IA, avec un bouton « Reconnecter ».

## Démarrage avec Docker

```bash
cp .env.example .env          # puis changer JWT_SECRET, DATA_ENCRYPTION_KEY, mots de passe
docker compose up -d --build  # http://localhost:8080 (Ollama inclus, modèles téléchargés au 1er démarrage)
```

## Comptes de démonstration

Mot de passe commun : `SunuDemo2026!` (variable `DEMO_PASSWORD`). **À supprimer en production.**
Les comptes super admin et admin technique sont invités à activer la double authentification
(page « Mon compte ») ; une fois activée, un code est demandé à chaque connexion.

| E-mail | Rôle | Dashboards |
|---|---|---|
| superadmin@sunusafeguard.local | Super administrateur | Tous |
| impact@sunusafeguard.local / analyste@… | Institutionnel / Analyste | Sunu Impact |
| partenaire@… / social@… | Responsable partenaire / Travailleur social | Sunu Orientation (sa structure uniquement) |
| expert@… / linguiste@… | Expert documentaire / linguistique | Sunu Ressources |
| tech@sunusafeguard.local | Administrateur technique | Sunu Tech |

## Tests

```bash
make test   # 27 tests : garde-fous, langue, RAG, RBAC, isolation partenaires, k-anonymat, consentement,
            # non-stockage des messages, comptes, 2FA, limitation de débit, rapports PDF/Excel, purge
make eval   # évaluation RAG : rappel@4 = 93 %, MRR = 0,82 sur le jeu de démo (14 cas)
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

## Mise à jour d'une installation locale existante

Si une ancienne base `backend/sunusafeguard.db` est détectée avec un schéma dépassé, elle est
recréée automatiquement avec les données de démonstration (développement uniquement). Avec
PostgreSQL / Docker, les migrations Alembic s'appliquent au démarrage.

## Points à valider avant toute mise en service

1. Contenus de `data/knowledge_base/` relus par des juristes et professionnel·les psychosociaux.
2. Numéros d'urgence (`data/seed/emergency_contacts.json`) vérifiés.
3. Lexique et messages wolof (`ai-engine/multilingual/lexicon.py`, `ai-engine/llm/fallback.py`) validés par des linguistes.
4. Règles d'urgence (`ai-engine/safety/rules.py`) revues avec des professionnel·les et un protocole validé.
5. Annuaire réel : structures, coordonnées, conventions de partenariat.
6. Analyse d'impact relative à la protection des données (CDC §11.3).
