/** Types alignés sur backend/app/schemas/__init__.py. */

export type Source = {
  ref: number;
  document_id: number;
  title: string | null;
  source: string | null;
  section: string | null;
  score: number;
};

export type ChatResponse = {
  answer: string;
  language: string;
  category: string;
  sources: Source[];
  grounded: boolean;
  show_emergency: boolean;
  suggest_directory: boolean;
  safety_action: string;
  disclaimer: string;
  generated: boolean;
};

export type Organization = {
  id: number;
  name: string;
  org_type: string;
  description: string;
  address: string;
  region: string;
  department: string;
  phone: string;
  email: string;
  domains: string[];
  publics: string[];
  services: string[];
  hours: string;
  access: string;
  capacity: number;
  availability: string;
  validated: boolean;
  last_verified_at: string | null;
  updated_at: string;
  /** La structure a un compte pour recevoir les demandes « Être rappelée ». */
  accepts_referrals: boolean;
};

export type EmergencyContact = { label: string; number: string };

export type ReferralCreated = { public_code: string; status: string; message: string };

export type ReferralStatus = { code: string; status: string; label: string };

/** Demande conservée sur le téléphone (carnet de session) : jamais de contenu sensible. */
export type StoredReferral = {
  code: string;
  createdAt: string;
  organization: string;
  status: string;
  label: string;
  checkedAt: string | null;
};

export type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; response: ChatResponse };
