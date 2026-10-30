import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/DashboardLayout";
import { Count, ErrorNote, Loading, Stat, Tabs } from "@/components/ui";
import { download } from "@/lib/api";
import { AXIS, CHART_COLORS, TOOLTIP_STYLE } from "@/lib/chart";
import { cat, fmtDate } from "@/lib/labels";
import type { Bucket } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

type Overview = {
  period_days: number; k_threshold: number; total_interactions: number | null; grounded_rate: number | null;
  directory_suggested: number | null; referrals_proposed: number | null; referrals_confirmed: number | null;
  completion_rate: number | null; timeseries: { date: string; count: number | null }[];
  by_channel: Bucket[]; by_language: Bucket[]; by_category: Bucket[]; notice: string;
};
type Region = { region: string; count: number | null; suppressed: boolean; wolof_share: number | null; top_categories: Bucket[] };

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);
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
  const qs = new URLSearchParams({ days: String(days), ...(language && { language }), ...(channel && { channel }) });
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
      </div>
      <ErrorNote error={error} />
      {!data ? <Loading /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Interactions" value={<Count value={data.total_interactions} k={data.k_threshold} />} />
            <Stat label="Réponses fondées sur une source" value={pct(data.grounded_rate)} />
            <Stat label="Orientations proposées" value={<Count value={data.referrals_proposed} k={data.k_threshold} />} />
            <Stat label="Taux de complétion des orientations" value={pct(data.completion_rate)} hint="Indicateur incomplet : dépend des retours des structures" />
          </div>
          <div className="card">
            <h2 className="mb-4 font-semibold">Évolution journalière</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={data.timeseries.map((p) => ({ ...p, date: p.date.slice(5) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                  <XAxis dataKey="date" {...AXIS} />
                  <YAxis {...AXIS} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="count" name="Interactions" stroke="#14B8A6" strokeWidth={2} dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <h2 className="mb-1 font-semibold">Catégories de besoins</h2>
              <p className="mb-4 text-xs muted">Classification automatique indicative — pas un diagnostic.</p>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={data.by_category.map((b) => ({ name: cat(b.key), count: b.count ?? 0 }))} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" {...AXIS} />
                    <YAxis type="category" dataKey="name" width={190} {...AXIS} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" name="Effectif" fill="#14B8A6" radius={[0, 6, 6, 0]} />
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
  return (
    <div className="card">
      <h2 className="mb-2 font-semibold">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="h-28 w-28">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={rows} dataKey="value" innerRadius={30} outerRadius={50} stroke="none">
                {rows.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-1 text-sm">
          {rows.map((r, i) => (
            <li key={r.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{r.name} · {r.value}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Geo() {
  const { data, error } = useFetch<Region[]>("/metrics/geo?days=30");
  const max = Math.max(1, ...(data ?? []).map((r) => r.count ?? 0));
  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-warn/10 p-3 text-sm">
        Tendances statistiques par région, jamais de localisation de personnes. Les régions sous le seuil sont masquées.
        La carte PostGIS par département est prévue en Phase 3.
      </p>
      <ErrorNote error={error} />
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
  async function exportXlsx() {
    setBusy(true);
    try {
      await download(`/reports/export?days=${days}`, `sunusafeguard-rapport-${days}j.xlsx`);
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
          <button onClick={exportXlsx} disabled={busy} className="btn-primary"><Download size={16} /> Export Excel</button>
          <button onClick={() => window.print()} className="btn-ghost"><Printer size={16} /> Imprimer / PDF</button>
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
