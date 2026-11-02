import { useState, type FormEvent } from "react";
import { FlaskConical, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/DashboardLayout";
import { Badge, Count, ErrorNote, Loading, Stat, Tabs } from "@/components/ui";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, cat, docStatus, fmtDate } from "@/lib/labels";
import { usePrefs } from "@/lib/prefs";
import { useFetch } from "@/lib/useFetch";

type Doc = { id: number; title: string; source: string; category: string; language: string; status: string; version: number; index_status: string; chunk_count: number; updated_at: string; published_at: string | null };
type DocDetail = { document: Doc; chunks: { id: number; section: string; text: string }[]; reviews: { decision: string; comment: string; created_at: string }[]; allowed_transitions: string[] };

const STATUS_TONE: Record<string, string> = { publie: "bg-success/10 text-success", rejete: "bg-alert/10 text-alert", en_validation: "bg-warn/10 text-warn", a_verifier: "bg-warn/10 text-warn" };

export default function Ressources() {
  const [tab, setTab] = useState<"kb" | "playground" | "gaps">("kb");
  const { tx } = usePrefs();
  return (
    <>
      <PageHeader title={tx("Sunu Ressources", "Resources")} subtitle={tx("Gestion et validation des connaissances utilisées par l'assistant.", "Management and validation of the knowledge used by the assistant.")} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "kb", label: tx("3.1 Base de connaissances", "3.1 Knowledge base") }, { id: "playground", label: tx("3.2 Banc d'essai RAG", "3.2 RAG test bench") }, { id: "gaps", label: tx("3.3 Lacunes & évaluation", "3.3 Gaps & evaluation") }]} />
      {tab === "kb" && <KnowledgeBase />}
      {tab === "playground" && <Playground />}
      {tab === "gaps" && <Gaps />}
    </>
  );
}

