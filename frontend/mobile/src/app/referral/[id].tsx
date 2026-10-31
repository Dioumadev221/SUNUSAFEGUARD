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
import { fonts, radius, useColors } from "@/theme";

type Level = "none" | "phone" | "other";

const LEVELS: { key: Level; title: string; detail: string }[] = [
  { key: "none", title: "Rien de plus", detail: "La structure ne pourra pas vous rappeler. Vous suivrez votre demande avec votre code, ou vous l'appellerez." },
  { key: "phone", title: "Un numéro où vous rappeler", detail: "Donnez un numéro sûr, où vous pouvez répondre sans risque." },
  { key: "other", title: "Un autre moyen", detail: "Par exemple : « appeler le matin entre 9 h et 11 h au numéro de ma sœur »." },
];

/** Parcours de mise en relation avec consentement (CDC mobile §3.3 D, §6.2). */
export default function Referral() {
  const c = useColors();
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
      setError(e instanceof ApiError ? e.message : "La demande n'a pas pu être envoyée. Rien n'a été transmis.");
    } finally {
      setSending(false);
    }
  };

  if (code) {
    return (
      <Screen back nav={false}>
        <Eyebrow>Demande transmise</Eyebrow>
        <T variant="title">Votre code de suivi</T>
        <Card style={{ alignItems: "center", gap: 12, borderStyle: "dashed", borderWidth: 2, borderColor: "rgba(217,144,46,0.5)", backgroundColor: c.ochreSoft }} flat>
          <T style={{ fontFamily: fonts.display, fontSize: 32, letterSpacing: 3 }} selectable>{code}</T>
          <Button
            kind="soft"
            label={copied ? "Copié" : "Copier le code"}
            onPress={() => void Clipboard.setStringAsync(code).then(() => setCopied(true))}
          />
        </Card>
        <T>
          Votre demande a été transmise à {clean(org.name)}. Cela ne veut pas encore dire qu'elle a été acceptée : l'état réel s'affichera dans « Mes demandes » dès que la structure l'aura mis à jour.
        </T>
        <Notice tone="info">
          <T variant="small">Le code est gardé sur ce téléphone, dans un espace chiffré. « Effacer toute trace » le supprime du téléphone, mais pas la demande déjà reçue par la structure.</T>
        </Notice>
        <Button label="Voir mes demandes" onPress={() => router.replace("/session")} />
        <Button kind="ghost" label="Retour à l'accueil" onPress={() => router.dismissTo("/")} />
      </Screen>
    );
  }

  return (
    <Screen back nav={false}>
      <View style={{ gap: 6 }}>
        <Eyebrow>Être rappelée</Eyebrow>
        <T variant="title">{clean(org.name)}</T>
        <T variant="muted">{org.region}{org.hours ? ` · ${org.hours}` : ""}</T>
      </View>

      <Card style={{ gap: 8 }}>
        <T style={{ fontFamily: fonts.semibold }}>Ce qui sera transmis</T>
        <T variant="small">• Le type d'aide{org.domains.length > 1 ? " que vous choisissez ci-dessous" : ` : ${cat(org.domains[0] ?? "autre")}`}{"\n"}• La région de la structure ({org.region}){"\n"}• Le moyen de vous recontacter, seulement si vous en donnez un</T>
        <T variant="small" style={{ fontFamily: fonts.semibold }}>Rien d'autre : ni votre nom, ni votre conversation avec l'assistant.</T>
        <T variant="muted" style={{ fontSize: 13 }}>
          Seule cette structure peut lire votre moyen de contact. Il est chiffré et effacé quand la demande est close.
        </T>
      </Card>

      {org.domains.length > 1 && (
        <View style={{ gap: 8 }}>
          <T style={{ fontFamily: fonts.semibold }}>1. De quel type d'aide avez-vous besoin ?</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {org.domains.map((d) => (
              <Chip key={d} label={cat(d)} active={chosenCategory === d} onPress={() => setCategory(d)} />
            ))}
          </View>
        </View>
      )}

      <View style={{ gap: 8 }}>
        <T style={{ fontFamily: fonts.semibold }}>{org.domains.length > 1 ? "2." : "1."} Que voulez-vous communiquer pour être recontactée ?</T>
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
            <T style={{ fontFamily: fonts.semibold }}>{l.title}</T>
            <T variant="muted">{l.detail}</T>
          </Pressable>
        ))}
        {level !== "none" && (
          <TextInput
            value={contact}
            onChangeText={setContact}
            placeholder={level === "phone" ? "Ex. 77 123 45 67" : "Comment vous recontacter"}
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
            accessibilityLabel="Moyen de contact"
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
          J'accepte que ces informations soient transmises à {clean(org.name)} pour qu'elle puisse m'aider.
        </T>
      </Pressable>

      {error && (
        <Notice tone="warn">
          <T variant="small">{error}</T>
        </Notice>
      )}

      <Button label="Envoyer ma demande" onPress={() => void submit()} disabled={!canSend} loading={sending} />
      <T variant="muted" style={{ fontSize: 13, textAlign: "center" }}>
        Vous pouvez aussi ne rien envoyer : l'annuaire et l'assistant restent accessibles.
      </T>
    </Screen>
  );
}
