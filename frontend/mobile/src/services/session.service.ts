import { QueryClient } from "@tanstack/react-query";
import { useSession } from "@/store/session";
import { stopRecording, stopSpeaking } from "./voice.service";
import { deleteItem, getItem, KEYS, setItem } from "./secure";
import { clearDirectoryCache } from "./resources.service";
import { logout } from "./auth.service";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000, gcTime: 10 * 60_000 } },
});

export const DEFAULT_EXIT_CODE = "1234";

export async function getExitCode(): Promise<string> {
  return (await getItem(KEYS.exitCode)) ?? DEFAULT_EXIT_CODE;
}

export async function setExitCode(code: string): Promise<void> {
  await setItem(KEYS.exitCode, code);
}

/**
 * Sortie rapide (CDC mobile §3.5 A) : coupe la voix, efface la conversation de l'écran
 * et de la mémoire, vide le cache des requêtes, puis affiche la calculatrice.
 * Le mode reste actif si l'app est fermée et rouverte.
 */
export async function quickExit(): Promise<void> {
  stopSpeaking();
  stopRecording();
  const s = useSession.getState();
  s.clearConversation();
  s.setStealth(true);
  queryClient.clear();
  await setItem(KEYS.stealth, "1");
}

export async function leaveStealth(): Promise<void> {
  await deleteItem(KEYS.stealth);
  useSession.getState().setStealth(false);
}

export async function restoreStealth(): Promise<void> {
  if ((await getItem(KEYS.stealth)) === "1") useSession.getState().setStealth(true);
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
