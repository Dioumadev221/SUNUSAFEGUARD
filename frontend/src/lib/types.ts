export type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization_id: number | null;
  dashboards: string[];
};

export type Source = { ref: number; document_id: number; title: string; source: string; section: string; score: number };

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
};

export type Bucket = { key: string; count: number | null; suppressed: boolean };
