import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText } from "lucide-react";
import RegionMap from "@/components/RegionMap";
import { PageHeader } from "@/components/DashboardLayout";
import { Count, ErrorNote, Loading, Stat, Tabs } from "@/components/ui";
import { download } from "@/lib/api";
import { AXIS, CHART_COLORS, TOOLTIP_STYLE } from "@/lib/chart";
import { cat, fmtDate, REGIONS } from "@/lib/labels";
import { usePrefs, type Tx } from "@/lib/prefs";
import type { Bucket } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

type Kpis = {
  total_interactions: number | null; grounded_rate: number | null; directory_suggested: number | null;
  referrals_proposed: number | null; referrals_confirmed: number | null; completion_rate: number | null;
};
type Overview = Kpis & {
  period_days: number; k_threshold: number; previous: Kpis; granularity: Granularity;
  timeseries: { date: string; count: number | null }[];
  by_channel: Bucket[]; by_language: Bucket[]; by_category: Bucket[]; notice: string;
};
type Region = { region: string; count: number | null; suppressed: boolean; wolof_share: number | null; top_categories: Bucket[] };

type Granularity = "day" | "week" | "month";
const granularityLabels = (tx: Tx): Record<Granularity, string> => ({ day: tx("Jour", "Day"), week: tx("Semaine", "Week"), month: tx("Mois", "Month") });

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);

/** Évolution par rapport à la période précédente : % pour un effectif, points pour un taux. */
function Delta({ now, before, rate }: { now: number | null; before: number | null; rate?: boolean }) {
  const { tx } = usePrefs();
  if (now === null || before === null || (!rate && before === 0)) return null;
  const v = rate ? Math.round((now - before) * 100) : Math.round(((now - before) / before) * 100);
  const tone = v > 0 ? "bg-success/15 text-success" : v < 0 ? "bg-alert/15 text-alert" : "bg-slate-500/15 muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`} title={tx("Par rapport à la période précédente de même durée", "Compared with the previous period of the same length")}>
      {v > 0 ? "+" : ""}{v}{rate ? " pt" : " %"}
    </span>
  );
}

function fmtBucket(d: string, g: Granularity, lang: string) {
  if (g === "month") return new Date(d).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { month: "short", year: "2-digit" });
  return `${d.slice(8)}/${d.slice(5, 7)}`;
}
const langLabels = (tx: Tx): Record<string, string> => ({ fr: tx("Français", "French"), wo: "Wolof" });
const channelLabels = (tx: Tx): Record<string, string> => ({ web: tx("Web (texte)", "Web (text)"), mobile: tx("Application mobile", "Mobile app"), pwa: "PWA mobile", voix: tx("Voix", "Voice") });

export default function Impact() {
  const [tab, setTab] = useState<"macro" | "geo" | "reports">("macro");
  const { tx } = usePrefs();
  return (
    <>
      <PageHeader title="Sunu Impact" subtitle={tx("Lecture globale et anonymisée de l'utilisation — aucune donnée individuelle.", "Overall, anonymized view of usage — no individual data.")} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "macro", label: tx("1.1 Vue macro & KPI", "1.1 Overview & KPIs") }, { id: "geo", label: tx("1.2 Cartographie", "1.2 Map") }, { id: "reports", label: tx("1.3 Rapports", "1.3 Reports") }]} />
      {tab === "macro" && <Macro />}
      {tab === "geo" && <Geo />}
      {tab === "reports" && <Reports />}
    </>
  );
}

