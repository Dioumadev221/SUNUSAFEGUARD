import { View } from "react-native";
import { useColors } from "@/theme";

/** Ondes sonores à partir du niveau du micro (dB, de -60 à 0), pour montrer que l'audio est bien capté. */
export default function VoiceWaveform({ levels }: { levels: number[] }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, height: 40 }} accessibilityElementsHidden>
      {levels.map((db, i) => {
        const h = Math.max(4, Math.min(40, ((db + 60) / 60) * 40));
        return <View key={i} style={{ width: 4, height: h, borderRadius: 2, backgroundColor: c.accent, opacity: 0.4 + (h / 40) * 0.6 }} />;
      })}
    </View>
  );
}
