import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { clean, fmtDate, ROLE_LABELS } from "@/lib/labels";
import type { Organization, User } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";
import { Badge, ErrorNote, Loading } from "./ui";

/** Gestion des comptes (super admin : tous ; responsable partenaire : sa structure). */
export default function UsersManager() {
  const { user: me } = useAuth();
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
        <div className="lg:col-span-2"><label className="label">E-mail professionnel</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label">Nom complet</label><input className="input" required minLength={2} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><label className="label">Rôle</label>
          <select className="input" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="" disabled>Choisir un rôle…</option>
            {roles.data?.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        {me?.role === "super_admin" && (
          <div><label className="label">Structure</label>
            <select className="input" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}>
              <option value="">Aucune</option>
              {orgs.data?.map((o) => <option key={o.id} value={o.id}>{clean(o.name)}</option>)}
            </select>
          </div>
        )}
        <div className="flex items-end lg:col-span-5"><button className="btn-primary"><UserPlus size={16} /> Créer le compte</button></div>
      </form>
      {secret && (
        <div role="status" className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm">
          Mot de passe provisoire pour <strong>{secret.email}</strong> : <code className="font-mono text-base">{secret.password}</code>
          <p className="mt-1 text-xs muted">Transmettez-le par un canal sûr. Il ne sera plus affiché ; la personne devra le changer à sa première connexion.</p>
          <button className="mt-2 text-xs underline" onClick={() => setSecret(null)}>Masquer</button>
        </div>
      )}
      <ErrorNote error={error ?? users.error} />
      {!users.data ? <Loading /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Compte</th><th>Rôle</th><th>Structure</th><th>Sécurité</th><th>Dernière connexion</th><th>Actions</th></tr></thead>
            <tbody>
              {users.data.map((u) => (
                <tr key={u.id} className={u.is_active ? "" : "opacity-50"}>
                  <td><p className="font-medium">{clean(u.full_name)}</p><p className="text-xs muted">{u.email}</p></td>
                  <td>
                    <select className="rounded-lg border border-sand-200 bg-transparent px-2 py-1 text-xs dark:border-night-700" value={u.role} disabled={u.id === me?.id}
                      onChange={(e) => patch(u, { role: e.target.value })}>
                      {(roles.data ?? []).concat(roles.data?.some((r) => r.id === u.role) ? [] : [{ id: u.role, label: ROLE_LABELS[u.role] }]).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="text-xs">{orgName(u.organization_id)}</td>
                  <td className="space-x-1">
                    {u.mfa_active ? <Badge tone="bg-success/15 text-success">2FA</Badge> : u.mfa_setup_required ? <Badge tone="bg-warn/15 text-warn">2FA à activer</Badge> : null}
                    {u.must_change_password && <Badge tone="bg-warn/15 text-warn">mdp provisoire</Badge>}
                    {!u.is_active && <Badge tone="bg-slate-500/15 text-slate-400">désactivé</Badge>}
                  </td>
                  <td className="text-xs">{fmtDate(u.last_login_at)}</td>
                  <td className="space-x-1 whitespace-nowrap">
                    {u.id !== me?.id && (
                      <>
                        <button className="rounded-lg border border-sand-200 px-2 py-1 text-xs dark:border-night-700" onClick={() => patch(u, { is_active: !u.is_active })}>{u.is_active ? "Désactiver" : "Réactiver"}</button>
                        <button className="rounded-lg border border-sand-200 px-2 py-1 text-xs dark:border-night-700" onClick={() => reset(u)}>Réinitialiser</button>
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
