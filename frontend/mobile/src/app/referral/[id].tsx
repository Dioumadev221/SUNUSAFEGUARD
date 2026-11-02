import { useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import Screen from "@/components/common/Screen";
import { Button, Card, Chip, Eyebrow, Notice, T } from "@/components/common/ui";
import { listOrganizations } from "@/services/resources.service";
import { createReferral } from "@/services/referrals.service";
import { ApiError } from "@/services/api";
import { cat, clean } from "@/constants/labels";
import { useLang } from "@/i18n";
import { fonts, radius, useColors } from "@/theme";

type Level = "none" | "phone" | "other";

const LEVELS: { key: Level; title: string; detail: string; titleEn: string; detailEn: string }[] = [
  { key: "none", title: "Rien de plus", detail: "La structure ne pourra pas vous rappeler. Vous suivrez votre demande avec votre code, ou vous l'appellerez.",
    titleEn: "Nothing more", detailEn: "The organisation will not be able to call you back. You will track your request with your code, or call it yourself." },
  { key: "phone", title: "Un numéro où vous rappeler", detail: "Donnez un numéro sûr, où vous pouvez répondre sans risque.",
    titleEn: "A number to call you back", detailEn: "Give a safe number, where you can answer without risk." },
  { key: "other", title: "Un autre moyen", detail: "Par exemple : « appeler le matin entre 9 h et 11 h au numéro de ma sœur ».",
    titleEn: "Another way", detailEn: "For example: “call in the morning between 9 and 11 am on my sister's number”." },
];

/** Parcours de mise en relation avec consentement (CDC mobile §3.3 D, §6.2). */
export default function Referral() {
  const c = useColors();
  const { lang, tx } = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useQuery({ queryKey: ["directory"], queryFn: listOrganizations });
  const org = data?.find((o) => String(o.id) === id);
  const [category, setCategory] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("none");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!org) return <Screen back nav={false}><ActivityIndicator color={c.accent} /></Screen>;

  const chosenCategory = category ?? (org.domains.length === 1 ? org.domains[0] : null);
  const contactOk = level === "none" || contact.trim().length >= 4;
  const canSend = !!chosenCategory && contactOk && consent && !sending;

  const submit = async () => {
    if (!canSend || !chosenCategory) return;
    setSending(true);
    setError(null);
    try {
      const res = await createReferral({
        organizationId: org.id,
        organizationName: clean(org.name),
        category: chosenCategory,
        region: org.region,
        contact: level === "none" ? "" : contact.trim(),
      });
      setCode(res.public_code);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tx("La demande n'a pas pu être envoyée. Rien n'a été transmis.", "The request could not be sent. Nothing was shared."));
    } finally {
      setSending(false);
    }
  };

  if (code) {
    return (
      <Screen back nav={false}>
        <Eyebrow>{tx("Demande transmise", "Request sent")}</Eyebrow>
        <T variant="title">{tx("Votre code de suivi", "Your tracking code")}</T>
        <Card style={{ alignItems: "center", gap: 12, borderStyle: "dashed", borderWidth: 2, borderColor: "rgba(217,144,46,0.5)", backgroundColor: c.ochreSoft }} flat>
          <T style={{ fontFamily: fonts.display, fontSize: 32, letterSpacing: 3 }} selectable>{code}</T>
          <Button
            kind="soft"
            label={copied ? tx("Copié", "Copied") : tx("Copier le code", "Copy the code")}
            onPress={() => void Clipboard.setStringAsync(code).then(() => setCopied(true))}
          />
        </Card>
        <T>
          {lang === "en"
            ? `Your request was sent to ${clean(org.name)}. This does not yet mean it was accepted: its real status will appear in “My requests” as soon as the organisation updates it.`
            : `Votre demande a été transmise à ${clean(org.name)}. Cela ne veut pas encore dire qu'elle a été acceptée : l'état réel s'affichera dans « Mes demandes » dès que la structure l'aura mis à jour.`}
        </T>
        <Notice tone="info">
          <T variant="small">{tx("Le code est gardé sur ce téléphone, dans un espace chiffré. « Effacer toute trace » le supprime du téléphone, mais pas la demande déjà reçue par la structure.", "The code is kept on this phone, in an encrypted space. “Erase all traces” deletes it from the phone, but not the request already received by the organisation.")}</T>
        </Notice>
        <Button label={tx("Voir mes demandes", "See my requests")} onPress={() => router.replace("/session")} />
        <Button kind="ghost" label={tx("Retour à l'accueil", "Back to home")} onPress={() => router.dismissTo("/")} />
      </Screen>
    );
  }

  return (
    <Screen back nav={false}>
      <View style={{ gap: 6 }}>
        <Eyebrow>{tx("Être rappelée", "Get a call back")}</Eyebrow>
        <T variant="title">{clean(org.name)}</T>
        <T variant="muted">{org.region}{org.hours ? ` · ${org.hours}` : ""}</T>
      </View>

      <Card style={{ gap: 8 }}>
        <T style={{ fontFamily: fonts.semibold }}>{tx("Ce qui sera transmis", "What will be shared")}</T>
        <T variant="small">• {tx("Le type d'aide", "The type of help")}{org.domains.length > 1 ? tx(" que vous choisissez ci-dessous", " you choose below") : ` : ${cat(org.domains[0] ?? "autre", lang)}`}{"\n"}• {tx("La région de la structure", "The organisation's region")} ({org.region}){"\n"}• {tx("Le moyen de vous recontacter, seulement si vous en donnez un", "How to contact you, only if you give one")}</T>
        <T variant="small" style={{ fontFamily: fonts.semibold }}>{tx("Rien d'autre : ni votre nom, ni votre conversation avec l'assistant.", "Nothing else: neither your name nor your conversation with the assistant.")}</T>
        <T variant="muted" style={{ fontSize: 13 }}>
          {tx("Seule cette structure peut lire votre moyen de contact. Il est chiffré et effacé quand la demande est close.", "Only this organisation can read your contact details. They are encrypted and erased when the request is closed.")}
        </T>
      </Card>

      {org.domains.length > 1 && (
        <View style={{ gap: 8 }}>
          <T style={{ fontFamily: fonts.semibold }}>1. {tx("De quel type d'aide avez-vous besoin ?", "What kind of help do you need?")}</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {org.domains.map((d) => (
              <Chip key={d} label={cat(d, lang)} active={chosenCategory === d} onPress={() => setCategory(d)} />
            ))}
          </View>
        </View>
      )}

      <View style={{ gap: 8 }}>
        <T style={{ fontFamily: fonts.semibold }}>{org.domains.length > 1 ? "2." : "1."} {tx("Que voulez-vous communiquer pour être recontactée ?", "What do you want to share to be contacted again?")}</T>
        {LEVELS.map((l) => (
          <Pressable
            key={l.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: level === l.key }}
            onPress={() => setLevel(l.key)}
            style={{
              borderWidth: 1.5,
              borderColor: level === l.key ? c.accent : c.border,
              backgroundColor: c.surface,
              borderRadius: radius.md,
              padding: 14,
              gap: 4,
            }}
          >
            <T style={{ fontFamily: fonts.semibold }}>{tx(l.title, l.titleEn)}</T>
            <T variant="muted">{tx(l.detail, l.detailEn)}</T>
          </Pressable>
        ))}
        {level !== "none" && (
          <TextInput
            value={contact}
            onChangeText={setContact}
            placeholder={level === "phone" ? "Ex. 77 123 45 67" : tx("Comment vous recontacter", "How to contact you")}
            placeholderTextColor={c.muted}
            keyboardType={level === "phone" ? "phone-pad" : "default"}
            maxLength={300}
            style={{
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surface,
              color: c.text,
              borderRadius: radius.md,
              padding: 14,
              fontFamily: fonts.regular,
              fontSize: 16,
            }}
            accessibilityLabel={tx("Moyen de contact", "Contact details")}
          />
        )}
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        onPress={() => setConsent(!consent)}
        style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: consent ? c.accent : c.muted,
            backgroundColor: consent ? c.accent : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 2,
          }}
        >
          {consent && <T style={{ color: c.accentText, fontFamily: fonts.bold, lineHeight: 18 }}>✓</T>}
        </View>
        <T style={{ flex: 1 }}>
          {lang === "en"
            ? `I agree that this information is shared with ${clean(org.name)} so it can help me.`
            : `J'accepte que ces informations soient transmises à ${clean(org.name)} pour qu'elle puisse m'aider.`}
        </T>
      </Pressable>

      {error && (
        <Notice tone="warn">
          <T variant="small">{error}</T>
        </Notice>
      )}

      <Button label={tx("Envoyer ma demande", "Send my request")} onPress={() => void submit()} disabled={!canSend} loading={sending} />
      <T variant="muted" style={{ fontSize: 13, textAlign: "center" }}>
        {tx("Vous pouvez aussi ne rien envoyer : l'annuaire et l'assistant restent accessibles.", "You can also send nothing: the directory and the assistant remain available.")}
      </T>
    </Screen>
  );
}
