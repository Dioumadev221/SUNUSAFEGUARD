import { Text, View } from "react-native";
import { router } from "expo-router";
import { HeartHandshake, MessageCircleQuestion, Square, Volume2 } from "lucide-react-native";
import type { ChatResponse } from "@/types";
import { LogoMark } from "@/components/common/Logo";
import { Pill } from "@/components/common/ui";
import { forSpeech, speak, stopSpeaking } from "@/services/voice.service";
import { useSession } from "@/store/session";
import { fonts, softShadow, useColors } from "@/theme";
import { useLang } from "@/i18n";

/**
 * Bulle de l'assistant, comme sur le site (AssistantMessage) : avatar cœur, carte blanche,
 * puis les trois actions du cahier des charges (§3.2 C) en pastilles.
 */
export default function ResponseCard({ id, response, onAskAnother }: { id: string; response: ChatResponse; onAskAnother: () => void }) {
  const c = useColors();
  const { tx } = useLang();
  const speakingId = useSession((s) => s.speakingId);
  const setSpeaking = useSession((s) => s.setSpeaking);
  const speaking = speakingId === id;

  const toggleSpeech = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(null);
    } else {
      speak(forSpeech(response.answer), { onStart: () => setSpeaking(id), onEnd: () => setSpeaking(null) });
    }
  };

  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ marginTop: 4 }}>
        <LogoMark size={30} />
      </View>
      <View
        style={[
          {
            flex: 1,
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 26,
            borderTopLeftRadius: 6,
            paddingHorizontal: 18,
            paddingVertical: 15,
          },
          !c.dark && softShadow,
        ]}
      >
        <Text style={{ fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: c.text }}>
          {response.answer.replace(/\s*\[\d+\]/g, "")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: c.border }}>
          <Pill
            tone="ochre"
            label={tx("Être orientée", "Get referred")}
            icon={(col) => <HeartHandshake size={14} color={col} />}
            onPress={() =>
              router.push({ pathname: "/resources", params: response.category !== "autre" ? { domain: response.category } : {} })
            }
          />
          <Pill
            label={speaking ? tx("Arrêter", "Stop") : tx("Réécouter", "Listen again")}
            icon={(col) => (speaking ? <Square size={13} color={col} fill={col} /> : <Volume2 size={14} color={col} />)}
            onPress={toggleSpeech}
          />
          <Pill label={tx("Autre question", "Another question")} icon={(col) => <MessageCircleQuestion size={14} color={col} />} onPress={onAskAnother} />
        </View>
      </View>
    </View>
  );
}
