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

export const AVAILABILITY: Record<string, { label: string; tone: string }> = {
  disponible: { label: "Disponible", tone: "bg-success/15 text-success" },
  capacite_limitee: { label: "Capacité limitée", tone: "bg-warn/15 text-warn" },
  sature: { label: "Saturé", tone: "bg-alert/15 text-alert" },
  information_non_actualisee: { label: "Information non actualisée", tone: "bg-slate-500/15 text-slate-500" },
  non_communique: { label: "Non communiqué", tone: "bg-slate-500/15 text-slate-500" },
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
  super_admin: "Super administrateur",
  admin_technique: "Administrateur technique",
  responsable_institutionnel: "Responsable institutionnel",
  analyste: "Analyste",
  responsable_partenaire: "Responsable partenaire",
  travailleur_social: "Travailleur social",
  expert_documentaire: "Expert documentaire",
  expert_linguistique: "Expert linguistique",
};

export const REGIONS = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga",
  "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor",
];

export const cat = (k: string) => CATEGORY_LABELS[k] ?? k;
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString("fr-SN", { dateStyle: "short", timeStyle: "short" }) : "—");
