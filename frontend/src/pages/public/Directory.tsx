import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Clock, HeartHandshake, House, LayoutGrid, type LucideIcon, MapPin, Phone, Scale, Search, ShieldAlert, Smartphone, Stethoscope } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AVAILABILITY, cat, clean, REGIONS } from "@/lib/labels";
import type { Organization } from "@/lib/types";
import { ErrorNote, Loading } from "@/components/ui";

const NEEDS: { id: string; label: string; icon: LucideIcon; domains: string[] }[] = [
  { id: "", label: "Tout", icon: LayoutGrid, domains: [] },
  { id: "ecoute", label: "Écoute", icon: HeartHandshake, domains: ["ecoute_psychosociale"] },
  { id: "violences", label: "Violences", icon: ShieldAlert, domains: ["violences_physiques_verbales", "violences_economiques"] },
  { id: "droit", label: "Droits et justice", icon: Scale, domains: ["information_juridique"] },
  { id: "sante", label: "Santé", icon: Stethoscope, domains: ["sante_reproductive"] },
  { id: "hebergement", label: "Hébergement", icon: House, domains: ["hebergement_protection"] },
  { id: "numerique", label: "Harcèlement en ligne", icon: Smartphone, domains: ["cyberharcelement"] },
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
        <p className="eyebrow">Réseau d'aide</p>
        <h1 className="mt-3 text-4xl sm:text-6xl">Trouver de <em className="scribble font-medium text-teal dark:text-teal-light">l'aide</em></h1>
        {/* Le rappel n'est promis que si au moins une structure affichée peut le recevoir. */}
        <p className="mt-3 text-lg muted">
          {filtered.some((o) => o.accepts_referrals)
            ? "Choisissez votre besoin, puis appelez la structure ou demandez qu'elle vous rappelle."
            : "Choisissez votre besoin, puis appelez directement la structure."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 muted" aria-hidden />
            <input className="input h-12 pl-11" placeholder="Rechercher un nom, un service (psychologue, juriste…)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />
          </div>
          <div className="relative sm:w-56">
            <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 muted" aria-hidden />
            <select className="input h-12 pl-11" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Région">
              <option value="">Toutes les régions</option>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Besoin">
          {NEEDS.map(({ id, label, icon: Icon }) => (
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
              <Icon size={16} aria-hidden /> {label}
            </button>
          ))}
        </div>
      </div>

      {orgs === null ? <Loading /> : filtered.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="font-semibold">Aucune structure pour ce choix.</p>
          <button onClick={() => { setNeed(""); setRegion(""); setQ(""); }} className="btn-ghost mt-3">Voir toutes les structures</button>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold muted">{filtered.length} structure{filtered.length > 1 ? "s" : ""}</p>
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
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Services">
            {org.services.slice(0, 3).map((s) => <li key={s} className="rounded-full border border-sand-200 bg-sand-100 px-2.5 py-1 text-xs font-medium dark:border-white/[0.06] dark:bg-white/[0.06]">{s}</li>)}
          </ul>
        )}
        <ul className="mt-4 space-y-2 text-sm muted">
          <li className="flex items-center gap-2.5"><MapPin size={15} className="shrink-0" /> {org.region}{org.department && org.department !== org.region ? `, ${org.department}` : ""}</li>
          {org.hours && <li className="flex items-start gap-2.5"><Clock size={15} className="mt-0.5 shrink-0" /> <span className="line-clamp-1">{org.hours}</span></li>}
        </ul>
      </div>
      <div className="flex gap-2 border-t border-sand-200 bg-sand-100/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
        {org.phone && <a href={`tel:${org.phone.replace(/\s/g, "")}`} className="btn-outline flex-1 px-3"><Phone size={16} /> Appeler</a>}
        {/* Le rappel en ligne n'est proposé qu'aux structures qui ont un compte actif pour recevoir les demandes. */}
        {org.accepts_referrals && <button onClick={onRefer} className="btn-primary flex-1 px-3">Être rappelée</button>}
        {!org.phone && !org.accepts_referrals && <p className="flex min-h-[44px] flex-1 items-center justify-center gap-2 text-sm muted"><MapPin size={15} aria-hidden /> Contact sur place</p>}
      </div>
    </article>
  );
}

function AvailabilityPill({ status }: { status: string }) {
  const a = AVAILABILITY[status] ?? AVAILABILITY.non_communique;
  const dot = { disponible: "bg-success", capacite_limitee: "bg-warn", sature: "bg-alert" }[status] ?? "bg-slate-400";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${a.tone}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{a.label}</span>;
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
        ? "Cette structure ne reçoit pas encore de demandes en ligne. Vous pouvez l'appeler directement."
        : (e as Error).message);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="ref-title">
        <div><p className="eyebrow">Être rappelée</p><h2 id="ref-title" className="mt-2 text-2xl">{clean(org.name)}</h2></div>
        {result ? (
          <>
            <p className="rounded-xl bg-success/10 p-3 text-sm text-success">{result.message}</p>
            <p className="rounded-2xl border-2 border-dashed border-ochre/50 bg-ochre-soft/50 py-4 text-center font-display text-3xl font-semibold tracking-widest dark:bg-ochre/10">{result.public_code}</p>
            <p className="text-center text-xs muted">Notez ce code : il permet de suivre votre demande, sans donner votre nom.</p>
            <button onClick={onClose} className="btn-primary w-full">Fermer</button>
          </>
        ) : (
          <>
            <p className="text-sm muted">
              Laissez un numéro et un moment où vous pouvez parler sans risque. La structure vous rappellera. Rien n'est transmis sans votre accord.
            </p>
            <div>
              <label className="label" htmlFor="ref-cat">Type de besoin</label>
              <select id="ref-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {org.domains.map((d) => <option key={d} value={d}>{cat(d)}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ref-contact">Moyen de recontact sûr</label>
              <input id="ref-contact" className="input" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={300} placeholder="Ex. : appel au 77…, entre 10h et 12h" />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-teal" />
              J'accepte que la structure me recontacte avec ces informations.
            </label>
            <ErrorNote error={error} />
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
              <button onClick={submit} disabled={!consent} className="btn-primary flex-1">Transmettre</button>
            </div>
          </>
        )}
    </Modal>
  );
}

function StatusLookup() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  async function check() {
    try {
      const r = await api<{ label: string }>(`/referrals/status/${encodeURIComponent(code.trim())}`);
      setLabel(r.label);
    } catch {
      setLabel("Code inconnu.");
    }
  }
  if (!open) return <p className="text-center text-sm muted">Déjà une demande ? <button onClick={() => setOpen(true)} className="font-semibold text-teal underline-offset-4 hover:underline dark:text-teal-light">Suivre avec votre code</button></p>;
  return (
    <section className="mx-auto max-w-md text-center">
      <div className="flex gap-2">
        <input className="input" placeholder="SSG-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code de suivi" autoFocus />
        <button onClick={check} className="btn-primary" disabled={!code.trim()}>Vérifier</button>
      </div>
      {label && <p className="mt-3 text-sm">{label}</p>}
    </section>
  );
}
