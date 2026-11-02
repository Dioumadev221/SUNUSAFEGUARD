import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { ArrowLeft, Moon, Sun } from "lucide-react-native";
import Logo from "./Logo";
import QuickExit from "@/components/security/QuickExit";
import { setItem, KEYS } from "@/services/secure";
import { useSession } from "@/store/session";
import { fonts, radius, useColors } from "@/theme";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/response", label: "Assistant" },
  { href: "/resources", label: "Trouver de l'aide" },
] as const;

/**
 * Cadre commun, calqué sur l'en-tête du site (PublicLayout) :
 * logo « Sunu », bouton Discret (mode sombre), bouton « Sortir », puis la navigation en pastilles.
 */
export default function Screen({
  children,
  footer,
  back,
  nav = true,
  scroll = true,
}: {
  children: ReactNode;
  footer?: ReactNode;
  back?: boolean;
  nav?: boolean;
  scroll?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const setThemeMode = useSession((s) => s.setThemeMode);

  const toggleDiscreet = () => {
    const next = c.dark ? "light" : "dark";
    setThemeMode(next);
    void setItem(KEYS.theme, next);
  };

  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1, paddingBottom: 0 }]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderColor: c.dark ? "rgba(255,255,255,0.05)" : "rgba(12,27,36,0.06)",
          backgroundColor: c.bg,
        }}
      >
        <View style={styles.header}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={10}
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              style={[styles.round, { borderColor: c.dark ? "rgba(255,255,255,0.1)" : "rgba(12,27,36,0.1)" }]}
            >
              <ArrowLeft size={18} color={c.text} />
            </Pressable>
          ) : (
            <Pressable accessibilityRole="link" accessibilityLabel="Accueil" onPress={() => router.dismissTo("/")}>
              <Logo />
            </Pressable>
          )}
          <View style={{ flex: 1 }} />
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Mode sombre"
            accessibilityState={{ checked: c.dark }}
            onPress={toggleDiscreet}
            hitSlop={6}
            style={[styles.round, { borderColor: c.dark ? "rgba(255,255,255,0.1)" : "rgba(12,27,36,0.1)" }]}
          >
            {c.dark ? <Sun size={16} color={c.muted} /> : <Moon size={16} color={c.muted} />}
          </Pressable>
          <QuickExit />
        </View>
        {nav && (
          <View style={styles.nav}>
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Pressable
                  key={n.href}
                  accessibilityRole="link"
                  accessibilityState={{ selected: active }}
                  onPress={() => (active ? null : n.href === "/" ? router.dismissTo("/") : router.navigate(n.href))}
                  style={[styles.navItem, active && { backgroundColor: c.dark ? "#FBF8F2" : "#0C1B24" }]}
                >
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: active ? (c.dark ? "#0C1B24" : "#FBF8F2") : c.muted }}>{n.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      {body}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10, backgroundColor: c.bg }]}>{footer}</View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, height: 66 },
  round: { width: 40, height: 40, borderRadius: radius.pill, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  nav: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
  navItem: { borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, gap: 18 },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
});
