import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import DashboardLayout from "@/components/DashboardLayout";
import { Loading } from "@/components/ui";
import Home from "@/pages/public/Home";
import Chat from "@/pages/public/Chat";
import Directory from "@/pages/public/Directory";
import Privacy from "@/pages/public/Privacy";
import Login from "@/pages/public/Login";
import { useAuth } from "@/lib/auth";

// Les dashboards (et recharts) ne sont chargés que pour les professionnels : page publique légère (faible débit).
const Impact = lazy(() => import("@/pages/dashboards/Impact"));
const Orientation = lazy(() => import("@/pages/dashboards/Orientation"));
const Ressources = lazy(() => import("@/pages/dashboards/Ressources"));
const Tech = lazy(() => import("@/pages/dashboards/Tech"));

function DashboardIndex() {
  const { user } = useAuth();
  return <Navigate to={user ? `/espace/${user.dashboards[0]}` : "/pro"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8"><Loading /></div>}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="chat" element={<Chat />} />
            <Route path="aide" element={<Directory />} />
            <Route path="confidentialite" element={<Privacy />} />
            <Route path="pro" element={<Login />} />
          </Route>
          <Route path="espace" element={<DashboardLayout />}>
            <Route index element={<DashboardIndex />} />
            <Route path="impact" element={<Impact />} />
            <Route path="orientation" element={<Orientation />} />
            <Route path="ressources" element={<Ressources />} />
            <Route path="tech" element={<Tech />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
