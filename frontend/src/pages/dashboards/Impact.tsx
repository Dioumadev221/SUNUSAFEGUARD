import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText } from "lucide-react";
import RegionMap from "@/components/RegionMap";
import { PageHeader } from "@/components/DashboardLayout";
import { Count, ErrorNote, Loading, Stat, Tabs } from "@/components/ui";
import { download } from "@/lib/api";
import { AXIS, CHART_COLORS, TOOLTIP_STYLE } from "@/lib/chart";
import { cat, fmtDate, REGIONS } from "@/lib/labels";
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
const GRANULARITY: Record<Granularity, string> = { day: "Jour", week: "Semaine", month: "Mois" };

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);

/** Évolution par rapport à la période précédente : % pour un effectif, points pour un taux. */
function Delta({ now, before, rate }: { now: number | null; before: number | null; rate?: boolean }) {
  if (now === null || before === null || (!rate && before === 0)) return null;
  const v = rate ? Math.round((now - before) * 100) : Math.round(((now - before) / before) * 100);
  const tone = v > 0 ? "bg-success/15 text-success" : v < 0 ? "bg-alert/15 text-alert" : "bg-slate-500/15 muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`} title="Par rapport à la période précédente de même durée">
      {v > 0 ? "+" : ""}{v}{rate ? " pt" : " %"}
    </span>
  );
}

function fmtBucket(d: string, g: Granularity) {
  if (g === "month") return new Date(d).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  return `${d.slice(8)}/${d.slice(5, 7)}`;
}
const LANG: Record<string, string> = { fr: "Français", wo: "Wolof" };
const CHANNEL: Record<string, string> = { web: "Web (texte)", pwa: "PWA mobile", voix: "Voix" };

export default function Impact() {
  const [tab, setTab] = useState<"macro" | "geo" | "reports">("macro");
  return (
    <>
      <PageHeader title="Sunu Impact" subtitle="Lecture globale et anonymisée de l'utilisation — aucune donnée individuelle." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "macro", label: "1.1 Vue macro & KPI" }, { id: "geo", label: "1.2 Cartographie" }, { id: "reports", label: "1.3 Rapports" }]} />
      {tab === "macro" && <Macro />}
      {tab === "geo" && <Geo />}
      {tab === "reports" && <Reports />}
    </>
  );
}

