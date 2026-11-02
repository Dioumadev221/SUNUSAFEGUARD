import { useEffect } from "react";
import { usePrefs } from "@/lib/prefs";

/**
 * Efface toute trace de session puis quitte le site : l'onglet se ferme quand le navigateur le permet,
 * sinon la page est remplacée par une page vide (le bouton « retour » ne ramène pas ici).
 * Aucun autre site ni aucune autre application ne s'ouvre.
 */
export function quickExit() {
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  document.body.innerHTML = "";
  document.title = "";
  window.close();
  window.location.replace("about:blank");
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
