import { Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { leaveStealth } from "@/services/session.service";
import { useLang } from "@/i18n";

/**
 * Après « Sortir » sur iPhone : iOS interdit à une application de se fermer seule.
 * L'écran devient entièrement noir, sans texte ni logo. Un toucher ramène à l'accueil,
 * avec une conversation vide (la navigation repart de zéro).
 */
export default function ExitScreen() {
  const { tx } = useLang();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tx("Revenir à l'accueil", "Back to home")}
      onPress={leaveStealth}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <StatusBar hidden />
    </Pressable>
  );
}
