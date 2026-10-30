import { NavLink, Outlet } from "react-router-dom";
import { Moon, ShieldCheck, Sun } from "lucide-react";
import QuickExit from "./QuickExit";
import { usePrefs } from "@/lib/prefs";

export default function PublicLayout() {
  const { t, dark, toggleDark, lang, setLang } = usePrefs();
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-teal/15 text-teal-light" : "hover:bg-sand-200 dark:hover:bg-night-800"}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-sand/90 backdrop-blur dark:border-night-800 dark:bg-night/90">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <NavLink to="/" className="mr-auto flex items-center gap-2 font-semibold">
            <ShieldCheck className="text-teal-light" aria-hidden /> <span>Sunu</span>
          </NavLink>
          <nav className="hidden gap-1 md:flex" aria-label="Navigation principale">
            <NavLink to="/" end className={link}>{t("navHome")}</NavLink>
            <NavLink to="/chat" className={link}>{t("navChat")}</NavLink>
            <NavLink to="/aide" className={link}>{t("navDirectory")}</NavLink>
            <NavLink to="/confidentialite" className={link}>{t("navPrivacy")}</NavLink>
          </nav>
          <select
            aria-label="Langue"
            value={lang}
            onChange={(e) => setLang(e.target.value as "fr" | "wo")}
            className="rounded-lg border border-sand-200 bg-transparent px-2 py-1.5 text-sm dark:border-night-700"
          >
            <option value="fr">FR</option>
            <option value="wo">WO</option>
          </select>
          <button onClick={toggleDark} className="rounded-lg p-2 hover:bg-sand-200 dark:hover:bg-night-800" aria-label={t("discreet")} title={t("discreet")}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <QuickExit />
        </div>
        <nav className="flex justify-around border-t border-sand-200 py-1 md:hidden dark:border-night-800" aria-label="Navigation mobile">
          <NavLink to="/" end className={link}>{t("navHome")}</NavLink>
          <NavLink to="/chat" className={link}>Chat</NavLink>
          <NavLink to="/aide" className={link}>{t("navDirectory")}</NavLink>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-sand-200 py-6 text-center text-xs muted dark:border-night-800">
        <p>SunuSafeguard AI · GREEN T SARL · Prototype de démonstration — ne remplace pas un·e professionnel·le.</p>
        <p className="mt-1">
          <NavLink to="/confidentialite" className="underline">{t("navPrivacy")}</NavLink> ·{" "}
          <NavLink to="/pro" className="underline">{t("navPro")}</NavLink>
        </p>
      </footer>
    </div>
  );
}
