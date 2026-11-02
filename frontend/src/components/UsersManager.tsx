import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { clean, fmtDate, role } from "@/lib/labels";
import { usePrefs } from "@/lib/prefs";
import type { Organization, User } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";
import { Badge, ErrorNote, Loading } from "./ui";

/** Gestion des comptes (super admin : tous ; responsable partenaire : sa structure). */
export default function UsersManager() {
  const { user: me } = useAuth();
  const { tx, lang } = usePrefs();
  const users = useFetch<User[]>("/users");
  const roles = useFetch<{ id: string; label: string }[]>("/users/roles");
  const orgs = useFetch<Organization[]>(me?.role === "super_admin" ? "/directory/manage" : null);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", full_name: "", role: "", organization_id: "" });

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api<{ user: User; temporary_password: string }>("/users", {
        method: "POST",
        json: { ...form, organization_id: form.organization_id ? +form.organization_id : null },
      });
      setSecret({ email: res.user.email, password: res.temporary_password });
      setForm({ email: "", full_name: "", role: "", organization_id: "" });
      users.reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function patch(u: User, json: Partial<User>) {
    setError(null);
    try {
      await api(`/users/${u.id}`, { method: "PATCH", json });
      users.reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function reset(u: User) {
    const res = await api<{ temporary_password: string }>(`/users/${u.id}/reset`, { method: "POST" });
    setSecret({ email: u.email, password: res.temporary_password });
    users.reload();
  }

  const orgName = (id: number | null) => orgs.data?.find((o) => o.id === id)?.name ? clean(orgs.data?.find((o) => o.id === id)?.name) : (id ? `#${id}` : "—");

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2"><label className="label">{tx("E-mail professionnel", "Work email")}</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label">{tx("Nom complet", "Full name")}</label><input className="input" required minLength={2} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><label className="label">{tx("Rôle", "Role")}</label>
          <select className="input" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="" disabled>{tx("Choisir un rôle…", "Choose a role…")}</option>
            {roles.data?.map((r) => <option key={r.id} value={r.id}>{role(r.id, lang)}</option>)}
          </select>
        </div>
        {me?.role === "super_admin" && (
          <div><label className="label">{tx("Structure", "Organization")}</label>
            <select className="input" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}>
              <option value="">{tx("Aucune", "None")}</option>
              {orgs.data?.map((o) => <option key={o.id} value={o.id}>{clean(o.name)}</option>)}
            </select>
          </div>
        )}
        <div className="flex items-end lg:col-span-5"><button className="btn-primary"><UserPlus size={16} /> {tx("Créer le compte", "Create account")}</button></div>
      </form>
      {secret && (
        <div role="status" className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm">
          {tx("Mot de passe provisoire pour", "Temporary password for")} <strong>{secret.email}</strong> : <code className="font-mono text-base">{secret.password}</code>
          <p className="mt-1 text-xs muted">{tx("Transmettez-le par un canal sûr. Il ne sera plus affiché ; la personne devra le changer à sa première connexion.", "Share it through a safe channel. It will not be shown again; the person must change it at first sign-in.")}</p>
          <button className="mt-2 text-xs underline" onClick={() => setSecret(null)}>{tx("Masquer", "Hide")}</button>
        </div>
      )}
      <ErrorNote error={error ?? users.error} />
      {!users.data ? <Loading /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>{tx("Compte", "Account")}</th><th>{tx("Rôle", "Role")}</th><th>{tx("Structure", "Organization")}</th><th>{tx("Sécurité", "Security")}</th><th>{tx("Dernière connexion", "Last sign-in")}</th><th>{tx("Actions", "Actions")}</th></tr></thead>
            <tbody>
              {users.data.map((u) => (
                <tr key={u.id} className={u.is_active ? "" : "opacity-50"}>
                  <td><p className="font-medium">{clean(u.full_name)}</p><p className="text-xs muted">{u.email}</p></td>
                  <td>
                    <select className="rounded-lg border border-sand-200 bg-transparent px-2 py-1 text-xs dark:border-night-700" value={u.role} disabled={u.id === me?.id}
                      onChange={(e) => patch(u, { role: e.target.value })}>
                      {(roles.data ?? []).concat(roles.data?.some((r) => r.id === u.role) ? [] : [{ id: u.role, label: u.role }]).map((r) => <option key={r.id} value={r.id}>{role(r.id, lang)}</option>)}
                    </select>
                  </td>
                  <td className="text-xs">{orgName(u.organization_id)}</td>
                  <td className="space-x-1">
                    {u.mfa_active ? <Badge tone="bg-success/15 text-success">2FA</Badge> : u.mfa_setup_required ? <Badge tone="bg-warn/15 text-warn">{tx("2FA à activer", "2FA to set up")}</Badge> : null}
                    {u.must_change_password && <Badge tone="bg-warn/15 text-warn">{tx("mdp provisoire", "temporary password")}</Badge>}
                    {!u.is_active && <Badge tone="bg-slate-500/15 text-slate-400">{tx("désactivé", "disabled")}</Badge>}
                  </td>
                  <td className="text-xs">{fmtDate(u.last_login_at, lang)}</td>
                  <td className="space-x-1 whitespace-nowrap">
                    {u.id !== me?.id && (
                      <>
                        <button className="rounded-lg border border-sand-200 px-2 py-1 text-xs dark:border-night-700" onClick={() => patch(u, { is_active: !u.is_active })}>{u.is_active ? tx("Désactiver", "Disable") : tx("Réactiver", "Re-enable")}</button>
                        <button className="rounded-lg border border-sand-200 px-2 py-1 text-xs dark:border-night-700" onClick={() => reset(u)}>{tx("Réinitialiser", "Reset")}</button>
                      </>
                    )}
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
