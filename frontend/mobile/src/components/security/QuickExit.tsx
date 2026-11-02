import { Pressable, StyleSheet, Text } from "react-native";
import { quickExit } from "@/services/session.service";
import { fonts, radius, useColors } from "@/theme";
import { useLang } from "@/i18n";

/** Bouton « Sortir », en haut à droite de chaque écran, identique à celui du site. */
export default function QuickExit() {
  const c = useColors();
  const { tx } = useLang();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tx("Sortir rapidement", "Quick exit")}
      accessibilityHint={tx("Efface la conversation et ferme l'application", "Erases the conversation and closes the app")}
      hitSlop={8}
      onPress={() => void quickExit()}
      style={({ pressed }) => [styles.btn, { backgroundColor: c.alert, opacity: pressed ? 0.9 : 1 }]}
    >
      <Text style={styles.text}>{tx("Sortir", "Exit")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E11D48",
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  text: { color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 14 },
});
