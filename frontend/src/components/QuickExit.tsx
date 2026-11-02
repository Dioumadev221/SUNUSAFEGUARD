import { useEffect } from "react";
import { usePrefs } from "@/lib/prefs";

const NEUTRAL_URL = "https://www.google.com/";

/** Efface toute trace de session puis remplace la page (le bouton « retour » ne ramène pas ici). */
export function quickExit() {
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  document.body.innerHTML = "";
  document.title = "Google";
  window.location.replace(NEUTRAL_URL);
}

export default function QuickExit() {
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
      className="inline-flex h-10 shrink-0 items-center rounded-full bg-alert px-5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgb(225_29_72/0.7)] transition hover:-translate-y-px hover:bg-alert/90"
    >
      {t("quickExit")}
    </button>
  );
}
