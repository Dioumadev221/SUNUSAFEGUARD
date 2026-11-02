import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Lock, Moon, Sun } from "lucide-react";
import QuickExit from "./QuickExit";
import Logo from "./Logo";
import { usePrefs } from "@/lib/prefs";
import LanguageSwitch from "./LanguageSwitch";

export default function PublicLayout() {
  const { t, tx, dark, toggleDark } = usePrefs();
  const { pathname } = useLocation();
  const link = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-night text-sand-100 dark:bg-sand-100 dark:text-night" : "text-slate-600 hover:bg-night/[0.05] hover:text-night dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"}`;
  const isChat = pathname === "/chat";
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-night/[0.06] bg-sand/85 backdrop-blur-xl dark:border-white/[0.05] dark:bg-night-950/85">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-1.5 px-4 sm:gap-2 sm:px-6">
          <NavLink to="/" className="mr-auto shrink-0 rounded-xl" aria-label={t("navHome")}>
            <Logo size={34} compact />
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex" aria-label={tx("Navigation principale", "Main navigation")}>
            <NavLink to="/chat" className={link}>{t("navChat")}</NavLink>
            <NavLink to="/aide" className={link}>{t("navDirectory")}</NavLink>
          </nav>
          {/* Langue d'affichage du site ; le chat reste en français ou en wolof. */}
          <LanguageSwitch className="border-night/10 text-slate-600 hover:border-night/30 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/30" />
          <button onClick={toggleDark} aria-pressed={dark} title={t("discreet")}
            className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-full border border-night/10 px-2.5 text-xs font-bold lg:px-3 text-slate-600 transition hover:border-night/30 hover:text-night dark:border-white/10 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white">
            {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
            <span className="hidden lg:inline">{t("discreet")}</span>
            <span className="sr-only lg:hidden">{t("discreet")}</span>
          </button>
          <QuickExit />
        </div>
        <nav className="flex justify-center gap-1 pb-2 md:hidden" aria-label={tx("Navigation mobile", "Mobile navigation")}>
          <NavLink to="/chat" className={link}>{t("navChat")}</NavLink>
          <NavLink to="/aide" className={link}>{t("navDirectory")}</NavLink>
        </nav>
      </header>
      <main className={`mx-auto w-full flex-1 px-4 sm:px-6 ${isChat ? "max-w-3xl py-4" : isHome ? "max-w-6xl pb-16 sm:pb-24" : "max-w-6xl py-10 sm:py-14"}`}>
        <Outlet />
      </main>
      {!isChat && (
        <footer className="bg-night text-sand-100 dark:bg-night-900">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-8 pt-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo size={36} inverted />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-sand-100/65">
                {tx("Information fiable et orientation vers des personnes qui peuvent aider. Gratuit, anonyme, sans inscription.",
                  "Reliable information and referral to people who can help. Free, anonymous, no sign-up.")}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-ochre-light">{tx("Naviguer", "Navigate")}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-sand-100/80">
                <li><NavLink to="/chat" className="hover:text-white">{t("navChat")}</NavLink></li>
                <li><NavLink to="/aide" className="hover:text-white">{t("navDirectory")}</NavLink></li>
                <li><NavLink to="/confidentialite" className="hover:text-white">{t("navPrivacy")}</NavLink></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-ochre-light">{tx("Votre sécurité", "Your safety")}</p>
              <p className="mt-4 flex gap-2 text-sm leading-relaxed text-sand-100/80"><Lock size={15} className="mt-0.5 shrink-0" aria-hidden /> {tx(`Appuyez deux fois sur Échap ou sur « ${t("quickExit")} » pour quitter le site instantanément.`,
                `Press Esc twice or "${t("quickExit")}" to leave the site instantly.`)}</p>
            </div>
          </div>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 pb-8 pt-2 text-xs text-sand-100/50 sm:flex-row sm:px-6">
            <span>© SunuSafeguard · GREEN T SARL</span>
            <NavLink to="/pro" className="hover:text-sand-100">{t("navPro")}</NavLink>
          </div>
        </footer>
      )}
    </div>
  );
}
