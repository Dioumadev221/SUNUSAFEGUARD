import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ErrorNote } from "@/components/ui";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email, password);
      nav(`/espace/${user.dashboards[0] ?? ""}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold"><Lock className="text-teal-light" /> Espace professionnel</h1>
        <p className="text-sm muted">Réservé aux comptes habilités (institutions, structures partenaires, experts, équipe technique).</p>
        <div>
          <label className="label" htmlFor="email">Adresse e-mail</label>
          <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="pwd">Mot de passe</label>
          <input id="pwd" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <ErrorNote error={error} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button>
        {import.meta.env.DEV && (
          <p className="text-xs muted">Démo : superadmin@sunusafeguard.local / SunuDemo2026! (voir README pour les autres rôles)</p>
        )}
      </form>
    </div>
  );
}
