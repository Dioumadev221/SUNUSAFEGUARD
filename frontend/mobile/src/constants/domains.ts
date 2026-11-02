import { HeartHandshake, House, LayoutGrid, Scale, ShieldAlert, Smartphone, Stethoscope, type LucideIcon } from "lucide-react-native";

/** Besoins et couleurs par domaine, repris de la page « Trouver de l'aide » du site (Directory.tsx). */
export const NEEDS: { id: string; label: string; en: string; icon: LucideIcon; domains: string[] }[] = [
  { id: "", label: "Tout", en: "All", icon: LayoutGrid, domains: [] },
  { id: "ecoute", label: "Écoute", en: "Listening", icon: HeartHandshake, domains: ["ecoute_psychosociale"] },
  { id: "violences", label: "Violences", en: "Violence", icon: ShieldAlert, domains: ["violences_physiques_verbales", "violences_economiques"] },
  { id: "droit", label: "Droits et justice", en: "Rights and justice", icon: Scale, domains: ["information_juridique"] },
  { id: "sante", label: "Santé", en: "Health", icon: Stethoscope, domains: ["sante_reproductive"] },
  { id: "hebergement", label: "Hébergement", en: "Shelter", icon: House, domains: ["hebergement_protection"] },
  { id: "numerique", label: "Harcèlement en ligne", en: "Online harassment", icon: Smartphone, domains: ["cyberharcelement"] },
];

/** Besoin correspondant à une catégorie renvoyée par le chat (pour « Être orientée »). */
export const needForDomain = (domain?: string) => NEEDS.find((n) => domain && n.domains.includes(domain))?.id ?? "";

type Tone = { icon: LucideIcon; bg: string; fg: string; bgDark: string; fgDark: string };

export const DOMAIN_STYLE: Record<string, Tone> = {
  ecoute_psychosociale: { icon: HeartHandshake, bg: "#D5F2EC", fg: "#0A5F56", bgDark: "rgba(14,124,112,0.15)", fgDark: "#4FD1BE" },
  violences_physiques_verbales: { icon: ShieldAlert, bg: "#EADCF2", fg: "#5B2E7A", bgDark: "rgba(91,46,122,0.25)", fgDark: "#D9B8EE" },
  violences_economiques: { icon: ShieldAlert, bg: "#EADCF2", fg: "#5B2E7A", bgDark: "rgba(91,46,122,0.25)", fgDark: "#D9B8EE" },
  information_juridique: { icon: Scale, bg: "#DDE5F3", fg: "#24427A", bgDark: "rgba(36,66,122,0.3)", fgDark: "#B7C9EE" },
  sante_reproductive: { icon: Stethoscope, bg: "#DCEBDD", fg: "#2F6235", bgDark: "rgba(47,98,53,0.3)", fgDark: "#B9DDBC" },
  hebergement_protection: { icon: House, bg: "#FBEBC9", fg: "#A86A17", bgDark: "rgba(217,144,46,0.15)", fgDark: "#F2C46D" },
  cyberharcelement: { icon: Smartphone, bg: "#F3E1D6", fg: "#8A4024", bgDark: "rgba(138,64,36,0.3)", fgDark: "#F0C3AB" },
};

export const domainStyle = (d?: string) => DOMAIN_STYLE[d ?? ""] ?? DOMAIN_STYLE.ecoute_psychosociale;
