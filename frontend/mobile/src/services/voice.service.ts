import * as Speech from "expo-speech";
import { Platform } from "react-native";
import { API_BASE, ApiError } from "./api";

/**
 * Lecture à voix haute avec la synthèse vocale du téléphone, en français uniquement.
 * Pas encore de voix wolof fiable et gratuite : rien n'est simulé.
 */
export function speak(text: string, handlers: { onStart?: () => void; onEnd?: () => void } = {}) {
  Speech.stop();
  handlers.onStart?.();
  Speech.speak(text, {
    language: "fr-FR",
    rate: 0.95,
    onDone: handlers.onEnd,
    onStopped: handlers.onEnd,
    onError: handlers.onEnd,
  });
}

export function stopSpeaking() {
  Speech.stop();
}

/** Texte lisible à l'oral : retire les marqueurs de citation « [1] » et le Markdown. */
export function forSpeech(text: string): string {
  return text
    .replace(/\[\d+\]/g, "")
    .replace(/[*_#>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Enregistrement en cours : la sortie rapide et le passage en arrière-plan doivent pouvoir le couper. ---
let activeStop: (() => void) | null = null;

export function registerRecording(stop: (() => void) | null) {
  activeStop = stop;
}

export function stopRecording() {
  activeStop?.();
  activeStop = null;
}

export type Transcription = { text: string; language: "fr" | "wo"; duration: number; seconds: number };

/** Envoie le message vocal au serveur (Whisper local) et renvoie le texte reconnu. */
export async function transcribe(uri: string, language: "fr" | "wo"): Promise<Transcription> {
  let res: Response;
  try {
    if (Platform.OS === "web") {
      const form = new FormData();
      form.append("language", language);
      form.append("audio", await (await fetch(uri)).blob(), "voix.webm");
      res = await fetch(`${API_BASE}/voice/transcribe`, { method: "POST", body: form });
    } else {
      // Sur téléphone, l'envoi de fichier en multipart échoue sur iOS : on lit le fichier et on l'envoie en base64.
      const { File } = await import("expo-file-system");
      const audio = await new File(uri).base64();
      res = await fetch(`${API_BASE}/voice/transcribe-base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio, language }),
      });
    }
  } catch (e) {
    // En développement, on affiche la cause exacte pour pouvoir diagnostiquer depuis le téléphone.
    const why = __DEV__ && e instanceof Error ? ` (${e.message})` : "";
    throw new ApiError(0, `Connexion impossible. Vérifiez votre réseau puis réessayez.${why}`);
  }
  if (!res.ok) {
    let detail = "La reconnaissance vocale n'a pas fonctionné. Réessayez ou écrivez votre question.";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
    } catch {
      /* corps non JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as Transcription;
}

/** Supprime le fichier audio temporaire du téléphone dès qu'il a été envoyé (CDC mobile §5.3). */
export async function deleteRecording(uri: string | null) {
  if (!uri || Platform.OS === "web") return;
  try {
    const { File } = await import("expo-file-system");
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    /* fichier déjà supprimé par le système */
  }
}
