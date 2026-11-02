import { create } from "zustand";
import type { Message } from "@/types";

/**
 * État de la session active, en mémoire uniquement (CDC mobile §3.1 D) :
 * la conversation disparaît à la fermeture de l'app, à la sortie rapide et à l'effacement.
 */
type ThemeMode = "auto" | "dark" | "light";

export type Account = { name: string; email: string; role: string };

type SessionState = {
  account: Account | null;
  setAccount: (a: Account | null) => void;
  messages: Message[];
  draft: string;
  stealth: boolean;
  speakingId: string | null;
  autoRead: boolean;
  themeMode: ThemeMode;
  voiceLang: "fr" | "wo";
  setVoiceLang: (lang: "fr" | "wo") => void;
  addMessage: (m: Message) => void;
  clearConversation: () => void;
  setDraft: (text: string) => void;
  setStealth: (on: boolean) => void;
  setSpeaking: (id: string | null) => void;
  setAutoRead: (on: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
};

export const useSession = create<SessionState>((set) => ({
  account: null,
  setAccount: (a) => set({ account: a }),
  messages: [],
  draft: "",
  stealth: false,
  speakingId: null,
  autoRead: false,
  themeMode: "dark", // choix de Diouma : le thème sombre par défaut
  voiceLang: "fr",
  setVoiceLang: (lang) => set({ voiceLang: lang }),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  clearConversation: () => set({ messages: [], draft: "", speakingId: null }),
  setDraft: (text) => set({ draft: text }),
  setStealth: (on) => set({ stealth: on }),
  setSpeaking: (id) => set({ speakingId: id }),
  setAutoRead: (on) => set({ autoRead: on }),
  setThemeMode: (mode) => set({ themeMode: mode }),
}));
