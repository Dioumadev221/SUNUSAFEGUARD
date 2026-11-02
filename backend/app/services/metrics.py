"""Indicateurs agrégés avec seuil de publication (k-anonymat, CDC §3.3)."""
from collections import Counter
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import ReferralRequest, UsageEvent


def record_usage(db: Session, result, channel: str = "web", region: str | None = None) -> None:
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    db.add(UsageEvent(
        hour=now, channel=channel, language=result.language, category=result.category,
        region=region or "non_renseignee", safety_action=result.safety_action, grounded=result.grounded,
        used_llm=result.used_llm, top_score=result.top_score, latency_ms=result.timings_ms.get("total", 0),
        directory_suggested=result.suggest_directory,
    ))


def suppress(counter: Counter, k: int) -> list[dict]:
    """Remplace les effectifs < k par None (affiché « < k ») et regroupe le reste."""
    out = []
    for key, n in counter.most_common():
        out.append({"key": key, "count": n if n >= k else None, "suppressed": n < k})
    return out


def _events(db: Session, days: int, offset_days: int = 0, **filters) -> list[UsageEvent]:
    """Événements de la fenêtre [maintenant - offset - days, maintenant - offset[."""
    until = datetime.now(timezone.utc) - timedelta(days=offset_days)
    q = select(UsageEvent).where(UsageEvent.hour >= until - timedelta(days=days))
    if offset_days:
        q = q.where(UsageEvent.hour < until)
    for col, val in filters.items():
        if val:
            q = q.where(getattr(UsageEvent, col) == val)
    return list(db.scalars(q))


def _bucket(day: date, granularity: str) -> str:
    if granularity == "week":
        return (day - timedelta(days=day.weekday())).isoformat()
    if granularity == "month":
        return day.replace(day=1).isoformat()
    return day.isoformat()


def _kpis(ev: list[UsageEvent], referrals: list[ReferralRequest], k: int) -> dict:
    total = len(ev)
    confirmed = sum(1 for r in referrals if r.status in {"prise_en_charge_confirmee", "cloturee"})
    return {
        "total_interactions": total if total >= k else None,
        "grounded_rate": round(sum(e.grounded for e in ev) / total, 3) if total >= k else None,
        "directory_suggested": sum(e.directory_suggested for e in ev) if total >= k else None,
        "referrals_proposed": len(referrals) if len(referrals) >= k else None,
        "referrals_confirmed": confirmed if confirmed >= k else None,
        "completion_rate": round(confirmed / len(referrals), 3) if len(referrals) >= k else None,
    }


def _referrals(db: Session, days: int, offset_days: int = 0) -> list[ReferralRequest]:
    until = datetime.now(timezone.utc) - timedelta(days=offset_days)
    q = select(ReferralRequest).where(ReferralRequest.created_at >= until - timedelta(days=days))
    if offset_days:
        q = q.where(ReferralRequest.created_at < until)
    return list(db.scalars(q))


def overview(db: Session, days: int = 30, channel: str | None = None, language: str | None = None,
             region: str | None = None, granularity: str = "day") -> dict:
    """KPI de la période, mêmes KPI sur la période précédente de même durée (comparaison, CDC §3.2)."""
    k = get_settings().k_anonymity_threshold
    filters = {"channel": channel, "language": language, "region": region}
    ev = _events(db, days, **filters)
    previous = _kpis(_events(db, days, offset_days=days, **filters), _referrals(db, days, offset_days=days), k)

    series = Counter(_bucket(e.hour.date(), granularity) for e in ev)
    return {
        "period_days": days,
        "k_threshold": k,
        **_kpis(ev, _referrals(db, days), k),
        "previous": previous,
        "granularity": granularity,
        "timeseries": [{"date": d, "count": n if n >= k else None} for d, n in sorted(series.items())],
        "by_channel": suppress(Counter(e.channel for e in ev), k),
        "by_language": suppress(Counter(e.language for e in ev), k),
        "by_category": suppress(Counter(e.category for e in ev), k),
        "notice": "Données agrégées et anonymes. Les effectifs inférieurs au seuil sont masqués.",
    }


def geo(db: Session, days: int = 30) -> list[dict]:
    k = get_settings().k_anonymity_threshold
    ev = [e for e in _events(db, days) if e.region != "non_renseignee"]
    regions: dict[str, list[UsageEvent]] = {}
    for e in ev:
        regions.setdefault(e.region, []).append(e)
    out = []
    for region, items in sorted(regions.items()):
        n = len(items)
        out.append({
            "region": region,
            "count": n if n >= k else None,
            "suppressed": n < k,
            "wolof_share": round(sum(e.language == "wo" for e in items) / n, 2) if n >= k else None,
            "top_categories": suppress(Counter(e.category for e in items), k)[:3] if n >= k else [],
        })
    return out


def knowledge_gaps(db: Session, days: int = 30) -> list[dict]:
    """Thématiques pour lesquelles l'assistant n'a pas trouvé de source suffisante."""
    k = get_settings().k_anonymity_threshold
    ev = [e for e in _events(db, days) if not e.grounded and e.safety_action in {"allow", "redirect_professional", "urgent"}]
    by_cat = Counter(e.category for e in ev)
    total_by_cat = Counter(e.category for e in _events(db, days))
    return [
        {"category": cat, "unanswered": n if n >= k else None, "suppressed": n < k,
         "share": round(n / total_by_cat[cat], 2) if total_by_cat[cat] else None}
        for cat, n in by_cat.most_common()
    ]


def ai_quality(db: Session, days: int = 7) -> dict:
    ev = _events(db, days)
    n = len(ev) or 1
    lat = sorted(e.latency_ms for e in ev) or [0]
    return {
        "interactions": len(ev),
        "grounded_rate": round(sum(e.grounded for e in ev) / n, 3),
        "no_source_rate": round(sum(not e.grounded for e in ev) / n, 3),
        "llm_usage_rate": round(sum(e.used_llm for e in ev) / n, 3),
        "avg_top_score": round(sum(e.top_score for e in ev) / n, 3),
        "latency_p50_ms": lat[len(lat) // 2],
        "latency_p95_ms": lat[int(len(lat) * 0.95) - 1 if len(lat) > 1 else 0],
        "safety_actions": dict(Counter(e.safety_action for e in ev)),
    }
