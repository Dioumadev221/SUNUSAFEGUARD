import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { BarChart3, BookOpen, Cpu, LogOut, Network, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/labels";
import QuickExit from "./QuickExit";
import { Loading } from "./ui";

export const DASHBOARDS = {
  impact: { label: "Sunu Impact", sub: "Pilotage institutionnel", icon: BarChart3 },
  orientation: { label: "Sunu Orientation", sub: "Réseau humain", icon: Network },
  ressources: { label: "Sunu Ressources", sub: "Connaissances & RAG", icon: BookOpen },
  tech: { label: "Sunu Tech", sub: "Supervision technique", icon: Cpu },
} as const;

export default function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-8"><Loading /></div>;
  if (!user) return <Navigate to="/pro" replace />;
  const current = loc.pathname.split("/")[2];
  if (current && !user.dashboards.includes(current)) return <Navigate to={`/espace/${user.dashboards[0]}`} replace />;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-sand-200 bg-white p-4 md:w-64 md:border-b-0 md:border-r dark:border-night-700 dark:bg-night-800">
        <div className="mb-6 flex items-center gap-2 font-semibold"><ShieldCheck className="text-teal-light" /> SunuSafeguard</div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Dashboards">
          {user.dashboards.map((d) => {
            const meta = DASHBOARDS[d as keyof typeof DASHBOARDS];
            const Icon = meta.icon;
            return (
              <NavLink key={d} to={`/espace/${d}`} className={({ isActive }) => `flex min-w-max items-center gap-3 rounded-xl px-3 py-2 ${isActive ? "bg-teal text-white" : "hover:bg-sand-200 dark:hover:bg-night-700"}`}>
                <Icon size={18} />
                <span><span className="block text-sm font-medium">{meta.label}</span><span className="block text-xs opacity-75">{meta.sub}</span></span>
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-6 hidden border-t border-sand-200 pt-4 text-sm md:block dark:border-night-700">
          <p className="font-medium">{user.full_name}</p>
          <p className="text-xs muted">{ROLE_LABELS[user.role]}</p>
          <button onClick={logout} className="mt-3 flex items-center gap-2 text-sm muted hover:text-teal-light"><LogOut size={16} /> Se déconnecter</button>
        </div>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-end gap-2 border-b border-sand-200 px-6 py-3 dark:border-night-700">
          <button onClick={logout} className="btn-ghost text-sm md:hidden">Déconnexion</button>
          <QuickExit compact />
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="muted">{subtitle}</p>
    </div>
  );
}
