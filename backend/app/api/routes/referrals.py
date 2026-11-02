import secrets
from datetime import datetime, timedelta, timezone
from statistics import median

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_user, require
from app.core.permissions import is_global
from app.core.config import get_settings
from app.core.security import decrypt, encrypt
from app.db.session import get_db
from app.models import Organization, ReferralEvent, ReferralRequest, User
from app.schemas import ReferralCreated, ReferralIn, ReferralStatusIn
from app.services.audit import audit
from app.services.partners import org_receives

router = APIRouter(prefix="/referrals", tags=["Referral API"])

PUBLIC_LABELS = {
    "transmise": "Votre demande a été transmise à la structure.",
    "recue": "La structure a bien reçu votre demande.",
    "en_cours": "La structure traite votre demande.",
    "prise_en_charge_confirmee": "La structure a confirmé la prise en charge.",
    "non_prise_en_charge": "La structure n'a pas pu donner suite. Consultez l'annuaire pour une autre structure.",
    "cloturee": "Demande clôturée.",
    "annulee": "Demande annulée.",
}


@router.post("", response_model=ReferralCreated, status_code=201)
def create_referral(data: ReferralIn, db: Session = Depends(get_db), owner: User | None = Depends(get_optional_user)):
    """Mise en relation volontaire. Sans consentement explicite, rien n'est transmis."""
    if not data.consent:
        raise HTTPException(400, "Le consentement explicite est requis pour transmettre une demande.")
    org = db.get(Organization, data.organization_id)
    if not org or not org.validated:
        raise HTTPException(404, "Structure introuvable")
    # Sans compte activé par la structure, personne ne verrait la demande : on ne prétend pas la transmettre.
    if not org_receives(db, org.id):
        raise HTTPException(409, "Cette structure ne reçoit pas encore de demandes en ligne. Appelez-la directement.")
    code = "SSG-" + secrets.token_hex(4).upper()
    ref = ReferralRequest(public_code=code, organization_id=org.id, category=data.category, region=data.region,
                          status="transmise", consent_given=True, contact_encrypted=encrypt(data.contact),
                          user_id=owner.id if owner else None)
    db.add(ref)
    db.flush()
    db.add(ReferralEvent(referral_id=ref.id, status="en_attente_consentement", note="Orientation proposée"))
    db.add(ReferralEvent(referral_id=ref.id, status="transmise", note="Consentement donné, demande transmise"))
    db.commit()
    return ReferralCreated(public_code=code, status=ref.status,
                           message="Demande transmise. Conservez ce code pour suivre son statut. "
                                   "La structure vous recontactera selon le moyen indiqué.")


@router.get("/status/{code}")
def public_status(code: str, db: Session = Depends(get_db)):
    ref = db.scalar(select(ReferralRequest).where(ReferralRequest.public_code == code.upper()))
    if not ref:
        raise HTTPException(404, "Code inconnu")
    return {"code": ref.public_code, "status": ref.status, "label": PUBLIC_LABELS.get(ref.status, ref.status)}


@router.get("/mine")
def my_referrals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Demandes du compte connecté, et uniquement les siennes (isolation entre comptes)."""
    q = select(ReferralRequest).where(ReferralRequest.user_id == user.id).order_by(ReferralRequest.id.desc())
    return [{"code": r.public_code, "organization": r.organization.name, "status": r.status,
             "label": PUBLIC_LABELS.get(r.status, r.status), "created_at": r.created_at} for r in db.scalars(q)]


def _serialize(ref: ReferralRequest, with_contact: bool) -> dict:
    return {
        "id": ref.id, "public_code": ref.public_code, "organization": ref.organization.name,
        "organization_id": ref.organization_id, "category": ref.category, "region": ref.region,
        "status": ref.status, "created_at": ref.created_at, "updated_at": ref.updated_at,
        "contact": decrypt(ref.contact_encrypted) if with_contact else None,
        "events": [{"status": e.status, "note": e.note, "created_at": e.created_at} for e in ref.events],
    }


@router.get("")
def list_referrals(user: User = Depends(require("referrals:manage")), db: Session = Depends(get_db)):
    q = select(ReferralRequest).order_by(ReferralRequest.id.desc())
    if not is_global(user.role):
        q = q.where(ReferralRequest.organization_id == user.organization_id)
    # Le contact déchiffré n'est visible que de la structure destinataire.
    return [_serialize(r, with_contact=user.organization_id == r.organization_id) for r in db.scalars(q)]


@router.patch("/{ref_id}")
def update_status(ref_id: int, data: ReferralStatusIn, user: User = Depends(require("referrals:manage")),
                  db: Session = Depends(get_db)):
    ref = db.get(ReferralRequest, ref_id)
    if not ref or (not is_global(user.role) and ref.organization_id != user.organization_id):
        raise HTTPException(404, "Demande introuvable")
    ref.status = data.status
    db.add(ReferralEvent(referral_id=ref.id, status=data.status, actor_id=user.id, note=data.note))
    if data.status in {"cloturee", "annulee"}:
        ref.contact_encrypted = ""  # Minimisation : le contact est effacé à la clôture.
    audit(db, user, "referral_status", f"referral:{ref.id}", status=data.status)
    db.commit()
    db.refresh(ref)
    return _serialize(ref, with_contact=user.organization_id == ref.organization_id)


@router.get("/stats")
def delays(user: User = Depends(require("referrals:manage")), db: Session = Depends(get_db)):
    """Délais agrégés transmission → réception → prise en charge (en heures)."""
    q = select(ReferralRequest)
    if not is_global(user.role):
        q = q.where(ReferralRequest.organization_id == user.organization_id)
    to_recv, to_conf, by_status = [], [], {}
    for ref in db.scalars(q):
        by_status[ref.status] = by_status.get(ref.status, 0) + 1
        times = {e.status: e.created_at for e in ref.events}
        if "transmise" in times and "recue" in times:
            to_recv.append((times["recue"] - times["transmise"]).total_seconds() / 3600)
        if "transmise" in times and "prise_en_charge_confirmee" in times:
            to_conf.append((times["prise_en_charge_confirmee"] - times["transmise"]).total_seconds() / 3600)
    return {
        "by_status": by_status,
        "median_hours_to_reception": round(median(to_recv), 1) if to_recv else None,
        "median_hours_to_confirmation": round(median(to_conf), 1) if to_conf else None,
        "pending_without_reception": by_status.get("transmise", 0),
    }


@router.get("/alerts")
def alerts(user: User = Depends(require("referrals:manage")), db: Session = Depends(get_db)):
    """Demandes transmises sans accusé de réception au-delà du délai configuré.
    Alerte interne uniquement : aucune relance n'est envoyée à la personne (CDC §4.3)."""
    hours = get_settings().referral_alert_hours
    limit = datetime.now(timezone.utc) - timedelta(hours=hours)
    q = select(ReferralRequest).where(ReferralRequest.status == "transmise")
    if not is_global(user.role):
        q = q.where(ReferralRequest.organization_id == user.organization_id)
    late = []
    for ref in db.scalars(q):
        created = ref.created_at if ref.created_at.tzinfo else ref.created_at.replace(tzinfo=timezone.utc)
        if created < limit:
            late.append({"id": ref.id, "public_code": ref.public_code, "organization": ref.organization.name,
                         "hours_waiting": round((datetime.now(timezone.utc) - created).total_seconds() / 3600)})
    return {"threshold_hours": hours, "late": sorted(late, key=lambda x: -x["hours_waiting"])}