function Macro() {
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
        <select className="input w-auto" value={days} onChange={(e) => setDays(+e.target.value)} aria-label="Période">
          {[7, 30, 90, 365].map((d) => <option key={d} value={d}>{d} derniers jours</option>)}
        </select>
        <select className="input w-auto" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Langue">
          <option value="">Toutes langues</option><option value="fr">Français</option><option value="wo">Wolof</option>
        </select>
        <select className="input w-auto" value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Canal">
          <option value="">Tous canaux</option>{Object.entries(CHANNEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input w-auto" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Région">
          <option value="">Toutes régions</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <ErrorNote error={error} />
      {!data ? <Loading /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Interactions" value={<Count value={data.total_interactions} k={data.k_threshold} />} delta={<Delta now={data.total_interactions} before={data.previous.total_interactions} />} />
            <Stat label="Réponses sourcées" value={pct(data.grounded_rate)} delta={<Delta now={data.grounded_rate} before={data.previous.grounded_rate} rate />} />
            <Stat label="Orientations proposées" value={<Count value={data.referrals_proposed} k={data.k_threshold} />} delta={<Delta now={data.referrals_proposed} before={data.previous.referrals_proposed} />}
              hint={data.referrals_confirmed !== null ? `${data.referrals_confirmed} prises en charge confirmées` : undefined} />
            <Stat label="Orientations abouties" value={pct(data.completion_rate)} delta={<Delta now={data.completion_rate} before={data.previous.completion_rate} rate />} hint="Selon les retours des structures" />
          </div>
          <p className="-mt-2 text-xs muted">Badges : évolution par rapport aux {days} jours précédents.</p>
          <div className="card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Évolution des interactions</h2>
              <div className="inline-flex rounded-full bg-sand-200/70 p-1 dark:bg-white/[0.05]" role="group" aria-label="Granularité">
                {(Object.keys(GRANULARITY) as Granularity[]).map((g) => (
                  <button key={g} onClick={() => setGranularity(g)} aria-pressed={granularity === g}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${granularity === g ? "bg-white shadow-sm dark:bg-night-700" : "muted"}`}>{GRANULARITY[g]}</button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={data.timeseries.map((p) => ({ ...p, date: fmtBucket(p.date, data.granularity) }))} margin={{ left: -20, right: 8 }}>
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
                  <Area type="monotone" dataKey="count" name="Interactions" stroke="#0E7C70" strokeWidth={2.5} fill="url(#area)" dot={false} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <h2 className="mb-1 font-bold">Besoins exprimés</h2>
              <p className="mb-4 text-xs muted">Classification automatique indicative — pas un diagnostic.</p>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={data.by_category.map((b) => ({ name: cat(b.key), count: b.count ?? 0 }))} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={200} {...AXIS} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#A1978A11" }} />
                    <Bar dataKey="count" name="Effectif" fill="#0E7C70" radius={[0, 999, 999, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-4">
              <Donut title="Langues" data={data.by_language} labels={LANG} />
              <Donut title="Canaux d'accès" data={data.by_channel} labels={CHANNEL} />
            </div>
          </div>
          <p className="text-xs muted">{data.notice} Seuil N ≥ {data.k_threshold}.</p>
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
  const { data, error } = useFetch<Region[]>("/metrics/geo?days=30");
  const [metric, setMetric] = useState<"count" | "wolof">("count");
  const max = Math.max(1, ...(data ?? []).map((r) => r.count ?? 0));
  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-warn/10 p-3 text-sm">
        Tendances statistiques par région, jamais de localisation de personnes. Les régions sous le seuil sont masquées.
      </p>
      <ErrorNote error={error} />
      {data && (
        <div className="card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Carte des régions (30 j)</h2>
            <select className="input w-auto" value={metric} onChange={(e) => setMetric(e.target.value as "count" | "wolof")} aria-label="Indicateur">
              <option value="count">Volume des demandes</option><option value="wolof">Part du wolof</option>
            </select>
          </div>
          <div className="max-w-xl"><RegionMap data={data} metric={metric} /></div>
        </div>
      )}
      {!data ? <Loading /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Région</th><th>Volume (30 j)</th><th className="w-1/3">Intensité</th><th>Part wolof</th><th>Besoins principaux</th></tr></thead>
            <tbody>
              {[...data].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).map((r) => (
                <tr key={r.region}>
                  <td className="font-medium">{r.region}</td>
                  <td><Count value={r.count} /></td>
                  <td><div className="h-2.5 rounded-full bg-sand-200 dark:bg-night-700"><div className="h-2.5 rounded-full bg-teal-light" style={{ width: `${((r.count ?? 0) / max) * 100}%` }} /></div></td>
                  <td>{r.wolof_share === null ? "—" : `${Math.round(r.wolof_share * 100)} %`}</td>
                  <td className="text-xs muted">{r.top_categories.filter((c) => c.count !== null).map((c) => cat(c.key)).join(" · ") || "—"}</td>
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
        <h2 className="font-semibold">Générer un rapport d'impact</h2>
        <p className="text-sm muted">Contenu : activité, volumes, besoins, répartition géographique et linguistique, orientations, limites méthodologiques.</p>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={days} onChange={(e) => setDays(+e.target.value)}>{[30, 90, 365].map((d) => <option key={d} value={d}>{d} jours</option>)}</select>
          <button onClick={() => exportReport("pdf")} disabled={busy} className="btn-primary"><FileText size={16} /> Rapport PDF</button>
          <button onClick={() => exportReport("xlsx")} disabled={busy} className="btn-ghost"><Download size={16} /> Données Excel</button>
        </div>
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">Historique des rapports</h2>
        {!history.data ? <Loading /> : history.data.length === 0 ? <p className="muted text-sm">Aucun rapport généré.</p> : (
          <table className="table"><thead><tr><th>Titre</th><th>Format</th><th>Date</th></tr></thead>
            <tbody>{history.data.map((r) => <tr key={r.id}><td>{r.title}</td><td>{r.format}</td><td>{fmtDate(r.created_at)}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
