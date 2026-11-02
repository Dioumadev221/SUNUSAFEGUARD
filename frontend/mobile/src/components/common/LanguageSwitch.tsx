import { Pressable, StyleSheet, Text } from "react-native";
import { Languages } from "lucide-react-native";
import { useSession } from "@/store/session";
import { setItem, KEYS } from "@/services/secure";
import { fonts, radius, useColors } from "@/theme";

/** Bouton FR / EN, comme sur le site : un toucher passe à l'autre langue, mémorisée sur le téléphone. */
export default function LanguageSwitch() {
  const c = useColors();
  const lang = useSession((s) => s.lang);
  const setLang = useSession((s) => s.setLang);
  const next = lang === "fr" ? "en" : "fr";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lang === "fr" ? "Langue : français. Passer en anglais" : "Language: English. Switch to French"}
      hitSlop={6}
      onPress={() => {
        setLang(next);
        void setItem(KEYS.lang, next);
      }}
      style={[styles.btn, { borderColor: c.dark ? "rgba(255,255,255,0.1)" : "rgba(12,27,36,0.1)" }]}
    >
      <Languages size={15} color={c.muted} />
      <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: c.muted }}>{lang.toUpperCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 40, borderRadius: radius.pill, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11 },
});
