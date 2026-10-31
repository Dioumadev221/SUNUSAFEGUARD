import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require
from app.api.routes.auth import user_out
from app.core.permissions import ORG_ASSIGNABLE_ROLES, ROLES
from app.core.security import hash_password
from app.db.session import get_db
from app.models import Organization, User
from app.schemas import UserCreatedOut, UserCreateIn, UserOut, UserUpdateIn
from app.services.audit import audit

router = APIRouter(prefix="/users", tags=["User API"])


def _check_scope(actor: User, role: str | None, organization_id: int | None) -> None:
    """Un responsable partenaire ne gère que les comptes de sa structure (CDC §4.4)."""
    if role is not None and role not in ROLES:
        raise HTTPException(422, "Rôle inconnu")
    if actor.role == "super_admin":
        return
    if organization_id != actor.organization_id:
        raise HTTPException(403, "Ce compte ne relève pas de votre structure")
    if role is not None and role not in ORG_ASSIGNABLE_ROLES:
        raise HTTPException(403, "Rôle non attribuable par un partenaire")


def _temporary_password() -> str:
    return "Ssg-" + secrets.token_urlsafe(9)


@router.get("", response_model=list[UserOut])
def list_users(actor: User = Depends(require("users:manage_org")), db: Session = Depends(get_db)):
    q = select(User).order_by(User.email)
    if actor.role != "super_admin":
        q = q.where(User.organization_id == actor.organization_id)
    return [user_out(u) for u in db.scalars(q)]


@router.get("/roles")
def roles(actor: User = Depends(require("users:manage_org"))):
    allowed = ROLES if actor.role == "super_admin" else {k: ROLES[k] for k in ORG_ASSIGNABLE_ROLES}
    return [{"id": k, "label": v} for k, v in allowed.items()]


@router.post("", response_model=UserCreatedOut, status_code=201)
def create_user(data: UserCreateIn, actor: User = Depends(require("users:manage_org")), db: Session = Depends(get_db)):
    org_id = data.organization_id if actor.role == "super_admin" else actor.organization_id
    _check_scope(actor, data.role, org_id)
    if org_id and not db.get(Organization, org_id):
        raise HTTPException(404, "Structure introuvable")
    email = data.email.strip().lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Un compte existe déjà avec cet e-mail")
    password = _temporary_password()
    user = User(email=email, full_name=data.full_name, role=data.role, organization_id=org_id,
                password_hash=hash_password(password), must_change_password=True)
    db.add(user)
    db.flush()
    audit(db, actor, "user_create", f"user:{user.id}", role=data.role)
    db.commit()
    return UserCreatedOut(user=user_out(user), temporary_password=password)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdateIn, actor: User = Depends(require("users:manage_org")),
                db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Compte introuvable")
    _check_scope(actor, data.role, user.organization_id)
    if user.id == actor.id and (data.is_active is False or (data.role and data.role != actor.role)):
        raise HTTPException(400, "Vous ne pouvez pas désactiver ou rétrograder votre propre compte")
    changes = data.model_dump(exclude_unset=True)
    if "organization_id" in changes and actor.role != "super_admin":
        changes.pop("organization_id")
    for key, value in changes.items():
        setattr(user, key, value)
    audit(db, actor, "user_update", f"user:{user.id}", **{k: str(v) for k, v in changes.items()})
    db.commit()
    return user_out(user)


@router.post("/{user_id}/reset", response_model=UserCreatedOut)
def reset_user(user_id: int, actor: User = Depends(require("users:manage_org")), db: Session = Depends(get_db)):
    """Réinitialise le mot de passe (provisoire) et la double authentification."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Compte introuvable")
    _check_scope(actor, None, user.organization_id)
    password = _temporary_password()
    user.password_hash = hash_password(password)
    user.must_change_password = True
    user.mfa_secret = ""
    user.failed_logins = 0
    user.locked_until = None
    audit(db, actor, "user_reset", f"user:{user.id}")
    db.commit()
    return UserCreatedOut(user=user_out(user), temporary_password=password)
