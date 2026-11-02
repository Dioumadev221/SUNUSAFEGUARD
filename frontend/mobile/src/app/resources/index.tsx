import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, MapPin, Search } from "lucide-react-native";
import Screen from "@/components/common/Screen";
import { Button, Card, Chip, Em, Eyebrow, Notice, T } from "@/components/common/ui";
import ResourceCard from "@/components/resources/ResourceCard";
import { directoryOfflineDate, listOrganizations } from "@/services/resources.service";
import { fmtDate, REGIONS } from "@/constants/labels";
import { NEEDS, needForDomain } from "@/constants/domains";
import { useLang } from "@/i18n";
import { fonts, palette, useColors } from "@/theme";

/** Écran 3 — Sunu Ressources : la page « Trouver de l'aide » du site. */
export default function Resources() {
  const c = useColors();
  const { lang, tx } = useLang();
  const params = useLocalSearchParams<{ domain?: string }>();
  const [need, setNeed] = useState(() => needForDomain(params.domain));
  const [region, setRegion] = useState("");
  const [department, setDepartment] = useState("");
  const [q, setQ] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: ["directory"], queryFn: listOrganizations });

  const filtered = useMemo(() => {
    const domains = NEEDS.find((n) => n.id === need)?.domains ?? [];
    return (data ?? []).filter(
      (o) =>
        (!region || o.region === region) &&
        (!department || o.department === department) &&
        (!domains.length || o.domains.some((d) => domains.includes(d))) &&
        (!q || `${o.name} ${o.description} ${o.services.join(" ")}`.toLowerCase().includes(q.toLowerCase())),
    );
  }, [data, region, department, need, q]);

  // CDC mobile §3.3 A : département, quand la région en compte plusieurs dans l'annuaire.
  const departments = useMemo(
    () => [...new Set((data ?? []).filter((o) => o.region === region && o.department).map((o) => o.department))].sort(),
    [data, region],
  );
  const offline = data ? directoryOfflineDate() : null;

  const field = { backgroundColor: c.surface, borderColor: c.dark ? "rgba(255,255,255,0.1)" : "rgba(220,207,184,0.8)" };

  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <Eyebrow>{tx("Réseau d'aide", "Support network")}</Eyebrow>
        <T variant="title">
          {lang === "en" ? <>Find <Em scribble>help</Em></> : <>Trouver de <Em scribble>l'aide</Em></>}
        </T>
        <T variant="muted" style={{ fontSize: 17, lineHeight: 26 }}>
          {tx("Choisissez votre besoin, puis appelez la structure ou demandez qu'elle vous rappelle.", "Choose your need, then call the organisation or ask it to call you back.")}
        </T>
      </View>

      <View style={{ gap: 10 }}>
        <View style={[styles.field, field]}>
          <Search size={18} color={c.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={tx("Rechercher un nom, un service (psychologue, juriste…)", "Search a name or a service (psychologist, lawyer…)")}
            placeholderTextColor={palette.slate400}
            style={[styles.fieldText, { color: c.text }]}
            accessibilityLabel={tx("Rechercher", "Search")}
          />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={tx("Région", "Region")} onPress={() => setRegionOpen(!regionOpen)} style={[styles.field, field]}>
          <MapPin size={18} color={c.muted} />
          <Text style={[styles.fieldText, { color: c.text }]}>{region || tx("Toutes les régions", "All regions")}</Text>
          <ChevronDown size={18} color={c.muted} />
        </Pressable>
        {regionOpen && (
          <Card flat style={{ padding: 6 }}>
            {["", ...REGIONS].map((r) => (
              <Pressable
                key={r || "all"}
                accessibilityRole="menuitem"
                onPress={() => {
                  setRegion(r);
                  setDepartment("");
                  setRegionOpen(false);
                }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 11 }}
              >
                <Text style={{ fontFamily: region === r ? fonts.semibold : fonts.regular, fontSize: 15, color: c.text }}>{r || tx("Toutes les régions", "All regions")}</Text>
                {region === r && <Check size={16} color={c.accent} />}
              </Pressable>
            ))}
          </Card>
        )}
        {departments.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
            <Chip label={tx("Tous les départements", "All departments")} active={!department} onPress={() => setDepartment("")} />
            {departments.map((d) => (
              <Chip key={d} label={d} active={department === d} onPress={() => setDepartment(d)} icon={(col) => <MapPin size={14} color={col} />} />
            ))}
          </ScrollView>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
          {NEEDS.map(({ id, label, en, icon: Icon }) => (
            <Chip key={id} label={tx(label, en)} active={need === id} onPress={() => setNeed(id)} icon={(col) => <Icon size={16} color={col} />} />
          ))}
        </ScrollView>
      </View>

      {offline && (
        <Notice tone="warn">
          <T variant="small">{tx("Hors connexion : annuaire du", "Offline: directory from")} {fmtDate(offline, lang)}. {tx("Les disponibilités peuvent avoir changé, appelez avant de vous déplacer.", "Availability may have changed, call before you go.")}</T>
        </Notice>
      )}
      {isLoading && <ActivityIndicator color={c.accent} style={{ marginTop: 24 }} />}
      {isError && (
        <Notice tone="warn">
          <T variant="small">{tx("L'annuaire n'a pas pu être chargé. Vérifiez votre connexion.", "The directory could not be loaded. Check your connection.")}</T>
          <Button kind="outline" label={tx("Réessayer", "Try again")} loading={isRefetching} onPress={() => void refetch()} />
        </Notice>
      )}

      {data &&
        (filtered.length === 0 ? (
          <Card style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
            <T style={{ fontFamily: fonts.semibold }}>{tx("Aucune structure pour ce choix.", "No organisation for this choice.")}</T>
            <Button kind="ghost" label={tx("Voir toutes les structures", "See all organisations")} onPress={() => { setNeed(""); setRegion(""); setDepartment(""); setQ(""); }} />
          </Card>
        ) : (
          <>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: c.muted }}>
              {filtered.length} {tx("structure", "organisation")}{filtered.length > 1 ? "s" : ""}
            </Text>
            {filtered.map((o) => (
              <ResourceCard key={o.id} org={o} />
            ))}
          </>
        ))}

      <View style={{ flexDirection: "row", justifyContent: "center", flexWrap: "wrap" }}>
        <T variant="muted" style={{ fontSize: 14 }}>{tx("Déjà une demande ? ", "Already made a request? ")}</T>
        <Pressable accessibilityRole="link" onPress={() => router.push("/session")} hitSlop={6}>
          <T style={{ fontSize: 14, fontFamily: fonts.semibold, color: c.accent }}>{tx("Suivre avec votre code", "Track it with your code")}</T>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: "row", alignItems: "center", gap: 10, height: 50, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16 },
  fieldText: { flex: 1, fontFamily: fonts.regular, fontSize: 14 },
});
