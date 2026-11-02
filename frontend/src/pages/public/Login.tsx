import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";
import { ErrorNote } from "@/components/ui";
import { usePrefs } from "@/lib/prefs";

export default function Login() {
  const { login, verifyMfa } = useAuth();
  const { tx } = usePrefs();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const enter = (user: User) =>
    nav(user.must_change_password || user.mfa_setup_required ? "/espace/compte" : `/espace/${user.dashboards[0] ?? "compte"}`);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await login(email, password);
      if ("mfaToken" in res) setMfaToken(res.mfaToken);
      else enter(res.user);
    });
  };

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    run(async () => enter(await verifyMfa(mfaToken!, code)));
  };

  if (mfaToken)
    return (
      <Shell>
        <form onSubmit={submitCode} className="space-y-5">
          <div className="pb-2 text-center"><h1 className="text-3xl">{tx("Double authentification", "Two-factor authentication")}</h1><p className="mt-2 text-sm muted">{tx("Saisissez le code à 6 chiffres de votre application d'authentification.", "Enter the 6-digit code from your authenticator app.")}</p></div>
          <input className="input text-center text-2xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus aria-label={tx("Code", "Code")} />
          <ErrorNote error={error} />
          <button className="btn-primary w-full" disabled={busy || code.length !== 6}>{tx("Valider", "Confirm")}</button>
          <button type="button" className="btn-ghost w-full" onClick={() => { setMfaToken(null); setCode(""); }}>{tx("Retour", "Back")}</button>
        </form>
      </Shell>
    );

  return (
    <Shell>
      <form onSubmit={submit} className="space-y-5">
        <div className="pb-2 text-center"><h1 className="text-4xl">{tx("Connexion", "Sign in")}</h1><p className="mt-2 text-sm muted">{tx("Connectez-vous à votre espace.", "Sign in to your area.")}</p></div>
        <div>
          <label className="label" htmlFor="email">{tx("Adresse e-mail", "Email address")}</label>
          <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="pwd">{tx("Mot de passe", "Password")}</label>
          <input id="pwd" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <ErrorNote error={error} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? tx("Connexion…", "Signing in…") : tx("Se connecter", "Sign in")}</button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
      <div className="w-full max-w-md rounded-5xl bg-white p-8 shadow-lift sm:p-12 dark:bg-night-850 dark:shadow-none">{children}</div>
    </div>
  );
}
