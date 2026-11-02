from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require
from app.db.session import get_db
from app.models import Report, User
from app.services import metrics, reports
from app.services.audit import audit

router = APIRouter(tags=["Metrics API", "Reports API"])

FORMATS = {
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pdf": "application/pdf",
}


@router.get("/metrics/overview")
def overview(days: int = Query(30, ge=1, le=366), channel: str | None = None, language: str | None = None,
             region: str | None = None, granularity: str = Query("day", pattern="^(day|week|month)$"),
             user: User = Depends(require("metrics:read")), db: Session = Depends(get_db)):
    return metrics.overview(db, days, channel, language, region, granularity)


@router.get("/metrics/geo")
def geo(days: int = Query(30, ge=1, le=366), user: User = Depends(require("metrics:read")),
        db: Session = Depends(get_db)):
    return metrics.geo(db, days)


@router.get("/reports")
def report_history(user: User = Depends(require("reports:export")), db: Session = Depends(get_db)):
    rows = db.scalars(select(Report).order_by(Report.id.desc()).limit(50))
    return [{"id": r.id, "title": r.title, "format": r.format, "period_start": r.period_start,
             "period_end": r.period_end, "created_at": r.created_at} for r in rows]


@router.get("/reports/export")
def export_report(days: int = Query(30, ge=1, le=366), format: str = Query("xlsx", pattern="^(xlsx|pdf)$"),
                  user: User = Depends(require("reports:export")), db: Session = Depends(get_db)):
    """Rapport agrégé Excel ou PDF. Les effectifs sous le seuil restent masqués."""
    data = reports.collect(db, days)
    content = reports.to_pdf(data) if format == "pdf" else reports.to_xlsx(data)
    db.add(Report(title=f"Rapport {days} jours", period_start=data["start"], period_end=data["end"], format=format,
                  created_by_id=user.id))
    audit(db, user, "report_export", format=format, days=days)
    db.commit()
    name = f"sunusafeguard-rapport-{datetime.now(timezone.utc):%Y%m%d}.{format}"
    return Response(content, media_type=FORMATS[format], headers={"Content-Disposition": f'attachment; filename="{name}"'})
