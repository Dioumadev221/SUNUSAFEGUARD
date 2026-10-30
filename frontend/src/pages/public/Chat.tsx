import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BookOpen, HeartHandshake, Send, ShieldAlert, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";
import type { ChatResponse } from "@/lib/types";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Badge } from "@/components/ui";

type Msg = { role: "user" | "assistant"; text: string; meta?: ChatResponse };
const KEY = "ssg_chat"; // Historique local à l'onglet uniquement (sessionStorage), jamais sur le serveur.

const SUGGESTIONS = [
  "Mon mari me frappe, est-ce que je peux porter plainte ?",
  "Quelqu'un menace de publier mes photos",
  "Je me sens triste et angoissée",
  "Mën naay am yoonu dimbal ?",
];

function loadHistory(): Msg[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function Chat() {
  const { t } = usePrefs();
  const [messages, setMessages] = useState<Msg[]>(loadHistory);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(messages)); } catch { /* ignore */ }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await api<ChatResponse>("/chat", { method: "POST", json: { message, channel: "web" } });
      setMessages((m) => [...m, { role: "assistant", text: res.answer, meta: res }]);
    } catch {
      setError("Le service ne répond pas pour le moment. Si vous êtes en danger, utilisez les numéros d'urgence ci-dessous.");
    } finally {
      setBusy(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const clear = () => {
    setMessages([]);
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  };

  const showEmergency = messages.some((m) => m.meta?.show_emergency);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-3 text-sm">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden />
        <p>
          Assistant automatisé d'information. Vos messages ne sont pas conservés sur nos serveurs, mais restent visibles
          sur cet appareil jusqu'à ce que vous les effaciez ou utilisiez la <strong>Sortie rapide</strong>. Évitez de donner votre nom ou votre adresse.
        </p>
      </div>

      {showEmergency && <EmergencyPanel />}

      <div className="card min-h-[50vh] space-y-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="py-6 text-center">
            <p className="font-medium">Bonjour. Comment puis-je vous aider aujourd'hui ?</p>
            <p className="mt-1 text-sm muted">Vous pouvez écrire en français ou en wolof.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-sand-200 px-3 py-1.5 text-sm hover:border-teal dark:border-night-700">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-teal text-white" : "bg-sand-200/60 dark:bg-night"}`}>
              {m.text}
              {m.meta && m.meta.sources.length > 0 && (
                <div className="mt-3 border-t border-sand-200 pt-2 dark:border-night-700">
                  <p className="mb-1 flex items-center gap-1 text-xs font-semibold muted"><BookOpen size={14} /> {t("sources")}</p>
                  <ol className="space-y-1 text-xs muted">
                    {m.meta.sources.map((s) => (
                      <li key={s.ref}>[{s.ref}] {s.title}{s.section ? ` — ${s.section}` : ""} <Badge tone="bg-success/15 text-success">validé</Badge></li>
                    ))}
                  </ol>
                </div>
              )}
              {m.meta?.suggest_directory && (
                <Link to="/aide" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-light underline">
                  <HeartHandshake size={16} /> Voir les structures d'aide
                </Link>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="muted animate-pulse text-sm">L'assistant prépare une réponse…</p>}
        {error && <p role="alert" className="text-sm text-alert">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-3 flex gap-2">
        <label htmlFor="msg" className="sr-only">Votre message</label>
        <input id="msg" className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("inputPlaceholder")} maxLength={2000} autoComplete="off" />
        <button className="btn-primary" disabled={busy || !input.trim()} aria-label={t("send")}><Send size={18} /></button>
        <button type="button" onClick={clear} className="btn-ghost" aria-label={t("clear")} title={t("clear")}><Trash2 size={18} /></button>
      </form>
    </div>
  );
}
