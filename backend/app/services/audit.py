from sqlalchemy.orm import Session

from app.models import AuditLog, SecurityEvent, User


def audit(db: Session, actor: User | None, action: str, target: str = "", **details) -> None:
    db.add(AuditLog(actor_id=actor.id if actor else None, action=action, target=target, details=details))


def security_event(db: Session, kind: str, severity: str = "info", rule: str = "", **details) -> None:
    db.add(SecurityEvent(kind=kind, severity=severity, rule=rule[:200], details=details))
