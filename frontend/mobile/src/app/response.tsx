import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ArrowUp, ArrowUpRight, RotateCcw } from "lucide-react-native";
import Screen from "@/components/common/Screen";
import { LogoMark } from "@/components/common/Logo";
import { Em, Notice, T } from "@/components/common/ui";
import VoiceButton from "@/components/voice/VoiceButton";
import ResponseCard from "@/components/response/ResponseCard";
import SafetyAlert from "@/components/response/SafetyAlert";
import { ask } from "@/services/conversation.service";
import { ApiError } from "@/services/api";
import { forSpeech, speak, stopSpeaking } from "@/services/voice.service";
import { setItem, KEYS } from "@/services/secure";
import { useSession } from "@/store/session";
import { fonts, palette, softShadow, useColors } from "@/theme";

// Mêmes suggestions que la page Assistant du site.
const SUGGESTIONS = [
  "Mon mari me frappe, est-ce que je peux porter plainte ?",
  "Quelqu'un menace de publier mes photos",
  "Je me sens triste et angoissée",
  "Mon mari garde tout mon salaire, que faire ?",
];

/** Page Assistant : Sunu Écoute (micro) tant que rien n'est dit, puis Sunu Réponse (le chat du site). */
export default function ResponseScreen() {
  const c = useColors();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const messages = useSession((s) => s.messages);
  const addMessage = useSession((s) => s.addMessage);
  const clearConversation = useSession((s) => s.clearConversation);
  const draft = useSession((s) => s.draft);
  const setDraft = useSession((s) => s.setDraft);
  const autoRead = useSession((s) => s.autoRead);
  const setAutoRead = useSession((s) => s.setAutoRead);
  const setSpeaking = useSession((s) => s.setSpeaking);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (focus === "1" || draft) setTimeout(() => inputRef.current?.focus(), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  useEffect(() => {
    if (messages.length || pending) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages.length, pending]);

  const send = async (raw?: string) => {
    const q = (raw ?? draft).trim();
    if (!q || pending) return; // protection contre les doubles envois
    setError(null);
    setDraft("");
    addMessage({ id: `u${Date.now()}`, role: "user", text: q });
    setPending(true);
    try {
      const response = await ask(q);
      const id = `a${Date.now()}`;
      addMessage({ id, role: "assistant", response });
      if (useSession.getState().autoRead) {
        speak(forSpeech(response.answer), { onStart: () => setSpeaking(id), onEnd: () => setSpeaking(null) });
      }
    } catch (e) {
      setError(
        e instanceof ApiError && e.status !== 0
          ? e.message
          : "Le service ne répond pas pour le moment. Si vous êtes en danger, appelez les numéros d'urgence.",
      );
      setDraft(q);
    } finally {
      setPending(false);
    }
  };

  const toggleAutoRead = () => {
    const next = !autoRead;
    setAutoRead(next);
    if (!next) stopSpeaking();
    void setItem(KEYS.autoRead, next ? "1" : "0");
  };

  const showEmergency = messages.some((m) => m.role === "assistant" && m.response.show_emergency);
  const empty = messages.length === 0;

  const footer = (
    <View>
      <View style={[styles.inputRow, { backgroundColor: c.surface, borderColor: c.dark ? "rgba(255,255,255,0.1)" : palette.sand300 }, !c.dark && styles.lift]}>
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          placeholder="Écrivez votre question…"
          placeholderTextColor={palette.slate400}
          multiline
          maxLength={2000}
          style={[styles.input, { color: c.text }]}
          accessibilityLabel="Votre message"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
          disabled={!draft.trim() || pending}
          onPress={() => void send()}
          style={[styles.send, { backgroundColor: !draft.trim() || pending ? (c.dark ? "rgba(255,255,255,0.1)" : palette.slate300) : c.accent }]}
        >
          <ArrowUp size={19} strokeWidth={2.5} color={c.dark && draft.trim() ? palette.night950 : "#FFFFFF"} />
        </Pressable>
      </View>
      <View style={{ alignItems: "center", marginTop: 8, gap: 2 }}>
        <T variant="caption" style={{ fontSize: 11, textAlign: "center" }}>Assistant d'information : il ne remplace pas un·e professionnel·le.</T>
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: autoRead }} onPress={toggleAutoRead} hitSlop={6}>
          <T variant="caption" style={{ fontSize: 11, color: c.accent, fontFamily: fonts.semibold }}>
            Lecture à voix haute : {autoRead ? "activée" : "désactivée"}
          </T>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen scroll={false} footer={footer}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ gap: 26, paddingTop: 4, paddingBottom: 16 }} keyboardShouldPersistTaps="handled" style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
        {!empty && (
          <Pressable accessibilityRole="button" onPress={() => { stopSpeaking(); clearConversation(); }} style={{ alignSelf: "flex-end", flexDirection: "row", gap: 4, alignItems: "center" }} hitSlop={8}>
            <RotateCcw size={13} color={c.muted} />
            <T variant="caption" style={{ fontFamily: fonts.semibold }}>Effacer la conversation</T>
          </Pressable>
        )}

        {showEmergency && <SafetyAlert note="Si vous ou un proche êtes en danger, appelez maintenant." />}

        {empty && (
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <T variant="title" style={{ fontSize: 40, lineHeight: 46, textAlign: "center" }}>
              Bonjour,{"\n"}
              <Em>je vous écoute.</Em>
            </T>
            {/* Sunu Écoute (CDC mobile §3.1) : on parle au micro ou on choisit d'écrire. */}
            <View style={{ paddingTop: 22, paddingBottom: 6 }}>
              <VoiceButton
                onUseText={() => inputRef.current?.focus()}
                onTranscript={(text) => {
                  // Le texte reconnu est à relire : il est placé dans le champ, pas envoyé.
                  setDraft(text);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
              />
            </View>
            <Text style={[styles.kicker, { color: palette.slate400 }]}>POUR COMMENCER</Text>
            <View style={{ alignSelf: "stretch", gap: 10 }}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  onPress={() => void send(s)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    { backgroundColor: c.dark ? c.surface : "rgba(255,255,255,0.8)", borderColor: pressed ? c.accent : c.border },
                  ]}
                >
                  <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: c.text }}>{s.replace(/ ([?!:])/g, " $1")}</Text>
                  <ArrowUpRight size={16} color={palette.slate300} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <View key={m.id} style={{ alignItems: "flex-end" }}>
              <View style={[styles.userBubble, { backgroundColor: c.ink }]}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: c.inkText }}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <ResponseCard key={m.id} id={m.id} response={m.response} onAskAnother={() => inputRef.current?.focus()} />
          ),
        )}

        {pending && <Typing />}
        {error && (
          <Notice tone="alert">
            <T variant="small" style={{ color: c.alert }}>{error}</T>
          </Notice>
        )}
      </ScrollView>
    </Screen>
  );
}

/** Trois points ocre qui sautillent, comme sur le site. */
function Typing() {
  const c = useColors();
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(v, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(300 - i * 150),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }} accessibilityLabel="L'assistant prépare une réponse">
      <LogoMark size={30} />
      <View style={[{ flexDirection: "row", gap: 6, backgroundColor: c.surface, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 13 }, !c.dark && softShadow]}>
        {dots.map((v, i) => (
          <Animated.View
            key={i}
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.ochre, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { marginTop: 44, marginBottom: 12, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2.2 },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 15 },
  userBubble: { maxWidth: "85%", borderRadius: 26, borderBottomRightRadius: 6, paddingHorizontal: 20, paddingVertical: 12 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, borderWidth: 1, borderRadius: 28, padding: 8, paddingLeft: 20 },
  lift: { shadowColor: palette.night, shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 6 },
  input: { flex: 1, minHeight: 44, maxHeight: 140, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 11 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
