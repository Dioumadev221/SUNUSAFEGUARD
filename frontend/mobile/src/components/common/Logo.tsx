import { useId } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";
import { fonts, useColors } from "@/theme";

const HEART =
  "M24 42c-.6 0-1.2-.2-1.7-.6C14.4 35.3 6.5 28.5 6.5 19.6 6.5 13.8 11 9.3 16.6 9.3c3.1 0 5.8 1.4 7.4 3.7 1.6-2.3 4.3-3.7 7.4-3.7 5.6 0 10.1 4.5 10.1 10.3 0 8.9-7.9 15.7-15.8 21.8-.5.4-1.1.6-1.7.6Z";

/** Même cœur que le site (frontend/src/components/Logo.tsx) : le soleil se lève sur la mer. */
export function LogoMark({ size = 32 }: { size?: number }) {
  const id = "h" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id={`${id}c`}>
          <Path d={HEART} />
        </ClipPath>
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#13897B" />
          <Stop offset="1" stopColor="#0A5F56" />
        </LinearGradient>
      </Defs>
      <Path d={HEART} fill={`url(#${id}g)`} />
      <G clipPath={`url(#${id}c)`}>
        <Circle cx="24" cy="29" r="8" fill="#F2C46D" />
        <Circle cx="24" cy="29" r="4.8" fill="#D9902E" />
        <Path d="M0 30.5c5-2.6 9-2.6 13.5 0s9 2.6 13.5 0 9-2.6 13.5 0 6 2 8 1V48H0Z" fill="#0C1B24" />
        <Path
          d="M0 35.5c5-2.4 9-2.4 13.5 0s9 2.4 13.5 0 9-2.4 13.5 0 6 1.8 8 .9"
          fill="none"
          stroke="#4FD1BE"
          strokeOpacity={0.55}
          strokeWidth={1.4}
        />
      </G>
    </Svg>
  );
}

/** Sur petit écran, le site n'affiche que « Sunu » (Logo compact). */
export default function Logo({ size = 34, compact = true }: { size?: number; compact?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }} accessibilityRole="header" accessibilityLabel="SunuSafeguard">
      <LogoMark size={size} />
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.text, letterSpacing: -0.3 }}>Sunu</Text>
        {!compact && <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: c.accent }}>Safeguard</Text>}
      </View>
    </View>
  );
}
