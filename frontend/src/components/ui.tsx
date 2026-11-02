import type { ReactNode } from "react";
import { AVAILABILITY } from "@/lib/labels";
import { usePrefs } from "@/lib/prefs";

export function Badge({ children, tone = "bg-teal-soft text-teal-dark dark:bg-teal/15 dark:text-teal-light" }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{children}</span>;
}

export function AvailabilityBadge({ status }: { status: string }) {
  const { lang } = usePrefs();
  const a = AVAILABILITY[status] ?? AVAILABILITY.non_communique;
  return <Badge tone={a.tone}>{lang === "en" ? a.en : a.label}</Badge>;
}

export function Stat({ label, value, hint, delta }: { label: string; value: ReactNode; hint?: string; delta?: ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-[13px] font-semibold muted">{label}</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 font-display text-[2.4rem] font-semibold leading-none tracking-tight">{value ?? "—"}{delta}</p>
      {hint && <p className="mt-1.5 text-xs muted">{hint}</p>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="mb-8 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-sand-200 bg-white/60 p-1 dark:border-white/[0.06] dark:bg-white/[0.04]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${value === tab.id ? "bg-night text-sand-100 shadow-sm dark:bg-sand-100 dark:text-night" : "text-slate-500 hover:text-night dark:hover:text-white"}`}
        >
          {/* Les numéros de section du cahier des charges (« 1.1 ») restent dans le code, pas à l'écran. */}
          {tab.label.replace(/^\d+(\.\d+)*\s+/, "")}
        </button>
      ))}
    </div>
  );
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return <p role="alert" className="rounded-2xl bg-alert/10 px-4 py-3 text-sm text-alert">{error}</p>;
}

export function Loading() {
  const { tx } = usePrefs();
  return <p className="muted animate-pulse">{tx("Chargement…", "Loading…")}</p>;
}

/** Affiche un effectif agrégé ; null = masqué par le seuil de confidentialité. */
export function Count({ value, k = 5 }: { value: number | null | undefined; k?: number }) {
  const { tx, lang } = usePrefs();
  return value === null || value === undefined
    ? <span title={tx("Effectif masqué (seuil de confidentialité)", "Count hidden (privacy threshold)")} className="muted">&lt; {k}</span>
    : <>{value.toLocaleString(lang === "en" ? "en-GB" : "fr-FR")}</>;
}