function Macro() {
  const { tx, lang } = usePrefs();
  const CHANNEL = channelLabels(tx);
  const GRANULARITY = granularityLabels(tx);
  const [days, setDays] = useState(30);
  const [language, setLanguage] = useState("");
  const [channel, setChannel] = useState("");
  const [region, setRegion] = useState("");
  const [granularity, setGranularity] = useState<Granularity>("day");
  const qs = new URLSearchParams({ days: String(days), granularity, ...(language && { language }), ...(channel && { channel }), ...(region && { region }) });
  const { data, error } = useFetch<Overview>(`/metrics/overview?${qs}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <select className="input w-auto" value={days} onChange={(e) => setDays(+e.target.value)} aria-label={tx("Période", "Period")}>
          {[7, 30, 90, 365].map((d) => <option key={d} value={d}>{tx(`${d} derniers jours`, `Last ${d} days`)}</option>)}
        </select>
        <select className="input w-auto" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label={tx("Langue", "Language")}>
          <option value="">{tx("Toutes langues", "All languages")}</option><option value="fr">{tx("Français", "French")}</option><option value="wo">Wolof</option>
        </select>
        <select className="input w-auto" value={channel} onChange={(e) => setChannel(e.target.value)} aria-label={tx("Canal", "Channel")}>
          <option value="">{tx("Tous canaux", "All channels")}</option>{Object.entries(CHANNEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input w-auto" value={region} onChange={(e) => setRegion(e.target.value)} aria-label={tx("Région", "Region")}>
          <option value="">{tx("Toutes régions", "All regions")}</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <ErrorNote error={error} />
      {!data ? <Loading /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={tx("Interactions", "Interactions")} value={<Count value={data.total_interactions} k={data.k_threshold} />} delta={<Delta now={data.total_interactions} before={data.previous.total_interactions} />} />
            <Stat label={tx("Réponses sourcées", "Sourced answers")} value={pct(data.grounded_rate)} delta={<Delta now={data.grounded_rate} before={data.previous.grounded_rate} rate />} />
            <Stat label={tx("Orientations proposées", "Referrals offered")} value={<Count value={data.referrals_proposed} k={data.k_threshold} />} delta={<Delta now={data.referrals_proposed} before={data.previous.referrals_proposed} />}
              hint={data.referrals_confirmed !== null ? tx(`${data.referrals_confirmed} prises en charge confirmées`, `${data.referrals_confirmed} confirmed by organizations`) : undefined} />
            <Stat label={tx("Orientations abouties", "Completed referrals")} value={pct(data.completion_rate)} delta={<Delta now={data.completion_rate} before={data.previous.completion_rate} rate />} hint={tx("Selon les retours des structures", "Based on feedback from organizations")} />
          </div>
          <p className="-mt-2 text-xs muted">{tx(`Badges : évolution par rapport aux ${days} jours précédents.`, `Badges: change compared with the previous ${days} days.`)}</p>
          <div className="card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">{tx("Évolution des interactions", "Interactions over time")}</h2>
              <div className="inline-flex rounded-full bg-sand-200/70 p-1 dark:bg-white/[0.05]" role="group" aria-label={tx("Granularité", "Granularity")}>
                {(Object.keys(GRANULARITY) as Granularity[]).map((g) => (
                  <button key={g} onClick={() => setGranularity(g)} aria-pressed={granularity === g}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${granularity === g ? "bg-white shadow-sm dark:bg-night-700" : "muted"}`}>{GRANULARITY[g]}</button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={data.timeseries.map((p) => ({ ...p, date: fmtBucket(p.date, data.granularity, lang) }))} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#0E7C70" stopOpacity={0.35} />
                      <stop offset="1" stopColor="#0E7C70" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#A1978A22" />
                  <XAxis dataKey="date" {...AXIS} tickLine={false} axisLine={false} minTickGap={40} />
                  <YAxis {...AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="count" name={tx("Interactions", "Interactions")} stroke="#0E7C70" strokeWidth={2.5} fill="url(#area)" dot={false} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <h2 className="mb-1 font-bold">{tx("Besoins exprimés", "Needs expressed")}</h2>
              <p className="mb-4 text-xs muted">{tx("Classification automatique indicative — pas un diagnostic.", "Indicative automatic classification — not a diagnosis.")}</p>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={data.by_category.map((b) => ({ name: cat(b.key, lang), count: b.count ?? 0 }))} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={200} {...AXIS} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#A1978A11" }} />
                    <Bar dataKey="count" name={tx("Effectif", "Count")} fill="#0E7C70" radius={[0, 999, 999, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-4">
              <Donut title={tx("Langues", "Languages")} data={data.by_language} labels={langLabels(tx)} />
              <Donut title={tx("Canaux d'accès", "Access channels")} data={data.by_channel} labels={CHANNEL} />
            </div>
          </div>
          <p className="text-xs muted">{data.notice} {tx("Seuil", "Threshold")} N ≥ {data.k_threshold}.</p>
        </>
      )}
    </div>
  );
}

