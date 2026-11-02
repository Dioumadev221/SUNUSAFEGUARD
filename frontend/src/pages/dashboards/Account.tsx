import { useState, type FormEvent } from "react";
import qrcode from "qrcode-generator";
import { KeyRound, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/DashboardLayout";
import { Badge, ErrorNote } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { clean, fmtDate, ROLE_LABELS } from "@/lib/labels";
import type { User } from "@/lib/types";

export default function Account() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <PageHeader title="Mon compte" subtitle={`${clean(user.full_name)} · ${ROLE_LABELS[user.role]} · dernière connexion ${fmtDate(user.last_login_at)}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PasswordCard forced={user.must_change_password} />
        <MfaCard />
      </div>
    </>
  );
}

function PasswordCard({ forced }: { forced: boolean }) {
  const { setUser } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    try {
      setUser(await api<User>("/auth/password", { method: "POST", json: { current_password: current, new_password: next } }));
      setDone(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="flex items-center gap-2 font-semibold"><KeyRound size={18} /> Mot de passe</h2>
      {forced && <p className="rounded-xl bg-warn/10 p-3 text-sm">Votre mot de passe est provisoire : choisissez-en un nouveau pour continuer.</p>}
      <div><label className="label">Mot de passe actuel</label><input type="password" className="input" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required /></div>
      <div><label className="label">Nouveau mot de passe (12 caractères, lettres et chiffres)</label><input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required /></div>
      <div><label className="label">Confirmation</label><input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></div>
      <ErrorNote error={error} />
      {done && <p className="text-sm text-success">Mot de passe mis à jour.</p>}
      <button className="btn-primary">Changer le mot de passe</button>
    </form>
  );
}

function MfaCard() {
  const { user, setUser } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string; setup_token: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setSetup(await api("/auth/mfa/setup", { method: "POST" }));
  }

  async function enable(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<User>(`/auth/mfa/enable?setup_token=${encodeURIComponent(setup!.setup_token)}`, { method: "POST", json: { code } }));
      setSetup(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const qr = () => {
    const q = qrcode(0, "M");
    q.addData(setup!.otpauth_uri);
    q.make();
    return q.createDataURL(5, 2);
  };

  return (
    <div className="card space-y-3">
      <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} /> Double authentification</h2>
      {user?.mfa_active ? (
        <p className="text-sm"><Badge tone="bg-success/15 text-success">Active</Badge> Un code de votre application est demandé à chaque connexion. Pour la réinitialiser, contactez un super administrateur.</p>
      ) : setup ? (
        <form onSubmit={enable} className="space-y-3">
          <p className="text-sm muted">Scannez ce QR code avec une application d'authentification (Google Authenticator, Aegis, Microsoft Authenticator…), puis saisissez le code affiché.</p>
          <img src={qr()} alt="QR code de configuration" className="mx-auto rounded-lg bg-white p-2" />
          <p className="break-all text-center font-mono text-xs muted">Clé manuelle : {setup.secret}</p>
          <input className="input text-center text-xl tracking-[0.4em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="Code" />
          <ErrorNote error={error} />
          <button className="btn-primary w-full" disabled={code.length !== 6}>Activer</button>
        </form>
      ) : (
        <>
          {user?.mfa_setup_required && <p className="rounded-xl bg-warn/10 p-3 text-sm">Obligatoire pour votre rôle : activez-la dès maintenant.</p>}
          <p className="text-sm muted">Protège votre compte même si votre mot de passe est découvert.</p>
          <button className="btn-primary" onClick={start}>Configurer</button>
        </>
      )}
    </div>
  );
}
