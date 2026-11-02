import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import Screen from "@/components/common/Screen";
import { Button, Card, Em, Eyebrow, Notice, T } from "@/components/common/ui";
import { RefreshCw, ShieldCheck, Trash2, UserRound } from "lucide-react-native";
import { loadReferrals, mergeServerReferrals, refreshReferral, removeReferral } from "@/services/referrals.service";
import { myReferrals } from "@/services/auth.service";
import { useSession } from "@/store/session";
import { DEFAULT_EXIT_CODE, getExitCode, panicWipe, setExitCode } from "@/services/session.service";
import { fmtDate, fmtDateTime } from "@/constants/labels";
import type { StoredReferral } from "@/types";
import { fonts, radius, useColors } from "@/theme";

const STATUS_TONE: Record<string, "ok" | "wait" | "end"> = {
  transmise: "wait",
  recue: "wait",
  en_cours: "wait",
  prise_en_charge_confirmee: "ok",
  non_prise_en_charge: "end",
  cloturee: "end",
  annulee: "end",
};

/** Écran 4 — Sunu Session : carnet des demandes, code de retour, effacement des traces. */
export default function Session() {
  const c = useColors();
  const account = useSession((s) => s.account);
  const [items, setItems] = useState<StoredReferral[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [exitCode, setCode] = useState("");
  const [editingCode, setEditingCode] = useState(false);
  const [draftCode, setDraftCode] = useState("");
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wiping, setWiping] = useState(false);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    let list = await loadReferrals();
    setItems(list);
    let failed = false;
    if (useSession.getState().account) {
      // Avec un compte : les demandes du compte (et seulement les siennes) sont aussi lues sur le serveur.
      try {
        list = await mergeServerReferrals(await myReferrals());
      } catch {
        failed = true;
      }
    }
    for (const r of list) {
      try {
        list = await refreshReferral(r.code);
      } catch {
        failed = true;
      }
    }
    setItems(list);
    setOffline(failed);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void refreshAll();
    void getExitCode().then(setCode);
  }, [refreshAll, account]);

  const saveCode = async () => {
    if (!/^\d{3,8}$/.test(draftCode)) return;
    await setExitCode(draftCode);
    setCode(draftCode);
    setEditingCode(false);
  };

  const wipe = async () => {
    setWiping(true);
    await panicWipe();
    setWiping(false);
    router.dismissTo("/");
  };

  const toneColor = (s: string) => ({ ok: c.success, wait: c.ochre, end: c.muted })[STATUS_TONE[s] ?? "wait"];

  return (
    <Screen back nav={false}>
      <View style={{ gap: 12 }}><Eyebrow>Votre espace</Eyebrow><T variant="title">Mes demandes et <Em>confidentialité</Em></T></View>

      <Notice tone="info">
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <ShieldCheck color={c.accent} size={20} />
          <T style={{ fontFamily: fonts.semibold, flex: 1 }}>Vos conversations ne sont pas stockées sur nos serveurs par défaut.</T>
        </View>
        <T variant="small">
          L'échange avec l'assistant reste sur ce téléphone le temps de la session. Le serveur ne garde que des chiffres anonymes (langue, thème), jamais vos messages.
        </T>
      </Notice>

      <Pressable accessibilityRole="link" onPress={() => router.push("/account")}>
        <Card flat style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <UserRound color={c.accent} size={20} />
          <T variant="small" style={{ flex: 1 }}>
            {account ? `Connectée : ${account.name}` : "Sans compte : vos demandes restent seulement sur ce téléphone. Se connecter ou créer un compte"}
          </T>
        </Card>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <T variant="heading">Demandes en cours</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Actualiser" onPress={() => void refreshAll()} hitSlop={10} disabled={refreshing}>
          {refreshing ? <ActivityIndicator color={c.accent} /> : <RefreshCw color={c.accent} size={20} />}
        </Pressable>
      </View>
      {offline && (
        <Notice tone="warn">
          <T variant="small">Certains statuts n'ont pas pu être actualisés. Le dernier état connu est affiché.</T>
        </Notice>
      )}
      {items?.length === 0 && <T variant="muted">Aucune demande pour le moment.</T>}
      {items?.map((r) => (
        <Card key={r.code} style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <T style={{ fontFamily: fonts.bold, letterSpacing: 1 }} selectable>{r.code}</T>
            <Pressable accessibilityRole="button" accessibilityLabel={`Retirer ${r.code} de ce téléphone`} hitSlop={10} onPress={() => void removeReferral(r.code).then(setItems)}>
              <Trash2 color={c.muted} size={18} />
            </Pressable>
          </View>
          <T variant="small">{r.organization}</T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneColor(r.status) }} />
            <T variant="small" style={{ flex: 1, color: toneColor(r.status), fontFamily: fonts.semibold }}>{r.label}</T>
          </View>
          <T variant="muted" style={{ fontSize: 12 }}>
            Créée le {fmtDate(r.createdAt)} · vérifiée le {fmtDateTime(r.checkedAt)}
          </T>
        </Card>
      ))}

      <T variant="heading" style={{ marginTop: 8 }}>Sortie rapide</T>
      <Card style={{ gap: 10 }}>
        <T variant="small">
          Le bouton « Sortir » affiche une calculatrice ordinaire et efface la conversation. Pour revenir ici, tapez votre code puis « = ».
        </T>
        {editingCode ? (
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TextInput
              value={draftCode}
              onChangeText={(t) => setDraftCode(t.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={8}
              placeholder="3 à 8 chiffres"
              placeholderTextColor={c.muted}
              style={{ flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: radius.sm, padding: 12, color: c.text, fontFamily: fonts.semibold, fontSize: 18 }}
              accessibilityLabel="Nouveau code de retour"
            />
            <Button label="OK" onPress={() => void saveCode()} disabled={!/^\d{3,8}$/.test(draftCode)} />
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T>
              Votre code : <T style={{ fontFamily: fonts.bold }}>{exitCode} =</T>
              {exitCode === DEFAULT_EXIT_CODE ? <T variant="muted"> (par défaut)</T> : null}
            </T>
            <Button kind="soft" label="Changer" onPress={() => { setDraftCode(""); setEditingCode(true); }} />
          </View>
        )}
        <T variant="muted" style={{ fontSize: 13 }}>
          Ce mode cache l'écran, mais il ne rend pas l'app invisible : elle reste dans la liste des applications du téléphone.
        </T>
      </Card>

      <T variant="heading" style={{ marginTop: 8 }}>Effacer toute trace</T>
      <Card style={{ gap: 10 }}>
        <T variant="small">
          Supprime de ce téléphone : la conversation, les codes de suivi, votre code de retour et vos réglages.
        </T>
        <T variant="small" style={{ fontFamily: fonts.semibold }}>
          Une demande déjà envoyée reste chez la structure : l'effacement ne l'annule pas.
        </T>
        {confirmWipe ? (
          <View style={{ gap: 8 }}>
            <Button kind="danger" label="Oui, tout effacer maintenant" loading={wiping} onPress={() => void wipe()} />
            <Button kind="ghost" label="Annuler" onPress={() => setConfirmWipe(false)} />
          </View>
        ) : (
          <Button kind="outline" label="Effacer toute trace" icon={<Trash2 color={c.alert} size={18} />} onPress={() => setConfirmWipe(true)} />
        )}
      </Card>
    </Screen>
  );
}
