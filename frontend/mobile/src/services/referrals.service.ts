import { api } from "./api";
import { getItem, KEYS, setItem } from "./secure";
import type { ServerReferral } from "./auth.service";
import type { ReferralCreated, ReferralStatus, StoredReferral } from "@/types";

const CLOSED = new Set(["cloturee", "annulee", "non_prise_en_charge"]);
const DAY = 24 * 3600 * 1000;

/** Conservation locale (CDC mobile §3.4 C) : une demande close disparaît 30 jours après,
 * toute demande disparaît au bout de 180 jours. */
export function expired(r: StoredReferral, now = Date.now()): boolean {
  const age = now - new Date(r.createdAt).getTime();
  const sinceCheck = r.checkedAt ? now - new Date(r.checkedAt).getTime() : 0;
  return age > 180 * DAY || (CLOSED.has(r.status) && sinceCheck > 30 * DAY);
}

export async function loadReferrals(): Promise<StoredReferral[]> {
  const raw = await getItem(KEYS.referrals);
  if (!raw) return [];
  let list: StoredReferral[];
  try {
    list = JSON.parse(raw);
  } catch {
    return [];
  }
  const kept = list.filter((r) => !expired(r));
  if (kept.length !== list.length) await setItem(KEYS.referrals, JSON.stringify(kept));
  return kept;
}

async function saveReferrals(list: StoredReferral[]): Promise<void> {
  await setItem(KEYS.referrals, JSON.stringify(list));
}

export async function createReferral(input: {
  organizationId: number;
  organizationName: string;
  category: string;
  region: string;
  contact: string;
}): Promise<ReferralCreated> {
  const created = await api<ReferralCreated>("/referrals", {
    json: {
      organization_id: input.organizationId,
      category: input.category,
      region: input.region,
      consent: true,
      contact: input.contact,
    },
  });
  const list = await loadReferrals();
  list.unshift({
    code: created.public_code,
    createdAt: new Date().toISOString(),
    organization: input.organizationName,
    status: created.status,
    label: "Votre demande a été transmise à la structure.",
    checkedAt: new Date().toISOString(),
  });
  await saveReferrals(list);
  return created;
}

/** Statut réel lu sur le serveur (jamais déduit côté téléphone). */
export async function refreshReferral(code: string): Promise<StoredReferral[]> {
  const status = await api<ReferralStatus>(`/referrals/status/${encodeURIComponent(code)}`);
  const list = await loadReferrals();
  const next = list.map((r) =>
    r.code === code ? { ...r, status: status.status, label: status.label, checkedAt: new Date().toISOString() } : r,
  );
  await saveReferrals(next);
  return next;
}

/** Ajoute au carnet local les demandes du compte enregistrées sur le serveur (autre téléphone, réinstallation). */
export async function mergeServerReferrals(server: ServerReferral[]): Promise<StoredReferral[]> {
  const list = await loadReferrals();
  const known = new Set(list.map((r) => r.code));
  const now = new Date().toISOString();
  for (const r of server) {
    if (known.has(r.code)) continue;
    list.push({ code: r.code, createdAt: r.created_at, organization: r.organization, status: r.status, label: r.label, checkedAt: now });
  }
  await saveReferrals(list);
  return list;
}

export async function removeReferral(code: string): Promise<StoredReferral[]> {
  const next = (await loadReferrals()).filter((r) => r.code !== code);
  await saveReferrals(next);
  return next;
}
