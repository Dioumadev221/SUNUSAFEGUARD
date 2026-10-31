/** Palette SunuSafeguard « Teranga » (60-30-10) — voir docs/user-guides/charte-ui.md */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        kenburns: { "0%": { transform: "scale(1)" }, "100%": { transform: "scale(1.08) translateY(-1.5%)" } },
        rise: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "none" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        kenburns: "kenburns 24s ease-out infinite alternate",
        rise: "rise .7s cubic-bezier(.2,.7,.2,1) both",
        float: "float 6s ease-in-out infinite",
      },
      colors: {
        // Dominante 60 % : bleu nuit profond, légèrement vert (encre) — textes et mode discret
        night: { DEFAULT: "#0C1B24", 950: "#08131A", 900: "#0C1B24", 850: "#11232D", 800: "#172C37", 700: "#22394A", 600: "#34505F" },
        // Secondaire 30 % : papier sable chaud (fonds de lecture)
        sand: { DEFAULT: "#F5EFE4", 100: "#FBF8F2", 200: "#EBE2D2", 300: "#DCCFB8" },
        // Accent 10 % : sarcelle, la couleur clé du projet
        teal: { DEFAULT: "#0E7C70", light: "#4FD1BE", dark: "#0A5F56", soft: "#D5F2EC" },
        // Touche chaleureuse : ocre du soleil levant (logo, soulignés, illustrations — jamais pour l'urgence)
        ochre: { DEFAULT: "#D9902E", light: "#F2C46D", soft: "#FBEBC9", dark: "#A86A17" },
        sun: "#F2C46D",
        alert: "#E11D48",    // Exclusivement : urgence / sortie rapide
        success: "#10B981",  // Ressource validée, orientation transmise
        warn: "#F59E0B",     // Rappels de confidentialité
        // Gris chauds (remplacent les gris bleutés de Tailwind, accordés au papier sable)
        slate: {
          50: "#FAF8F4", 100: "#F2EEE7", 200: "#E4DDD2", 300: "#CFC6B8", 400: "#A1978A",
          500: "#6E665A", 600: "#575047", 700: "#423D36", 800: "#2B2823", 900: "#1B1916",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans Variable", "Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Fraunces Variable", "Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(12 27 36 / 0.04), 0 12px 32px -16px rgb(12 27 36 / 0.16)",
        lift: "0 2px 4px rgb(12 27 36 / 0.04), 0 24px 48px -20px rgb(12 27 36 / 0.28)",
        glow: "0 18px 40px -18px rgb(14 124 112 / 0.55)",
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.75rem" },
    },
  },
  plugins: [],
};
