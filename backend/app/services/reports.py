"""Génération des rapports d'impact (CDC §3.4) : Excel et PDF, toujours agrégés."""
import io
from datetime import datetime, timedelta, timezone

from fpdf import FPDF
from openpyxl import Workbook
from openpyxl.styles import Font
from sqlalchemy.orm import Session

from app.services import metrics

CATEGORY_LABELS = {
    "ecoute_psychosociale": "Écoute et information psychosociales",
    "violences_physiques_verbales": "Violences physiques ou verbales",
    "violences_economiques": "Violences économiques",
    "cyberharcelement": "Cyberharcèlement et violences numériques",
    "hebergement_protection": "Hébergement et protection",
    "information_juridique": "Information juridique et droits",
    "sante_reproductive": "Santé reproductive et bien-être",
    "autre": "Autre / non classé",
}
LANG = {"fr": "Français", "wo": "Wolof"}
CHANNEL = {"web": "Web (texte)", "pwa": "PWA mobile", "mobile": "Application mobile", "voix": "Voix"}


def collect(db: Session, days: int) -> dict:
    end = datetime.now(timezone.utc)
    data = metrics.overview(db, days)
    k = data["k_threshold"]
    return {
        "start": end - timedelta(days=days), "end": end, "k": k, "overview": data, "regions": metrics.geo(db, days),
        "limits": [
            "Données observées issues d'interactions anonymes ; aucune donnée individuelle n'est conservée.",
            f"Effectifs inférieurs à {k} masqués pour éviter toute réidentification.",
            "Les catégories sont des classifications automatiques indicatives, pas des diagnostics.",
            "Les orientations confirmées dépendent des retours des structures : indicateur incomplet.",
            "La région n'est renseignée que lorsque la personne l'indique volontairement.",
        ],
    }


def _show(value, k):
    return value if value is not None else f"< {k}"


def _pct(value):
    return "—" if value is None else f"{round(value * 100)} %"


def summary_rows(r: dict) -> list[tuple[str, object]]:
    o, k = r["overview"], r["k"]
    return [
        ("Interactions avec l'assistant", _show(o["total_interactions"], k)),
        ("Réponses fondées sur une source validée", _pct(o["grounded_rate"])),
        ("Suggestions de l'annuaire", _show(o["directory_suggested"], k)),
        ("Orientations proposées", _show(o["referrals_proposed"], k)),
        ("Orientations confirmées", _show(o["referrals_confirmed"], k)),
        ("Taux de complétion des orientations", _pct(o["completion_rate"])),
    ]


def to_xlsx(r: dict) -> bytes:
    k, o = r["k"], r["overview"]
    wb = Workbook()
    ws = wb.active
    ws.title = "Synthèse"
    ws.append(["SunuSafeguard AI — Rapport d'impact"])
    ws["A1"].font = Font(bold=True, size=14)
    ws.append([f"Période : {r['start']:%d/%m/%Y} → {r['end']:%d/%m/%Y}"])
    ws.append([])
    for row in summary_rows(r):
        ws.append(list(row))
    for title, key, labels in [("Besoins", "by_category", CATEGORY_LABELS), ("Langues", "by_language", LANG),
                               ("Canaux", "by_channel", CHANNEL)]:
        sheet = wb.create_sheet(title)
        sheet.append(["Catégorie", "Effectif"])
        for row in o[key]:
            sheet.append([labels.get(row["key"], row["key"]), _show(row["count"], k)])
    geo = wb.create_sheet("Régions")
    geo.append(["Région", "Effectif", "Part wolof"])
    for g in r["regions"]:
        geo.append([g["region"], _show(g["count"], k), g["wolof_share"]])
    trend = wb.create_sheet("Évolution")
    trend.append(["Date", "Interactions"])
    for p in o["timeseries"]:
        trend.append([p["date"], _show(p["count"], k)])
    limits = wb.create_sheet("Limites méthodologiques")
    for line in r["limits"]:
        limits.append([line])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _latin(text: str) -> str:
    """Les polices PDF standard sont en Latin-1 : on remplace les rares caractères hors jeu."""
    for a, b in {"→": "->", "—": "-", "–": "-", "’": "'", "≥": ">=", "·": "-", "…": "...", "œ": "oe"}.items():
        text = text.replace(a, b)
    return text.encode("latin-1", "replace").decode("latin-1")


class _PDF(FPDF):
    def header(self):
        self.set_fill_color(15, 23, 42)
        self.rect(0, 0, 210, 18, "F")
        self.set_text_color(248, 250, 252)
        self.set_font("Helvetica", "B", 12)
        self.set_xy(12, 5)
        self.cell(0, 8, _latin("SunuSafeguard AI — Rapport d'impact (données agrégées)"))
        self.set_text_color(15, 23, 42)
        self.ln(18)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 6, _latin(f"GREEN T SARL — page {self.page_no()} — document confidentiel, diffusion restreinte"), align="C")


def to_pdf(r: dict) -> bytes:
    k, o = r["k"], r["overview"]
    pdf = _PDF()
    pdf.set_auto_page_break(True, 16)
    pdf.add_page()
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _latin(f"Période : {r['start']:%d/%m/%Y} -> {r['end']:%d/%m/%Y}"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    def section(title):
        pdf.ln(3)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(13, 148, 136)
        pdf.cell(0, 8, _latin(title), new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(15, 23, 42)
        pdf.set_font("Helvetica", "", 10)

    section("1. Indicateurs clés")
    for label, value in summary_rows(r):
        pdf.cell(120, 7, _latin(label), border="B")
        pdf.cell(0, 7, _latin(str(value)), border="B", align="R", new_x="LMARGIN", new_y="NEXT")

    def bars(title, rows, labels):
        section(title)
        visible = [x for x in rows if x["count"] is not None]
        top = max([x["count"] for x in visible] or [1])
        for x in rows:
            pdf.cell(75, 7, _latin(labels.get(x["key"], x["key"])))
            if x["count"] is None:
                pdf.set_text_color(100, 116, 139)
                pdf.cell(0, 7, _latin(f"< {k} (masqué)"), new_x="LMARGIN", new_y="NEXT")
                pdf.set_text_color(15, 23, 42)
                continue
            width = 90 * x["count"] / top
            pdf.set_fill_color(20, 184, 166)
            y = pdf.get_y()
            pdf.rect(pdf.get_x(), y + 1.5, max(width, 0.5), 4, "F")
            pdf.set_x(pdf.get_x() + width + 2)
            pdf.cell(0, 7, str(x["count"]), new_x="LMARGIN", new_y="NEXT")

    bars("2. Répartition des besoins", o["by_category"], CATEGORY_LABELS)
    bars("3. Langues utilisées", o["by_language"], LANG)
    bars("4. Canaux d'accès", o["by_channel"], CHANNEL)
    bars("5. Répartition géographique (régions déclarées)",
         [{"key": g["region"], "count": g["count"]} for g in r["regions"]], {})
    section("6. Limites méthodologiques")
    for line in r["limits"]:
        pdf.multi_cell(0, 6, _latin("- " + line), new_x="LMARGIN", new_y="NEXT")
    return bytes(pdf.output())
