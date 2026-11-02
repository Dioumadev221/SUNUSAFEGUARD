import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUp, BookOpen, ChevronDown, HeartHandshake, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";
import type { ChatResponse } from "@/lib/types";
import EmergencyPanel from "@/components/EmergencyPanel";
import { LogoMark } from "@/components/Logo";

type Msg = { role: "user" | "assistant"; text: string; meta?: ChatResponse };
const KEY = "ssg_chat"; // Historique local à l'onglet uniquement (sessionStorage), jamais sur le serveur.

// Exemples envoyés à l'assistant : toujours en français, la langue du chat (avec le wolof).
const SUGGESTIONS = [
  "Mon mari me frappe, est-ce que je peux porter plainte ?",
  "Quelqu'un menace de publier mes photos",
  "Je me sens triste et angoissée",
  "Mon mari garde tout mon salaire, que faire ?",
];

function loadHistory(): Msg[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function Chat() {
  const { t, tx, lang } = usePrefs();
  const [params, setParams] = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>(loadHistory);
  // Un sujet choisi sur l'accueil pré-remplit la question, sans l'envoyer : la personne garde la main.
  const [input, setInput] = useState(() => params.get("q") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (params.has("q")) {
      setParams({}, { replace: true });
      inputRef.current?.focus();
    }
  }, [params, setParams]);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(messages)); } catch { /* ignore */ }
    if (messages.length || busy) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

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
      setError(tx("Le service ne répond pas pour le moment. Si vous êtes en danger, appelez les numéros d'urgence.",
        "The service is not responding right now. If you are in danger, call the emergency numbers."));
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
  const empty = messages.length === 0;

  return (
    <div className="flex min-h-[calc(100vh-7.5rem)] flex-col">
      {!empty && (
        <div className="mb-4 flex justify-end text-xs muted">
          <button onClick={clear} className="flex items-center gap-1 rounded-full px-2 py-1 font-semibold hover:text-teal"><RotateCcw size={13} /> {t("clear")}</button>
        </div>
      )}

      {showEmergency && <div className="mb-6"><EmergencyPanel note={tx("Si vous ou un proche êtes en danger, appelez maintenant.", "If you or someone close to you is in danger, call now.")} /></div>}

      <div className="flex-1 space-y-7" aria-live="polite">
        {empty && (
          <div className="flex flex-col items-center pt-16 text-center sm:pt-24">
            <h1 className="text-4xl sm:text-5xl">{tx("Bonjour,", "Hello,")} <em className="font-medium text-teal dark:text-teal-light">{tx("je vous écoute.", "I'm listening.")}</em></h1>
            {lang === "en" && (
              <p className="mt-4 max-w-md text-sm muted">The assistant answers in French or Wolof. You can write to it in either language.</p>
            )}
            <p className="mt-12 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{tx("Pour commencer", "To get started")}</p>
            <div className="mt-3 grid w-full gap-2.5 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="group flex items-center justify-between gap-3 rounded-2xl border border-sand-200 bg-white/80 px-4 py-3.5 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:border-teal hover:bg-white hover:shadow-soft dark:border-white/[0.08] dark:bg-night-850 dark:hover:border-teal-light">
                  {s.replace(/ ([?!:])/g, " $1")}
                  <ArrowUp size={16} className="shrink-0 rotate-45 text-slate-300 transition group-hover:text-teal dark:group-hover:text-teal-light" />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => m.role === "user" ? (
          <div key={i} className="flex justify-end">
            <div className="max-w-[85%] whitespace-pre-line rounded-[1.6rem] rounded-br-md bg-night px-5 py-3 leading-relaxed text-sand-100 dark:bg-teal-dark dark:text-white">{m.text}</div>
          </div>
        ) : (
          <AssistantMessage key={i} msg={m} />
        ))}
        {busy && (
          <div className="flex items-center gap-3">
            <LogoMark size={32} />
            <span className="flex gap-1.5 rounded-full bg-white px-4 py-3 shadow-soft dark:bg-night-850 dark:shadow-none" aria-label={tx("L'assistant prépare une réponse", "The assistant is preparing an answer")}>
              {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-ochre" style={{ animationDelay: `${d}ms` }} />)}
            </span>
          </div>
        )}
        {error && <p role="alert" className="rounded-2xl bg-alert/10 px-4 py-3 text-sm text-alert">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-0 mt-8 bg-gradient-to-t from-sand via-sand to-transparent pb-4 pt-6 dark:from-night-950 dark:via-night-950">
        <div className="flex items-end gap-2 rounded-[1.75rem] border border-sand-300/80 bg-white p-2 pl-5 shadow-lift transition focus-within:border-teal dark:border-white/10 dark:bg-night-850 dark:shadow-none dark:focus-within:border-teal-light">
          <label htmlFor="msg" className="sr-only">{tx("Votre message", "Your message")}</label>
          <textarea
            id="msg"
            ref={inputRef}
            rows={1}
            className="max-h-40 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed outline-none [field-sizing:content] placeholder:text-slate-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={t("inputPlaceholder")}
            maxLength={2000}
            autoComplete="off"
          />
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal text-white transition hover:bg-teal-dark disabled:bg-slate-300 dark:bg-teal-light dark:text-night-950 dark:disabled:bg-white/10" disabled={busy || !input.trim()} aria-label={t("send")}>
            <ArrowUp size={19} strokeWidth={2.5} />
          </button>
        </div>
        <p className="mt-2.5 text-center text-[11px] muted">{tx("Assistant d'information : il ne remplace pas un·e professionnel·le.", "Information assistant: it does not replace a professional.")}</p>
      </form>
    </div>
  );
}

function AssistantMessage({ msg }: { msg: Msg }) {
  const { t, tx } = usePrefs();
  const [open, setOpen] = useState(false);
  const sources = msg.meta?.sources ?? [];
  return (
    <div className="flex gap-3">
      <LogoMark size={32} className="mt-1 shrink-0" />
      <div className="min-w-0 max-w-[90%] rounded-[1.6rem] rounded-tl-md border border-sand-200 bg-white px-5 py-4 shadow-soft dark:border-white/[0.06] dark:bg-night-850 dark:shadow-none">
        <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
        {(sources.length > 0 || msg.meta?.suggest_directory) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-3 dark:border-white/[0.06]">
            {sources.length > 0 && (
              <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1.5 text-xs font-bold text-teal-dark transition hover:bg-teal-soft/70 dark:bg-teal/15 dark:text-teal-light" aria-expanded={open}>
                <BookOpen size={13} /> {sources.length} {sources.length > 1 ? tx("sources vérifiées", "verified sources") : tx("source vérifiée", "verified source")}
                <ChevronDown size={13} className={`transition ${open ? "rotate-180" : ""}`} />
              </button>
            )}
            {msg.meta?.suggest_directory && (
              <Link to="/aide" className="inline-flex items-center gap-1.5 rounded-full bg-ochre-soft px-3 py-1.5 text-xs font-bold text-ochre-dark transition hover:bg-ochre-light dark:bg-ochre/15 dark:text-ochre-light">
                <HeartHandshake size={13} /> {tx("Trouver une structure d'aide", "Find a support organization")}
              </Link>
            )}
          </div>
        )}
        {open && (
          <ol className="mt-3 space-y-1.5 rounded-2xl bg-sand-100 p-3 text-xs dark:bg-white/[0.03]" aria-label={t("sources")}>
            {sources.map((s) => (
              <li key={s.ref} className="flex gap-2"><span className="font-bold text-teal dark:text-teal-light">[{s.ref}]</span><span><span className="font-semibold">{s.title}</span>{s.section ? <span className="muted"> · {s.section}</span> : null}</span></li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
