"""Chargement des données de démonstration depuis `data/`.

Les événements d'usage générés ici sont SYNTHÉTIQUES (marqués comme tels dans
le README) : ils servent uniquement à peupler les dashboards de démonstration.
"""
import json
import random
import re
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import encrypt, hash_password
from app.models import (AIModelConfiguration, KnowledgeDocument, KnowledgeVersion, Organization, ReferralEvent,
                        ReferralRequest, SafetyRule, SecurityEvent, UsageEvent, User)
from app.services.knowledge import index_document

from safety.rules import RULES_VERSION  # noqa: E402


def _front_matter(text: str) -> tuple[dict, str]:
    text = text.replace("\r\n", "\n").lstrip("\ufeff")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        return {}, text
    meta = dict(line.split(":", 1) for line in m.group(1).splitlines() if ":" in line)
    return {k.strip(): v.strip().strip('"').strip("'") for k, v in meta.items()}, m.group(2).strip()


def _manifest(folder: Path) -> dict:
    path = folder / "_manifest.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def seed_organizations(db: Session, data_dir: Path) -> dict[str, Organization]:
    orgs = {}
    for item in json.loads((data_dir / "seed" / "organizations.json").read_text(encoding="utf-8")):
        org = db.scalar(select(Organization).where(Organization.name == item["name"]))
        if not org:
            org = Organization(**item, last_verified_at=datetime.now(timezone.utc))
            db.add(org)
        orgs[item["name"]] = org
    db.flush()
    return orgs


def seed_users(db: Session, data_dir: Path, orgs: dict[str, Organization]) -> None:
    password = get_settings().demo_password
    for item in json.loads((data_dir / "seed" / "users.json").read_text(encoding="utf-8")):
        if db.scalar(select(User).where(User.email == item["email"])):
            continue
        org = orgs.get(item.get("organization", ""))
        db.add(User(email=item["email"], full_name=item["full_name"], role=item["role"],
                    organization_id=org.id if org else None, password_hash=hash_password(password),
                    mfa_enabled=item["role"] in {"super_admin", "admin_technique"}))
    db.flush()


def seed_knowledge(db: Session, data_dir: Path) -> int:
    count = 0
    root = data_dir / "knowledge_base"
    for path in sorted(root.rglob("*.md")):
        if path.name.lower() == "readme.md":
            continue
        meta, body = _front_matter(path.read_text(encoding="utf-8"))
        # Un manifeste par dossier peut compléter les en-têtes (catégorie, statut).
        meta = {**meta, **_manifest(path.parent).get(path.name, {})}
        filename = path.relative_to(root).as_posix()
        if db.scalar(select(KnowledgeDocument).where(KnowledgeDocument.filename == filename)):
            continue
        date = meta.get("published_at") or meta.get("last_reviewed")
        published = datetime.fromisoformat(date).replace(tzinfo=timezone.utc) if date else None
        doc = KnowledgeDocument(
            title=meta.get("title", path.stem), source=meta.get("source", ""), category=meta.get("category", "autre"),
            language=meta.get("language", "fr"), status=meta.get("status", "a_verifier"), filename=filename,
            content=body, published_at=published, verified_at=published,
        )
        db.add(doc)
        db.flush()
        db.add(KnowledgeVersion(document_id=doc.id, version=1, content=body))
        index_document(db, doc)
        count += 1
    return count


