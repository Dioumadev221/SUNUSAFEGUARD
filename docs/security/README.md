# Sécurité, confidentialité et protection des personnes

## Ce que le code garantit aujourd'hui

| Exigence (CDC) | Mise en œuvre | Vérifiée par |
|---|---|---|
| Conversations non conservées (§7.2, §10) | Aucune table ne stocke le texte ; historique en `sessionStorage` du navigateur | `test_chat_never_stores_message_text` |
| Journaux sans contenu sensible (§6.4) | `SecurityEvent` ne contient que la règle déclenchée ; nginx `access_log off` | idem |
| Statistiques anonymes (§3.1) | `UsageEvent` : langue, catégorie, région déclarée, heure arrondie — pas d'ID de session | — |
| Seuil de publication N ≥ 5 (§3.3) | `services/metrics.py::suppress`, aussi dans l'export Excel | `test_k_anonymity_suppression` |
| Consentement avant transmission (§4.3, §11.2) | `POST /api/referrals` refuse sans `consent=true` | `test_referral_requires_consent` |
| Identifiant de suivi non corrélable (§10) | Code aléatoire `SSG-XXXXXXXX` | — |
| Données d'orientation chiffrées (§11.1) | Fernet (`DATA_ENCRYPTION_KEY`), effacées à la clôture | — |
| Isolation des partenaires (§4.4) | Filtrage serveur par `organization_id` | `test_partner_isolation` |
| RBAC côté serveur (§8) | `require(permission)` sur chaque route | `test_dashboard_permissions` |
| Protection contre la force brute (§8.3) | Verrouillage 15 min après 5 échecs | — |
| Pas de signalement automatique (§6.3) | Aucune intégration sortante ; garde-fou de sortie | `test_output_guard` |
| Prompt injection (§6.3) | Règles déterministes + consignes système + texte utilisateur délimité | `test_prompt_injection_refused` |
| Documents non validés exclus (§5.2) | Seul le statut `publie` est chargé | `test_unpublished_document_not_used` |
| Sortie rapide | Bouton rouge sur chaque écran, Échap ×2, efface `sessionStorage`, `location.replace` | — |

## À faire avant production

- MFA effective pour les comptes privilégiés (le drapeau `mfa_enabled` existe ; TOTP en Phase 3).
- TLS, rotation des secrets, sauvegardes chiffrées (`infrastructure/scripts/backup-postgres.sh`).
- Politique de conservation : purge planifiée de `usage_events` et `security_events`.
- Limitation de débit sur `/api/chat` et `/api/auth/login` (nginx `limit_req` ou Redis).
- Tests d'intrusion, revue des règles d'urgence avec des professionnel·les.
- Protocole spécifique mineures avant toute ouverture (CDC §7.4).
