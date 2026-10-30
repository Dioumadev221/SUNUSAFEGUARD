import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { PageHeader } from "@/components/DashboardLayout";
import { Badge, ErrorNote, Loading, Stat, Tabs } from "@/components/ui";
import { fmtDate } from "@/lib/labels";
import { useFetch } from "@/lib/useFetch";

type Services = {
  services: { name: string; status: string; detail: string; latency_ms?: number | null }[];
  system: { cpu_percent: number; ram_percent: number; ram_used_gb: number; ram_total_gb: number; disk_percent: number };
  safety_rules_version: string;
};
type AIQuality = { interactions: number; grounded_rate: number; no_source_rate: number; llm_usage_rate: number; avg_top_score: number; latency_p50_ms: number; latency_p95_ms: number; safety_actions: Record<string, number> };
type Security = { counts: Record<string, number>; recent: { id: number; kind: string; severity: string; rule: string; created_at: string }[] };
type Audit = { id: number; actor: string | null; action: string; target: string; created_at: string }[];

const pct = (v: number) => `${Math.round(v * 100)} %`;
const STATUS_ICON: Record<string, JSX.Element> = {
  up: <CheckCircle2 className="text-success" size={18} />,
  down: <XCircle className="text-alert" size={18} />,
  disabled: <CircleDashed className="text-warn" size={18} />,
  planned: <CircleDashed className="text-slate-400" size={18} />,
};

export default function Tech() {
  const [tab, setTab] = useState<"ai" | "safety" | "infra">("ai");
  return (
    <>
      <PageHeader title="Sunu Tech" subtitle="Supervision technique, qualité de l'IA, garde-fous et journaux." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "ai", label: "4.1 Performance RAG & IA" }, { id: "safety", label: "4.2 Garde-fous" }, { id: "infra", label: "4.3 Infrastructure & journaux" }]} />
      {tab === "ai" && <AI />}
      {tab === "safety" && <Safety />}
      {tab === "infra" && <Infra />}
    </>
  );
}

function AI() {
  const { data, error } = useFetch<AIQuality>("/monitoring/ai?days=7");
  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Interactions (7 j)" value={data.interactions} />
        <Stat label="Réponses sourcées" value={pct(data.grounded_rate)} />
        <Stat label="Réponses sans source suffisante" value={pct(data.no_source_rate)} hint="Repli honnête plutôt qu'invention" />
        <Stat label="Score moyen de récupération" value={data.avg_top_score.toFixed(2)} />
        <Stat label="Latence p50" value={`${Math.round(data.latency_p50_ms)} ms`} />
        <Stat label="Latence p95" value={`${Math.round(data.latency_p95_ms)} ms`} />
        <Stat label="Réponses via LLM" value={pct(data.llm_usage_rate)} hint="Le reste : repli extractif" />
      </div>
      <div className="card text-sm">
        <h2 className="mb-2 font-semibold">Chaîne technique</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {["STT (Phase 4)", "Détection langue", "Embeddings", "RAG Retrieval", "LLM Inference", "Contrôle sécurité", "TTS (Phase 4)"].map((s, i, a) => (
            <span key={s} className="flex items-center gap-2"><Badge tone={s.includes("Phase") ? "bg-slate-500/15 text-slate-400" : undefined}>{s}</Badge>{i < a.length - 1 && "→"}</span>
          ))}
        </div>
        <p className="mt-3 text-xs muted">La fidélité des réponses générées (« groundedness ») doit être mesurée sur jeu de tests annoté : la cible &gt; 99 % est un objectif expérimental, pas une garantie.</p>
      </div>
    </div>
  );
}

function Safety() {
  const { data, error } = useFetch<Security>("/monitoring/security");
  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading />;
  const label: Record<string, string> = { safety_urgent: "Escalades d'urgence (règles déterministes)", safety_refuse_injection: "Tentatives de prompt injection", safety_out_of_scope: "Demandes hors périmètre", safety_redirect_professional: "Redirections vers un professionnel", login_failed: "Échecs de connexion", account_locked: "Comptes verrouillés" };
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(label).map(([k, v]) => <Stat key={k} label={v} value={data.counts[k] ?? 0} />)}
      </div>
      <p className="rounded-xl bg-warn/10 p-3 text-sm"><AlertTriangle size={16} className="mr-1 inline text-warn" /> Aucun signalement externe n'est jamais déclenché automatiquement. Les événements ne contiennent pas le texte des utilisatrices.</p>
      <div className="card overflow-x-auto">
        <h2 className="mb-2 font-semibold">Événements récents</h2>
        <table className="table"><thead><tr><th>Date</th><th>Type</th><th>Gravité</th><th>Règle</th></tr></thead>
          <tbody>{data.recent.map((e) => <tr key={e.id}><td className="text-xs">{fmtDate(e.created_at)}</td><td>{e.kind}</td><td><Badge tone={e.severity === "warning" ? "bg-warn/15 text-warn" : undefined}>{e.severity}</Badge></td><td className="font-mono text-xs muted">{e.rule}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function Infra() {
  const svc = useFetch<Services>("/monitoring/services");
  const audit = useFetch<Audit>("/audit");
  return (
    <div className="space-y-4">
      <ErrorNote error={svc.error} />
      {!svc.data ? <Loading /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="CPU" value={`${svc.data.system.cpu_percent} %`} />
            <Stat label="Mémoire" value={`${svc.data.system.ram_percent} %`} hint={`${svc.data.system.ram_used_gb} / ${svc.data.system.ram_total_gb} Go`} />
            <Stat label="Stockage" value={`${svc.data.system.disk_percent} %`} />
          </div>
          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Activity size={18} /> État des services</h2>
            <ul className="divide-y divide-sand-200 dark:divide-night-700">
              {svc.data.services.map((s) => (
                <li key={s.name} className="flex items-center gap-3 py-2 text-sm">
                  {STATUS_ICON[s.status] ?? STATUS_ICON.planned}
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-auto text-xs muted">{s.detail}{s.latency_ms != null && ` · ${s.latency_ms} ms`}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs muted">Règles de sécurité : version {svc.data.safety_rules_version}. Métriques Prometheus exposées sur /metrics (Grafana : voir infrastructure/monitoring).</p>
          </div>
        </>
      )}
      <div className="card overflow-x-auto">
        <h2 className="mb-2 font-semibold">Journal d'administration</h2>
        {!audit.data ? <Loading /> : (
          <table className="table"><thead><tr><th>Date</th><th>Acteur</th><th>Action</th><th>Cible</th></tr></thead>
            <tbody>{audit.data.map((a) => <tr key={a.id}><td className="text-xs">{fmtDate(a.created_at)}</td><td className="text-xs">{a.actor ?? "système"}</td><td>{a.action}</td><td className="font-mono text-xs muted">{a.target}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
