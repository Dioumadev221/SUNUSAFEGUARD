import { useState } from "react";
import { TextInput, View } from "react-native";
import { router } from "expo-router";
import { LogOut, UserRound } from "lucide-react-native";
import Screen from "@/components/common/Screen";
import { Button, Card, Chip, Em, Eyebrow, Notice, T } from "@/components/common/ui";
import { login, logout, register } from "@/services/auth.service";
import { useSession } from "@/store/session";
import { fonts, radius, useColors } from "@/theme";

const ROLE_LABELS: Record<string, string> = {
  utilisateur: "Utilisateur",
  admin_operationnel: "Administrateur opérationnel",
  super_admin: "Super administrateur GREEN T",
};

/** Compte facultatif : inscription, connexion et déconnexion. */
export default function Account() {
  const c = useColors();
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
        <View style={{ gap: 12 }}><Eyebrow>Votre espace</Eyebrow><T variant="title">Mon <Em>compte</Em></T></View>
        <Card style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <UserRound color={c.accent} size={22} />
            <T style={{ fontFamily: fonts.bold, flex: 1 }} accessibilityLabel="Compte connecté">{account.name}</T>
          </View>
          <T variant="small">{account.email}</T>
          <T variant="muted">Profil : {ROLE_LABELS[account.role] ?? account.role}</T>
        </Card>
        <Button label="Mes demandes" onPress={() => router.push("/session")} />
        <Button kind="outline" label="Se déconnecter" icon={<LogOut color={c.accent} size={18} />} loading={busy}
          onPress={() => { setBusy(true); void logout().finally(() => setBusy(false)); }} />
        <T variant="muted" style={{ fontSize: 13 }}>
          Après déconnexion, la session est fermée sur le serveur : elle ne peut plus être réutilisée.
        </T>
      </Screen>
    );

  return (
    <Screen back nav={false}>
      <View style={{ gap: 12 }}><Eyebrow>Votre espace</Eyebrow><T variant="title">Mon <Em>compte</Em></T></View>
      <Notice tone="info">
        <T variant="small">
          Le compte est facultatif : l'assistant et l'annuaire marchent sans compte. Il sert à retrouver vos demandes d'orientation.
        </T>
      </Notice>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip label="Se connecter" active={mode === "login"} onPress={() => { setMode("login"); setError(null); }} />
        <Chip label="Créer un compte" active={mode === "register"} onPress={() => { setMode("register"); setError(null); }} />
      </View>
      <Card style={{ gap: 10 }}>
        {mode === "register" && (
          <TextInput value={name} onChangeText={setName} placeholder="Prénom ou pseudonyme (facultatif)" placeholderTextColor={c.muted}
            style={input} accessibilityLabel="Prénom ou pseudonyme" autoCapitalize="words" />
        )}
        <TextInput value={email} onChangeText={setEmail} placeholder="E-mail ou identifiant" placeholderTextColor={c.muted}
          style={input} accessibilityLabel="E-mail ou identifiant" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
        <TextInput value={password} onChangeText={setPassword} placeholder="Mot de passe" placeholderTextColor={c.muted}
          style={input} accessibilityLabel="Mot de passe" secureTextEntry />
        {mode === "register" && <T variant="muted" style={{ fontSize: 13 }}>12 caractères minimum, avec des lettres et des chiffres.</T>}
        {error && <Notice tone="warn"><T variant="small">{error}</T></Notice>}
        <Button label={mode === "register" ? "Créer mon compte" : "Se connecter"} loading={busy}
          disabled={!email.trim() || !password} onPress={() => void submit()} />
      </Card>
    </Screen>
  );
}
