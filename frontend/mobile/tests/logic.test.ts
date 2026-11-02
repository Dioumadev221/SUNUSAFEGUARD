import { describe, expect, it } from "@jest/globals";
import { availabilityOf, clean } from "@/constants/labels";
import { needForDomain } from "@/constants/domains";
import { expired } from "@/services/referrals.service";
import { forSpeech } from "@/services/voice.service";
import type { StoredReferral } from "@/types";

const DAY = 24 * 3600 * 1000;

describe("Annuaire : disponibilité (CDC mobile §3.3 C)", () => {
  const recent = new Date(Date.now() - 2 * DAY).toISOString();
  const old = new Date(Date.now() - 10 * DAY).toISOString();
  it("affiche « Disponible » seulement si l'information est récente", () => {
    expect(availabilityOf("disponible", recent).label).toBe("Disponible");
    expect(availabilityOf("disponible", old).label).toBe("Disponibilité non confirmée");
    expect(availabilityOf("disponible", null).label).toBe("Disponibilité non confirmée");
  });
  it("garde la capacité limitée quand elle est récente", () => {
    expect(availabilityOf("capacite_limitee", recent).tone).toBe("limited");
  });
  it("retire les marqueurs de démonstration à l'affichage", () => {
    expect(clean("Centre d'écoute Jàmm (DÉMO)")).toBe("Centre d'écoute Jàmm");
  });
  it("relie une catégorie du chat au bon besoin", () => {
    expect(needForDomain("information_juridique")).toBe("droit");
    expect(needForDomain("violences_economiques")).toBe("violences");
    expect(needForDomain("autre")).toBe("");
  });
});

describe("Carnet de session : conservation locale (CDC mobile §3.4 C)", () => {
  const base: StoredReferral = { code: "SSG-1", createdAt: "", organization: "X", status: "transmise", label: "", checkedAt: null };
  const now = Date.now();
  it("garde une demande en cours", () => {
    expect(expired({ ...base, createdAt: new Date(now - 20 * DAY).toISOString() }, now)).toBe(false);
  });
  it("efface une demande close depuis plus de 30 jours", () => {
    const r = { ...base, status: "cloturee", createdAt: new Date(now - 60 * DAY).toISOString(), checkedAt: new Date(now - 31 * DAY).toISOString() };
    expect(expired(r, now)).toBe(true);
  });
  it("efface toute demande au bout de 180 jours", () => {
    expect(expired({ ...base, createdAt: new Date(now - 181 * DAY).toISOString() }, now)).toBe(true);
  });
});

describe("Lecture à voix haute", () => {
  it("retire les renvois [1] et le Markdown", () => {
    expect(forSpeech("Vous avez des **droits** [1]. Parlez-en [2].")).toBe("Vous avez des droits . Parlez-en .");
  });
});
