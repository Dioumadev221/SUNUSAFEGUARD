/** Libellés repris de frontend/src/lib/labels.ts pour que le site et l'app parlent pareil. */

export const CATEGORY_LABELS: Record<string, string> = {
  ecoute_psychosociale: "Écoute et soutien",
  violences_physiques_verbales: "Violences physiques ou verbales",
  violences_economiques: "Violences économiques",
  cyberharcelement: "Cyberharcèlement",
  hebergement_protection: "Hébergement et protection",
  information_juridique: "Droits et justice",
  sante_reproductive: "Santé",
  autre: "Autre",
};

/** CDC mobile §3.3 C : seuls trois états sont montrés à l'utilisatrice. Un « Disponible » ancien
 * de plus de 7 jours redevient « Disponibilité non confirmée ». */
export type AvailabilityTone = "ok" | "limited" | "unknown" | "full";

export function availabilityOf(status: string, verifiedAt: string | null): { label: string; tone: AvailabilityTone } {
  const fresh = verifiedAt ? Date.now() - new Date(verifiedAt).getTime() < 7 * 24 * 3600 * 1000 : false;
  if (status === "disponible" && fresh) return { label: "Disponible", tone: "ok" };
  if (status === "capacite_limitee" && fresh) return { label: "Capacité limitée", tone: "limited" };
  if (status === "sature" && fresh) return { label: "Complet pour le moment", tone: "full" };
  return { label: "Disponibilité non confirmée", tone: "unknown" };
}

export const REGIONS = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga",
  "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor",
];

export const cat = (k: string) => CATEGORY_LABELS[k] ?? k;

/** Retire à l'affichage les marqueurs « (DÉMO) » des données d'exemple, comme le site. */
export const clean = (s?: string | null) => (s ?? "").replace(/\s*\(d[ée]mo\)\s*/gi, " ").trim();

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";
