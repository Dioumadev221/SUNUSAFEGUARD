import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { router } from "expo-router";
import {
  ArrowRight, ArrowUpRight, HeartHandshake, House, Scale, ShieldAlert,
  ShieldCheck, Smartphone, Stethoscope, UserRound, type LucideIcon,
} from "lucide-react-native";
import Screen from "@/components/common/Screen";
import { Button, Em, Eyebrow, T } from "@/components/common/ui";
import SafetyAlert from "@/components/response/SafetyAlert";
import ConnectionNotice from "@/components/common/ConnectionNotice";
import { useSession } from "@/store/session";
import { fonts, palette, softShadow, useColors } from "@/theme";

// Mêmes sujets et mêmes photos que l'accueil du site (frontend/public/illustrations/sujets).
const TOPICS: { icon: LucideIcon; title: string; ask: string; img: ImageSourcePropType }[] = [
  { icon: HeartHandshake, title: "Moral et bien-être", ask: "Je me sens triste et angoissée", img: require("../../assets/illustrations/sujets/moral.jpg") },
  { icon: ShieldAlert, title: "Violences à la maison", ask: "Mon mari me frappe, est-ce que je peux porter plainte ?", img: require("../../assets/illustrations/sujets/violences.jpg") },
  { icon: Scale, title: "Droits et justice", ask: "Mon mari garde tout mon salaire. Est-ce que c'est normal ?", img: require("../../assets/illustrations/sujets/droits.jpg") },
  { icon: Stethoscope, title: "Santé et corps", ask: "Où trouver un suivi de santé reproductive confidentiel ?", img: require("../../assets/illustrations/sujets/sante.jpg") },
  { icon: House, title: "Un endroit sûr", ask: "Je dois quitter la maison, où puis-je être hébergée ?", img: require("../../assets/illustrations/sujets/abri.jpg") },
  { icon: Smartphone, title: "Harcèlement en ligne", ask: "Quelqu'un menace de publier mes photos", img: require("../../assets/illustrations/sujets/numerique.jpg") },
];

/** Accueil : le même que sur le site. Le micro (Sunu Écoute) est sur la page Assistant. */
export default function Home() {
  const c = useColors();
  const setDraft = useSession((s) => s.setDraft);
  const account = useSession((s) => s.account);
  // Comme sur le site : un sujet pré-remplit la question sans l'envoyer, la personne garde la main.
  const openTopic = (ask: string) => {
    setDraft(ask);
    router.push("/response");
  };

  return (
    <Screen>
      <ConnectionNotice />

      <View style={{ gap: 18, paddingTop: 8 }}>
        <T variant="title" style={{ fontSize: 44, lineHeight: 48 }}>
          Parlez en confiance.{"\n"}Trouvez de <Em scribble>l'aide</Em>.
        </T>
        <T variant="muted" style={{ fontSize: 17, lineHeight: 27 }}>
          Bien-être, violences, droits, santé : faites-vous aider en toute discrétion. Sunu répond avec des informations vérifiées et vous oriente vers des personnes qui peuvent vous accompagner.
        </T>
      </View>

      <View style={{ gap: 12, marginTop: 8 }}>
        <Button big label="Parler à l'assistant" iconRight={<ArrowRight size={18} color={c.accentText} />} onPress={() => router.push("/response")} />
        <Button big kind="outline" label="Trouver une structure" onPress={() => router.push("/resources")} />
      </View>

      <View style={{ marginTop: 40, gap: 10 }}>
        <Eyebrow>Vous pouvez tout dire</Eyebrow>
        <T variant="title" style={{ fontSize: 34, lineHeight: 39 }}>De quoi voulez-vous parler ?</T>
      </View>
      <View style={{ gap: 14 }}>
        {TOPICS.map(({ icon: Icon, title, ask, img }) => (
          <Pressable
            key={title}
            accessibilityRole="button"
            accessibilityLabel={`${title} : ${ask}`}
            onPress={() => openTopic(ask)}
            style={({ pressed }) => [styles.topic, !c.dark && softShadow, { opacity: pressed ? 0.92 : 1 }]}
          >
            <Image source={img} style={[styles.topicImg, { opacity: c.dark ? 0.75 : 1 }]} resizeMode="cover" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12,27,36,0.35)" }]} />
            <View style={styles.topicShade} />
            <View style={styles.topicArrow}>
              <ArrowUpRight size={18} color="#FFFFFF" />
            </View>
            <View style={styles.topicIcon}>
              <Icon size={20} color="#FFFFFF" strokeWidth={1.8} />
            </View>
            <Text style={styles.topicTitle}>{title}</Text>
            <Text style={styles.topicAsk}>« {ask} »</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/session")}
        style={[styles.privacy, { backgroundColor: c.dark ? c.surface : "rgba(255,255,255,0.7)", borderColor: c.border }]}
      >
        <View style={[styles.privacyIcon, { backgroundColor: c.dark ? palette.sand100 : palette.night }]}>
          <ShieldCheck size={19} color={c.dark ? palette.ochreDark : palette.ochreLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: c.text }}>Mes demandes et confidentialité</Text>
          <T variant="caption" style={{ fontSize: 13, lineHeight: 19 }}>
            Vos conversations ne sont pas stockées sur nos serveurs par défaut. Suivez vos demandes ou effacez toute trace.
          </T>
        </View>
        <ArrowRight size={18} color={c.accent} />
      </Pressable>

      <Pressable accessibilityRole="link" onPress={() => router.push("/account")} style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center", padding: 8 }}>
        <UserRound size={16} color={c.accent} />
        <T variant="small" style={{ color: c.accent, fontFamily: fonts.semibold }}>{account ? `Mon compte · ${account.name}` : "Mon compte (facultatif)"}</T>
      </Pressable>

      <SafetyAlert note="Appel gratuit, 24 h/24." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topic: { width: "100%", aspectRatio: 4 / 3, borderRadius: 28, overflow: "hidden", justifyContent: "flex-end", padding: 20, backgroundColor: palette.night },
  topicImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  topicShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "65%", backgroundColor: "rgba(12,27,36,0.45)" },
  topicArrow: { position: "absolute", right: 16, top: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  topicIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  topicTitle: { marginTop: 12, fontFamily: "Fraunces_600SemiBold", fontSize: 24, color: "#FFFFFF" },
  topicAsk: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: "rgba(255,255,255,0.88)" },
  privacy: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: 28, padding: 18, marginTop: 24 },
  privacyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