def seed_synthetic_activity(db: Session, n: int = 900, days: int = 45) -> None:
    """Activité fictive pour les graphiques (ne provient d'aucune personne réelle)."""
    if db.scalar(select(UsageEvent).limit(1)):
        return
    rng = random.Random(221)
    regions = {"Dakar": 0.36, "Thiès": 0.15, "Diourbel": 0.08, "Kaolack": 0.09, "Saint-Louis": 0.08,
               "Ziguinchor": 0.07, "Louga": 0.05, "Tambacounda": 0.04, "Kolda": 0.03, "Matam": 0.02,
               "Fatick": 0.02, "Kédougou": 0.005, "Sédhiou": 0.005}
    cats = {"ecoute_psychosociale": 0.28, "violences_physiques_verbales": 0.2, "information_juridique": 0.15,
            "cyberharcelement": 0.1, "violences_economiques": 0.08, "hebergement_protection": 0.07,
            "sante_reproductive": 0.07, "autre": 0.05}
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    for _ in range(n):
        region = rng.choices(list(regions), list(regions.values()))[0]
        cat = rng.choices(list(cats), list(cats.values()))[0]
        wo = rng.random() < (0.45 if region != "Dakar" else 0.25)
        grounded = cat not in {"autre"} and rng.random() > (0.35 if cat == "violences_economiques" else 0.12)
        action = rng.choices(["allow", "urgent", "refuse_injection", "out_of_scope", "redirect_professional"],
                             [0.9, 0.03, 0.01, 0.03, 0.03])[0]
        db.add(UsageEvent(
            hour=now - timedelta(hours=rng.randint(0, days * 24)),
            channel=rng.choices(["web", "pwa", "voix"], [0.6, 0.3, 0.1])[0], language="wo" if wo else "fr",
            category=cat, region=region if rng.random() > 0.2 else "non_renseignee", safety_action=action,
            grounded=grounded and action == "allow", used_llm=rng.random() > 0.3,
            top_score=round(rng.uniform(0.2, 0.7) if grounded else rng.uniform(0.02, 0.18), 3),
            latency_ms=round(rng.lognormvariate(7.3, 0.4), 1), directory_suggested=rng.random() < 0.35,
        ))
    for kind, sev, k in [("safety_urgent", "info", 14), ("safety_refuse_injection", "warning", 6),
                         ("safety_out_of_scope", "info", 11), ("login_failed", "info", 4)]:
        for _ in range(k):
            db.add(SecurityEvent(kind=kind, severity=sev, rule="(démo)",
                                 created_at=now - timedelta(hours=rng.randint(0, days * 24))))


def seed_referrals(db: Session, orgs: dict[str, Organization]) -> None:
    if db.scalar(select(ReferralRequest).limit(1)):
        return
    rng = random.Random(7)
    flow = ["transmise", "recue", "en_cours", "prise_en_charge_confirmee", "cloturee"]
    validated = [o for o in orgs.values() if o.validated]
    now = datetime.now(timezone.utc)
    for i in range(14):
        org = rng.choice(validated)
        depth = rng.randint(1, len(flow))
        start = now - timedelta(days=rng.randint(1, 30), hours=rng.randint(0, 23))
        ref = ReferralRequest(public_code="SSG-" + secrets.token_hex(4).upper(), organization_id=org.id,
                              category=rng.choice(org.domains), region=org.region, status=flow[depth - 1],
                              consent_given=True,
                              contact_encrypted=encrypt("Rappel souhaité en journée (donnée fictive)")
                              if depth < 5 else "", created_at=start)
        db.add(ref)
        db.flush()
        t = start
        for status in flow[:depth]:
            db.add(ReferralEvent(referral_id=ref.id, status=status, note="(démo)", created_at=t))
            t += timedelta(hours=rng.uniform(1, 30))


def seed_all(db: Session, synthetic: bool = True) -> dict:
    data_dir = Path(get_settings().data_dir)
    orgs = seed_organizations(db, data_dir)
    seed_users(db, data_dir, orgs)
    docs = seed_knowledge(db, data_dir)
    if not db.scalar(select(SafetyRule).limit(1)):
        db.add(SafetyRule(version=RULES_VERSION, description="Règles déterministes initiales (Phase 1)"))
    if not db.scalar(select(AIModelConfiguration).limit(1)):
        s = get_settings()
        db.add(AIModelConfiguration(name="défaut", provider=s.llm_provider, model=s.ollama_model,
                                    params={"temperature": 0.2, "top_k": s.rag_top_k, "min_score": s.rag_min_score},
                                    active=True))
    if synthetic:
        seed_synthetic_activity(db)
        seed_referrals(db, orgs)
    db.commit()
    return {"organizations": len(orgs), "documents_indexed": docs}
