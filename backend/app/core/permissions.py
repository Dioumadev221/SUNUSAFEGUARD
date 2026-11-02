"""Matrice RBAC (CDC §8). Versionnée dans le code pour être auditable ;
contrôlée côté serveur sur chaque route via `require(permission)`.

Démonstration (contrôle d'accès minimal) : trois profils suffisent —
`utilisateur` (application, aucun accès à l'administration), `admin_operationnel`
(ressources, annuaire, orientations) et `super_admin` (GREEN T : comptes, rôles,
configuration technique, supervision). Les rôles détaillés restent disponibles."""

ROLES = {
    "super_admin": "Super administrateur GREEN T",
    "admin_operationnel": "Administrateur opérationnel",
    "utilisateur": "Utilisateur",
    "admin_technique": "Administrateur technique",
    "responsable_institutionnel": "Responsable institutionnel",
    "analyste": "Analyste",
    "responsable_partenaire": "Responsable partenaire",
    "travailleur_social": "Travailleur social",
    "expert_documentaire": "Expert documentaire",
    "expert_linguistique": "Expert linguistique",
}

# Rôle attribué aux comptes créés par inscription publique : aucune permission d'administration.
PUBLIC_ROLE = "utilisateur"

OPS = "admin_operationnel"

DASHBOARDS = {
    "impact": {"super_admin", OPS, "responsable_institutionnel", "analyste"},
    "orientation": {"super_admin", OPS, "responsable_partenaire", "travailleur_social"},
    "ressources": {"super_admin", OPS, "expert_documentaire", "expert_linguistique"},
    "tech": {"super_admin", "admin_technique"},
}

PERMISSIONS: dict[str, set[str]] = {
    "metrics:read": DASHBOARDS["impact"] | {"admin_technique"},
    "reports:export": {"super_admin", OPS, "responsable_institutionnel", "analyste"},
    "directory:manage": {"super_admin", OPS, "responsable_partenaire"},
    "directory:availability": {"super_admin", OPS, "responsable_partenaire", "travailleur_social"},
    "directory:validate": {"super_admin", OPS},
    "referrals:manage": {"super_admin", OPS, "responsable_partenaire", "travailleur_social"},
    "knowledge:read": DASHBOARDS["ressources"] | {"admin_technique"},
    "knowledge:manage": {"super_admin", OPS, "expert_documentaire"},
    "knowledge:validate": {"super_admin", OPS, "expert_documentaire", "expert_linguistique"},
    "rag:playground": DASHBOARDS["ressources"] | {"admin_technique"},
    # Réservé GREEN T : supervision, journaux, comptes et rôles, configuration technique.
    "monitoring:read": DASHBOARDS["tech"],
    "audit:read": DASHBOARDS["tech"],
    "users:manage": {"super_admin"},
    "users:manage_org": {"super_admin", "responsable_partenaire"},
    "retention:manage": {"super_admin", "admin_technique"},
}

# Comptes privilégiés : double authentification obligatoire (CDC §8.3).
MFA_REQUIRED_ROLES = {"super_admin", "admin_technique"}

# Rôles qu'un responsable partenaire peut attribuer dans sa structure.
ORG_ASSIGNABLE_ROLES = {"responsable_partenaire", "travailleur_social"}

# Rôles qui agissent sur toutes les structures (les autres restent limités à la leur).
GLOBAL_SCOPE_ROLES = {"super_admin", OPS}


def has_permission(role: str, permission: str) -> bool:
    return role in PERMISSIONS.get(permission, set())


def dashboards_for(role: str) -> list[str]:
    return [name for name, roles in DASHBOARDS.items() if role in roles]


def is_global(role: str) -> bool:
    return role in GLOBAL_SCOPE_ROLES
