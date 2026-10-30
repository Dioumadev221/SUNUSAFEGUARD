import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Font
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require
from app.db.session import get_db
from app.models import Report, User
from app.services import metrics
from app.services.audit import audit

router = APIRouter(tags=["Metrics API", "Reports API"])


@router.get("/metrics/overview")
def overview(days: int = Query(30, ge=1, le=366), channel: str | None = None, language: str | None = None,
             region: str | None = None, user: User = Depends(require("metrics:read")), db: Session = Depends(get_db)):
    return metrics.overview(db, days, channel, language, region)


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
def export_report(days: int = Query(30, ge=1, le=366), user: User = Depends(require("reports:export")),
                  db: Session = Depends(get_db)):
    """Rapport Excel agrégé (CDC §3.4). Les effectifs < seuil restent masqués."""
    data = metrics.overview(db, days)
    regions = metrics.geo(db, days)
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    k = data["k_threshold"]
    show = lambda v: v if v is not None else f"< {k}"  # noqa: E731

    wb = Workbook()
    ws = wb.active
    ws.title = "Synthèse"
    ws.append(["SunuSafeguard AI — Rapport d'impact"])
    ws["A1"].font = Font(bold=True, size=14)
    ws.append([f"Période : {start:%d/%m/%Y} → {end:%d/%m/%Y}"])
    ws.append([])
    for label, key in [("Interactions", "total_interactions"), ("Taux de réponses sourcées", "grounded_rate"),
                       ("Orientations proposées", "referrals_proposed"), ("Orientations confirmées", "referrals_confirmed"),
                       ("Taux de complétion", "completion_rate")]:
        ws.append([label, show(data[key])])
    for title, key in [("Besoins", "by_category"), ("Langues", "by_language"), ("Canaux", "by_channel")]:
        sheet = wb.create_sheet(title)
        sheet.append(["Catégorie", "Effectif"])
        for row in data[key]:
            sheet.append([row["key"], show(row["count"])])
    geo_sheet = wb.create_sheet("Régions")
    geo_sheet.append(["Région", "Effectif", "Part wolof"])
    for r in regions:
        geo_sheet.append([r["region"], show(r["count"]), r["wolof_share"]])
    limits = wb.create_sheet("Limites méthodologiques")
    for line in [
        "Données observées issues des interactions anonymes ; aucune donnée individuelle.",
        f"Effectifs inférieurs à {k} masqués (protection contre la réidentification).",
        "Les catégories sont des classifications automatiques indicatives, pas des diagnostics.",
        "Les orientations confirmées dépendent des retours des structures (indicateur incomplet).",
    ]:
        limits.append([line])

    db.add(Report(title=f"Rapport {days} jours", period_start=start, period_end=end, format="xlsx",
                  created_by_id=user.id))
    audit(db, user, "report_export", format="xlsx", days=days)
    db.commit()
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="sunusafeguard-rapport-{end:%Y%m%d}.xlsx"'},
    )
