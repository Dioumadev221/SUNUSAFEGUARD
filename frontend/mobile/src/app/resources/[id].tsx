import { ActivityIndicator, Linking, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { HeartHandshake, Mail, Phone } from "lucide-react-native";
import Screen from "@/components/common/Screen";
import { Button, Card, Eyebrow, Notice, T } from "@/components/common/ui";
import AvailabilityIndicator from "@/components/resources/AvailabilityIndicator";
import { listOrganizations } from "@/services/resources.service";
import { cat, clean, fmtDate } from "@/constants/labels";
import { domainStyle } from "@/constants/domains";
import { fonts, useColors } from "@/theme";

/** Fiche d'une structure (CDC mobile §3.3 B et D). */
export default function ResourceDetail() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ["directory"], queryFn: listOrganizations });
  const org = data?.find((o) => String(o.id) === id);

  if (isLoading) return <Screen back nav={false}><ActivityIndicator color={c.accent} /></Screen>;
  if (!org)
    return (
      <Screen back nav={false}>
        <Notice tone="warn"><T variant="small">Cette structure n'est plus dans l'annuaire.</T></Notice>
      </Screen>
    );

  const style = domainStyle(org.domains[0]);
  const Icon = style.icon;
  const rows: [string, string][] = [
    ["Adresse", [org.address, org.department, org.region].filter(Boolean).join(", ")],
    ["Horaires", org.hours],
    ["Conditions d'accès", org.access],
    ["Services", org.services.join(", ")],
    ["Public accueilli", org.publics.join(", ")],
  ];

  return (
    <Screen back nav={false}>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: c.dark ? style.bgDark : style.bg }}>
            <Icon size={24} strokeWidth={1.8} color={c.dark ? style.fgDark : style.fg} />
          </View>
          <AvailabilityIndicator status={org.availability} verifiedAt={org.last_verified_at} />
        </View>
        <Eyebrow>{org.org_type}</Eyebrow>
        <T variant="title" style={{ fontSize: 34, lineHeight: 39 }}>{clean(org.name)}</T>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: c.accent }}>{org.domains.map(cat).join(" · ")}</Text>
      </View>

      {!!org.description && <T style={{ fontSize: 17, lineHeight: 26 }}>{org.description}</T>}

      <Card style={{ gap: 14 }}>
        {rows
          .filter(([, v]) => !!v)
          .map(([k, v]) => (
            <View key={k} style={{ gap: 2 }}>
              <T variant="caption" style={{ fontSize: 13 }}>{k}</T>
              <T variant="small" style={{ fontFamily: fonts.medium }}>{v}</T>
            </View>
          ))}
        <T variant="caption">Disponibilité vérifiée le {fmtDate(org.last_verified_at)}. Une place n'est jamais garantie avant que la structure le confirme.</T>
      </Card>

      {!!org.phone && (
        <Button
          big
          kind="outline"
          label={`Appeler ${org.phone}`}
          icon={<Phone size={18} color={c.text} />}
          onPress={() => void Linking.openURL(`tel:${org.phone.replace(/\s/g, "")}`)}
          accessibilityHint="Ouvre le clavier de votre téléphone. Vous gardez la main sur l'appel."
        />
      )}
      {!!org.email && (
        <Button
          big
          kind="outline"
          label={`Écrire à ${org.email}`}
          icon={<Mail size={18} color={c.text} />}
          onPress={() => void Linking.openURL(`mailto:${org.email}`)}
        />
      )}
      {org.accepts_referrals ? (
        <Button
          big
          label="Être rappelée"
          icon={<HeartHandshake size={18} color={c.accentText} />}
          onPress={() => router.push({ pathname: "/referral/[id]", params: { id: String(org.id) } })}
        />
      ) : (
        <Notice tone="info">
          <T variant="small">Cette structure ne reçoit pas encore de demandes par l'application. Contactez-la directement.</T>
        </Notice>
      )}
      <T variant="caption" style={{ textAlign: "center" }}>
        L'appel passe par votre opérateur : votre numéro s'affiche comme pour tout appel.
      </T>
    </Screen>
  );
}
