"""Matrice RBAC (CDC §8). Versionnée dans le code pour être auditable ;
contrôlée côté serveur sur chaque route via `require(permission)`."""

ROLES = {
    "super_admin": "Super administrateur",
    "admin_technique": "Administrateur technique",
    "responsable_institutionnel": "Responsable institutionnel",
    "analyste": "Analyste",
    "responsable_partenaire": "Responsable partenaire",
    "travailleur_social": "Travailleur social",
    "expert_documentaire": "Expert documentaire",
    "expert_linguistique": "Expert linguistique",
}

DASHBOARDS = {
    "impact": {"super_admin", "responsable_institutionnel", "analyste"},
    "orientation": {"super_admin", "responsable_partenaire", "travailleur_social"},
    "ressources": {"super_admin", "expert_documentaire", "expert_linguistique"},
    "tech": {"super_admin", "admin_technique"},
}

PERMISSIONS: dict[str, set[str]] = {
    "metrics:read": DASHBOARDS["impact"] | {"admin_technique"},
    "reports:export": {"super_admin", "responsable_institutionnel", "analyste"},
    "directory:manage": {"super_admin", "responsable_partenaire"},
    "directory:availability": {"super_admin", "responsable_partenaire", "travailleur_social"},
    "directory:validate": {"super_admin"},
    "referrals:manage": {"super_admin", "responsable_partenaire", "travailleur_social"},
    "knowledge:read": DASHBOARDS["ressources"] | {"admin_technique"},
    "knowledge:manage": {"super_admin", "expert_documentaire"},
    "knowledge:validate": {"super_admin", "expert_documentaire", "expert_linguistique"},
    "rag:playground": DASHBOARDS["ressources"] | {"admin_technique"},
    "monitoring:read": DASHBOARDS["tech"],
    "audit:read": DASHBOARDS["tech"],
    "users:manage": {"super_admin"},
}


def has_permission(role: str, permission: str) -> bool:
    return role in PERMISSIONS.get(permission, set())


def dashboards_for(role: str) -> list[str]:
    return [name for name, roles in DASHBOARDS.items() if role in roles]
