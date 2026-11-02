"""Test de bout en bout de l'API SunuSafeguard, à lancer avec le serveur démarré.

    python scripts/smoke_test.py [http://127.0.0.1:8000]

Parcourt chaque fonctionnalité (assistant, annuaire, mise en relation, connexion de
chaque rôle, les 4 tableaux de bord, contrôle des droits) et affiche OK / ÉCHEC.
Bibliothèque standard uniquement : aucun paquet à installer.
"""
import json
import sys
import time
import urllib.error
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/") + "/api"
PASSWORD = "SunuDemo2026!"
results: list[tuple[str, bool, str]] = []


def call(method, path, body=None, token=None, raw=False):
    req = urllib.request.Request(BASE + path, method=method)
    if body is not None:
        req.data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = r.read()
            return r.status, (data if raw else json.loads(data or b"null"))
    except urllib.error.HTTPError as e:
        return e.code, e.read()[:200]
    except Exception as e:  # serveur arrêté, délai dépassé…
        return 0, str(e)


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(f"{'OK   ' if ok else 'ÉCHEC'}  {name}{'  · ' + detail if detail else ''}", flush=True)


# Public
code, body = call("GET", "/health")
check("Santé de l'API", code == 200, str(body)[:80])

code, body = call("POST", "/chat", {"message": "Mon mari garde tout mon salaire, est-ce normal ?"})
ok = code == 200 and body.get("answer")
check("Assistant : question en français", ok, f"{len(body.get('sources', []))} source(s)" if ok else str(body)[:120])

code, body = call("POST", "/chat", {"message": "Dama bëgg ndimbal, sama jëkkër dafay dóor"})
check("Assistant : question en wolof", code == 200 and body.get("answer"), str(code))

code, body = call("POST", "/chat", {"message": "Il me menace avec un couteau, je suis en danger maintenant"})
check("Assistant : détection d'urgence", code == 200 and body.get("show_emergency"), str(code))

code, body = call("GET", "/emergency-contacts")
check("Numéros d'urgence", code == 200 and len(body) > 0, f"{len(body) if code == 200 else code}")

code, orgs = call("GET", "/directory")
check("Annuaire des structures", code == 200 and len(orgs) > 0, f"{len(orgs) if code == 200 else code} structures")

if code == 200 and orgs:
    # Le rappel en ligne n'est possible qu'avec une structure qui a un compte actif (accepts_referrals).
    accepting = [o for o in orgs if o.get("accepts_referrals")]
    closed = [o for o in orgs if not o.get("accepts_referrals")]
    check("Annuaire : champ accepts_referrals présent", all("accepts_referrals" in o for o in orgs),
          f"{len(accepting)} avec rappel, {len(closed)} sans")
    if accepting:
        target = accepting[0]["id"]
        c, ref = call("POST", "/referrals", {"organization_id": target, "category": "ecoute", "region": "Dakar",
                                             "consent": True, "contact": "77 000 00 00, après 18 h"})
        check("Demande de rappel (avec consentement)", c == 201, ref.get("public_code", "") if c == 201 else str(ref)[:120])
        c2, st = call("GET", f"/referrals/status/{ref.get('public_code', 'x')}") if c == 201 else (0, None)
        check("Suivi de la demande avec le code", c2 == 200, st.get("status", "") if c2 == 200 else str(c2))
        c3, _ = call("POST", "/referrals", {"organization_id": target, "category": "ecoute", "consent": False})
        check("Refus sans consentement", c3 == 400, str(c3))
    else:
        print("INFO   Aucune structure n'accepte encore de demandes en ligne : création de rappel non testée")
    if closed:
        c4, _ = call("POST", "/referrals", {"organization_id": closed[0]["id"], "category": "ecoute", "consent": True})
        check("Rappel refusé pour une structure sans compte", c4 == 409, str(c4))

# Espace pro : chaque rôle et son tableau de bord
ROLES = {
    "superadmin": ["/metrics/overview", "/referrals", "/knowledge/documents", "/monitoring/services", "/users"],
    "impact": ["/metrics/overview", "/metrics/overview?granularity=week&region=Dakar", "/metrics/geo", "/reports",
               "/reports/export?format=xlsx", "/reports/export?format=pdf"],
    "analyste": ["/metrics/overview?granularity=month", "/metrics/geo"],
    "partenaire": ["/directory/manage", "/referrals", "/referrals/stats", "/referrals/alerts", "/users"],
    "social": ["/directory/manage", "/referrals", "/referrals/stats"],
    "expert": ["/knowledge/documents", "/rag/gaps", "/rag/evaluations"],
    "linguiste": ["/knowledge/documents", "/rag/gaps"],
    "tech": ["/monitoring/services", "/monitoring/ai", "/monitoring/security", "/monitoring/retention",
             "/monitoring/ai-engine", "/audit", "/metrics/overview"],
}
FORBIDDEN = {"impact": "/monitoring/services", "social": "/metrics/overview", "expert": "/referrals", "tech": "/users"}

tokens = {}
for who, paths in ROLES.items():
    c, body = call("POST", "/auth/login", {"email": f"{who}@sunusafeguard.local", "password": PASSWORD})
    if c == 429:  # limite anti-force brute (10 connexions par minute) : on patiente puis on réessaie
        time.sleep(61)
        c, body = call("POST", "/auth/login", {"email": f"{who}@sunusafeguard.local", "password": PASSWORD})
    token = body.get("access_token") if c == 200 and isinstance(body, dict) else None
    detail = "double authentification demandée" if c == 200 and body.get("mfa_required") else (str(c) if not token else "")
    check(f"Connexion {who}", token, detail)
    if not token:
        continue
    tokens[who] = token
    for p in paths:
        c, _ = call("GET", p, token=token, raw=p.startswith("/reports/export"))
        check(f"  {who} → {p}", c == 200, "" if c == 200 else str(c))
    if who in FORBIDDEN:
        c, _ = call("GET", FORBIDDEN[who], token=token)
        check(f"  {who} bloqué sur {FORBIDDEN[who]}", c == 403, str(c))

if "expert" in tokens:
    c, body = call("POST", "/rag/playground", {"question": "Mën naa am ndimbal ci yoon wi ?", "generate": False},
                   token=tokens["expert"])
    check("Banc d'essai RAG (wolof)", c == 200 and body.get("candidates") is not None,
          f"{len(body.get('candidates', []))} extrait(s)" if c == 200 else str(c))

c, _ = call("POST", "/auth/login", {"email": "impact@sunusafeguard.local", "password": "mauvais"})
check("Mauvais mot de passe refusé", c in (401, 429), str(c))

failed = [n for n, ok, _ in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} vérifications réussies.")
sys.exit(1 if failed else 0)
