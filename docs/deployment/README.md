# Déploiement

## Docker Compose (serveur unique)

```bash
cp .env.example .env
# Obligatoire : JWT_SECRET, DATA_ENCRYPTION_KEY, POSTGRES_PASSWORD, GRAFANA_PASSWORD, ENVIRONMENT=production
docker compose up -d --build
docker compose --profile llm up -d ollama && docker compose exec ollama ollama pull llama3.1:8b
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
| Avec Ollama `llama3.1:8b` | 8 vCPU ou GPU | 16 Go | Latence de génération à mesurer |

## Checklist de mise en service

- [ ] HTTPS (reverse proxy ou certificat sur nginx)
- [ ] Secrets générés et stockés hors du dépôt
- [ ] Sauvegardes planifiées et testées
- [ ] Comptes de démonstration supprimés
- [ ] Points de validation du README traités
