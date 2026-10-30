import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Phone, Search, Send } from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, cat, REGIONS } from "@/lib/labels";
import type { Organization } from "@/lib/types";
import { AvailabilityBadge, Badge, ErrorNote, Loading } from "@/components/ui";

export default function Directory() {
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [region, setRegion] = useState("");
  const [domain, setDomain] = useState("");
  const [q, setQ] = useState("");
  const [referTo, setReferTo] = useState<Organization | null>(null);

  useEffect(() => {
    api<Organization[]>("/directory").then(setOrgs).catch(() => setOrgs([]));
  }, []);

  const filtered = useMemo(
    () =>
      (orgs ?? []).filter(
        (o) =>
          (!region || o.region === region) &&
          (!domain || o.domains.includes(domain)) &&
          (!q || `${o.name} ${o.description} ${o.services.join(" ")}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [orgs, region, domain, q],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trouver une structure d'aide</h1>
        <p className="muted">Structures vérifiées par l'équipe. Une disponibilité affichée n'est pas une confirmation d'accueil : appelez avant de vous déplacer.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 muted" aria-hidden />
          <input className="input pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />
        </div>
        <select className="input" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Région">
          <option value="">Toutes les régions</option>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className="input" value={domain} onChange={(e) => setDomain(e.target.value)} aria-label="Domaine">
          <option value="">Tous les besoins</option>
          {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== "autre").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {orgs === null ? <Loading /> : filtered.length === 0 ? <p className="muted">Aucune structure ne correspond à ces critères.</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <article key={o.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{o.name}</h2>
                  <p className="text-sm muted">{o.org_type}</p>
                </div>
                <AvailabilityBadge status={o.availability} />
              </div>
              <p className="text-sm">{o.description}</p>
              <div className="flex flex-wrap gap-1">{o.domains.map((d) => <Badge key={d}>{cat(d)}</Badge>)}</div>
              <ul className="space-y-1 text-sm muted">
                <li className="flex gap-2"><MapPin size={16} className="shrink-0" /> {o.region}{o.department ? ` · ${o.department}` : ""}</li>
                <li className="flex gap-2"><Clock size={16} className="shrink-0" /> {o.hours} · {o.access}</li>
              </ul>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {o.phone && <a href={`tel:${o.phone.replace(/\s/g, "")}`} className="btn-ghost text-sm"><Phone size={16} /> Appeler</a>}
                <button onClick={() => setReferTo(o)} className="btn-primary text-sm"><Send size={16} /> Être recontactée</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <StatusLookup />
      {referTo && <ReferralDialog org={referTo} onClose={() => setReferTo(null)} />}
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
      setError((e as Error).message);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="ref-title" className="fixed inset-0 z-40 flex items-end justify-center bg-night/70 p-4 sm:items-center">
      <div className="card w-full max-w-lg space-y-4">
        <h2 id="ref-title" className="text-lg font-semibold">Demander à être recontactée par {org.name}</h2>
        {result ? (
          <>
            <p className="rounded-xl bg-success/10 p-3 text-sm text-success">{result.message}</p>
            <p className="text-center text-2xl font-bold tracking-widest">{result.public_code}</p>
            <button onClick={onClose} className="btn-primary w-full">Fermer</button>
          </>
        ) : (
          <>
            <p className="text-sm muted">
              Seules les informations ci-dessous seront transmises à cette structure, et uniquement si vous donnez votre accord.
              Indiquez un moyen sûr de vous joindre (par exemple un numéro et un créneau horaire où vous pouvez parler librement).
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
              J'accepte que ces informations soient transmises à cette structure pour qu'elle me recontacte. Je peux annuler à tout moment auprès d'elle.
            </label>
            <ErrorNote error={error} />
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
              <button onClick={submit} disabled={!consent} className="btn-primary flex-1">Transmettre</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusLookup() {
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
  return (
    <section className="card">
      <h2 className="font-semibold">Suivre une demande</h2>
      <div className="mt-3 flex gap-2">
        <input className="input" placeholder="SSG-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code de suivi" />
        <button onClick={check} className="btn-primary" disabled={!code.trim()}>Vérifier</button>
      </div>
      {label && <p className="mt-2 text-sm">{label}</p>}
    </section>
  );
}
