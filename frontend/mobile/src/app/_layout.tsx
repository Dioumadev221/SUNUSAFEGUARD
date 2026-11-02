import { useEffect, useState } from "react";
import { AppState, Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import * as ScreenCapture from "expo-screen-capture";
import { useFonts, Fraunces_500Medium_Italic, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import ExitScreen from "@/components/security/ExitScreen";
import { clearLegacyStealth, queryClient } from "@/services/session.service";
import { restoreAccount } from "@/services/auth.service";
import { getItem, KEYS } from "@/services/secure";
import { stopRecording, stopSpeaking } from "@/services/voice.service";
import { useSession } from "@/store/session";
import { useColors } from "@/theme";

export default function RootLayout() {
  const c = useColors();
  const stealth = useSession((s) => s.stealth);
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    void Promise.all([
      clearLegacyStealth(),
      restoreAccount(),
      getItem(KEYS.autoRead).then((v) => useSession.getState().setAutoRead(v === "1")),
      getItem(KEYS.lang).then((v) => useSession.getState().setLang(v === "en" ? "en" : "fr")),
      getItem(KEYS.theme).then((v) => useSession.getState().setThemeMode(v === "light" ? "light" : "dark")),
    ]).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    // En développement (Expo Go, démonstrations), captures et enregistrements d'écran restent permis.
    // Dans l'app installée : écran blanc dans les applications récentes et captures bloquées (Android),
    // flou dans le sélecteur d'apps et captures bloquées (iOS).
    if (Platform.OS === "web") return;
    if (__DEV__) {
      void ScreenCapture.allowScreenCaptureAsync();
      if (Platform.OS === "ios") void ScreenCapture.disableAppSwitcherProtectionAsync();
      return;
    }
    void ScreenCapture.preventScreenCaptureAsync();
    if (Platform.OS === "ios") void ScreenCapture.enableAppSwitcherProtectionAsync(0.9);
  }, []);

  useEffect(() => {
    // CDC mobile §6.4 : ni lecture audio ni micro quand l'app passe en arrière-plan.
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        stopSpeaking();
        stopRecording();
        useSession.getState().setSpeaking(null);
      }
    });
    return () => sub.remove();
  }, []);

  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: stealth ? "#000000" : c.bg }} />;

  if (stealth) return <ExitScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={c.dark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: "fade" }} />
    </QueryClientProvider>
  );
}
