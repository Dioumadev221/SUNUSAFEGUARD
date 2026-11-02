import { api, ApiError, setAuthToken } from "./api";
import { deleteItem, getItem, KEYS, setItem } from "./secure";
import { useSession, type Account } from "@/store/session";

/**
 * Compte facultatif : l'assistant et l'annuaire restent utilisables sans compte.
 * Avec un compte, les demandes d'orientation sont rattachées à la personne et
 * retrouvées sur un autre téléphone. Le jeton est conservé dans le stockage chiffré.
 */
type TokenResponse = { access_token: string; user: { full_name: string; email: string; role: string } };

export type ServerReferral = { code: string; organization: string; status: string; label: string; created_at: string };

async function accept(res: TokenResponse): Promise<Account> {
  const account = { name: res.user.full_name, email: res.user.email, role: res.user.role };
  setAuthToken(res.access_token);
  await setItem(KEYS.token, res.access_token);
  useSession.getState().setAccount(account);
  return account;
}

export async function register(email: string, password: string, name: string): Promise<Account> {
  return accept(await api<TokenResponse>("/auth/register", { json: { email, password, full_name: name } }));
}

export async function login(email: string, password: string): Promise<Account> {
  const res = await api<TokenResponse & { mfa_required?: boolean }>("/auth/login", { json: { email, password } });
  if (res.mfa_required) throw new ApiError(403, "Ce compte professionnel se connecte sur l'espace pro du site.");
  return accept(res);
}

/** Déconnexion : le serveur révoque le jeton, puis il est effacé du téléphone. */
export async function logout(): Promise<void> {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    /* hors ligne : le jeton local est effacé quand même */
  }
  setAuthToken(null);
  await deleteItem(KEYS.token);
  useSession.getState().setAccount(null);
}

/** Au démarrage : reprend la session si le jeton est encore valide (vérification sans bloquer l'ouverture). */
export async function restoreAccount(): Promise<void> {
  const token = await getItem(KEYS.token);
  if (!token) return;
  setAuthToken(token);
  api<{ full_name: string; email: string; role: string }>("/auth/me")
    .then((me) => useSession.getState().setAccount({ name: me.full_name, email: me.email, role: me.role }))
    .catch(async (e) => {
      if (e instanceof ApiError && e.status === 401) {
        setAuthToken(null);
        await deleteItem(KEYS.token);
      }
    });
}

export async function myReferrals(): Promise<ServerReferral[]> {
  return api<ServerReferral[]>("/referrals/mine");
}
