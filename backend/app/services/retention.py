"""Politique de conservation et de suppression (CDC §6.4, §11.1)."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import AuditLog, ReferralEvent, ReferralRequest, SecurityEvent, UsageEvent
from app.services.audit import audit


def policy() -> dict:
    s = get_settings()
    return {
        "usage_events_days": s.retention_usage_days,
        "security_events_days": s.retention_security_days,
        "audit_logs_days": s.retention_audit_days,
        "closed_referrals_days": s.retention_referral_days,
        "conversations": "jamais conservées",
    }


def purge(db: Session, actor=None) -> dict:
    s = get_settings()
    now = datetime.now(timezone.utc)
    counts = {}
    counts["usage_events"] = db.execute(
        delete(UsageEvent).where(UsageEvent.hour < now - timedelta(days=s.retention_usage_days))).rowcount
    counts["security_events"] = db.execute(
        delete(SecurityEvent).where(SecurityEvent.created_at < now - timedelta(days=s.retention_security_days))).rowcount
    counts["audit_logs"] = db.execute(
        delete(AuditLog).where(AuditLog.created_at < now - timedelta(days=s.retention_audit_days))).rowcount
    old_refs = list(db.scalars(select(ReferralRequest.id).where(
        ReferralRequest.status.in_(["cloturee", "annulee", "non_prise_en_charge"]),
        ReferralRequest.updated_at < now - timedelta(days=s.retention_referral_days))))
    if old_refs:
        db.execute(delete(ReferralEvent).where(ReferralEvent.referral_id.in_(old_refs)))
        db.execute(delete(ReferralRequest).where(ReferralRequest.id.in_(old_refs)))
    counts["referrals"] = len(old_refs)
    # Coordonnées de recontact : jamais conservées au-delà de la clôture.
    for ref in db.scalars(select(ReferralRequest).where(
            ReferralRequest.status.in_(["cloturee", "annulee"]), ReferralRequest.contact_encrypted != "")):
        ref.contact_encrypted = ""
    audit(db, actor, "retention_purge", **counts)
    db.commit()
    return counts


def last_purge(db: Session) -> dict | None:
    row = db.scalar(select(AuditLog).where(AuditLog.action == "retention_purge").order_by(AuditLog.id.desc()))
    return {"at": row.created_at, "counts": row.details} if row else None
