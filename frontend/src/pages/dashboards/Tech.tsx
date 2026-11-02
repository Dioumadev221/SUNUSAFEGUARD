import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, CircleDashed, Download, RefreshCw, Trash2, XCircle } from "lucide-react";
import UsersManager from "@/components/UsersManager";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/DashboardLayout";
import { Badge, ErrorNote, Loading, Stat, Tabs } from "@/components/ui";
import { fmtDate } from "@/lib/labels";
import { usePrefs, type Tx } from "@/lib/prefs";
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
  const { tx } = usePrefs();
  return (
    <>
      <PageHeader title="Sunu Tech" subtitle={tx("Supervision technique, qualité de l'IA, garde-fous et journaux.", "Technical monitoring, AI quality, safeguards and logs.")} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "ai", label: tx("4.1 Performance RAG & IA", "4.1 RAG & AI performance") }, { id: "safety", label: tx("4.2 Garde-fous", "4.2 Safeguards") }, { id: "infra", label: tx("4.3 Infrastructure & journaux", "4.3 Infrastructure & logs") },
        ...(user?.role === "super_admin" ? [{ id: "users" as const, label: tx("Comptes & accès", "Accounts & access") }] : [])]} />
      {tab === "ai" && <AI />}
      {tab === "safety" && <Safety />}
      {tab === "infra" && <Infra />}
      {tab === "users" && <UsersManager />}
    </>
  );
}

function AI() {
  const { tx } = usePrefs();
  const { data, error } = useFetch<AIQuality>("/monitoring/ai?days=7");
  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={tx("Interactions (7 j)", "Interactions (7 days)")} value={data.interactions} />
        <Stat label={tx("Réponses sourcées", "Sourced answers")} value={pct(data.grounded_rate)} hint={`${pct(data.no_source_rate)} ${tx("sans source suffisante", "without enough sources")}`} />
        <Stat label={tx("Rédigées par le LLM", "Written by the LLM")} value={pct(data.llm_usage_rate)} hint={tx("Le reste : extraits des documents", "The rest: excerpts from documents")} />
        <Stat label={tx("Temps de réponse", "Response time")} value={`${(data.latency_p50_ms / 1000).toFixed(1)} s`} hint={`${tx("médiane", "median")} · p95 ${(data.latency_p95_ms / 1000).toFixed(1)} s`} />
      </div>
      <Pipeline score={data.avg_top_score} />
      <Engine />
    </div>
  );
}

const pipelineSteps = (tx: Tx): { step: string; live: boolean }[] => [
  { step: tx("Voix → texte (STT)", "Voice → text (STT)"), live: false },
  { step: tx("Détection de la langue", "Language detection"), live: true },
  { step: "Embeddings", live: true },
  { step: tx("Recherche documentaire", "Document search"), live: true },
  { step: tx("Génération LLM", "LLM generation"), live: true },
  { step: tx("Contrôle de sécurité", "Safety check"), live: true },
  { step: tx("Texte → voix (TTS)", "Text → voice (TTS)"), live: false },
];

