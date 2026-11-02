"""Contrôle d'accès minimal de la démonstration : utilisateur / admin opérationnel / super admin GREEN T."""
import uuid

from app.models import Organization, User
from app.db.session import SessionLocal

USER = "utilisateur@sunusafeguard.local"
USER2 = "utilisateur2@sunusafeguard.local"
OPS = "operationnel@sunusafeguard.local"
SUPER = "superadmin@sunusafeguard.local"


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_register_creates_user_role_only(client):
    email = f"test-{uuid.uuid4().hex[:8]}@exemple.sn"
    r = client.post("/api/auth/register", json={"email": email, "password": "MotDePasse2026", "full_name": "Test",
                                                "role": "super_admin"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["user"]["role"] == "utilisateur"  # le rôle demandé est ignoré
    assert body["user"]["dashboards"] == []
    assert client.get("/api/auth/me", headers=_bearer(body["access_token"])).status_code == 200


def test_register_rejects_weak_password_and_duplicates(client):
    assert client.post("/api/auth/register", json={"email": "faible@exemple.sn", "password": "court"}).status_code == 422
    assert client.post("/api/auth/register", json={"email": USER, "password": "MotDePasse2026"}).status_code == 409


def test_user_cannot_reach_administration(client, login):
    h = login(USER)
    for path in ["/api/metrics/overview", "/api/referrals", "/api/directory/manage", "/api/users",
                 "/api/monitoring/services", "/api/knowledge/documents"]:
        assert client.get(path, headers=h).status_code == 403, path


def test_ops_admin_has_operations_but_not_greent_settings(client, login):
    h = login(OPS)
    me = client.get("/api/auth/me", headers=h).json()
    assert set(me["dashboards"]) == {"impact", "orientation", "ressources"}
    assert client.get("/api/referrals", headers=h).status_code == 200
    assert client.get("/api/directory/manage", headers=h).status_code == 200
    # Réservé GREEN T : comptes, rôles, supervision technique.
    assert client.get("/api/users", headers=h).status_code == 403
    assert client.get("/api/users/roles", headers=h).status_code == 403
    assert client.get("/api/monitoring/services", headers=h).status_code == 403


def test_super_admin_manages_accounts(client, login):
    h = login(SUPER)
    assert "tech" in client.get("/api/auth/me", headers=h).json()["dashboards"]
    assert client.get("/api/users", headers=h).status_code == 200


def test_logout_revokes_token(client):
    r = client.post("/api/auth/login", json={"email": USER2, "password": "SunuDemo2026!"})
    h = _bearer(r.json()["access_token"])
    assert client.get("/api/auth/me", headers=h).status_code == 200
    assert client.post("/api/auth/logout", headers=h).status_code == 204
    assert client.get("/api/auth/me", headers=h).status_code == 401


def test_referrals_are_isolated_between_accounts(client):
    with SessionLocal() as db:
        org = next(o for o in db.query(Organization).filter(Organization.validated.is_(True))
                   if db.query(User).filter(User.organization_id == o.id, User.is_active.is_(True)).first())
        org_id = org.id
    tokens = []
    for _ in range(2):
        r = client.post("/api/auth/register", json={"email": f"iso-{uuid.uuid4().hex[:8]}@exemple.sn",
                                                    "password": "MotDePasse2026"})
        tokens.append(r.json()["access_token"])
    created = client.post("/api/referrals", headers=_bearer(tokens[0]),
                          json={"organization_id": org_id, "category": "violences", "consent": True, "contact": "77 000 00 00"})
    assert created.status_code == 201, created.text
    code = created.json()["public_code"]
    assert [r["code"] for r in client.get("/api/referrals/mine", headers=_bearer(tokens[0])).json()] == [code]
    assert client.get("/api/referrals/mine", headers=_bearer(tokens[1])).json() == []
    assert client.get("/api/referrals/mine").status_code == 401
