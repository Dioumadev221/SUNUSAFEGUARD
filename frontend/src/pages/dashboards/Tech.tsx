import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, CircleDashed, Download, RefreshCw, Trash2, XCircle } from "lucide-react";
import UsersManager from "@/components/UsersManager";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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
  pulling: <Download className="animate-pulse text-warn" size={18} />,
};

type AIEngine = {
  retrieval_mode: string; embedder: string; embedding_provider: string; threshold: number | null;
  calibration: { method: string; threshold?: number; inside_min?: number | null; outside_max?: number | null } | null;
  llm_provider: string; llm_model: string | null; llm_ready: boolean; pulling: string[];
  events: { at: string; level: string; message: string }[];
};

export default function Tech() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"ai" | "safety" | "infra" | "users">("ai");
  return (
    <>
      <PageHeader title="Sunu Tech" subtitle="Supervision technique, qualité de l'IA, garde-fous et journaux." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "ai", label: "4.1 Performance RAG & IA" }, { id: "safety", label: "4.2 Garde-fous" }, { id: "infra", label: "4.3 Infrastructure & journaux" },
        ...(user?.role === "super_admin" ? [{ id: "users" as const, label: "Comptes & accès" }] : [])]} />
      {tab === "ai" && <AI />}
      {tab === "safety" && <Safety />}
      {tab === "infra" && <Infra />}
      {tab === "users" && <UsersManager />}
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
        <Stat label="Réponses sourcées" value={pct(data.grounded_rate)} hint={`${pct(data.no_source_rate)} sans source suffisante`} />
        <Stat label="Rédigées par le LLM" value={pct(data.llm_usage_rate)} hint="Le reste : extraits des documents" />
        <Stat label="Temps de réponse" value={`${(data.latency_p50_ms / 1000).toFixed(1)} s`} hint={`médiane · p95 ${(data.latency_p95_ms / 1000).toFixed(1)} s`} />
      </div>
      <Pipeline score={data.avg_top_score} />
      <Engine />
    </div>
  );
}

const PIPELINE: { step: string; live: boolean }[] = [
  { step: "Voix → texte (STT)", live: false },
  { step: "Détection de la langue", live: true },
  { step: "Embeddings", live: true },
  { step: "Recherche documentaire", live: true },
  { step: "Génération LLM", live: true },
  { step: "Contrôle de sécurité", live: true },
  { step: "Texte → voix (TTS)", live: false },
];

function Pipeline({ score }: { score: number }) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold">Chaîne technique</h2>
        <p className="text-xs muted">Score moyen de récupération : <strong className="text-current">{score.toFixed(2)}</strong></p>
      </div>
      <ol className="mt-4 flex flex-wrap items-center gap-2">
        {PIPELINE.map(({ step, live }, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${live ? "bg-teal/10 text-teal dark:text-teal-light" : "border border-dashed border-sand-300 muted dark:border-white/15"}`}>
              {step}{!live && " · bientôt"}
            </span>
            {i < PIPELINE.length - 1 && <ChevronRight size={14} className="muted" aria-hidden />}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs muted">La fidélité des réponses est mesurée sur un jeu de questions de référence annoté ; l'objectif de 99 % n'est pas une garantie.</p>
    </div>
  );
}

function Engine() {
  const { user } = useAuth();
  const { data, error, reload } = useFetch<AIEngine>("/monitoring/ai-engine");
  const [busy, setBusy] = useState(false);
  async function reconnect() {
    setBusy(true);
    try { await api("/monitoring/ai-engine/reconnect", { method: "POST" }); reload(); } finally { setBusy(false); }
  }
  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading />;
  const c = data.calibration;
  return (
    <div className="card space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-1 text-base font-bold">Moteur IA</h2>
        <Badge tone={data.retrieval_mode === "hybride" ? "bg-success/15 text-success" : "bg-warn/15 text-warn"}>Recherche {data.retrieval_mode === "hybride" ? "hybride" : "lexicale"}</Badge>
        <Badge tone={data.llm_ready ? "bg-success/15 text-success" : "bg-warn/15 text-warn"}>{data.llm_ready ? `LLM ${data.llm_model}` : data.llm_provider === "none" ? "LLM désactivé" : "LLM indisponible : repli extractif"}</Badge>
        {data.pulling.map((m) => <Badge key={m} tone="bg-warn/15 text-warn">Téléchargement {m}…</Badge>)}
        {(user?.role === "super_admin" || user?.role === "admin_technique") && <button className="btn-ghost ml-auto" disabled={busy} onClick={reconnect}><RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Reconnecter</button>}
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Modèle d'embeddings", data.embedder, `fournisseur : ${data.embedding_provider}`],
          ["Seuil de pertinence", String(data.threshold ?? "—"), c?.method ?? ""],
          ["Calibration", c?.inside_min != null && c?.outside_max != null ? `${c.outside_max} → ${c.inside_min}` : "—", "hors périmètre → pertinent"],
        ].map(([k, v, h]) => (
          <div key={k} className="card-flat">
            <dt className="text-xs muted">{k}</dt>
            <dd className="mt-1 truncate font-bold">{v}</dd>
            <dd className="mt-0.5 truncate text-xs muted" title={h}>{h}</dd>
          </div>
        ))}
      </dl>
      {data.events.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
          {data.events.map((e, i) => <li key={i} className={e.level === "warning" ? "text-warn" : "muted"}>{fmtDate(e.at)} — {e.message}</li>)}
        </ul>
      )}
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
      <Retention />
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

type RetentionStatus = { policy: Record<string, number | string>; last_purge: { at: string; counts: Record<string, number> } | null };

function Retention() {
  const { data, reload } = useFetch<RetentionStatus>("/monitoring/retention");
  const [busy, setBusy] = useState(false);
  const labels: Record<string, string> = { usage_events_days: "Indicateurs d'usage anonymes", security_events_days: "Événements de sécurité", audit_logs_days: "Journal d'administration", closed_referrals_days: "Orientations clôturées", conversations: "Conversations" };
  async function purge() {
    setBusy(true);
    try { await api("/monitoring/retention/purge", { method: "POST" }); reload(); } finally { setBusy(false); }
  }
  if (!data) return <Loading />;
  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Conservation et purge</h2>
      <ul className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
        {Object.entries(data.policy).map(([k, v]) => <li key={k} className="flex justify-between gap-2 border-b border-sand-200 py-1 dark:border-night-700"><span className="muted">{labels[k] ?? k}</span><span>{typeof v === "number" ? `${v} jours` : v}</span></li>)}
      </ul>
      <p className="text-xs muted">Purge automatique toutes les 24 h. Dernière : {data.last_purge ? `${fmtDate(data.last_purge.at)} (${Object.entries(data.last_purge.counts).map(([k, v]) => `${k} ${v}`).join(", ")})` : "jamais"}</p>
      <button className="btn-ghost" disabled={busy} onClick={purge}><Trash2 size={16} /> Lancer la purge maintenant</button>
    </div>
  );
}
