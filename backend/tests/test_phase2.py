"""Comptes, double authentification, limitation de débit, rapports, conservation, alertes."""
from app.core import ratelimit, totp

from .conftest import PASSWORD


def test_super_admin_creates_user_with_temporary_password(client, login):
    admin = login("superadmin@sunusafeguard.local")
    r = client.post("/api/users", headers=admin, json={"email": "nouvelle@sunusafeguard.local",
                                                       "full_name": "Nouvelle Analyste", "role": "analyste"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["user"]["must_change_password"]
    r = client.post("/api/auth/login", json={"email": "nouvelle@sunusafeguard.local", "password": body["temporary_password"]})
    token = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert r.json()["user"]["must_change_password"]
    assert client.post("/api/auth/password", headers=token,
                       json={"current_password": body["temporary_password"], "new_password": "court"}).status_code == 422
    r = client.post("/api/auth/password", headers=token,
                    json={"current_password": body["temporary_password"], "new_password": "UnMotDePasse2026"})
    assert r.status_code == 200 and not r.json()["must_change_password"]


def test_partner_manages_only_own_org_and_roles(client, login):
    partner = login("partenaire@sunusafeguard.local")
    users = client.get("/api/users", headers=partner).json()
    org_id = users[0]["organization_id"]
    assert all(u["organization_id"] == org_id for u in users)
    # Ne peut pas créer un super administrateur
    r = client.post("/api/users", headers=partner, json={"email": "x@sunusafeguard.local", "full_name": "Xavier", "role": "super_admin"})
    assert r.status_code == 403
    r = client.post("/api/users", headers=partner, json={"email": "ts2@sunusafeguard.local", "full_name": "TS", "role": "travailleur_social"})
    assert r.status_code == 201 and r.json()["user"]["organization_id"] == org_id
    # Ne peut pas modifier un compte d'une autre structure
    expert = next(u for u in client.get("/api/users", headers=login("superadmin@sunusafeguard.local")).json()
                  if u["email"] == "expert@sunusafeguard.local")
    assert client.patch(f"/api/users/{expert['id']}", headers=partner, json={"is_active": False}).status_code == 403
    assert client.get("/api/users", headers=login("analyste@sunusafeguard.local")).status_code == 403


def test_mfa_enrolment_and_login(client, login):
    tech = login("tech@sunusafeguard.local")
    assert client.get("/api/auth/me", headers=tech).json()["mfa_setup_required"]
    setup = client.post("/api/auth/mfa/setup", headers=tech).json()
    assert client.post(f"/api/auth/mfa/enable?setup_token={setup['setup_token']}", headers=tech,
                       json={"code": "000000"}).status_code == 400
    r = client.post(f"/api/auth/mfa/enable?setup_token={setup['setup_token']}", headers=tech,
                    json={"code": totp.now_code(setup["secret"])})
    assert r.status_code == 200 and r.json()["mfa_active"]
    step1 = client.post("/api/auth/login", json={"email": "tech@sunusafeguard.local", "password": PASSWORD}).json()
    assert step1["mfa_required"] and step1["access_token"] is None
    # Le jeton intermédiaire ne donne accès à rien
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {step1['mfa_token']}"}).status_code == 401
    assert client.post("/api/auth/mfa/verify", json={"mfa_token": step1["mfa_token"], "code": "123456"}).status_code == 401
    r = client.post("/api/auth/mfa/verify", json={"mfa_token": step1["mfa_token"], "code": totp.now_code(setup["secret"])})
    assert r.status_code == 200 and r.json()["access_token"]


def test_rate_limit_on_chat(client):
    ratelimit.reset()
    codes = [client.post("/api/chat", json={"message": "bonjour"}).status_code for _ in range(32)]
    assert codes[:30] == [200] * 30 and codes[-1] == 429
    ratelimit.reset()


def test_pdf_and_excel_reports(client, login):
    analyst = login("analyste@sunusafeguard.local")
    pdf = client.get("/api/reports/export?format=pdf", headers=analyst)
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")
    xlsx = client.get("/api/reports/export?format=xlsx", headers=analyst)
    assert xlsx.status_code == 200 and xlsx.content[:2] == b"PK"
    assert client.get("/api/reports/export?format=pdf", headers=login("social@sunusafeguard.local")).status_code == 403


def test_retention_purge(client, login):
    tech_admin = login("superadmin@sunusafeguard.local")
    counts = client.post("/api/monitoring/retention/purge", headers=tech_admin).json()
    assert {"usage_events", "security_events", "audit_logs", "referrals"} <= counts.keys()
    status = client.get("/api/monitoring/retention", headers=tech_admin).json()
    assert status["last_purge"] and status["policy"]["conversations"] == "jamais conservées"


def test_referral_alerts(client, login):
    r = client.get("/api/referrals/alerts", headers=login("superadmin@sunusafeguard.local"))
    assert r.status_code == 200 and "late" in r.json()
