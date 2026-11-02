# Déploiement

## Mise en service (production)

Prérequis : un serveur Linux (4 vCPU / 8 Go minimum, 8 vCPU / 16 Go recommandés), Docker,
un nom de domaine dont l'enregistrement DNS A pointe vers l'adresse IP du serveur.

```bash
git clone https://github.com/Dioumadev221/SUNUSAFEGUARD.git && cd SUNUSAFEGUARD
cp .env.production.example .env        # remplir DOMAIN, CORS_ORIGINS, POSTGRES_PASSWORD, JWT_SECRET, DATA_ENCRYPTION_KEY
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- HTTPS est obtenu automatiquement (Caddy, Let's Encrypt) ; seuls les ports 80 et 443 sont ouverts.
- L'API refuse de démarrer si un secret est absent ou laissé à sa valeur par défaut, ou si la base est SQLite.
- En production, le chargement initial ne crée que les structures réelles (`data/seed/organizations_reelles.json`) :
  aucun compte, aucune structure ni activité de démonstration.
- Une sauvegarde PostgreSQL est écrite chaque jour dans `backups/` (14 jours conservés).

Ensuite, une seule fois :

```bash
docker compose exec backend python -m app.cli create-admin admin@votre-domaine.sn
docker compose exec backend python -m app.cli invite-structures /app/identifiants-structures.csv
docker compose cp backend:/app/identifiants-structures.csv .   # puis supprimer la copie du conteneur
```

`invite-structures` crée un compte « responsable partenaire » par structure validée. Le mot de passe
est provisoire : une structure ne reçoit les demandes d'orientation en ligne qu'après sa première
connexion, lorsqu'elle l'a remplacé. Tant que ce n'est pas fait, l'application invite à l'appeler
directement. Remettre les identifiants à chaque référent·e par un canal sûr, puis détruire le fichier.

Une base déjà en service (ancienne installation de démonstration) se nettoie avec
`python -m app.cli remove-demo`.


## Docker Compose (serveur unique)

```bash
cp .env.example .env
# Obligatoire : JWT_SECRET, DATA_ENCRYPTION_KEY, POSTGRES_PASSWORD, GRAFANA_PASSWORD, ENVIRONMENT=production
docker compose up -d --build
# Ollama démarre avec le reste ; le backend télécharge qwen2.5:3b et paraphrase-multilingual (~3 Go)
docker compose --profile monitoring up -d     # Prometheus :9090, Grafana :3000
```

Au démarrage, le backend applique les migrations (`alembic upgrade head`) puis charge les
données de référence (`python -m app.cli seed`). En production, retirer les comptes de
démonstration et l'activité synthétique : `python -m app.cli seed --no-synthetic` puis
`python -m app.cli create-admin admin@exemple.sn`.

## Ressources indicatives

| Profil | CPU | RAM | Remarque |
|---|---|---|---|
| Sans LLM (repli extractif) | 2 vCPU | 2 Go | Suffisant pour une démonstration |
| Avec Ollama `qwen2.5:3b` + embeddings | 4 vCPU | 8 Go | Profil par défaut ; ~5-20 s par réponse sur CPU |
| Avec Ollama `qwen2.5:7b` / `llama3.1:8b` | 8 vCPU ou GPU | 16 Go | Réponses plus fines, latence à mesurer |

## Checklist de mise en service

- [ ] HTTPS (reverse proxy ou certificat sur nginx)
- [ ] Secrets générés et stockés hors du dépôt
- [ ] Sauvegardes planifiées et testées
- [ ] Comptes de démonstration supprimés
- [ ] Points de validation du README traités
