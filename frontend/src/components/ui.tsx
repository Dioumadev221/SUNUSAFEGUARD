import type { ReactNode } from "react";
import { AVAILABILITY } from "@/lib/labels";

export function Badge({ children, tone = "bg-teal/15 text-teal-light" }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{children}</span>;
}

export function AvailabilityBadge({ status }: { status: string }) {
  const a = AVAILABILITY[status] ?? AVAILABILITY.non_communique;
  return <Badge tone={a.tone}>{a.label}</Badge>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card">
      <p className="text-sm muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value ?? "—"}</p>
      {hint && <p className="mt-1 text-xs muted">{hint}</p>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="mb-6 flex flex-wrap gap-2 border-b border-sand-200 pb-2 dark:border-night-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${value === tab.id ? "bg-teal text-white" : "hover:bg-sand-200 dark:hover:bg-night-700"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return <p role="alert" className="rounded-xl bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>;
}

export function Loading() {
  return <p className="muted animate-pulse">Chargement…</p>;
}

/** Affiche un effectif agrégé ; null = masqué par le seuil de confidentialité. */
export function Count({ value, k = 5 }: { value: number | null | undefined; k?: number }) {
  return value === null || value === undefined ? <span title="Effectif masqué (seuil de confidentialité)" className="muted">&lt; {k}</span> : <>{value.toLocaleString("fr-FR")}</>;
}
