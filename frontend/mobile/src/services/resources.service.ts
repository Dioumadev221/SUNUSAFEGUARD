import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import type { Organization } from "@/types";

/** Copie locale de l'annuaire public (données publiques, sans rien sur l'utilisatrice) pour la consulter hors connexion. */
export const DIRECTORY_CACHE_KEY = "ssg.directory.cache";

let offlineSince: string | null = null;

/** Date de la copie affichée quand le serveur ne répond pas, sinon null. */
export const directoryOfflineDate = () => offlineSince;

/** Annuaire public : le serveur ne renvoie que les structures validées. Hors connexion, dernière copie connue. */
export async function listOrganizations(): Promise<Organization[]> {
  try {
    const orgs = await api<Organization[]>("/directory", { timeoutMs: 15000 });
    offlineSince = null;
    try {
      await AsyncStorage.setItem(DIRECTORY_CACHE_KEY, JSON.stringify({ at: new Date().toISOString(), orgs }));
    } catch {
      /* stockage indisponible : on continue sans copie */
    }
    return orgs;
  } catch (e) {
    const raw = await AsyncStorage.getItem(DIRECTORY_CACHE_KEY).catch(() => null);
    if (!raw) throw e;
    const cached = JSON.parse(raw) as { at: string; orgs: Organization[] };
    offlineSince = cached.at;
    return cached.orgs;
  }
}

export async function clearDirectoryCache(): Promise<void> {
  offlineSince = null;
  await AsyncStorage.removeItem(DIRECTORY_CACHE_KEY).catch(() => undefined);
}
