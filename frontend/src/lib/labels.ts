export const CATEGORY_LABELS: Record<string, string> = {
  ecoute_psychosociale: "Écoute et information psychosociales",
  violences_physiques_verbales: "Violences physiques ou verbales",
  violences_economiques: "Violences économiques",
  cyberharcelement: "Cyberharcèlement et violences numériques",
  hebergement_protection: "Hébergement et protection",
  information_juridique: "Information juridique et droits",
  sante_reproductive: "Santé reproductive et bien-être",
  autre: "Autre / non classé",
};

// Version anglaise des besoins, pour l'affichage public quand le site est en anglais.
export const CATEGORY_LABELS_EN: Record<string, string> = {
  ecoute_psychosociale: "Psychosocial listening and information",
  violences_physiques_verbales: "Physical or verbal violence",
  violences_economiques: "Economic violence",
  cyberharcelement: "Cyberbullying and online violence",
  hebergement_protection: "Shelter and protection",
  information_juridique: "Legal information and rights",
  sante_reproductive: "Reproductive health and well-being",
  autre: "Other / unclassified",
};

export const AVAILABILITY: Record<string, { label: string; en: string; tone: string }> = {
  disponible: { label: "Disponible", en: "Available", tone: "bg-success/15 text-success" },
  capacite_limitee: { label: "Capacité limitée", en: "Limited capacity", tone: "bg-warn/15 text-warn" },
  sature: { label: "Saturé", en: "Full", tone: "bg-alert/15 text-alert" },
  information_non_actualisee: { label: "Information non actualisée", en: "Information not updated", tone: "bg-slate-500/15 text-slate-500" },
  non_communique: { label: "Non communiqué", en: "Not provided", tone: "bg-slate-500/15 text-slate-500" },
};

export const REFERRAL_STATUS: Record<string, string> = {
  brouillon: "Brouillon",
  en_attente_consentement: "En attente de consentement",
  transmise: "Transmise",
  recue: "Reçue",
  en_cours: "En cours de traitement",
  prise_en_charge_confirmee: "Prise en charge confirmée",
  non_prise_en_charge: "Non prise en charge",
  cloturee: "Clôturée",
  annulee: "Annulée",
};

export const DOC_STATUS: Record<string, string> = {
  importe: "Importé",
  en_traitement: "En traitement",
  a_verifier: "À vérifier",
  en_validation: "En validation",
  valide: "Validé",
  publie: "Publié",
  expire: "Expiré",
  archive: "Archivé",
  rejete: "Rejeté",
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrateur GREEN T",
  admin_operationnel: "Administrateur opérationnel",
  utilisateur: "Utilisateur",
  admin_technique: "Administrateur technique",
  responsable_institutionnel: "Responsable institutionnel",
  analyste: "Analyste",
  responsable_partenaire: "Responsable partenaire",
  travailleur_social: "Travailleur social",
  expert_documentaire: "Expert documentaire",
  expert_linguistique: "Expert linguistique",
};

export const REFERRAL_STATUS_EN: Record<string, string> = {
  brouillon: "Draft",
  en_attente_consentement: "Awaiting consent",
  transmise: "Sent",
  recue: "Received",
  en_cours: "In progress",
  prise_en_charge_confirmee: "Care confirmed",
  non_prise_en_charge: "Not taken on",
  cloturee: "Closed",
  annulee: "Cancelled",
};

export const DOC_STATUS_EN: Record<string, string> = {
  importe: "Imported",
  en_traitement: "Processing",
  a_verifier: "To review",
  en_validation: "Under validation",
  valide: "Validated",
  publie: "Published",
  expire: "Expired",
  archive: "Archived",
  rejete: "Rejected",
};

export const ROLE_LABELS_EN: Record<string, string> = {
  super_admin: "GREEN T super administrator",
  admin_operationnel: "Operations administrator",
  utilisateur: "User",
  admin_technique: "Technical administrator",
  responsable_institutionnel: "Institutional lead",
  analyste: "Analyst",
  responsable_partenaire: "Partner lead",
  travailleur_social: "Social worker",
  expert_documentaire: "Documentation expert",
  expert_linguistique: "Language expert",
};

type L = "fr" | "en";
export const role = (k: string, lang: L = "fr") => (lang === "en" ? ROLE_LABELS_EN[k] : ROLE_LABELS[k]) ?? k;
export const refStatus = (k: string, lang: L = "fr") => (lang === "en" ? REFERRAL_STATUS_EN[k] : REFERRAL_STATUS[k]) ?? k;
export const docStatus = (k: string, lang: L = "fr") => (lang === "en" ? DOC_STATUS_EN[k] : DOC_STATUS[k]) ?? k;
export const availability = (k: string, lang: L = "fr") => {
  const a = AVAILABILITY[k] ?? AVAILABILITY.non_communique;
  return lang === "en" ? a.en : a.label;
};

export const REGIONS = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga",
  "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor",
];

export const cat = (k: string, lang: "fr" | "en" = "fr") => (lang === "en" ? CATEGORY_LABELS_EN[k] : CATEGORY_LABELS[k]) ?? k;
// Retire à l'affichage les marqueurs « (DÉMO) » des données d'exemple, sans modifier la base.
export const clean = (s?: string | null) => (s ?? "").replace(/\s*\(d[ée]mo\)\s*/gi, " ").trim();
export const fmtDate = (d?: string | null, lang: L = "fr") =>
  (d ? new Date(d).toLocaleString(lang === "en" ? "en-GB" : "fr-SN", { dateStyle: "short", timeStyle: "short" }) : "—");
