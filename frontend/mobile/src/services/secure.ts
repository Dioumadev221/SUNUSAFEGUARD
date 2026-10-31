import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Stockage chiffré du téléphone (Keystore Android / Keychain iOS).
 * Dans un navigateur (aperçu de développement), repli en mémoire : rien n'est écrit sur le disque.
 */
const memory = new Map<string, string>();
const native = Platform.OS !== "web";

export const KEYS = {
  referrals: "ssg.referrals",
  exitCode: "ssg.exitCode",
  stealth: "ssg.stealth",
  autoRead: "ssg.autoRead",
  theme: "ssg.theme",
} as const;

export async function getItem(key: string): Promise<string | null> {
  return native ? SecureStore.getItemAsync(key) : memory.get(key) ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  if (native) await SecureStore.setItemAsync(key, value);
  else memory.set(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (native) await SecureStore.deleteItemAsync(key);
  else memory.delete(key);
}