function KnowledgeBase() {
  const { tx, lang } = usePrefs();
  const docs = useFetch<Doc[]>("/knowledge/documents");
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">{tx("Seuls les documents publiés alimentent l'assistant.", "Only published documents feed the assistant.")}</p>
        <UploadForm onDone={docs.reload} />
      </div>
      <ErrorNote error={docs.error} />
      {!docs.data ? <Loading /> : (
        <div className="card overflow-x-auto p-2 sm:p-3">
          <table className="table">
            <thead><tr><th>Document</th><th>{tx("Statut", "Status")}</th><th className="text-right">{tx("Segments", "Chunks")}</th><th className="text-right">{tx("Mis à jour", "Updated")}</th></tr></thead>
            <tbody>
              {docs.data.map((d) => (
                <tr key={d.id} onClick={() => setSelected(d.id)} className="cursor-pointer transition hover:bg-sand-100 dark:hover:bg-white/[0.03]">
                  <td><p className="font-semibold">{d.title}</p><p className="text-xs muted">{cat(d.category, lang)}</p></td>
                  <td><Badge tone={STATUS_TONE[d.status] ?? "bg-slate-500/10 text-slate-500"}>{docStatus(d.status, lang)}</Badge></td>
                  <td className="text-right tabular-nums">{d.chunk_count}</td>
                  <td className="whitespace-nowrap text-right text-xs muted">{fmtDate(d.updated_at, lang).split(" ")[0].replace(/,$/, "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-night-950/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl dark:bg-night-900" onClick={(e) => e.stopPropagation()}>
            <button className="btn-ghost mb-2 -ml-3 h-9 min-h-0 px-3" onClick={() => setSelected(null)}><X size={16} /> {tx("Fermer", "Close")}</button>
            <DocPanel id={selected} onChange={docs.reload} />
          </div>
        </div>
      )}
    </div>
  );
}

function UploadForm({ onDone }: { onDone: () => void }) {
  const { tx, lang } = usePrefs();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await api("/knowledge/documents", { method: "POST", body: new FormData(e.currentTarget) });
      setOpen(false);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  if (!open) return <button className="btn-primary" onClick={() => setOpen(true)}><Upload size={16} /> {tx("Importer un document", "Import a document")}</button>;
  return (
    <form onSubmit={submit} className="card grid w-full gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="label">{tx("Fichier (PDF, DOCX, TXT, MD — 10 Mo max)", "File (PDF, DOCX, TXT, MD — 10 MB max)")}</label><input name="file" type="file" accept=".pdf,.docx,.txt,.md" required className="input" /></div>
      <div><label className="label">{tx("Titre", "Title")}</label><input name="title" required className="input" /></div>
      <div><label className="label">{tx("Organisme source", "Source organization")}</label><input name="source" className="input" /></div>
      <div><label className="label">{tx("Catégorie", "Category")}</label><select name="category" className="input">{Object.keys(CATEGORY_LABELS).map((k) => <option key={k} value={k}>{cat(k, lang)}</option>)}</select></div>
      <div><label className="label">{tx("Langue", "Language")}</label><select name="language" className="input"><option value="fr">{tx("Français", "French")}</option><option value="wo">Wolof</option></select></div>
      <ErrorNote error={error} />
      <div className="flex gap-2 sm:col-span-2"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{tx("Annuler", "Cancel")}</button><button className="btn-primary">{tx("Importer et indexer", "Import and index")}</button></div>
    </form>
  );
}

function DocPanel({ id, onChange }: { id: number; onChange: () => void }) {
  const { tx, lang } = usePrefs();
  const { data, error, reload } = useFetch<DocDetail>(`/knowledge/documents/${id}`);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState<string | null>(null);
  async function move(status: string) {
    setErr(null);
    try {
      await api(`/knowledge/documents/${id}/status`, { method: "PATCH", json: { status, comment } });
      setComment("");
      reload();
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading />;
  return (
    <div className="space-y-5">
      <div>
        <Badge tone={STATUS_TONE[data.document.status] ?? "bg-slate-500/10 text-slate-500"}>{docStatus(data.document.status, lang)}</Badge>
        <h2 className="mt-2 text-xl font-bold">{data.document.title}</h2>
        <p className="text-xs muted">{tx("Indexation :", "Indexing:")} {data.document.index_status} · {data.chunks.length} {tx("segments", "chunks")}</p>
      </div>
      <div className="space-y-2">
        <textarea className="input" rows={2} placeholder={tx("Commentaire de validation", "Validation comment")} value={comment} onChange={(e) => setComment(e.target.value)} />
        <div className="flex flex-wrap gap-2">{data.allowed_transitions.map((s) => <button key={s} className={s === "publie" ? "btn-primary" : "btn-outline"} onClick={() => move(s)}>{docStatus(s, lang)}</button>)}</div>
        <ErrorNote error={err} />
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-medium">{tx("Segments indexés", "Indexed chunks")}</summary>
        <ol className="mt-2 max-h-80 space-y-2 overflow-y-auto text-xs">{data.chunks.map((c) => <li key={c.id} className="rounded-2xl bg-sand-100 p-3 dark:bg-white/[0.03]"><strong>{c.section}</strong><p className="mt-1 muted">{c.text}</p></li>)}</ol>
      </details>
      {data.reviews.length > 0 && (
        <div><p className="text-sm font-medium">{tx("Historique", "History")}</p><ul className="text-xs muted">{data.reviews.map((r, i) => <li key={i}>{fmtDate(r.created_at, lang)} — {docStatus(r.decision, lang)}{r.comment && ` : ${r.comment}`}</li>)}</ul></div>
      )}
    </div>
  );
}

type PlaygroundResult = {
  language: { lang: string; confidence: number }; expanded_query: string; embedder: string; retrieval_mode: string; min_score_threshold: number;
  candidates: { chunk_id: number; title: string; section: string; score: number; semantic: number | null; lexical: number | null; above_threshold: boolean; text: string }[];
  context: string; response: { answer: string; used_llm: boolean; grounded: boolean; safety_action: string; category: string; timings_ms: Record<string, number> } | null; warning: string;
};

function Playground() {
  const { tx } = usePrefs();
  const [question, setQuestion] = useState("Mën naay am yoonu dimbal ?");
  const [topK, setTopK] = useState(5);
  const [res, setRes] = useState<PlaygroundResult | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setRes(await api<PlaygroundResult>("/rag/playground", { method: "POST", json: { question, top_k: topK, generate: true } }));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <form onSubmit={run} className="card flex flex-wrap items-end gap-2">
        <div className="min-w-[240px] flex-1"><label className="label">{tx("Question (français ou wolof)", "Question (French or Wolof)")}</label><input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} /></div>
        <div><label className="label">Top-k</label><input type="number" min={1} max={10} className="input w-20" value={topK} onChange={(e) => setTopK(+e.target.value)} /></div>
        <button className="btn-primary" disabled={busy}><FlaskConical size={16} /> {tx("Tester", "Test")}</button>
      </form>
      {res && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label={tx("Langue détectée", "Detected language")} value={res.language.lang.toUpperCase()} hint={`${tx("confiance", "confidence")} ${Math.round(res.language.confidence * 100)} %`} />
            <Stat label={`${tx("Recherche", "Search")} ${res.retrieval_mode}`} value={<span className="text-lg">{res.embedder}</span>} hint={`${tx("seuil de pertinence", "relevance threshold")} ${res.min_score_threshold}`} />
            <Stat label={tx("Réponse", "Answer")} value={<span className="text-lg">{res.response?.grounded ? tx("Sourcée", "Sourced") : tx("Sans source", "No source")}</span>} hint={res.response ? `${res.response.used_llm ? "LLM" : tx("Repli extractif", "Extractive fallback")} · ${res.response.safety_action}` : ""} />
          </div>
          <div className="card text-sm"><p className="font-medium">{tx("Requête après expansion linguistique", "Query after language expansion")}</p><p className="mt-1 font-mono text-xs muted">{res.expanded_query}</p></div>
          <div className="card overflow-x-auto">
            <h3 className="mb-2 font-semibold">{tx("Segments candidats", "Candidate chunks")}</h3>
            <table className="table">
              <thead><tr><th>Score</th><th>{tx("Sémantique", "Semantic")}</th><th>{tx("Lexical", "Lexical")}</th><th>Document / section</th><th>{tx("Extrait", "Excerpt")}</th></tr></thead>
              <tbody>{res.candidates.map((c) => (
                <tr key={c.chunk_id} className={c.above_threshold ? "" : "opacity-50"}>
                  <td><Badge tone={c.above_threshold ? "bg-success/15 text-success" : "bg-slate-500/15 text-slate-500"}>{c.score.toFixed(3)}</Badge></td>
                  <td className="text-xs muted">{c.semantic == null ? "—" : c.semantic.toFixed(3)}</td>
                  <td className="text-xs muted">{c.lexical == null ? "—" : c.lexical.toFixed(3)}</td>
                  <td className="text-xs"><p className="font-medium">{c.title}</p><p className="muted">{c.section}</p></td>
                  <td className="text-xs muted">{c.text.slice(0, 220)}…</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <details className="card"><summary className="cursor-pointer font-semibold">{tx("Contexte transmis au LLM", "Context sent to the LLM")}</summary><pre className="mt-2 whitespace-pre-wrap text-xs muted">{res.context || tx("(vide)", "(empty)")}</pre></details>
          {res.response && <div className="card"><h3 className="mb-2 font-semibold">{tx("Réponse générée", "Generated answer")}</h3><p className="whitespace-pre-line text-sm">{res.response.answer}</p><p className="mt-2 text-xs muted">{tx("Temps (ms) :", "Time (ms):")} {Object.entries(res.response.timings_ms).map(([k, v]) => `${k} ${v}`).join(" · ")}</p></div>}
          <p className="text-xs text-warn">{res.warning}</p>
        </>
      )}
    </div>
  );
}

type EvalResult = { recall_at_k: number; mrr: number; k: number; n: number; cases: { id: string; ok: boolean; rank: number | null; top_score: number; top_title: string | null }[] };

function Gaps() {
  const { tx, lang } = usePrefs();
  const gaps = useFetch<{ category: string; unanswered: number | null; share: number | null }[]>("/rag/gaps");
  const history = useFetch<{ id: number; created_at: string; recall_at_k: number; mrr: number; config: Record<string, unknown> }[]>("/rag/evaluations");
  const [evalRes, setEvalRes] = useState<EvalResult | null>(null);
  async function evaluate() {
    setEvalRes(await api<EvalResult>("/rag/evaluate", { method: "POST" }));
    history.reload();
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card">
        <h2 className="mb-1 font-semibold">{tx("Thématiques sans source suffisante (30 j)", "Topics without enough sources (30 days)")}</h2>
        <p className="mb-3 text-xs muted">{tx("Calculé sur des indicateurs minimisés : aucune question d'utilisatrice n'est conservée.", "Computed from minimized indicators: no user question is kept.")}</p>
        {!gaps.data ? <Loading /> : (
          <table className="table"><thead><tr><th>{tx("Thématique", "Topic")}</th><th>{tx("Sans réponse", "Unanswered")}</th><th>{tx("Part", "Share")}</th></tr></thead>
            <tbody>{gaps.data.map((g) => <tr key={g.category}><td>{cat(g.category, lang)}</td><td><Count value={g.unanswered} /></td><td>{g.share === null ? "—" : `${Math.round(g.share * 100)} %`}</td></tr>)}</tbody>
          </table>
        )}
      </div>
      <div className="card space-y-3">
        <h2 className="font-semibold">{tx("Évaluation du RAG", "RAG evaluation")}</h2>
        <p className="text-xs muted">{tx("Jeu de questions de référence : français, wolof et questions hors périmètre.", "Reference question set: French, Wolof and out-of-scope questions.")}</p>
        <button className="btn-primary" onClick={evaluate}>{tx("Lancer l'évaluation", "Run the evaluation")}</button>
        {evalRes && (
          <>
            <div className="grid grid-cols-2 gap-3"><Stat label={`${tx("Rappel", "Recall")}@${evalRes.k}`} value={`${Math.round(evalRes.recall_at_k * 100)} %`} /><Stat label="MRR" value={evalRes.mrr.toFixed(2)} /></div>
            <ul className="text-xs">{evalRes.cases.map((c) => <li key={c.id} className={c.ok ? "text-success" : "text-alert"}>{c.ok ? "✓" : "✗"} {c.id} — {c.top_title ?? tx("aucune source", "no source")} ({c.top_score})</li>)}</ul>
          </>
        )}
        {history.data && history.data.length > 0 && (
          <table className="table"><thead><tr><th>Date</th><th>{tx("Rappel", "Recall")}</th><th>MRR</th></tr></thead>
            <tbody>{history.data.map((h) => <tr key={h.id}><td className="text-xs">{fmtDate(h.created_at, lang)}</td><td>{Math.round(h.recall_at_k * 100)} %</td><td>{h.mrr}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
