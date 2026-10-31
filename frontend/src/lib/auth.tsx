import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore } from "./api";
import type { User } from "./types";

type LoginResult = { user: User } | { mfaToken: string };
type TokenResponse = { access_token: string | null; user: User | null; mfa_required: boolean; mfa_token: string | null };

type Auth = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyMfa: (mfaToken: string, code: string) => Promise<User>;
  setUser: (u: User) => void;
  logout: () => void;
};
const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const accept = (res: TokenResponse) => {
    tokenStore.set(res.access_token!);
    setUser(res.user!);
    return res.user!;
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const res = await api<TokenResponse>("/auth/login", { method: "POST", json: { email, password } });
    if (res.mfa_required) return { mfaToken: res.mfa_token! };
    return { user: accept(res) };
  };

  const verifyMfa = async (mfaToken: string, code: string) =>
    accept(await api<TokenResponse>("/auth/mfa/verify", { method: "POST", json: { mfa_token: mfaToken, code } }));

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, verifyMfa, setUser, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("AuthProvider manquant");
  return c;
};
