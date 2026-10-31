import { useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Plus } from "lucide-react";
import UsersManager from "@/components/UsersManager";
import { PageHeader } from "@/components/DashboardLayout";
import { Badge, ErrorNote, Loading, Stat, Tabs } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AVAILABILITY, CATEGORY_LABELS, cat, clean, fmtDate, REFERRAL_STATUS, REGIONS } from "@/lib/labels";
import type { Organization } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

type Referral = {
  id: number; public_code: string; organization: string; category: string; region: string; status: string;
  created_at: string; contact: string | null; events: { status: string; note: string; created_at: string }[];
};

export default function Orientation() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"directory" | "referrals" | "team">("directory");
  const canManageTeam = user?.role === "super_admin" || user?.role === "responsable_partenaire";
  return (
    <>
      <PageHeader title="Sunu Orientation" subtitle="Annuaire, capacités déclarées et suivi des mises en relation autorisées." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "directory", label: "2.1 Annuaire & capacités" },
        { id: "referrals", label: "2.2 Mises en relation" },
        ...(canManageTeam ? [{ id: "team" as const, label: "Équipe & comptes" }] : []),
      ]} />
      {tab === "directory" && <DirectoryManager />}
      {tab === "referrals" && <Referrals />}
      {tab === "team" && <UsersManager />}
    </>
  );
}

const EMPTY_ORG = { name: "", org_type: "Association", description: "", address: "", region: "Dakar", department: "", phone: "", email: "",
  domains: [] as string[], publics: [] as string[], services: [] as string[], hours: "", access: "" };
type OrgForm = typeof EMPTY_ORG;

function OrgEditor({ initial, onSave, onCancel }: { initial?: Organization; onSave: (data: OrgForm) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState<OrgForm>(initial ? { ...EMPTY_ORG, ...initial } : EMPTY_ORG);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof OrgForm) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const list = (k: "publics" | "services") => ({ value: f[k].join(", "), onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) }) });
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try { await onSave(f); } catch (err) { setError((err as Error).message); }
  }
  return (
    <form onSubmit={submit} className="card grid gap-4 sm:grid-cols-2">
      <h2 className="font-semibold sm:col-span-2">{initial ? `Modifier « ${clean(initial.name)} »` : "Nouvelle structure"}</h2>
      <div><label className="label">Nom</label><input className="input" required value={f.name} onChange={set("name")} /></div>
      <div><label className="label">Type d'organisation</label><input className="input" required value={f.org_type} onChange={set("org_type")} /></div>
      <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={f.description} onChange={set("description")} /></div>
      <div><label className="label">Région</label><select className="input" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
      <div><label className="label">Département</label><input className="input" value={f.department} onChange={set("department")} /></div>
      <div className="sm:col-span-2"><label className="label">Adresse professionnelle</label><input className="input" value={f.address} onChange={set("address")} /></div>
      <div><label className="label">Téléphone officiel</label><input className="input" value={f.phone} onChange={set("phone")} /></div>
      <div><label className="label">E-mail officiel</label><input className="input" type="email" value={f.email} onChange={set("email")} /></div>
      <div><label className="label">Horaires et permanences</label><input className="input" value={f.hours} onChange={set("hours")} /></div>
      <div><label className="label">Modalités d'accès</label><input className="input" value={f.access} onChange={set("access")} /></div>
      <div><label className="label">Publics (séparés par des virgules)</label><input className="input" {...list("publics")} /></div>
      <div><label className="label">Services (séparés par des virgules)</label><input className="input" {...list("services")} /></div>
      <fieldset className="sm:col-span-2">
        <legend className="label">Domaines d'intervention</legend>
        <div className="flex flex-wrap gap-3">
          {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== "autre").map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-teal" checked={f.domains.includes(k)}
                onChange={(e) => setF({ ...f, domains: e.target.checked ? [...f.domains, k] : f.domains.filter((d) => d !== k) })} />{v}
            </label>
          ))}
        </div>
      </fieldset>
      <ErrorNote error={error} />
      <div className="flex gap-2 sm:col-span-2"><button type="button" className="btn-ghost" onClick={onCancel}>Annuler</button><button className="btn-primary">Enregistrer</button></div>
    </form>
  );
}

