import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { usePrefs } from "@/lib/prefs";

const NEUTRAL_URL = "https://www.google.com/search?q=m%C3%A9t%C3%A9o+dakar";

/** Efface toute trace de session puis remplace la page (le bouton « retour » ne ramène pas ici). */
export function quickExit() {
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  document.body.innerHTML = "";
  document.title = "Météo";
  window.location.replace(NEUTRAL_URL);
}

export default function QuickExit({ compact = false }: { compact?: boolean }) {
  const { t } = usePrefs();

  useEffect(() => {
    // Raccourci clavier : deux appuis sur Échap en moins d'une seconde.
    let last = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const now = Date.now();
      if (now - last < 1000) quickExit();
      last = now;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <button
      onClick={quickExit}
      title={t("quickExitHint")}
      aria-label={t("quickExitHint")}
      className="btn min-h-[40px] bg-alert px-3 text-sm font-semibold text-white shadow-lg hover:bg-alert/90"
    >
      <LogOut size={16} aria-hidden />
      {!compact && t("quickExit")}
    </button>
  );
}
