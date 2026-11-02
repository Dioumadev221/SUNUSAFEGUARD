// Traductions wolof PROVISOIRES : à faire valider par des spécialistes (CDC §9.4).
export type Lang = "fr" | "wo";

const dict = {
  quickExit: { fr: "Sortir", wo: "Génn gaaw" },
  quickExitHint: { fr: "Quitte immédiatement le site (touche Échap ×2)", wo: "Génn ci kaw gaaw (Échap ×2)" },
  navHome: { fr: "Accueil", wo: "Kër" },
  navChat: { fr: "Assistant", wo: "Waxtaan ak ndimbal bi" },
  navDirectory: { fr: "Trouver de l'aide", wo: "Gis ndimbal" },
  navPrivacy: { fr: "Confidentialité", wo: "Sutura" },
  navPro: { fr: "Espace professionnel", wo: "Bérab liggéeykat yi" },
  heroTitle: { fr: "Parlez en confiance. Trouvez de l'aide.", wo: "Xibaar yu wóor ak ndimbal, ci sutura." },
  heroText: {
    fr: "Bien-être, violences, droits, santé : faites-vous aider en toute discrétion. Sunu répond avec des informations vérifiées et vous oriente vers des personnes qui peuvent vous accompagner.",
    wo: "Laajal sa laaj ci sa xel, fitna yi, sa yoon walla wér-gi-yaram. Ndimbal bi dina la tontu ak téere yu wóor te won la bérab yi.",
  },
  startChat: { fr: "Parler à l'assistant", wo: "Tàmbali bind" },
  findHelp: { fr: "Trouver une structure", wo: "Xool annuaire bi" },
  limitsTitle: { fr: "Ce que l'assistant peut et ne peut pas faire", wo: "Li ndimbal bi mën ak li mu mënul" },
  inputPlaceholder: { fr: "Écrivez votre question…", wo: "Bindal sa laaj…" },
  send: { fr: "Envoyer", wo: "Yónnee" },
  clear: { fr: "Effacer la conversation", wo: "Far waxtaan bi" },
  sources: { fr: "Sources", wo: "Téere yi" },
  emergencyTitle: { fr: "En danger immédiat ?", wo: "Ndax yaa ngi ci musiba ?" },
  discreet: { fr: "Mode discret", wo: "Mode sutura" },
} as const;

export type Key = keyof typeof dict;
export const t = (key: Key, lang: Lang) => dict[key][lang] ?? dict[key].fr;
