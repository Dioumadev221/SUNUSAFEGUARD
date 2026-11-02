# Déploiement

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
