import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { Mic, Square } from "lucide-react-native";
import { Chip } from "@/components/common/ui";
import VoiceWaveform from "./VoiceWaveform";
import { ApiError } from "@/services/api";
import { deleteRecording, registerRecording, stopSpeaking, transcribe } from "@/services/voice.service";
import { useSession } from "@/store/session";
import { fonts, palette, useColors } from "@/theme";

type Status = "ready" | "listening" | "processing" | "error";
const MAX_MS = 60_000;
const BARS = 28;

/**
 * Grand bouton micro (CDC mobile §3.1 B) : appuyer pour parler, appuyer pour arrêter.
 * L'audio est transcrit sur le serveur (Whisper local, gratuit), puis le fichier est effacé du téléphone.
 * Le texte reconnu est envoyé à l'assistant et la réponse est lue à voix haute (parcours A du CDC).
 */
export default function VoiceButton({
  onTranscript,
  onUseText,
  compact,
  onError,
}: {
  onTranscript: (text: string) => void;
  onUseText?: () => void;
  /** Petit bouton à côté du champ de saisie, pour continuer la conversation à la voix. */
  compact?: boolean;
  onError?: (message: string | null) => void;
}) {
  const c = useColors();
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recState = useAudioRecorderState(recorder, 120);
  const [status, setStatus] = useState<Status>("ready");
  const language = useSession((s) => s.voiceLang);
  const setLanguage = useSession((s) => s.setVoiceLang);
  const [message, setMessage] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(-60));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (status === "listening" && typeof recState.metering === "number") {
      setLevels((l) => [...l.slice(1), recState.metering as number]);
    }
  }, [recState.metering, status]);

  const report = (m: string | null) => {
    setMessage(m);
    onError?.(m);
  };

  useEffect(() => () => registerRecording(null), []);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setLevels(Array(BARS).fill(-60));
  };

  const start = async () => {
    report(null);
    stopSpeaking();
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setStatus("error");
      report("L'accès au micro a été refusé. Vous pouvez l'autoriser dans les réglages du téléphone, ou écrire votre question.");
      return;
    }
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      cancelled.current = false;
      setStatus("listening");
      // Sortie rapide / arrière-plan : on coupe le micro et on jette l'enregistrement.
      registerRecording(() => {
        cancelled.current = true;
        void recorder.stop().then(() => deleteRecording(recorder.uri));
        reset();
        setStatus("ready");
      });
      timer.current = setTimeout(() => void stop(), MAX_MS);
    } catch {
      setStatus("error");
      report("Le micro n'a pas pu démarrer. Réessayez ou écrivez votre question.");
    }
  };

  const stop = async () => {
    reset();
    registerRecording(null);
    setStatus("processing");
    let uri: string | null = null;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      uri = recorder.uri;
      if (cancelled.current || !uri) return setStatus("ready");
      const result = await transcribe(uri, language);
      if (!result.text) {
        setStatus("error");
        report("Je n'ai rien entendu. Parlez un peu plus près du téléphone et réessayez.");
        return;
      }
      setStatus("ready");
      onTranscript(result.text);
    } catch (e) {
      setStatus("error");
      report(e instanceof ApiError ? e.message : "La reconnaissance vocale n'a pas fonctionné. Réessayez ou écrivez votre question.");
    } finally {
      void deleteRecording(uri);
    }
  };

  const listening = status === "listening";
  const processing = status === "processing";
  const hint = {
    ready: "",
    listening: "Je vous écoute… Appuyez pour terminer.",
    processing: "Je transcris votre message…",
    error: message ?? "",
  }[status];

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={listening ? "Arrêter et envoyer le message vocal" : "Parler"}
        disabled={processing}
        onPress={() => void (listening ? stop() : start())}
        style={[styles.small, { backgroundColor: listening ? palette.alert : c.accentSoft }]}
      >
        {processing ? (
          <ActivityIndicator color={c.accent} />
        ) : listening ? (
          <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
        ) : (
          <Mic size={20} color={c.accentSoftText} />
        )}
      </Pressable>
    );
  }

  return (    <View style={{ alignItems: "center", gap: 14 }}>
      <View style={[styles.outer, { backgroundColor: c.dark ? "rgba(242,196,109,0.12)" : "rgba(242,196,109,0.45)" }]}>
        <View style={[styles.inner, { borderColor: listening ? c.accent : c.dark ? "rgba(79,209,190,0.2)" : "rgba(14,124,112,0.18)" }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listening ? "Arrêter et envoyer le message vocal" : "Parler à l'assistant"}
            disabled={processing}
            onPress={() => void (listening ? stop() : start())}
            style={({ pressed }) => [
              styles.mic,
              { backgroundColor: listening ? palette.tealDark : c.accent, opacity: pressed ? 0.9 : 1 },
              !c.dark && { shadowColor: palette.teal, shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 6 },
            ]}
          >
            {processing ? (
              <ActivityIndicator size="large" color={c.accentText} />
            ) : listening ? (
              <Square size={40} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Mic size={50} color={c.accentText} strokeWidth={1.7} />
            )}
          </Pressable>
        </View>
      </View>

      {listening && <VoiceWaveform levels={levels} />}

      {!!hint && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: status === "error" ? c.alert : c.muted, textAlign: "center", paddingHorizontal: 12 }}
        >
          {hint}
        </Text>
      )}

      {!listening && !processing && (
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: c.muted }}>Je parle</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Chip label="Français" active={language === "fr"} onPress={() => setLanguage("fr")} />
            <Chip label="Wolof" active={language === "wo"} onPress={() => setLanguage("wo")} />
          </View>
        </View>
      )}

      {status === "error" && !!onUseText && (
        <Pressable accessibilityRole="button" onPress={onUseText} hitSlop={8}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: c.accent, textDecorationLine: "underline" }}>Écrire ma question</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: 216, height: 216, borderRadius: 108, alignItems: "center", justifyContent: "center" },
  inner: { width: 184, height: 184, borderRadius: 92, borderWidth: 10, alignItems: "center", justifyContent: "center" },
  mic: { width: 140, height: 140, borderRadius: 70, alignItems: "center", justifyContent: "center" },
  small: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