function Pipeline({ score }: { score: number }) {
  const { tx } = usePrefs();
  const PIPELINE = pipelineSteps(tx);
  return (
    <div className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold">{tx("Chaîne technique", "Technical pipeline")}</h2>
        <p className="text-xs muted">{tx("Score moyen de récupération :", "Average retrieval score:")} <strong className="text-current">{score.toFixed(2)}</strong></p>
      </div>
      <ol className="mt-4 flex flex-wrap items-center gap-2">
        {PIPELINE.map(({ step, live }, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${live ? "bg-teal/10 text-teal dark:text-teal-light" : "border border-dashed border-sand-300 muted dark:border-white/15"}`}>
              {step}{!live && tx(" · bientôt", " · coming soon")}
            </span>
            {i < PIPELINE.length - 1 && <ChevronRight size={14} className="muted" aria-hidden />}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs muted">{tx("La fidélité des réponses est mesurée sur un jeu de questions de référence annoté ; l'objectif de 99 % n'est pas une garantie.", "Answer faithfulness is measured on an annotated reference question set; the 99% target is not a guarantee.")}</p>
    </div>
  );
}

function Engine() {
  const { user } = useAuth();
  const { tx, lang } = usePrefs();
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
        <h2 className="mr-1 text-base font-bold">{tx("Moteur IA", "AI engine")}</h2>
        <Badge tone={data.retrieval_mode === "hybride" ? "bg-success/15 text-success" : "bg-warn/15 text-warn"}>{data.retrieval_mode === "hybride" ? tx("Recherche hybride", "Hybrid search") : tx("Recherche lexicale", "Lexical search")}</Badge>
        <Badge tone={data.llm_ready ? "bg-success/15 text-success" : "bg-warn/15 text-warn"}>{data.llm_ready ? `LLM ${data.llm_model}` : data.llm_provider === "none" ? tx("LLM désactivé", "LLM disabled") : tx("LLM indisponible : repli extractif", "LLM unavailable: extractive fallback")}</Badge>
        {data.pulling.map((m) => <Badge key={m} tone="bg-warn/15 text-warn">{tx("Téléchargement", "Downloading")} {m}…</Badge>)}
        {(user?.role === "super_admin" || user?.role === "admin_technique") && <button className="btn-ghost ml-auto" disabled={busy} onClick={reconnect}><RefreshCw size={16} className={busy ? "animate-spin" : ""} /> {tx("Reconnecter", "Reconnect")}</button>}
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          [tx("Modèle d'embeddings", "Embedding model"), data.embedder, `${tx("fournisseur", "provider")} : ${data.embedding_provider}`],
          [tx("Seuil de pertinence", "Relevance threshold"), String(data.threshold ?? "—"), c?.method ?? ""],
          ["Calibration", c?.inside_min != null && c?.outside_max != null ? `${c.outside_max} → ${c.inside_min}` : "—", tx("hors périmètre → pertinent", "out of scope → relevant")],
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
          {data.events.map((e, i) => <li key={i} className={e.level === "warning" ? "text-warn" : "muted"}>{fmtDate(e.at, lang)} — {e.message}</li>)}
        </ul>
      )}
    </div>
  );
}

function Safety() {
  const { tx, lang } = usePrefs();
  const { data, error } = useFetch<Security>("/monitoring/security");
  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading />;
  const label: Record<string, string> = {
    safety_urgent: tx("Escalades d'urgence (règles déterministes)", "Emergency escalations (deterministic rules)"),
    safety_refuse_injection: tx("Tentatives de prompt injection", "Prompt injection attempts"),
    safety_out_of_scope: tx("Demandes hors périmètre", "Out-of-scope requests"),
    safety_redirect_professional: tx("Redirections vers un professionnel", "Redirections to a professional"),
    login_failed: tx("Échecs de connexion", "Failed sign-ins"),
    account_locked: tx("Comptes verrouillés", "Locked accounts"),
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(label).map(([k, v]) => <Stat key={k} label={v} value={data.counts[k] ?? 0} />)}
      </div>
      <p className="rounded-xl bg-warn/10 p-3 text-sm"><AlertTriangle size={16} className="mr-1 inline text-warn" /> {tx("Aucun signalement externe n'est jamais déclenché automatiquement. Les événements ne contiennent pas le texte des utilisatrices.", "No external report is ever triggered automatically. Events never contain users' text.")}</p>
      <div className="card overflow-x-auto">
        <h2 className="mb-2 font-semibold">{tx("Événements récents", "Recent events")}</h2>
        <table className="table"><thead><tr><th>Date</th><th>Type</th><th>{tx("Gravité", "Severity")}</th><th>{tx("Règle", "Rule")}</th></tr></thead>
          <tbody>{data.recent.map((e) => <tr key={e.id}><td className="text-xs">{fmtDate(e.created_at, lang)}</td><td>{e.kind}</td><td><Badge tone={e.severity === "warning" ? "bg-warn/15 text-warn" : undefined}>{e.severity}</Badge></td><td className="font-mono text-xs muted">{e.rule}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function Infra() {
  const { tx, lang } = usePrefs();
  const svc = useFetch<Services>("/monitoring/services");
  const audit = useFetch<Audit>("/audit");
  return (
    <div className="space-y-4">
      <ErrorNote error={svc.error} />
      {!svc.data ? <Loading /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="CPU" value={`${svc.data.system.cpu_percent} %`} />
            <Stat label={tx("Mémoire", "Memory")} value={`${svc.data.system.ram_percent} %`} hint={`${svc.data.system.ram_used_gb} / ${svc.data.system.ram_total_gb} ${tx("Go", "GB")}`} />
            <Stat label={tx("Stockage", "Storage")} value={`${svc.data.system.disk_percent} %`} />
          </div>
          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Activity size={18} /> {tx("État des services", "Service status")}</h2>
            <ul className="divide-y divide-sand-200 dark:divide-night-700">
              {svc.data.services.map((s) => (
                <li key={s.name} className="flex items-center gap-3 py-2 text-sm">
                  {STATUS_ICON[s.status] ?? STATUS_ICON.planned}
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-auto text-xs muted">{s.detail}{s.latency_ms != null && ` · ${s.latency_ms} ms`}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs muted">{tx(`Règles de sécurité : version ${svc.data.safety_rules_version}. Métriques Prometheus exposées sur /metrics (Grafana : voir infrastructure/monitoring).`, `Safety rules: version ${svc.data.safety_rules_version}. Prometheus metrics exposed on /metrics (Grafana: see infrastructure/monitoring).`)}</p>
          </div>
        </>
      )}
      <Retention />
      <div className="card overflow-x-auto">
        <h2 className="mb-2 font-semibold">{tx("Journal d'administration", "Administration log")}</h2>
        {!audit.data ? <Loading /> : (
          <table className="table"><thead><tr><th>Date</th><th>{tx("Acteur", "Actor")}</th><th>Action</th><th>{tx("Cible", "Target")}</th></tr></thead>
            <tbody>{audit.data.map((a) => <tr key={a.id}><td className="text-xs">{fmtDate(a.created_at, lang)}</td><td className="text-xs">{a.actor ?? tx("système", "system")}</td><td>{a.action}</td><td className="font-mono text-xs muted">{a.target}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

type RetentionStatus = { policy: Record<string, number | string>; last_purge: { at: string; counts: Record<string, number> } | null };

function Retention() {
  const { tx, lang } = usePrefs();
  const { data, reload } = useFetch<RetentionStatus>("/monitoring/retention");
  const [busy, setBusy] = useState(false);
  const labels: Record<string, string> = {
    usage_events_days: tx("Indicateurs d'usage anonymes", "Anonymous usage indicators"),
    security_events_days: tx("Événements de sécurité", "Security events"),
    audit_logs_days: tx("Journal d'administration", "Administration log"),
    closed_referrals_days: tx("Orientations clôturées", "Closed referrals"),
    conversations: tx("Conversations", "Conversations"),
  };
  async function purge() {
    setBusy(true);
    try { await api("/monitoring/retention/purge", { method: "POST" }); reload(); } finally { setBusy(false); }
  }
  if (!data) return <Loading />;
  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">{tx("Conservation et purge", "Retention and purge")}</h2>
      <ul className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
        {Object.entries(data.policy).map(([k, v]) => <li key={k} className="flex justify-between gap-2 border-b border-sand-200 py-1 dark:border-night-700"><span className="muted">{labels[k] ?? k}</span><span>{typeof v === "number" ? tx(`${v} jours`, `${v} days`) : v}</span></li>)}
      </ul>
      <p className="text-xs muted">{tx("Purge automatique toutes les 24 h. Dernière :", "Automatic purge every 24 h. Last:")} {data.last_purge ? `${fmtDate(data.last_purge.at, lang)} (${Object.entries(data.last_purge.counts).map(([k, v]) => `${k} ${v}`).join(", ")})` : tx("jamais", "never")}</p>
      <button className="btn-ghost" disabled={busy} onClick={purge}><Trash2 size={16} /> {tx("Lancer la purge maintenant", "Run the purge now")}</button>
    </div>
  );
}
