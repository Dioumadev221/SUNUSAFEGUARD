import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react-native";
import { api } from "@/services/api";
import type { EmergencyContact } from "@/types";
import { fonts, softShadow, useColors } from "@/theme";

/** Copie de data/seed/emergency_contacts.json, affichée tant que le serveur n'a pas répondu (hors connexion). */
const OFFLINE_CONTACTS: EmergencyContact[] = [
  { label: "Police secours", number: "17" },
  { label: "Sapeurs-pompiers", number: "18" },
  { label: "SAMU national", number: "1515" },
  { label: "Allô 116 — écoute et protection de l'enfance (Centre Ginddi)", number: "116" },
  { label: "AJS — assistance juridique gratuite (numéro vert)", number: "800 805 805" },
];

/**
 * Panneau d'urgence, identique au site (EmergencyPanel) : grands numéros à toucher pour appeler.
 * Rien n'est envoyé à qui que ce soit : l'utilisatrice choisit d'appeler ou non.
 */
export default function SafetyAlert({ note = "Appelez maintenant." }: { note?: string }) {
  const c = useColors();
  const { data } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: () => api<EmergencyContact[]>("/emergency-contacts"),
    staleTime: 24 * 3600 * 1000,
    placeholderData: OFFLINE_CONTACTS,
  });
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.panel,
        { backgroundColor: c.surface, borderColor: "rgba(225,29,72,0.15)" },
        !c.dark && softShadow,
      ]}
    >
      <View style={[styles.head, { backgroundColor: "rgba(225,29,72,0.06)" }]}>
        <View style={styles.bubble}>
          <Phone size={20} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: c.alert }]}>En danger immédiat ?</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted }}>
          {note} Touchez un numéro pour appeler.
        </Text>
      </View>
      {(data ?? []).map((ct, i) => (
        <Pressable
          key={ct.number}
          accessibilityRole="button"
          accessibilityLabel={`Appeler ${ct.label}, ${ct.number}`}
          onPress={() => void Linking.openURL(`tel:${ct.number}`)}
          style={({ pressed }) => [
            styles.row,
            { borderTopColor: c.border, borderTopWidth: i === 0 ? 0 : 1, backgroundColor: pressed ? c.alertSoft : "transparent" },
          ]}
        >
          <Text style={[styles.number, { color: c.text }]}>{ct.number}</Text>
          <Text style={[styles.label, { color: c.muted }]}>{ct.label}</Text>
          <View style={[styles.call, { backgroundColor: "rgba(225,29,72,0.1)" }]}>
            <Phone size={18} color={c.alert} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 32, borderWidth: 1, overflow: "hidden" },
  head: { padding: 22, gap: 10 },
  bubble: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Fraunces_600SemiBold", fontSize: 28, lineHeight: 33 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  number: { fontFamily: "Fraunces_600SemiBold", fontSize: 34, minWidth: 72 },
  label: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  call: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
