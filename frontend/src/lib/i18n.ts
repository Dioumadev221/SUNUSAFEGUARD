// Langue d'affichage du site. Le chat, lui, se fait en français ou en wolof quelle que soit cette langue.
export type Lang = "fr" | "en";
export const LANGS: { id: Lang; short: string; name: string }[] = [
  { id: "fr", short: "FR", name: "Français" },
  { id: "en", short: "EN", name: "English" },
];

const dict = {
  quickExit: { fr: "Sortir", en: "Exit" },
  quickExitHint: { fr: "Quitte immédiatement le site (touche Échap ×2)", en: "Leave the site immediately (press Esc twice)" },
  navHome: { fr: "Accueil", en: "Home" },
  navChat: { fr: "Assistant", en: "Assistant" },
  navDirectory: { fr: "Trouver de l'aide", en: "Find help" },
  navPrivacy: { fr: "Confidentialité", en: "Privacy" },
  navPro: { fr: "Espace professionnel", en: "Professional area" },
  heroTitle: { fr: "Parlez en confiance. Trouvez de l'aide.", en: "Speak in confidence. Find help." },
  heroText: {
    fr: "Bien-être, violences, droits, santé : faites-vous aider en toute discrétion. Sunu répond avec des informations vérifiées et vous oriente vers des personnes qui peuvent vous accompagner.",
    en: "Well-being, violence, rights, health: get help discreetly. Sunu answers with verified information and points you to people who can support you.",
  },
  startChat: { fr: "Parler à l'assistant", en: "Talk to the assistant" },
  findHelp: { fr: "Trouver une structure", en: "Find an organization" },
  inputPlaceholder: { fr: "Écrivez votre question…", en: "Write your question…" },
  send: { fr: "Envoyer", en: "Send" },
  clear: { fr: "Effacer la conversation", en: "Clear the conversation" },
  sources: { fr: "Sources", en: "Sources" },
  emergencyTitle: { fr: "En danger immédiat ?", en: "In immediate danger?" },
  discreet: { fr: "Mode discret", en: "Discreet mode" },
  language: { fr: "Langue du site", en: "Site language" },
} as const;

export type Key = keyof typeof dict;
export const t = (key: Key, lang: Lang) => dict[key][lang] ?? dict[key].fr;
