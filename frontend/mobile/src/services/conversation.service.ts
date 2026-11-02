import { api } from "./api";
import type { ChatResponse } from "@/types";

/** Question écrite envoyée au chat existant. Le serveur ne stocke ni ne journalise le message. */
export function ask(message: string): Promise<ChatResponse> {
  return api<ChatResponse>("/chat", { json: { message, channel: "mobile" }, timeoutMs: 120000 });
}
