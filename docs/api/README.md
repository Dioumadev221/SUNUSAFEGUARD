# API

Documentation interactive OpenAPI : **http://localhost:8000/api/docs**.

| Famille (CDC §13) | Routes principales | Accès |
|---|---|---|
| Authentication | `POST /api/auth/login`, `GET /api/auth/me` | public / connecté |
| Chat | `POST /api/chat`, `GET /api/emergency-contacts` | public |
| Service Directory | `GET /api/directory`, `GET /api/directory/manage`, `POST/PUT /api/directory`, `POST /api/directory/{id}/availability`, `/validate`, `/history` | public (validées) / partenaires / super admin |
| Referral | `POST /api/referrals` (consentement obligatoire), `GET /api/referrals/status/{code}`, `GET /api/referrals`, `PATCH /api/referrals/{id}`, `GET /api/referrals/stats` | public / structure destinataire |
| Knowledge | `GET/POST /api/knowledge/documents`, `GET /api/knowledge/documents/{id}`, `PATCH …/status`, `POST …/reindex` | experts |
| RAG | `POST /api/rag/playground`, `POST /api/rag/evaluate`, `GET /api/rag/evaluations`, `GET /api/rag/gaps` | experts, tech |
| Metrics / Reports | `GET /api/metrics/overview`, `GET /api/metrics/geo`, `GET /api/reports`, `GET /api/reports/export` | Sunu Impact |
| Monitoring / Audit | `GET /api/monitoring/services`, `/ai`, `/security`, `GET /api/audit`, `GET /metrics` (Prometheus) | Sunu Tech |

Exemple :
```bash
curl -X POST localhost:8000/api/chat -H "Content-Type: application/json" \
     -d '{"message": "Mën naay am yoonu dimbal ?"}'
```
