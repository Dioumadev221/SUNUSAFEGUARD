import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/DashboardLayout";
import { AvailabilityBadge, Badge, ErrorNote, Loading, Stat, Tabs } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AVAILABILITY, cat, fmtDate, REFERRAL_STATUS } from "@/lib/labels";
import type { Organization } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

type Referral = {
  id: number; public_code: string; organization: string; category: string; region: string; status: string;
  created_at: string; contact: string | null; events: { status: string; note: string; created_at: string }[];
};

export default function Orientation() {
  const [tab, setTab] = useState<"directory" | "referrals">("directory");
  return (
    <>
      <PageHeader title="Sunu Orientation" subtitle="Annuaire, capacités déclarées et suivi des mises en relation autorisées." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "directory", label: "2.1 Annuaire & capacités" }, { id: "referrals", label: "2.2 Mises en relation" }]} />
      {tab === "directory" ? <DirectoryManager /> : <Referrals />}
    </>
  );
}

function DirectoryManager() {
  const { user } = useAuth();
  const { data, error, reload } = useFetch<Organization[]>("/directory/manage");
  const [msg, setMsg] = useState<string | null>(null);

  async function update(org: Organization, status: string, capacity: number) {
    await api(`/directory/${org.id}/availability`, { method: "POST", json: { status, capacity } });
    setMsg(`Disponibilité de « ${org.name} » mise à jour.`);
    reload();
  }
  async function validate(org: Organization) {
    await api(`/directory/${org.id}/validate`, { method: "POST" });
    reload();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm muted">Une disponibilité déclarée n'est jamais présentée au public comme une confirmation d'accueil.</p>
      <ErrorNote error={error} />
      {msg && <p className="rounded-xl bg-success/10 p-3 text-sm text-success">{msg}</p>}
      {!data ? <Loading /> : data.map((org) => <OrgCard key={org.id} org={org} canValidate={user?.role === "super_admin"} onUpdate={update} onValidate={validate} />)}
    </div>
  );
}

function OrgCard({ org, canValidate, onUpdate, onValidate }: {
  org: Organization; canValidate: boolean;
  onUpdate: (o: Organization, s: string, c: number) => void; onValidate: (o: Organization) => void;
}) {
  const [status, setStatus] = useState(org.availability);
  const [capacity, setCapacity] = useState(org.capacity);
  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{org.name}</h2>
          <p className="text-sm muted">{org.org_type} · {org.region} · vérifié le {fmtDate(org.last_verified_at)}</p>
        </div>
        <div className="flex gap-2">
          <AvailabilityBadge status={org.availability} />
          {org.validated ? <Badge tone="bg-success/15 text-success">Validée</Badge> : <Badge tone="bg-warn/15 text-warn">À valider</Badge>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">{org.domains.map((d) => <Badge key={d}>{cat(d)}</Badge>)}</div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="label">Disponibilité</label>
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Places déclarées</label>
          <input type="number" min={0} className="input w-28" value={capacity} onChange={(e) => setCapacity(+e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => onUpdate(org, status, capacity)}>Mettre à jour</button>
        {canValidate && !org.validated && <button className="btn-ghost" onClick={() => onValidate(org)}><CheckCircle2 size={16} /> Valider la fiche</button>}
      </div>
    </div>
  );
}

const NEXT: Record<string, string[]> = {
  transmise: ["recue", "annulee"],
  recue: ["en_cours", "non_prise_en_charge"],
  en_cours: ["prise_en_charge_confirmee", "non_prise_en_charge"],
  prise_en_charge_confirmee: ["cloturee"],
  non_prise_en_charge: ["cloturee"],
};

function Referrals() {
  const list = useFetch<Referral[]>("/referrals");
  const stats = useFetch<{ by_status: Record<string, number>; median_hours_to_reception: number | null; median_hours_to_confirmation: number | null; pending_without_reception: number }>("/referrals/stats");
  async function move(r: Referral, status: string) {
    await api(`/referrals/${r.id}`, { method: "PATCH", json: { status } });
    list.reload();
    stats.reload();
  }
  return (
    <div className="space-y-4">
      {stats.data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="En attente de réception" value={stats.data.pending_without_reception} />
          <Stat label="Délai médian jusqu'à réception" value={stats.data.median_hours_to_reception === null ? "—" : `${stats.data.median_hours_to_reception} h`} />
          <Stat label="Délai médian jusqu'à prise en charge" value={stats.data.median_hours_to_confirmation === null ? "—" : `${stats.data.median_hours_to_confirmation} h`} />
        </div>
      )}
      <p className="text-sm muted">Identifiants techniques aléatoires. Aucune relance automatique n'est envoyée à la personne. Le contact est effacé à la clôture.</p>
      <ErrorNote error={list.error} />
      {!list.data ? <Loading /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Code</th><th>Structure</th><th>Besoin</th><th>Statut</th><th>Contact</th><th>Créée</th><th>Action</th></tr></thead>
            <tbody>
              {list.data.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.public_code}</td>
                  <td>{r.organization}</td>
                  <td>{cat(r.category)}</td>
                  <td><Badge>{REFERRAL_STATUS[r.status] ?? r.status}</Badge></td>
                  <td className="text-xs">{r.contact ?? <span className="muted">masqué</span>}</td>
                  <td className="text-xs">{fmtDate(r.created_at)}</td>
                  <td className="space-x-1 whitespace-nowrap">
                    {(NEXT[r.status] ?? []).map((s) => <button key={s} onClick={() => move(r, s)} className="rounded-lg border border-sand-200 px-2 py-1 text-xs hover:border-teal dark:border-night-700">{REFERRAL_STATUS[s]}</button>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
