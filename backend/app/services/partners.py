"""Structures partenaires réellement joignables en ligne.

Une structure ne reçoit des demandes d'orientation que si au moins un compte de
son équipe est actif ET a été activé par la personne elle-même (première
connexion avec changement du mot de passe provisoire). Un compte créé mais jamais
ouvert ne doit pas faire croire qu'une demande sera lue.
"""
import csv
import re
import secrets
import string
import unicodedata
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import ORG_ASSIGNABLE_ROLES
from app.core.security import hash_password
from app.models import Organization, User

ACCOUNT_DOMAIN = "structures.sunusafeguard.sn"


def receiving_condition():
    return (User.is_active.is_(True), User.organization_id.is_not(None),
            User.role.in_(ORG_ASSIGNABLE_ROLES), User.must_change_password.is_(False))


def receiving_org_ids(db: Session) -> set[int]:
    return set(db.scalars(select(User.organization_id).where(*receiving_condition())))


def org_receives(db: Session, org_id: int) -> bool:
    q = select(User.id).where(User.organization_id == org_id, *receiving_condition()).limit(1)
    return db.scalar(q) is not None


def _slug(name: str) -> str:
    name = unicodedata.normalize("NFD", name.lower())
    name = "".join(c for c in name if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", name).strip("-")[:60]


def _temporary_password() -> str:
    alphabet = string.ascii_letters + string.digits
    return "-".join("".join(secrets.choice(alphabet) for _ in range(5)) for _ in range(4))


def invite_structures(db: Session, output: Path, only_validated: bool = True) -> list[dict]:
    """Crée un compte « responsable partenaire » par structure qui n'en a pas encore.

    Identifiant : l'e-mail public de la structure s'il est connu, sinon un identifiant
    <structure>@structures.sunusafeguard.sn. Le mot de passe est provisoire : la
    structure ne reçoit des demandes qu'après l'avoir remplacé à sa première connexion.
    Les identifiants sont écrits dans `output` (CSV, à remettre en main propre puis à détruire).
    """
    q = select(Organization).order_by(Organization.region, Organization.name)
    if only_validated:
        q = q.where(Organization.validated.is_(True))
    created = []
    for org in db.scalars(q):
        if "DÉMO" in org.name:
            continue
        if db.scalar(select(User.id).where(User.organization_id == org.id,
                                           User.role.in_(ORG_ASSIGNABLE_ROLES)).limit(1)):
            continue
        email = (org.email or "").strip().lower()
        if not email or db.scalar(select(User.id).where(User.email == email)):
            email = f"{_slug(org.name)}@{ACCOUNT_DOMAIN}"
        password = _temporary_password()
        db.add(User(email=email, full_name=f"Référent·e {org.name}", role="responsable_partenaire",
                    organization_id=org.id, password_hash=hash_password(password), must_change_password=True))
        created.append({"structure": org.name, "region": org.region, "telephone": org.phone,
                        "identifiant": email, "mot_de_passe_provisoire": password})
    db.commit()
    if created:
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=list(created[0]))
            writer.writeheader()
            writer.writerows(created)
        output.chmod(0o600)
    return created
