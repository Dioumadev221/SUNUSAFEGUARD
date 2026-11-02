import { useCallback } from "react";
import { useSession, type Lang } from "@/store/session";

/** Texte en français ou en anglais selon la langue choisie (bouton FR / EN en haut de l'écran). */
export type Tx = (fr: string, en: string) => string;

export function useLang(): { lang: Lang; tx: Tx } {
  const lang = useSession((s) => s.lang);
  const tx = useCallback<Tx>((fr, en) => (lang === "en" ? en : fr), [lang]);
  return { lang, tx };
}

/** Pour le code hors composant (services). */
export const txNow: Tx = (fr, en) => (useSession.getState().lang === "en" ? en : fr);

export const locale = (lang: Lang) => (lang === "en" ? "en-GB" : "fr-FR");
