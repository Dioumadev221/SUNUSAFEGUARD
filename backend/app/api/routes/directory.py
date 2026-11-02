from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require
from app.core.permissions import is_global
from app.db.session import get_db
from app.models import Organization, ServiceAvailability, User
from app.schemas import AvailabilityIn, OrganizationIn, OrganizationOut
from app.services.audit import audit

router = APIRouter(prefix="/directory", tags=["Service Directory API"])


def _scope_check(user: User, org: Organization) -> None:
    """Un partenaire n'agit que sur sa propre structure (CDC §4.4)."""
    if not is_global(user.role) and user.organization_id != org.id:
        raise HTTPException(403, "Cette structure ne relève pas de votre périmètre")


def _get(db: Session, org_id: int) -> Organization:
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Structure introuvable")
    return org


@router.get("", response_model=list[OrganizationOut])
def public_directory(region: str | None = None, domain: str | None = None, db: Session = Depends(get_db)):
    """Annuaire public : uniquement les structures validées."""
    orgs = db.scalars(select(Organization).where(Organization.validated.is_(True)).order_by(Organization.region))
    receiving = set(db.scalars(select(User.organization_id).where(User.is_active.is_(True), User.organization_id.is_not(None))))
    return [
        OrganizationOut.model_validate(o).model_copy(update={"accepts_referrals": o.id in receiving})
        for o in orgs
        if (not region or o.region == region) and (not domain or domain in o.domains)
    ]


@router.get("/manage", response_model=list[OrganizationOut])
def manage_list(user: User = Depends(require("directory:availability")), db: Session = Depends(get_db)):
    q = select(Organization).order_by(Organization.name)
    if not is_global(user.role):
        q = q.where(Organization.id == user.organization_id)
    return list(db.scalars(q))


@router.post("", response_model=OrganizationOut, status_code=201)
def create(data: OrganizationIn, user: User = Depends(require("directory:validate")), db: Session = Depends(get_db)):
    org = Organization(**data.model_dump())
    db.add(org)
    db.flush()
    audit(db, user, "organization_create", f"organization:{org.id}")
    db.commit()
    return org


@router.put("/{org_id}", response_model=OrganizationOut)
def update(org_id: int, data: OrganizationIn, user: User = Depends(require("directory:manage")),
           db: Session = Depends(get_db)):
    org = _get(db, org_id)
    _scope_check(user, org)
    for key, value in data.model_dump().items():
        setattr(org, key, value)
    if not is_global(user.role):
        org.validated = False  # Toute modification partenaire repasse en validation.
    audit(db, user, "organization_update", f"organization:{org.id}")
    db.commit()
    return org


@router.post("/{org_id}/availability", response_model=OrganizationOut)
def set_availability(org_id: int, data: AvailabilityIn, user: User = Depends(require("directory:availability")),
                     db: Session = Depends(get_db)):
    org = _get(db, org_id)
    _scope_check(user, org)
    org.availability, org.capacity = data.status, data.capacity
    org.last_verified_at = datetime.now(timezone.utc)
    db.add(ServiceAvailability(organization_id=org.id, status=data.status, capacity=data.capacity,
                               note=data.note, updated_by_id=user.id))
    audit(db, user, "availability_update", f"organization:{org.id}", status=data.status)
    db.commit()
    return org


@router.get("/{org_id}/history")
def availability_history(org_id: int, user: User = Depends(require("directory:availability")),
                         db: Session = Depends(get_db)):
    org = _get(db, org_id)
    _scope_check(user, org)
    rows = db.scalars(select(ServiceAvailability).where(ServiceAvailability.organization_id == org_id)
                      .order_by(ServiceAvailability.id.desc()).limit(50))
    return [{"status": r.status, "capacity": r.capacity, "note": r.note, "created_at": r.created_at} for r in rows]


@router.post("/{org_id}/validate", response_model=OrganizationOut)
def validate(org_id: int, user: User = Depends(require("directory:validate")), db: Session = Depends(get_db)):
    org = _get(db, org_id)
    org.validated = True
    org.last_verified_at = datetime.now(timezone.utc)
    audit(db, user, "organization_validate", f"organization:{org.id}")
    db.commit()
    return org
