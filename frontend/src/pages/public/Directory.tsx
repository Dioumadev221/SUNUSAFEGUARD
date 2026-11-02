import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Clock, HeartHandshake, House, LayoutGrid, type LucideIcon, MapPin, Phone, Scale, Search, ShieldAlert, Smartphone, Stethoscope } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AVAILABILITY, cat, clean, REGIONS } from "@/lib/labels";
import type { Organization } from "@/lib/types";
import { ErrorNote, Loading } from "@/components/ui";
import { usePrefs } from "@/lib/prefs";

const NEEDS: { id: string; label: string; en: string; icon: LucideIcon; domains: string[] }[] = [
  { id: "", label: "Tout", en: "All", icon: LayoutGrid, domains: [] },
  { id: "ecoute", label: "Écoute", en: "Listening", icon: HeartHandshake, domains: ["ecoute_psychosociale"] },
  { id: "violences", label: "Violences", en: "Violence", icon: ShieldAlert, domains: ["violences_physiques_verbales", "violences_economiques"] },
  { id: "droit", label: "Droits et justice", en: "Rights and justice", icon: Scale, domains: ["information_juridique"] },
  { id: "sante", label: "Santé", en: "Health", icon: Stethoscope, domains: ["sante_reproductive"] },
  { id: "hebergement", label: "Hébergement", en: "Shelter", icon: House, domains: ["hebergement_protection"] },
  { id: "numerique", label: "Harcèlement en ligne", en: "Online harassment", icon: Smartphone, domains: ["cyberharcelement"] },
];

const DOMAIN_STYLE: Record<string, { icon: LucideIcon; tone: string }> = {
  ecoute_psychosociale: { icon: HeartHandshake, tone: "bg-teal-soft text-teal-dark dark:bg-teal/15 dark:text-teal-light" },
  violences_physiques_verbales: { icon: ShieldAlert, tone: "bg-[#EADCF2] text-[#5B2E7A] dark:bg-[#5B2E7A]/25 dark:text-[#D9B8EE]" },
  violences_economiques: { icon: ShieldAlert, tone: "bg-[#EADCF2] text-[#5B2E7A] dark:bg-[#5B2E7A]/25 dark:text-[#D9B8EE]" },
  information_juridique: { icon: Scale, tone: "bg-[#DDE5F3] text-[#24427A] dark:bg-[#24427A]/30 dark:text-[#B7C9EE]" },
  sante_reproductive: { icon: Stethoscope, tone: "bg-[#DCEBDD] text-[#2F6235] dark:bg-[#2F6235]/30 dark:text-[#B9DDBC]" },
  hebergement_protection: { icon: House, tone: "bg-ochre-soft text-ochre-dark dark:bg-ochre/15 dark:text-ochre-light" },
  cyberharcelement: { icon: Smartphone, tone: "bg-[#F3E1D6] text-[#8A4024] dark:bg-[#8A4024]/30 dark:text-[#F0C3AB]" },
};


