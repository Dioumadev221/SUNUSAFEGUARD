import { useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Plus } from "lucide-react";
import UsersManager from "@/components/UsersManager";
import { PageHeader } from "@/components/DashboardLayout";
import { Badge, ErrorNote, Loading, Stat, Tabs } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AVAILABILITY, CATEGORY_LABELS, cat, clean, fmtDate, refStatus, REGIONS } from "@/lib/labels";
import { usePrefs } from "@/lib/prefs";
import type { Organization } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

type Referral = {
  id: number; public_code: string; organization: string; category: string; region: string; status: string;
  created_at: string; contact: string | null; events: { status: string; note: string; created_at: string }[];
};

export default function Orientation() {
  const { user } = useAuth();
  const { tx } = usePrefs();
  const [tab, setTab] = useState<"directory" | "referrals" | "team">("directory");
  const canManageTeam = user?.role === "super_admin" || user?.role === "responsable_partenaire";
  return (
    <>
      <PageHeader title={tx("Sunu Orientation", "Support network")} subtitle={tx("Annuaire, capacités déclarées et suivi des mises en relation autorisées.", "Directory, declared capacity and follow-up of authorized referrals.")} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "directory", label: tx("2.1 Annuaire & capacités", "2.1 Directory & capacity") },
        { id: "referrals", label: tx("2.2 Mises en relation", "2.2 Referrals") },
        ...(canManageTeam ? [{ id: "team" as const, label: tx("Équipe & comptes", "Team & accounts") }] : []),
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
  const { tx, lang } = usePrefs();
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
      <h2 className="font-semibold sm:col-span-2">{initial ? tx(`Modifier « ${clean(initial.name)} »`, `Edit "${clean(initial.name)}"`) : tx("Nouvelle structure", "New organization")}</h2>
      <div><label className="label">{tx("Nom", "Name")}</label><input className="input" required value={f.name} onChange={set("name")} /></div>
      <div><label className="label">{tx("Type d'organisation", "Organization type")}</label><input className="input" required value={f.org_type} onChange={set("org_type")} /></div>
      <div className="sm:col-span-2"><label className="label">{tx("Description", "Description")}</label><textarea className="input" rows={2} value={f.description} onChange={set("description")} /></div>
      <div><label className="label">{tx("Région", "Region")}</label><select className="input" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
      <div><label className="label">{tx("Département", "Department")}</label><input className="input" value={f.department} onChange={set("department")} /></div>
      <div className="sm:col-span-2"><label className="label">{tx("Adresse professionnelle", "Business address")}</label><input className="input" value={f.address} onChange={set("address")} /></div>
      <div><label className="label">{tx("Téléphone officiel", "Official phone")}</label><input className="input" value={f.phone} onChange={set("phone")} /></div>
      <div><label className="label">{tx("E-mail officiel", "Official email")}</label><input className="input" type="email" value={f.email} onChange={set("email")} /></div>
      <div><label className="label">{tx("Horaires et permanences", "Opening hours")}</label><input className="input" value={f.hours} onChange={set("hours")} /></div>
      <div><label className="label">{tx("Modalités d'accès", "Access conditions")}</label><input className="input" value={f.access} onChange={set("access")} /></div>
      <div><label className="label">{tx("Publics (séparés par des virgules)", "Audiences (comma-separated)")}</label><input className="input" {...list("publics")} /></div>
      <div><label className="label">{tx("Services (séparés par des virgules)", "Services (comma-separated)")}</label><input className="input" {...list("services")} /></div>
      <fieldset className="sm:col-span-2">
        <legend className="label">{tx("Domaines d'intervention", "Areas of work")}</legend>
        <div className="flex flex-wrap gap-3">
          {Object.keys(CATEGORY_LABELS).filter((k) => k !== "autre").map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-teal" checked={f.domains.includes(k)}
                onChange={(e) => setF({ ...f, domains: e.target.checked ? [...f.domains, k] : f.domains.filter((d) => d !== k) })} />{cat(k, lang)}
            </label>
          ))}
        </div>
      </fieldset>
      <ErrorNote error={error} />
      <div className="flex gap-2 sm:col-span-2"><button type="button" className="btn-ghost" onClick={onCancel}>{tx("Annuler", "Cancel")}</button><button className="btn-primary">{tx("Enregistrer", "Save")}</button></div>
    </form>
  );
}

