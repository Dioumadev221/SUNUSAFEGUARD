import { useColorScheme } from "react-native";
import { useSession } from "@/store/session";

/** Palette « Teranga », identique au site (frontend/tailwind.config.js). */
export const palette = {
  night: "#0C1B24",
  night950: "#08131A",
  night900: "#0C1B24",
  night850: "#11232D",
  night800: "#172C37",
  sand: "#F5EFE4",
  sand100: "#FBF8F2",
  sand200: "#EBE2D2",
  sand300: "#DCCFB8",
  teal: "#0E7C70",
  tealDark: "#0A5F56",
  tealLight: "#4FD1BE",
  tealSoft: "#D5F2EC",
  ochre: "#D9902E",
  ochreLight: "#F2C46D",
  ochreSoft: "#FBEBC9",
  ochreDark: "#A86A17",
  sun: "#F2C46D",
  alert: "#E11D48", // exclusivement : urgence et sortie rapide
  success: "#10B981",
  warn: "#F59E0B",
  slate300: "#CFC6B8",
  slate400: "#A1978A",
  slate500: "#6E665A",
  slate600: "#575047",
  slate700: "#423D36",
  white: "#FFFFFF",
};

export type Colors = {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  accentSoftText: string;
  ochre: string;
  ochreSoft: string;
  ochreSoftText: string;
  ink: string; // bouton « encre » et bulle de l'utilisatrice
  inkText: string;
  alert: string;
  alertSoft: string;
  success: string;
  warn: string;
};

const light: Colors = {
  dark: false,
  bg: palette.sand,
  surface: palette.white,
  surfaceAlt: palette.sand100,
  border: palette.sand200,
  borderStrong: palette.sand300,
  text: palette.night,
  muted: palette.slate500,
  accent: palette.teal,
  accentText: palette.white,
  accentSoft: palette.tealSoft,
  accentSoftText: palette.tealDark,
  ochre: palette.ochre,
  ochreSoft: palette.ochreSoft,
  ochreSoftText: palette.ochreDark,
  ink: palette.night,
  inkText: palette.sand100,
  alert: palette.alert,
  alertSoft: "rgba(225,29,72,0.08)",
  success: palette.success,
  warn: palette.warn,
};

const dark: Colors = {
  dark: true,
  bg: palette.night950,
  surface: palette.night850,
  surfaceAlt: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
  text: "#F2EEE7",
  muted: palette.slate400,
  accent: palette.tealLight,
  accentText: palette.night950,
  accentSoft: "rgba(14,124,112,0.18)",
  accentSoftText: palette.tealLight,
  ochre: palette.ochre,
  ochreSoft: "rgba(217,144,46,0.16)",
  ochreSoftText: palette.ochreLight,
  ink: palette.tealDark,
  inkText: palette.white,
  alert: palette.alert,
  alertSoft: "rgba(225,29,72,0.10)",
  success: palette.success,
  warn: palette.warn,
};

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayItalic: "Fraunces_500Medium_Italic",
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};

export const radius = { sm: 12, md: 18, lg: 28, pill: 999 };

/** Ombre douce du site (shadow-soft), en mode clair seulement. */
export const softShadow = {
  shadowColor: palette.night,
  shadowOpacity: 0.1,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};

/** Thème sombre par défaut ; le bouton lune/soleil bascule en clair. */
export function useColors(): Colors {
  const system = useColorScheme();
  const mode = useSession((s) => s.themeMode);
  const isDark = mode === "dark" || (mode === "auto" && system === "dark");
  return isDark ? dark : light;
}
