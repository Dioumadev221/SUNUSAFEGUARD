import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Adresse de l'API SunuSafeguard.
 * 1. EXPO_PUBLIC_API_URL si définie (ex. https://api.sunusafeguard.sn/api en production) ;
 * 2. sinon, en développement avec Expo Go : le PC qui sert l'app (même IP que Metro),
 *    port EXPO_PUBLIC_API_PORT (8001 avec scripts/dev-mobile.ps1, 8000 par défaut) ;
 * 3. sinon, dans un navigateur : localhost.
 */
function resolveBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const port = process.env.EXPO_PUBLIC_API_PORT ?? "8000";
  const hostUri = Constants.expoConfig?.hostUri; // ex. « 192.168.1.20:8081 »
  if (hostUri && Platform.OS !== "web") return `http://${hostUri.split(":")[0]}:${port}/api`;
  // Navigateur : même machine que la page (localhost sur le PC, IP du PC depuis un téléphone).
  const host = (typeof window !== "undefined" && window.location?.hostname) || "localhost";
  return `http://${host}:${port}/api`;
}

export const API_BASE = resolveBase();

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Requête JSON. Aucun texte de conversation n'est journalisé côté application. */
export async function api<T>(path: string, options: { method?: string; json?: unknown; timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? (options.json !== undefined ? "POST" : "GET"),
      headers: options.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, "Connexion impossible. Vérifiez votre réseau puis réessayez.");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let detail = "Le service n'a pas pu répondre. Réessayez dans un instant.";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
    } catch {
      /* corps non JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}
