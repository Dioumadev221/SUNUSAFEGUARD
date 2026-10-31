import { Text, View } from "react-native";
import { availabilityOf } from "@/constants/labels";
import { fonts, palette } from "@/theme";

const TONES = {
  ok: { bg: "rgba(16,185,129,0.15)", fg: palette.success },
  limited: { bg: "rgba(245,158,11,0.15)", fg: palette.warn },
  full: { bg: "rgba(225,29,72,0.15)", fg: palette.alert },
  unknown: { bg: "rgba(110,102,90,0.15)", fg: palette.slate500 },
};

/** Pastille de disponibilité (style du site). Une information de plus de 7 jours n'est jamais présentée comme actuelle. */
export default function AvailabilityIndicator({ status, verifiedAt }: { status: string; verifiedAt: string | null }) {
  const a = availabilityOf(status, verifiedAt);
  const t = TONES[a.tone];
  return (
    <View
      accessibilityLabel={`Disponibilité : ${a.label}`}
      style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: t.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.fg }} />
      <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: t.fg }}>{a.label}</Text>
    </View>
  );
}
