import { Languages } from "lucide-react";
import { LANGS, type Lang } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

/** Choix de la langue d'affichage (français ou anglais), mémorisé sur l'appareil. */
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const { t, lang, setLang } = usePrefs();
  return (
    <label className={`relative inline-flex h-10 shrink-0 items-center rounded-full border text-xs font-bold transition ${className}`}>
      <Languages size={15} className="pointer-events-none absolute left-2.5" aria-hidden />
      <span className="sr-only">{t("language")}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} title={t("language")}
        className="h-full cursor-pointer appearance-none rounded-full bg-transparent pl-8 pr-3 outline-none">
        {LANGS.map((l) => <option key={l.id} value={l.id} className="text-night">{l.short}</option>)}
      </select>
    </label>
  );
}