export default function Directory() {
  const { tx, lang } = usePrefs();
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [region, setRegion] = useState("");
  const [need, setNeed] = useState("");
  const [q, setQ] = useState("");
  const [referTo, setReferTo] = useState<Organization | null>(null);

  useEffect(() => {
    api<Organization[]>("/directory").then(setOrgs).catch(() => setOrgs([]));
  }, []);

  const filtered = useMemo(() => {
    const domains = NEEDS.find((n) => n.id === need)?.domains ?? [];
    return (orgs ?? []).filter(
      (o) =>
        (!region || o.region === region) &&
        (!domains.length || o.domains.some((d) => domains.includes(d))) &&
        (!q || `${o.name} ${o.description} ${o.services.join(" ")}`.toLowerCase().includes(q.toLowerCase())),
    );
  }, [orgs, region, need, q]);

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="eyebrow">{tx("Réseau d'aide", "Support network")}</p>
        <h1 className="mt-3 text-4xl sm:text-6xl">{tx("Trouver de ", "Find ")}<em className="scribble font-medium text-teal dark:text-teal-light">{tx("l'aide", "help")}</em></h1>
        {/* Le rappel n'est promis que si au moins une structure affichée peut le recevoir. */}
        <p className="mt-3 text-lg muted">
          {filtered.some((o) => o.accepts_referrals)
            ? tx("Choisissez votre besoin, puis appelez la structure ou demandez qu'elle vous rappelle.",
              "Choose your need, then call the organization or ask it to call you back.")
            : tx("Choisissez votre besoin, puis appelez directement la structure.", "Choose your need, then call the organization directly.")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 muted" aria-hidden />
            <input className="input h-12 pl-11" placeholder={tx("Rechercher un nom, un service (psychologue, juriste…)", "Search a name, a service (psychologist, lawyer…)")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={tx("Rechercher", "Search")} />
          </div>
          <div className="relative sm:w-56">
            <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 muted" aria-hidden />
            <select className="input h-12 pl-11" value={region} onChange={(e) => setRegion(e.target.value)} aria-label={tx("Région", "Region")}>
              <option value="">{tx("Toutes les régions", "All regions")}</option>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={tx("Besoin", "Need")}>
          {NEEDS.map(({ id, label, en, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={need === id}
              onClick={() => setNeed(id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                need === id
                  ? "border-night bg-night text-sand-100 dark:border-sand-100 dark:bg-sand-100 dark:text-night"
                  : "border-sand-300 bg-white/70 hover:border-night/40 hover:bg-white dark:border-white/10 dark:bg-night-850 dark:hover:border-white/30"
              }`}
            >
              <Icon size={16} aria-hidden /> {lang === "en" ? en : label}
            </button>
          ))}
        </div>
      </div>

      {orgs === null ? <Loading /> : filtered.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="font-semibold">{tx("Aucune structure pour ce choix.", "No organization for this choice.")}</p>
          <button onClick={() => { setNeed(""); setRegion(""); setQ(""); }} className="btn-ghost mt-3">{tx("Voir toutes les structures", "See all organizations")}</button>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold muted">{filtered.length} {lang === "en" ? `organization${filtered.length > 1 ? "s" : ""}` : `structure${filtered.length > 1 ? "s" : ""}`}</p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o) => <OrgCard key={o.id} org={o} onRefer={() => setReferTo(o)} />)}
          </div>
        </>
      )}

      <StatusLookup />
      {referTo && <ReferralDialog org={referTo} onClose={() => setReferTo(null)} />}
    </div>
  );
}

function OrgCard({ org, onRefer }: { org: Organization; onRefer: () => void }) {
  const { tx } = usePrefs();
  const style = DOMAIN_STYLE[org.domains[0]] ?? DOMAIN_STYLE.ecoute_psychosociale;
  const Icon = style.icon;
  return (
    <article className="card flex flex-col overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3 p-5 pb-0">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${style.tone}`} aria-hidden><Icon size={22} strokeWidth={1.8} /></span>
        <AvailabilityPill status={org.availability} />
      </div>
      <div className="flex-1 p-5">
        <h2 className="font-display text-xl font-semibold leading-snug">
          {clean(org.name)}
        </h2>
        <p className="mt-0.5 text-sm muted">{org.org_type}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed">{org.description}</p>
        {org.services.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={tx("Services", "Services")}>
            {org.services.slice(0, 3).map((s) => <li key={s} className="rounded-full border border-sand-200 bg-sand-100 px-2.5 py-1 text-xs font-medium dark:border-white/[0.06] dark:bg-white/[0.06]">{s}</li>)}
          </ul>
        )}
        <ul className="mt-4 space-y-2 text-sm muted">
          <li className="flex items-center gap-2.5"><MapPin size={15} className="shrink-0" /> {org.region}{org.department && org.department !== org.region ? `, ${org.department}` : ""}</li>
          {org.hours && <li className="flex items-start gap-2.5"><Clock size={15} className="mt-0.5 shrink-0" /> <span className="line-clamp-1">{org.hours}</span></li>}
        </ul>
      </div>
      <div className="flex gap-2 border-t border-sand-200 bg-sand-100/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
        {org.phone && <a href={`tel:${org.phone.replace(/\s/g, "")}`} className="btn-outline flex-1 px-3"><Phone size={16} /> {tx("Appeler", "Call")}</a>}
        {/* Le rappel en ligne n'est proposé qu'aux structures qui ont un compte actif pour recevoir les demandes. */}
        {org.accepts_referrals && <button onClick={onRefer} className="btn-primary flex-1 px-3">{tx("Être rappelée", "Get a call back")}</button>}
        {!org.phone && !org.accepts_referrals && <p className="flex min-h-[44px] flex-1 items-center justify-center gap-2 text-sm muted"><MapPin size={15} aria-hidden /> {tx("Contact sur place", "Visit in person")}</p>}
      </div>
    </article>
  );
}

function AvailabilityPill({ status }: { status: string }) {
  const { lang } = usePrefs();
  const a = AVAILABILITY[status] ?? AVAILABILITY.non_communique;
  const dot = { disponible: "bg-success", capacite_limitee: "bg-warn", sature: "bg-alert" }[status] ?? "bg-slate-400";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${a.tone}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{lang === "en" ? a.en : a.label}</span>;
}

function Modal({ onClose, labelledBy, children }: { onClose: () => void; labelledBy: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={onClose} className="fixed inset-0 z-40 flex items-end justify-center bg-night-950/60 p-4 backdrop-blur-sm sm:items-center">
      <div onClick={(e) => e.stopPropagation()} className="card w-full max-w-lg space-y-4 p-6 sm:p-8">{children}</div>
    </div>
  );
}

function ReferralDialog({ org, onClose }: { org: Organization; onClose: () => void }) {
  const { tx, lang } = usePrefs();
  const [consent, setConsent] = useState(false);
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState(org.domains[0] ?? "autre");
  const [result, setResult] = useState<{ public_code: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      setResult(await api("/referrals", { method: "POST", json: { organization_id: org.id, category, region: org.region, consent, contact } }));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409
        ? tx("Cette structure ne reçoit pas encore de demandes en ligne. Vous pouvez l'appeler directement.",
          "This organization does not take online requests yet. You can call it directly.")
        : (e as Error).message);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="ref-title">
        <div><p className="eyebrow">{tx("Être rappelée", "Get a call back")}</p><h2 id="ref-title" className="mt-2 text-2xl">{clean(org.name)}</h2></div>
        {result ? (
          <>
            <p className="rounded-xl bg-success/10 p-3 text-sm text-success">{result.message}</p>
            <p className="rounded-2xl border-2 border-dashed border-ochre/50 bg-ochre-soft/50 py-4 text-center font-display text-3xl font-semibold tracking-widest dark:bg-ochre/10">{result.public_code}</p>
            <p className="text-center text-xs muted">{tx("Notez ce code : il permet de suivre votre demande, sans donner votre nom.", "Write down this code: it lets you follow your request without giving your name.")}</p>
            <button onClick={onClose} className="btn-primary w-full">{tx("Fermer", "Close")}</button>
          </>
        ) : (
          <>
            <p className="text-sm muted">
              {tx("Laissez un numéro et un moment où vous pouvez parler sans risque. La structure vous rappellera. Rien n'est transmis sans votre accord.",
                "Leave a number and a time when you can talk safely. The organization will call you back. Nothing is shared without your consent.")}
            </p>
            <div>
              <label className="label" htmlFor="ref-cat">{tx("Type de besoin", "Type of need")}</label>
              <select id="ref-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {org.domains.map((d) => <option key={d} value={d}>{cat(d, lang)}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ref-contact">{tx("Moyen de recontact sûr", "Safe way to reach you")}</label>
              <input id="ref-contact" className="input" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={300} placeholder={tx("Ex. : appel au 77…, entre 10h et 12h", "E.g. call 77…, between 10am and 12pm")} />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-teal" />
              {tx("J'accepte que la structure me recontacte avec ces informations.", "I agree that the organization may contact me with this information.")}
            </label>
            <ErrorNote error={error} />
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1">{tx("Annuler", "Cancel")}</button>
              <button onClick={submit} disabled={!consent} className="btn-primary flex-1">{tx("Transmettre", "Send")}</button>
            </div>
          </>
        )}
    </Modal>
  );
}

function StatusLookup() {
  const { tx } = usePrefs();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  async function check() {
    try {
      const r = await api<{ label: string }>(`/referrals/status/${encodeURIComponent(code.trim())}`);
      setLabel(r.label);
    } catch {
      setLabel(tx("Code inconnu.", "Unknown code."));
    }
  }
  if (!open) return <p className="text-center text-sm muted">{tx("Déjà une demande ?", "Already made a request?")} <button onClick={() => setOpen(true)} className="font-semibold text-teal underline-offset-4 hover:underline dark:text-teal-light">{tx("Suivre avec votre code", "Track it with your code")}</button></p>;
  return (
    <section className="mx-auto max-w-md text-center">
      <div className="flex gap-2">
        <input className="input" placeholder="SSG-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} aria-label={tx("Code de suivi", "Tracking code")} autoFocus />
        <button onClick={check} className="btn-primary" disabled={!code.trim()}>{tx("Vérifier", "Check")}</button>
      </div>
      {label && <p className="mt-3 text-sm">{label}</p>}
    </section>
  );
}
