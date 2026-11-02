import { useState, type FormEvent } from "react";
import qrcode from "qrcode-generator";
import { KeyRound, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/DashboardLayout";
import { Badge, ErrorNote } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { clean, fmtDate, role } from "@/lib/labels";
import { usePrefs } from "@/lib/prefs";
import type { User } from "@/lib/types";

export default function Account() {
  const { user } = useAuth();
  const { tx, lang } = usePrefs();
  if (!user) return null;
  return (
    <>
      <PageHeader title={tx("Mon compte", "My account")} subtitle={`${clean(user.full_name)} · ${role(user.role, lang)} · ${tx("dernière connexion", "last sign-in")} ${fmtDate(user.last_login_at, lang)}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PasswordCard forced={user.must_change_password} />
        <MfaCard />
      </div>
    </>
  );
}

function PasswordCard({ forced }: { forced: boolean }) {
  const { setUser } = useAuth();
  const { tx } = usePrefs();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) return setError(tx("Les deux mots de passe ne correspondent pas.", "The two passwords do not match."));
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
      <h2 className="flex items-center gap-2 font-semibold"><KeyRound size={18} /> {tx("Mot de passe", "Password")}</h2>
      {forced && <p className="rounded-xl bg-warn/10 p-3 text-sm">{tx("Votre mot de passe est provisoire : choisissez-en un nouveau pour continuer.", "Your password is temporary: choose a new one to continue.")}</p>}
      <div><label className="label">{tx("Mot de passe actuel", "Current password")}</label><input type="password" className="input" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required /></div>
      <div><label className="label">{tx("Nouveau mot de passe (12 caractères, lettres et chiffres)", "New password (12 characters, letters and numbers)")}</label><input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required /></div>
      <div><label className="label">{tx("Confirmation", "Confirm")}</label><input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></div>
      <ErrorNote error={error} />
      {done && <p className="text-sm text-success">{tx("Mot de passe mis à jour.", "Password updated.")}</p>}
      <button className="btn-primary">{tx("Changer le mot de passe", "Change password")}</button>
    </form>
  );
}

function MfaCard() {
  const { user, setUser } = useAuth();
  const { tx } = usePrefs();
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
      <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} /> {tx("Double authentification", "Two-factor authentication")}</h2>
      {user?.mfa_active ? (
        <p className="text-sm"><Badge tone="bg-success/15 text-success">{tx("Active", "On")}</Badge> {tx("Un code de votre application est demandé à chaque connexion. Pour la réinitialiser, contactez un super administrateur.", "A code from your app is required at each sign-in. To reset it, contact a super administrator.")}</p>
      ) : setup ? (
        <form onSubmit={enable} className="space-y-3">
          <p className="text-sm muted">{tx("Scannez ce QR code avec une application d'authentification (Google Authenticator, Aegis, Microsoft Authenticator…), puis saisissez le code affiché.", "Scan this QR code with an authenticator app (Google Authenticator, Aegis, Microsoft Authenticator…), then enter the code shown.")}</p>
          <img src={qr()} alt={tx("QR code de configuration", "Setup QR code")} className="mx-auto rounded-lg bg-white p-2" />
          <p className="break-all text-center font-mono text-xs muted">{tx("Clé manuelle :", "Manual key:")} {setup.secret}</p>
          <input className="input text-center text-xl tracking-[0.4em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="Code" />
          <ErrorNote error={error} />
          <button className="btn-primary w-full" disabled={code.length !== 6}>{tx("Activer", "Turn on")}</button>
        </form>
      ) : (
        <>
          {user?.mfa_setup_required && <p className="rounded-xl bg-warn/10 p-3 text-sm">{tx("Obligatoire pour votre rôle : activez-la dès maintenant.", "Required for your role: turn it on now.")}</p>}
          <p className="text-sm muted">{tx("Protège votre compte même si votre mot de passe est découvert.", "Protects your account even if your password is discovered.")}</p>
          <button className="btn-primary" onClick={start}>{tx("Configurer", "Set up")}</button>
        </>
      )}
    </div>
  );
}
