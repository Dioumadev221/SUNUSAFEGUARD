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
| Protection contre la force brute (§8.3) | Verrouillage 15 min après 5 échecs + limitation de débit par IP hachée | `test_rate_limit_on_chat` |
| MFA pour comptes privilégiés (§8.3) | TOTP (RFC 6238) ; jeton intermédiaire 5 min sans accès aux API | `test_mfa_enrolment_and_login` |
| Gestion des comptes (§4.4, §8) | Mot de passe provisoire à changer, désactivation, réinitialisation, périmètre partenaire | `test_partner_manages_only_own_org_and_roles` |
| Conservation et purge (§6.4) | Purge quotidienne + manuelle, contacts effacés à la clôture | `test_retention_purge` |
| Pas de signalement automatique (§6.3) | Aucune intégration sortante ; garde-fou de sortie | `test_output_guard` |
| Prompt injection (§6.3) | Règles déterministes + consignes système + texte utilisateur délimité | `test_prompt_injection_refused` |
| Documents non validés exclus (§5.2) | Seul le statut `publie` est chargé | `test_unpublished_document_not_used` |
| Sortie rapide | Bouton rouge sur chaque écran, Échap ×2, efface `sessionStorage`, `location.replace` | — |

## À faire avant production

- TLS, rotation des secrets, sauvegardes chiffrées (`infrastructure/scripts/backup-postgres.sh`).
- Valider les durées de conservation avec le responsable de traitement.
- Avec plusieurs instances backend : déplacer la limitation de débit vers Redis.
- Tests d'intrusion, revue des règles d'urgence avec des professionnel·les.
- Protocole spécifique mineures avant toute ouverture (CDC §7.4).
