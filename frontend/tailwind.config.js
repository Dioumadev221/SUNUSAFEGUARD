/** Palette SunuSafeguard (60-30-10) — voir docs/user-guides/charte-ui.md */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#0F172A", 800: "#1E293B", 700: "#334155" }, // Dominante 60 %
        sand: { DEFAULT: "#F8FAFC", 200: "#E2E8F0" },                   // Secondaire 30 %
        teal: { DEFAULT: "#0D9488", light: "#14B8A6", dark: "#0F766E" }, // Accent 10 %
        alert: "#E11D48",   // Exclusivement : urgence / sortie rapide
        success: "#10B981", // Ressource validée, orientation transmise
        warn: "#F59E0B",    // Rappels de confidentialité
      },
      fontFamily: { sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"] },
    },
  },
  plugins: [],
};
