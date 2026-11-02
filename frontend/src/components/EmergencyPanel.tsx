import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { api } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";

type Contact = { label: string; number: string };

export default function EmergencyPanel({ note }: { note?: string }) {
  const { t, tx } = usePrefs();
  const [contacts, setContacts] = useState<Contact[]>([]);
  useEffect(() => {
    api<Contact[]>("/emergency-contacts").then(setContacts).catch(() => setContacts([]));
  }, []);
  return (
    <section role="alert" className="overflow-hidden rounded-[2rem] border border-alert/15 bg-white shadow-soft dark:border-alert/20 dark:bg-night-850 dark:shadow-none">
      <div className="grid lg:grid-cols-[0.85fr_1.6fr]">
        <div className="flex flex-col justify-center gap-4 bg-alert/[0.06] p-6 sm:p-8">
          <span className="relative grid h-12 w-12 place-items-center rounded-full bg-alert text-white">
            <span className="absolute inset-0 animate-ping rounded-full bg-alert/30 motion-reduce:hidden" aria-hidden />
            <Phone size={20} aria-hidden />
          </span>
          <div>
            <h2 className="text-3xl text-alert sm:text-4xl">{t("emergencyTitle")}</h2>
            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">{note ?? tx("Appelez maintenant.", "Call now.")} {tx("Touchez un numéro pour appeler.", "Tap a number to call.")}</p>
          </div>
        </div>
        <ul className="grid gap-px bg-sand-200 sm:grid-cols-2 dark:bg-white/[0.06]">
          {contacts.map((c) => (
            <li key={c.number} className="bg-white dark:bg-night-850 sm:[&:last-child:nth-child(odd)]:col-span-2">
              <a href={`tel:${c.number}`} className="group flex h-full items-center gap-4 px-5 py-5 transition hover:bg-alert/[0.04] sm:px-6">
                {c.number.replace(/\s/g, "").length > 4 ? (
                  // Numéro long (ex. 800 805 805) : le numéro sur une ligne, la phrase en dessous, sur toute la largeur.
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="whitespace-nowrap font-display text-3xl font-semibold tabular-nums leading-none">{c.number}</span>
                    <span className="text-sm font-semibold leading-snug text-slate-600 dark:text-slate-300">{c.label}</span>
                  </span>
                ) : (
                  <>
                    <span className="min-w-[4.5rem] font-display text-4xl font-semibold tabular-nums leading-none">{c.number}</span>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-slate-600 dark:text-slate-300">{c.label}</span>
                  </>
                )}
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-alert/10 text-alert transition group-hover:bg-alert group-hover:text-white" aria-hidden>
                  <Phone size={18} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