function DirectoryManager() {
  const { user } = useAuth();
  const { data, error, reload } = useFetch<Organization[]>("/directory/manage");
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<Organization | "new" | null>(null);

  async function save(data: OrgForm) {
    if (editing === "new") await api("/directory", { method: "POST", json: data });
    else await api(`/directory/${(editing as Organization).id}`, { method: "PUT", json: data });
    setMsg(editing === "new" ? "Structure créée (à valider)." : "Fiche mise à jour. Une modification par un partenaire repasse en validation.");
    setEditing(null);
    reload();
  }

  async function update(org: Organization, status: string, capacity: number) {
    await api(`/directory/${org.id}/availability`, { method: "POST", json: { status, capacity } });
    setMsg(`Disponibilité de « ${clean(org.name)} » mise à jour.`);
    reload();
  }
  async function validate(org: Organization) {
    await api(`/directory/${org.id}/validate`, { method: "POST" });
    reload();
  }

  const canEdit = user?.role === "super_admin" || user?.role === "responsable_partenaire";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">La disponibilité déclarée n'est jamais présentée au public comme une garantie d'accueil.</p>
        {user?.role === "super_admin" && !editing && <button className="btn-primary" onClick={() => setEditing("new")}><Plus size={16} /> Nouvelle structure</button>}
      </div>
      {editing && <OrgEditor initial={editing === "new" ? undefined : editing} onSave={save} onCancel={() => setEditing(null)} />}
      <ErrorNote error={error} />
      {msg && <p className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{msg}</p>}
      {!data ? <Loading /> : (
        <div className="card overflow-x-auto p-2 sm:p-3">
          <table className="table">
            <thead><tr><th>Structure</th><th>Disponibilité</th><th>Places</th><th>Fiche</th><th /></tr></thead>
            <tbody>
              {data.map((org) => <OrgRow key={org.id} org={org} canValidate={user?.role === "super_admin"} canEdit={canEdit}
                onEdit={() => setEditing(org)} onUpdate={update} onValidate={validate} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrgRow({ org, canValidate, canEdit, onEdit, onUpdate, onValidate }: {
  org: Organization; canValidate: boolean; canEdit: boolean; onEdit: () => void;
  onUpdate: (o: Organization, s: string, c: number) => void; onValidate: (o: Organization) => void;
}) {
  const [status, setStatus] = useState(org.availability);
  const [capacity, setCapacity] = useState(org.capacity);
  const dirty = status !== org.availability || capacity !== org.capacity;
  return (
    <tr>
      <td className="min-w-[220px]">
        <p className="font-semibold">{clean(org.name)}</p>
        <p className="text-xs muted">{org.org_type} · {org.region}</p>
      </td>
      <td>
        <select className="input w-auto py-2 pr-8" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={`Disponibilité de ${org.name}`}>
          {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </td>
      <td><input type="number" min={0} className="input w-20 py-2" value={capacity} onChange={(e) => setCapacity(+e.target.value)} aria-label="Places déclarées" /></td>
      <td>
        {org.validated
          ? <span className="flex items-center gap-1.5 text-xs font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" />Validée</span>
          : canValidate
            ? <button className="flex items-center gap-1.5 text-xs font-semibold text-warn hover:underline" onClick={() => onValidate(org)}><CheckCircle2 size={14} /> Valider</button>
            : <span className="text-xs font-medium text-warn">À valider</span>}
        <p className="mt-0.5 text-[11px] muted">vérifiée le {fmtDate(org.last_verified_at).split(" ")[0]}</p>
      </td>
      <td className="whitespace-nowrap text-right">
        {dirty && <button className="btn-primary h-9 min-h-0 px-4 text-xs" onClick={() => onUpdate(org, status, capacity)}>Enregistrer</button>}
        {canEdit && <button className="ml-1 rounded-lg p-2 text-slate-400 hover:text-teal" onClick={onEdit} aria-label={`Modifier ${org.name}`} title="Modifier la fiche"><Pencil size={16} /></button>}
      </td>
    </tr>
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
  const alerts = useFetch<{ threshold_hours: number; late: { id: number; public_code: string; organization: string; hours_waiting: number }[] }>("/referrals/alerts");
  async function move(r: Referral, status: string) {
    await api(`/referrals/${r.id}`, { method: "PATCH", json: { status } });
    list.reload();
    stats.reload();
    alerts.reload();
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
      {alerts.data && alerts.data.late.length > 0 && (
        <div role="alert" className="rounded-2xl bg-warn/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle size={16} className="text-warn" /> {alerts.data.late.length} demande(s) transmise(s) sans accusé de réception depuis plus de {alerts.data.threshold_hours} h</p>
          <ul className="mt-1 text-xs">{alerts.data.late.map((a) => <li key={a.id}><span className="font-mono">{a.public_code}</span> · {clean(a.organization)} · {a.hours_waiting} h</li>)}</ul>
        </div>
      )}
      <ErrorNote error={list.error} />
      {!list.data ? <Loading /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Code</th><th>Structure</th><th>Besoin</th><th>Statut</th><th>Contact</th><th>Créée</th><th>Action</th></tr></thead>
            <tbody>
              {list.data.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.public_code}</td>
                  <td>{clean(r.organization)}</td>
                  <td>{cat(r.category)}</td>
                  <td><Badge>{REFERRAL_STATUS[r.status] ?? r.status}</Badge></td>
                  <td className="text-xs">{r.contact ?? <span className="muted">masqué</span>}</td>
                  <td className="text-xs">{fmtDate(r.created_at)}</td>
                  <td className="space-x-1 whitespace-nowrap">
                    {(NEXT[r.status] ?? []).map((s) => <button key={s} onClick={() => move(r, s)} className="rounded-full border border-sand-200 px-3 py-1 text-xs font-medium hover:border-teal hover:text-teal dark:border-white/10">{REFERRAL_STATUS[s]}</button>)}
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
