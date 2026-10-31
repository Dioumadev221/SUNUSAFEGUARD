import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { BarChart3, BookOpen, Cpu, LogOut, Network, ShieldAlert, UserCog } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { clean, ROLE_LABELS } from "@/lib/labels";
import Logo from "./Logo";
import { Loading } from "./ui";

export const DASHBOARDS = {
  impact: { label: "Impact", sub: "Pilotage institutionnel", icon: BarChart3 },
  orientation: { label: "Orientation", sub: "Réseau humain", icon: Network },
  ressources: { label: "Ressources", sub: "Connaissances & RAG", icon: BookOpen },
  tech: { label: "Tech", sub: "Supervision technique", icon: Cpu },
} as const;

const item = ({ isActive }: { isActive: boolean }) =>
  `flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive
    ? "bg-sand-100 text-night shadow-[inset_3px_0_0_#D9902E]"
    : "text-sand-100/60 hover:bg-white/[0.06] hover:text-sand-100"}`;

export default function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-8"><Loading /></div>;
  if (!user) return <Navigate to="/pro" replace />;
  const current = loc.pathname.split("/")[2];
  if (user.must_change_password && current !== "compte") return <Navigate to="/espace/compte" replace />;
  if (current && current !== "compte" && !user.dashboards.includes(current)) return <Navigate to={`/espace/${user.dashboards[0]}`} replace />;
  const initials = clean(user.full_name).split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="weave-texture relative flex flex-col gap-4 bg-night px-4 py-4 text-sand-100 md:sticky md:top-0 md:h-screen md:w-64 md:py-7 dark:bg-night-900">
        <div className="flex items-center justify-between px-2 md:mb-6">
          <Logo size={32} sub="Espace pro" inverted />
          <button onClick={logout} className="btn h-9 min-h-0 px-3 text-sand-100/70 hover:bg-white/10 md:hidden" aria-label="Se déconnecter"><LogOut size={16} /></button>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Tableaux de bord">
          {user.dashboards.map((d) => {
            const meta = DASHBOARDS[d as keyof typeof DASHBOARDS];
            const Icon = meta.icon;
            return <NavLink key={d} to={`/espace/${d}`} className={item} title={meta.sub}><Icon size={18} strokeWidth={1.8} /> {meta.label}</NavLink>;
          })}
          <NavLink to="/espace/compte" className={item}><UserCog size={18} strokeWidth={1.8} /> Mon compte</NavLink>
        </nav>
        <div className="mt-auto hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:flex">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ochre-light font-display text-sm font-semibold text-night">{initials}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{clean(user.full_name)}</span>
            <span className="block truncate text-xs text-sand-100/50">{ROLE_LABELS[user.role]}</span>
          </span>
          <button onClick={logout} className="rounded-lg p-1.5 text-sand-100/50 hover:bg-white/10 hover:text-white" aria-label="Se déconnecter" title="Se déconnecter"><LogOut size={16} /></button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">
          {user.mfa_setup_required && current !== "compte" && (
            <NavLink to="/espace/compte" className="mb-6 flex items-center gap-2 rounded-2xl bg-warn/10 px-4 py-2.5 text-sm text-warn">
              <ShieldAlert size={16} /> Activez la double authentification pour sécuriser votre compte <span className="ml-auto font-semibold">Activer →</span>
            </NavLink>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl sm:text-5xl">{title.replace(/^Sunu\s+/, "")}</h1>
      <p className="mt-2 max-w-2xl muted">{subtitle}</p>
    </div>
  );
}