function DirectoryManager() {
  const { user } = useAuth();
  const { tx } = usePrefs();
  const { data, error, reload } = useFetch<Organization[]>("/directory/manage");
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<Organization | "new" | null>(null);

  async function save(data: OrgForm) {
    if (editing === "new") await api("/directory", { method: "POST", json: data });
    else await api(`/directory/${(editing as Organization).id}`, { method: "PUT", json: data });
    setMsg(editing === "new" ? tx("Structure créée (à valider).", "Organization created (to be validated).") : tx("Fiche mise à jour. Une modification par un partenaire repasse en validation.", "Profile updated. A change made by a partner goes back to validation."));
    setEditing(null);
    reload();
  }

  async function update(org: Organization, status: string, capacity: number) {
    await api(`/directory/${org.id}/availability`, { method: "POST", json: { status, capacity } });
    setMsg(tx(`Disponibilité de « ${clean(org.name)} » mise à jour.`, `Availability of "${clean(org.name)}" updated.`));
    reload();
  }
  async function validate(org: Organization) {
    await api(`/directory/${org.id}/validate`, { method: "POST" });
    reload();
  }

  const isGlobal = user?.role === "super_admin" || user?.role === "admin_operationnel";
  const canEdit = isGlobal || user?.role === "responsable_partenaire";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">{tx("La disponibilité déclarée n'est jamais présentée au public comme une garantie d'accueil.", "Declared availability is never shown to the public as a guarantee of being received.")}</p>
        {isGlobal && !editing && <button className="btn-primary" onClick={() => setEditing("new")}><Plus size={16} /> {tx("Nouvelle structure", "New organization")}</button>}
      </div>
      {editing && <OrgEditor initial={editing === "new" ? undefined : editing} onSave={save} onCancel={() => setEditing(null)} />}
      <ErrorNote error={error} />
      {msg && <p className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{msg}</p>}
      {!data ? <Loading /> : (
        <div className="card overflow-x-auto p-2 sm:p-3">
          <table className="table">
            <thead><tr><th>{tx("Structure", "Organization")}</th><th>{tx("Disponibilité", "Availability")}</th><th>{tx("Places", "Places")}</th><th>{tx("Fiche", "Profile")}</th><th /></tr></thead>
            <tbody>
              {data.map((org) => <OrgRow key={org.id} org={org} canValidate={isGlobal} canEdit={canEdit}
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
  const { tx, lang } = usePrefs();
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
        <select className="input w-auto py-2 pr-8" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={tx(`Disponibilité de ${org.name}`, `Availability of ${org.name}`)}>
          {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{lang === "en" ? v.en : v.label}</option>)}
        </select>
      </td>
      <td><input type="number" min={0} className="input w-20 py-2" value={capacity} onChange={(e) => setCapacity(+e.target.value)} aria-label={tx("Places déclarées", "Declared places")} /></td>
      <td>
        {org.validated
          ? <span className="flex items-center gap-1.5 text-xs font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" />{tx("Validée", "Validated")}</span>
          : canValidate
            ? <button className="flex items-center gap-1.5 text-xs font-semibold text-warn hover:underline" onClick={() => onValidate(org)}><CheckCircle2 size={14} /> {tx("Valider", "Validate")}</button>
            : <span className="text-xs font-medium text-warn">{tx("À valider", "To validate")}</span>}
        <p className="mt-0.5 text-[11px] muted">{tx("vérifiée le", "checked on")} {fmtDate(org.last_verified_at, lang).split(" ")[0].replace(/,$/, "")}</p>
      </td>
      <td className="whitespace-nowrap text-right">
        {dirty && <button className="btn-primary h-9 min-h-0 px-4 text-xs" onClick={() => onUpdate(org, status, capacity)}>{tx("Enregistrer", "Save")}</button>}
        {canEdit && <button className="ml-1 rounded-lg p-2 text-slate-400 hover:text-teal" onClick={onEdit} aria-label={tx(`Modifier ${org.name}`, `Edit ${org.name}`)} title={tx("Modifier la fiche", "Edit profile")}><Pencil size={16} /></button>}
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
  const { tx, lang } = usePrefs();
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
          <Stat label={tx("En attente de réception", "Awaiting receipt")} value={stats.data.pending_without_reception} />
          <Stat label={tx("Délai médian jusqu'à réception", "Median time to receipt")} value={stats.data.median_hours_to_reception === null ? "—" : `${stats.data.median_hours_to_reception} h`} />
          <Stat label={tx("Délai médian jusqu'à prise en charge", "Median time to care")} value={stats.data.median_hours_to_confirmation === null ? "—" : `${stats.data.median_hours_to_confirmation} h`} />
        </div>
      )}
      {alerts.data && alerts.data.late.length > 0 && (
        <div role="alert" className="rounded-2xl bg-warn/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle size={16} className="text-warn" /> {tx(`${alerts.data.late.length} demande(s) transmise(s) sans accusé de réception depuis plus de ${alerts.data.threshold_hours} h`, `${alerts.data.late.length} request(s) sent with no acknowledgement for more than ${alerts.data.threshold_hours} h`)}</p>
          <ul className="mt-1 text-xs">{alerts.data.late.map((a) => <li key={a.id}><span className="font-mono">{a.public_code}</span> · {clean(a.organization)} · {a.hours_waiting} h</li>)}</ul>
        </div>
      )}
      <ErrorNote error={list.error} />
      {!list.data ? <Loading /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Code</th><th>{tx("Structure", "Organization")}</th><th>{tx("Besoin", "Need")}</th><th>{tx("Statut", "Status")}</th><th>Contact</th><th>{tx("Créée", "Created")}</th><th>Action</th></tr></thead>
            <tbody>
              {list.data.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.public_code}</td>
                  <td>{clean(r.organization)}</td>
                  <td>{cat(r.category, lang)}</td>
                  <td><Badge>{refStatus(r.status, lang)}</Badge></td>
                  <td className="text-xs">{r.contact ?? <span className="muted">{tx("masqué", "hidden")}</span>}</td>
                  <td className="text-xs">{fmtDate(r.created_at, lang)}</td>
                  <td className="space-x-1 whitespace-nowrap">
                    {(NEXT[r.status] ?? []).map((s) => <button key={s} onClick={() => move(r, s)} className="rounded-full border border-sand-200 px-3 py-1 text-xs font-medium hover:border-teal hover:text-teal dark:border-white/10">{refStatus(s, lang)}</button>)}
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
