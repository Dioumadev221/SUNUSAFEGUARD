import { Linking, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react-native";
import type { Organization } from "@/types";
import { clean } from "@/constants/labels";
import { domainStyle } from "@/constants/domains";
import { Button } from "@/components/common/ui";
import AvailabilityIndicator from "./AvailabilityIndicator";
import { fonts, softShadow, useColors } from "@/theme";

/** Carte d'une structure, comme OrgCard sur le site : pictogramme du domaine, disponibilité, Appeler / Être rappelée. */
export default function ResourceCard({ org }: { org: Organization }) {
  const c = useColors();
  const style = domainStyle(org.domains[0]);
  const Icon = style.icon;
  const open = () => router.push({ pathname: "/resources/[id]", params: { id: String(org.id) } });
  return (
    <View style={[{ backgroundColor: c.dark ? c.surface : "rgba(255,255,255,0.85)", borderColor: c.border, borderWidth: 1, borderRadius: 28, overflow: "hidden" }, !c.dark && softShadow]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${clean(org.name)}, voir la fiche`} onPress={open} style={{ padding: 20, gap: 4 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: c.dark ? style.bgDark : style.bg }}>
            <Icon size={22} strokeWidth={1.8} color={c.dark ? style.fgDark : style.fg} />
          </View>
          <AvailabilityIndicator status={org.availability} verifiedAt={org.last_verified_at} />
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 26, color: c.text }}>{clean(org.name)}</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: c.muted }}>{org.org_type}</Text>
        {!!org.description && (
          <Text numberOfLines={2} style={{ marginTop: 8, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.text }}>
            {org.description}
          </Text>
        )}
        {org.services.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {org.services.slice(0, 3).map((s) => (
              <Text key={s} style={{ fontFamily: fonts.medium, fontSize: 12, color: c.text, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" }}>
                {s}
              </Text>
            ))}
          </View>
        )}
        <View style={{ gap: 8, marginTop: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MapPin size={15} color={c.muted} />
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: c.muted }}>
              {org.region}
              {org.department && org.department !== org.region ? `, ${org.department}` : ""}
            </Text>
          </View>
          {!!org.hours && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Clock size={15} color={c.muted} />
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.regular, fontSize: 14, color: c.muted }}>{org.hours}</Text>
            </View>
          )}
        </View>
      </Pressable>
      <View style={{ flexDirection: "row", gap: 8, padding: 14, borderTopWidth: 1, borderColor: c.border, backgroundColor: c.dark ? "rgba(255,255,255,0.02)" : "rgba(251,248,242,0.6)" }}>
        {!!org.phone && (
          <Button
            kind="outline"
            style={{ flex: 1, paddingHorizontal: 12 }}
            label="Appeler"
            icon={<Phone size={16} color={c.text} />}
            onPress={() => void Linking.openURL(`tel:${org.phone.replace(/\s/g, "")}`)}
          />
        )}
        {org.accepts_referrals ? (
          <Button
            style={{ flex: 1, paddingHorizontal: 12 }}
            label="Être rappelée"
            onPress={() => router.push({ pathname: "/referral/[id]", params: { id: String(org.id) } })}
          />
        ) : !org.phone && !!org.email ? (
          <Button
            kind="outline"
            style={{ flex: 1, paddingHorizontal: 12 }}
            label="Écrire"
            icon={<Mail size={16} color={c.text} />}
            onPress={() => void Linking.openURL(`mailto:${org.email}`)}
          />
        ) : null}
      </View>
    </View>
  );
}
