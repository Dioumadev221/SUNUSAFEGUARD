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
import { fonts, palette, useColors } from "@/theme";

/** Écran 3 — Sunu Ressources : la page « Trouver de l'aide » du site. */
export default function Resources() {
  const c = useColors();
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
        <Eyebrow>Réseau d'aide</Eyebrow>
        <T variant="title">
          Trouver de <Em scribble>l'aide</Em>
        </T>
        <T variant="muted" style={{ fontSize: 17, lineHeight: 26 }}>
          Choisissez votre besoin, puis appelez la structure ou demandez qu'elle vous rappelle.
        </T>
      </View>

      <View style={{ gap: 10 }}>
        <View style={[styles.field, field]}>
          <Search size={18} color={c.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher un nom, un service (psychologue, juriste…)"
            placeholderTextColor={palette.slate400}
            style={[styles.fieldText, { color: c.text }]}
            accessibilityLabel="Rechercher"
          />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Région" onPress={() => setRegionOpen(!regionOpen)} style={[styles.field, field]}>
          <MapPin size={18} color={c.muted} />
          <Text style={[styles.fieldText, { color: c.text }]}>{region || "Toutes les régions"}</Text>
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
                <Text style={{ fontFamily: region === r ? fonts.semibold : fonts.regular, fontSize: 15, color: c.text }}>{r || "Toutes les régions"}</Text>
                {region === r && <Check size={16} color={c.accent} />}
              </Pressable>
            ))}
          </Card>
        )}
        {departments.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
            <Chip label="Tous les départements" active={!department} onPress={() => setDepartment("")} />
            {departments.map((d) => (
              <Chip key={d} label={d} active={department === d} onPress={() => setDepartment(d)} icon={(col) => <MapPin size={14} color={col} />} />
            ))}
          </ScrollView>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
          {NEEDS.map(({ id, label, icon: Icon }) => (
            <Chip key={id} label={label} active={need === id} onPress={() => setNeed(id)} icon={(col) => <Icon size={16} color={col} />} />
          ))}
        </ScrollView>
      </View>

      {offline && (
        <Notice tone="warn">
          <T variant="small">Hors connexion : annuaire du {fmtDate(offline)}. Les disponibilités peuvent avoir changé, appelez avant de vous déplacer.</T>
        </Notice>
      )}
      {isLoading && <ActivityIndicator color={c.accent} style={{ marginTop: 24 }} />}
      {isError && (
        <Notice tone="warn">
          <T variant="small">L'annuaire n'a pas pu être chargé. Vérifiez votre connexion.</T>
          <Button kind="outline" label="Réessayer" loading={isRefetching} onPress={() => void refetch()} />
        </Notice>
      )}

      {data &&
        (filtered.length === 0 ? (
          <Card style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
            <T style={{ fontFamily: fonts.semibold }}>Aucune structure pour ce choix.</T>
            <Button kind="ghost" label="Voir toutes les structures" onPress={() => { setNeed(""); setRegion(""); setDepartment(""); setQ(""); }} />
          </Card>
        ) : (
          <>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: c.muted }}>
              {filtered.length} structure{filtered.length > 1 ? "s" : ""}
            </Text>
            {filtered.map((o) => (
              <ResourceCard key={o.id} org={o} />
            ))}
          </>
        ))}

      <View style={{ flexDirection: "row", justifyContent: "center", flexWrap: "wrap" }}>
        <T variant="muted" style={{ fontSize: 14 }}>Déjà une demande ? </T>
        <Pressable accessibilityRole="link" onPress={() => router.push("/session")} hitSlop={6}>
          <T style={{ fontSize: 14, fontFamily: fonts.semibold, color: c.accent }}>Suivre avec votre code</T>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: "row", alignItems: "center", gap: 10, height: 50, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16 },
  fieldText: { flex: 1, fontFamily: fonts.regular, fontSize: 14 },
});
