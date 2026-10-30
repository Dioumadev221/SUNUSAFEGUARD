import time

import psutil
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.api.deps import require
from app.core.ai import get_ai_embedder, get_llm
from app.core.config import get_settings
from app.db.session import get_db
from app.models import AuditLog, KnowledgeChunk, SecurityEvent, User
from app.services import metrics

from safety.rules import RULES_VERSION  # noqa: E402

router = APIRouter(tags=["Monitoring API", "Audit API"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    """Sonde publique minimale (aucune information sensible)."""
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/monitoring/services")
def services(user: User = Depends(require("monitoring:read")), db: Session = Depends(get_db)):
    s = get_settings()
    t0 = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:  # noqa: BLE001
        db_ok = False
    db_ms = round((time.perf_counter() - t0) * 1000, 1)
    llm = get_llm()
    t1 = time.perf_counter()
    llm_ok = llm.is_available() if llm else None
    llm_ms = round((time.perf_counter() - t1) * 1000, 1)
    vm = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "services": [
            {"name": "Backend FastAPI", "status": "up", "detail": s.environment},
            {"name": "Base relationnelle", "status": "up" if db_ok else "down",
             "detail": s.database_url.split("://")[0], "latency_ms": db_ms},
            {"name": "Index vectoriel", "status": "up",
             "detail": f"{db.scalar(select(func.count()).select_from(KnowledgeChunk))} segments · {get_ai_embedder().name}"},
            {"name": "Moteur LLM", "status": "disabled" if llm is None else ("up" if llm_ok else "down"),
             "detail": f"{s.ollama_model} @ {s.ollama_url}" if llm else "LLM désactivé (mode repli extractif)",
             "latency_ms": llm_ms if llm else None},
            {"name": "Services vocaux (STT/TTS)", "status": "planned", "detail": "Phase 4"},
        ],
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=0.2),
            "ram_percent": vm.percent, "ram_used_gb": round(vm.used / 1e9, 2), "ram_total_gb": round(vm.total / 1e9, 2),
            "disk_percent": disk.percent,
        },
        "safety_rules_version": RULES_VERSION,
    }


@router.get("/monitoring/ai")
def ai_quality(days: int = 7, user: User = Depends(require("monitoring:read")), db: Session = Depends(get_db)):
    return metrics.ai_quality(db, days)


@router.get("/monitoring/security")
def security_events(user: User = Depends(require("monitoring:read")), db: Session = Depends(get_db)):
    counts = dict(db.execute(select(SecurityEvent.kind, func.count()).group_by(SecurityEvent.kind)).all())
    recent = db.scalars(select(SecurityEvent).order_by(SecurityEvent.id.desc()).limit(30))
    return {
        "counts": counts,
        "recent": [{"id": e.id, "kind": e.kind, "severity": e.severity, "rule": e.rule, "created_at": e.created_at}
                   for e in recent],
    }


@router.get("/audit")
def audit_log(user: User = Depends(require("audit:read")), db: Session = Depends(get_db)):
    rows = db.execute(select(AuditLog, User.email).outerjoin(User, AuditLog.actor_id == User.id)
                      .order_by(AuditLog.id.desc()).limit(100)).all()
    return [{"id": a.id, "actor": email, "action": a.action, "target": a.target, "details": a.details,
             "created_at": a.created_at} for a, email in rows]
