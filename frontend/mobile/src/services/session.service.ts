import { BackHandler, Platform } from "react-native";
import { QueryClient } from "@tanstack/react-query";
import { useSession } from "@/store/session";
import { stopRecording, stopSpeaking } from "./voice.service";
import { deleteItem, KEYS } from "./secure";
import { clearDirectoryCache } from "./resources.service";
import { logout } from "./auth.service";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000, gcTime: 10 * 60_000 } },
});

/**
 * Sortie rapide (CDC mobile §3.5 A) : coupe la voix, efface la conversation de l'écran
 * et de la mémoire, vide le cache des requêtes, puis ferme l'application.
 * - Android : l'application se ferme vraiment.
 * - iOS ne permet pas à une application de se fermer seule : l'écran devient noir et vide,
 *   sans rien qui rappelle l'assistant ; un toucher ramène à l'accueil.
 * - Navigateur (aperçu) : la page est remplacée par une page vide.
 * Aucune autre application ne s'ouvre et rien n'est gardé pour la prochaine ouverture.
 */
export async function quickExit(): Promise<void> {
  stopSpeaking();
  stopRecording();
  const s = useSession.getState();
  s.clearConversation();
  queryClient.clear();
  if (Platform.OS === "android") {
    BackHandler.exitApp();
    return;
  }
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.replace("about:blank");
    return;
  }
  s.setStealth(true);
}

export function leaveStealth(): void {
  useSession.getState().setStealth(false);
}

/** Anciennes versions : la calculatrice restait active d'une ouverture à l'autre. On efface ce réglage. */
export async function clearLegacyStealth(): Promise<void> {
  await Promise.all([deleteItem(KEYS.stealth), deleteItem(KEYS.exitCode)]);
}

/**
 * « Effacer toute trace » (CDC mobile §3.4 C) : conversation, cache, codes de suivi
 * et préférences enregistrés sur ce téléphone. Ne supprime pas une demande déjà
 * transmise à une structure : celle-ci reste chez la structure.
 */
export async function panicWipe(): Promise<void> {
  if (useSession.getState().account) await logout();
  stopSpeaking();
  stopRecording();
  useSession.getState().clearConversation();
  useSession.getState().setAutoRead(false);
  useSession.getState().setThemeMode("dark");
  queryClient.clear();
  await Promise.all([...Object.values(KEYS).map((k) => deleteItem(k)), clearDirectoryCache()]);
}
