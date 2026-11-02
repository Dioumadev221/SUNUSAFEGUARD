import { useState } from "react";
import { TextInput, View } from "react-native";
import { router } from "expo-router";
import { LogOut, UserRound } from "lucide-react-native";
import Screen from "@/components/common/Screen";
import { Button, Card, Chip, Em, Eyebrow, Notice, T } from "@/components/common/ui";
import { login, logout, register } from "@/services/auth.service";
import { useSession } from "@/store/session";
import { useLang } from "@/i18n";
import { fonts, radius, useColors } from "@/theme";

const ROLE_LABELS_EN: Record<string, string> = {
  utilisateur: "User",
  admin_operationnel: "Operations administrator",
  super_admin: "GREEN T super administrator",
};

const ROLE_LABELS: Record<string, string> = {
  utilisateur: "Utilisateur",
  admin_operationnel: "Administrateur opérationnel",
  super_admin: "Super administrateur GREEN T",
};

/** Compte facultatif : inscription, connexion et déconnexion. */
export default function Account() {
  const c = useColors();
  const { lang, tx } = useLang();
  const account = useSession((s) => s.account);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input = {
    borderWidth: 1, borderColor: c.border, borderRadius: radius.sm, padding: 12,
    color: c.text, fontFamily: fonts.medium, fontSize: 16,
  } as const;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") await register(email.trim(), password, name.trim());
      else await login(email.trim(), password);
      setPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (account)
    return (
      <Screen back nav={false}>
        <View style={{ gap: 12 }}><Eyebrow>{tx("Votre espace", "Your space")}</Eyebrow><T variant="title">{lang === "en" ? <>My <Em>account</Em></> : <>Mon <Em>compte</Em></>}</T></View>
        <Card style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <UserRound color={c.accent} size={22} />
            <T style={{ fontFamily: fonts.bold, flex: 1 }} accessibilityLabel={tx("Compte connecté", "Signed-in account")}>{account.name}</T>
          </View>
          <T variant="small">{account.email}</T>
          <T variant="muted">{tx("Profil", "Profile")} : {(lang === "en" ? ROLE_LABELS_EN : ROLE_LABELS)[account.role] ?? account.role}</T>
        </Card>
        <Button label={tx("Mes demandes", "My requests")} onPress={() => router.push("/session")} />
        <Button kind="outline" label={tx("Se déconnecter", "Sign out")} icon={<LogOut color={c.accent} size={18} />} loading={busy}
          onPress={() => { setBusy(true); void logout().finally(() => setBusy(false)); }} />
        <T variant="muted" style={{ fontSize: 13 }}>
          {tx("Après déconnexion, la session est fermée sur le serveur : elle ne peut plus être réutilisée.", "After signing out, the session is closed on the server: it cannot be reused.")}
        </T>
      </Screen>
    );

  return (
    <Screen back nav={false}>
      <View style={{ gap: 12 }}><Eyebrow>{tx("Votre espace", "Your space")}</Eyebrow><T variant="title">{lang === "en" ? <>My <Em>account</Em></> : <>Mon <Em>compte</Em></>}</T></View>
      <Notice tone="info">
        <T variant="small">
          {tx("Le compte est facultatif : l'assistant et l'annuaire marchent sans compte. Il sert à retrouver vos demandes d'orientation.", "The account is optional: the assistant and the directory work without one. It lets you find your referral requests again.")}
        </T>
      </Notice>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip label={tx("Se connecter", "Sign in")} active={mode === "login"} onPress={() => { setMode("login"); setError(null); }} />
        <Chip label={tx("Créer un compte", "Create an account")} active={mode === "register"} onPress={() => { setMode("register"); setError(null); }} />
      </View>
      <Card style={{ gap: 10 }}>
        {mode === "register" && (
          <TextInput value={name} onChangeText={setName} placeholder={tx("Prénom ou pseudonyme (facultatif)", "First name or nickname (optional)")} placeholderTextColor={c.muted}
            style={input} accessibilityLabel={tx("Prénom ou pseudonyme", "First name or nickname")} autoCapitalize="words" />
        )}
        <TextInput value={email} onChangeText={setEmail} placeholder={tx("E-mail ou identifiant", "Email or username")} placeholderTextColor={c.muted}
          style={input} accessibilityLabel={tx("E-mail ou identifiant", "Email or username")} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
        <TextInput value={password} onChangeText={setPassword} placeholder={tx("Mot de passe", "Password")} placeholderTextColor={c.muted}
          style={input} accessibilityLabel={tx("Mot de passe", "Password")} secureTextEntry />
        {mode === "register" && <T variant="muted" style={{ fontSize: 13 }}>{tx("12 caractères minimum, avec des lettres et des chiffres.", "At least 12 characters, with letters and numbers.")}</T>}
        {error && <Notice tone="warn"><T variant="small">{error}</T></Notice>}
        <Button label={mode === "register" ? tx("Créer mon compte", "Create my account") : tx("Se connecter", "Sign in")} loading={busy}
          disabled={!email.trim() || !password} onPress={() => void submit()} />
      </Card>
    </Screen>
  );
}
