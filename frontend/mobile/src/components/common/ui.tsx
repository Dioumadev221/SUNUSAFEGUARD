import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { fonts, radius, softShadow, useColors } from "@/theme";

/** Équivalents des classes du site (frontend/src/index.css) : .display, .muted, .eyebrow, .card, .btn-*. */

type Variant = "body" | "small" | "muted" | "title" | "heading" | "caption";

export function T({ variant = "body", style, ...rest }: TextProps & { variant?: Variant }) {
  const c = useColors();
  const base: TextStyle = {
    body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: c.text },
    small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.text },
    muted: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: c.muted },
    caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: c.muted },
    title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, color: c.text, letterSpacing: -0.6 },
    heading: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31, color: c.text, letterSpacing: -0.3 },
  }[variant];
  return <Text {...rest} style={[base, style]} />;
}

/** Mot en italique sarcelle dans les titres (« je vous écoute. », « l'aide »), souligné à l'ocre si `scribble`. */
export function Em({ children, scribble }: { children: ReactNode; scribble?: boolean }) {
  const c = useColors();
  return (
    <Text
      style={{
        fontFamily: fonts.displayItalic,
        color: c.accent,
        textDecorationLine: scribble ? "underline" : "none",
        textDecorationColor: c.ochre,
      }}
    >
      {children}
    </Text>
  );
}

/** Sur-titre : trait ocre + capitales sarcelle (classe .eyebrow du site). */
export function Eyebrow({ children }: { children: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: 24, height: 1, backgroundColor: c.ochre }} />
      <Text style={{ fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2.2, color: c.accent, textTransform: "uppercase" }}>{children}</Text>
    </View>
  );
}

type ButtonKind = "primary" | "outline" | "ink" | "ghost" | "danger" | "soft";

export function Button({
  label,
  onPress,
  kind = "primary",
  icon,
  iconRight,
  disabled,
  loading,
  style,
  big,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  big?: boolean;
  accessibilityHint?: string;
}) {
  const c = useColors();
  const p = {
    primary: { bg: c.accent, fg: c.accentText, border: c.accent },
    outline: { bg: "transparent", fg: c.text, border: c.dark ? "rgba(255,255,255,0.15)" : "rgba(12,27,36,0.15)" },
    ink: { bg: c.dark ? "#FBF8F2" : "#0C1B24", fg: c.dark ? "#0C1B24" : "#FBF8F2", border: "transparent" },
    ghost: { bg: "transparent", fg: c.muted, border: "transparent" },
    danger: { bg: c.alert, fg: "#FFFFFF", border: c.alert },
    soft: { bg: c.accentSoft, fg: c.accentSoftText, border: "transparent" },
  }[kind];
  const glow = kind === "primary" && !c.dark ? { shadowColor: "#0E7C70", shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 4 } : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        big && { minHeight: 56 },
        { backgroundColor: p.bg, borderColor: p.border, opacity: disabled ? 0.4 : pressed ? 0.88 : 1 },
        glow,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={p.fg} /> : icon}
      <Text style={[styles.btnText, big && { fontSize: 16 }, { color: p.fg }]}>{label}</Text>
      {iconRight}
    </Pressable>
  );
}

export function Card({ children, style, flat }: { children: ReactNode; style?: StyleProp<ViewStyle>; flat?: boolean }) {
  const c = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.dark ? c.surface : "rgba(255,255,255,0.85)", borderColor: c.border },
        !flat && !c.dark && softShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Pastille arrondie (filtres de l'annuaire, sujets) : noire quand elle est choisie, comme sur le site. */
export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress: () => void; icon?: (color: string) => ReactNode }) {
  const c = useColors();
  const fg = active ? (c.dark ? "#0C1B24" : "#FBF8F2") : c.text;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: c.dark ? "#FBF8F2" : "#0C1B24", borderColor: c.dark ? "#FBF8F2" : "#0C1B24" }
          : { backgroundColor: c.dark ? c.surface : "rgba(255,255,255,0.7)", borderColor: c.borderStrong },
      ]}
    >
      {icon?.(fg)}
      <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: fg }}>{label}</Text>
    </Pressable>
  );
}

/** Petite pastille d'action (sous une réponse du chat), teintée sarcelle ou ocre. */
export function Pill({ label, onPress, tone = "teal", icon }: { label: string; onPress: () => void; tone?: "teal" | "ochre"; icon?: (color: string) => ReactNode }) {
  const c = useColors();
  const bg = tone === "teal" ? c.accentSoft : c.ochreSoft;
  const fg = tone === "teal" ? c.accentSoftText : c.ochreSoftText;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.pill, { backgroundColor: bg, opacity: pressed ? 0.8 : 1 }]}
    >
      {icon?.(fg)}
      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: fg }}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "alert"; children: ReactNode }) {
  const c = useColors();
  const bg = { info: c.accentSoft, warn: c.ochreSoft, alert: c.alertSoft }[tone];
  return <View style={[styles.notice, { backgroundColor: bg }]}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { fontFamily: fonts.semibold, fontSize: 15 },
  card: { borderRadius: 28, borderWidth: 1, padding: 20 },
  chip: { minHeight: 42, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  pill: { minHeight: 34, borderRadius: radius.pill, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  notice: { borderRadius: radius.md, padding: 14, gap: 6 },
});
