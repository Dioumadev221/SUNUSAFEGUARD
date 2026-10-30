// Traductions wolof PROVISOIRES : à faire valider par des spécialistes (CDC §9.4).
export type Lang = "fr" | "wo";

const dict = {
  quickExit: { fr: "Sortie rapide", wo: "Génn gaaw" },
  quickExitHint: { fr: "Quitte immédiatement le site (touche Échap ×2)", wo: "Génn ci kaw gaaw (Échap ×2)" },
  navHome: { fr: "Accueil", wo: "Kër" },
  navChat: { fr: "Parler à l'assistant", wo: "Waxtaan ak ndimbal bi" },
  navDirectory: { fr: "Trouver de l'aide", wo: "Gis ndimbal" },
  navPrivacy: { fr: "Confidentialité", wo: "Sutura" },
  navPro: { fr: "Espace professionnel", wo: "Bérab liggéeykat yi" },
  heroTitle: { fr: "Des informations fiables et une orientation, en toute discrétion.", wo: "Xibaar yu wóor ak ndimbal, ci sutura." },
  heroText: {
    fr: "Posez vos questions sur le bien-être, les violences, vos droits ou la santé. L'assistant vous répond à partir de ressources validées et vous oriente vers des structures humaines.",
    wo: "Laajal sa laaj ci sa xel, fitna yi, sa yoon walla wér-gi-yaram. Ndimbal bi dina la tontu ak téere yu wóor te won la bérab yi.",
  },
  startChat: { fr: "Commencer à écrire", wo: "Tàmbali bind" },
  findHelp: { fr: "Voir l'annuaire", wo: "Xool annuaire bi" },
  limitsTitle: { fr: "Ce que l'assistant peut et ne peut pas faire", wo: "Li ndimbal bi mën ak li mu mënul" },
  inputPlaceholder: { fr: "Écrivez votre question…", wo: "Bindal sa laaj…" },
  send: { fr: "Envoyer", wo: "Yónnee" },
  clear: { fr: "Effacer la conversation", wo: "Far waxtaan bi" },
  sources: { fr: "Sources", wo: "Téere yi" },
  emergencyTitle: { fr: "En danger immédiat ? Appelez :", wo: "Ndax yaa ngi ci musiba ? Woolal :" },
  discreet: { fr: "Mode discret", wo: "Mode sutura" },
} as const;

export type Key = keyof typeof dict;
export const t = (key: Key, lang: Lang) => dict[key][lang] ?? dict[key].fr;