function Donut({ title, data, labels }: { title: string; data: Bucket[]; labels: Record<string, string> }) {
  const rows = data.filter((d) => d.count !== null).map((d) => ({ name: labels[d.key] ?? d.key, value: d.count as number }));
  const total = rows.reduce((n, r) => n + r.value, 0) || 1;
  return (
    <div className="card p-5">
      <h2 className="mb-4 font-bold">{title}</h2>
      <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-sand-200 dark:bg-white/[0.06]">
        {rows.map((r, i) => <span key={r.name} style={{ width: `${(r.value / total) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />)}
      </div>
      <ul className="space-y-2 text-sm">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            {r.name}
            <span className="ml-auto font-semibold tabular-nums">{Math.round((r.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Geo() {
  const { tx, lang } = usePrefs();
  const { data, error } = useFetch<Region[]>("/metrics/geo?days=30");
  const [metric, setMetric] = useState<"count" | "wolof">("count");
  const max = Math.max(1, ...(data ?? []).map((r) => r.count ?? 0));
  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-warn/10 p-3 text-sm">
        {tx("Tendances statistiques par région, jamais de localisation de personnes. Les régions sous le seuil sont masquées.",
          "Statistical trends by region, never the location of individuals. Regions below the threshold are hidden.")}
      </p>
      <ErrorNote error={error} />
      {data && (
        <div className="card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{tx("Carte des régions (30 j)", "Regional map (30 days)")}</h2>
            <select className="input w-auto" value={metric} onChange={(e) => setMetric(e.target.value as "count" | "wolof")} aria-label={tx("Indicateur", "Indicator")}>
              <option value="count">{tx("Volume des demandes", "Request volume")}</option><option value="wolof">{tx("Part du wolof", "Wolof share")}</option>
            </select>
          </div>
          <div className="max-w-xl"><RegionMap data={data} metric={metric} /></div>
        </div>
      )}
      {!data ? <Loading /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>{tx("Région", "Region")}</th><th>{tx("Volume (30 j)", "Volume (30 days)")}</th><th className="w-1/3">{tx("Intensité", "Intensity")}</th><th>{tx("Part wolof", "Wolof share")}</th><th>{tx("Besoins principaux", "Main needs")}</th></tr></thead>
            <tbody>
              {[...data].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).map((r) => (
                <tr key={r.region}>
                  <td className="font-medium">{r.region}</td>
                  <td><Count value={r.count} /></td>
                  <td><div className="h-2.5 rounded-full bg-sand-200 dark:bg-night-700"><div className="h-2.5 rounded-full bg-teal-light" style={{ width: `${((r.count ?? 0) / max) * 100}%` }} /></div></td>
                  <td>{r.wolof_share === null ? "—" : `${Math.round(r.wolof_share * 100)} %`}</td>
                  <td className="text-xs muted">{r.top_categories.filter((c) => c.count !== null).map((c) => cat(c.key, lang)).join(" · ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Reports() {
  const { tx, lang } = usePrefs();
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const history = useFetch<{ id: number; title: string; format: string; created_at: string }[]>("/reports");
  async function exportReport(format: "xlsx" | "pdf") {
    setBusy(true);
    try {
      await download(`/reports/export?days=${days}&format=${format}`, `sunusafeguard-rapport-${days}j.${format}`);
      history.reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <h2 className="font-semibold">{tx("Générer un rapport d'impact", "Generate an impact report")}</h2>
        <p className="text-sm muted">{tx("Contenu : activité, volumes, besoins, répartition géographique et linguistique, orientations, limites méthodologiques.", "Contents: activity, volumes, needs, geographic and language breakdown, referrals, methodological limits.")}</p>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={days} onChange={(e) => setDays(+e.target.value)}>{[30, 90, 365].map((d) => <option key={d} value={d}>{tx(`${d} jours`, `${d} days`)}</option>)}</select>
          <button onClick={() => exportReport("pdf")} disabled={busy} className="btn-primary"><FileText size={16} /> {tx("Rapport PDF", "PDF report")}</button>
          <button onClick={() => exportReport("xlsx")} disabled={busy} className="btn-ghost"><Download size={16} /> {tx("Données Excel", "Excel data")}</button>
        </div>
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">{tx("Historique des rapports", "Report history")}</h2>
        {!history.data ? <Loading /> : history.data.length === 0 ? <p className="muted text-sm">{tx("Aucun rapport généré.", "No report generated yet.")}</p> : (
          <table className="table"><thead><tr><th>{tx("Titre", "Title")}</th><th>Format</th><th>Date</th></tr></thead>
            <tbody>{history.data.map((r) => <tr key={r.id}><td>{r.title}</td><td>{r.format}</td><td>{fmtDate(r.created_at, lang)}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
