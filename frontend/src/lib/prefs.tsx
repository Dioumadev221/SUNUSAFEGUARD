import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { t as translate, type Key, type Lang } from "./i18n";

export type Tx = (fr: string, en: string) => string;

type Prefs = {
  dark: boolean; toggleDark: () => void; lang: Lang; setLang: (l: Lang) => void;
  t: (k: Key) => string;
  /** Texte dans la langue du site : tx("Bonjour", "Hello"). */
  tx: Tx;
};
const Ctx = createContext<Prefs | null>(null);

const read = (k: string, d: string) => {
  try {
    return localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
};

export function PrefsProvider({ children }: { children: ReactNode }) {
  // Mode discret (sombre) : suit le réglage du téléphone, puis le choix de la personne — accessible en un clic (charte UI).
  const systemDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
  const [dark, setDark] = useState(read("ssg_discret", systemDark ? "1" : "0") === "1");
  // Langue d'affichage choisie par la personne (français par défaut), mémorisée sur l'appareil.
  const [lang, setLangState] = useState<Lang>(read("ssg_lang", "fr") === "en" ? "en" : "fr");

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("ssg_discret", dark ? "1" : "0"); } catch { /* stockage indisponible */ }
  }, [dark]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("ssg_lang", l); } catch { /* stockage indisponible */ }
  };

  return (
    <Ctx.Provider value={{ dark, toggleDark: () => setDark((d) => !d), lang, setLang, t: (k) => translate(k, lang), tx: (fr, en) => (lang === "en" ? en : fr) }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePrefs = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("PrefsProvider manquant");
  return c;
};
