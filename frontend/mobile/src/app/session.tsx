import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { router } from "expo-router";
import Screen from "@/components/common/Screen";
import { Button, Card, Em, Eyebrow, Notice, T } from "@/components/common/ui";
import { RefreshCw, ShieldCheck, Trash2, UserRound } from "lucide-react-native";
import { loadReferrals, mergeServerReferrals, refreshReferral, removeReferral } from "@/services/referrals.service";
import { myReferrals } from "@/services/auth.service";
import { useSession } from "@/store/session";
import { panicWipe } from "@/services/session.service";
import { fmtDate, fmtDateTime } from "@/constants/labels";
import type { StoredReferral } from "@/types";
import { useLang } from "@/i18n";
import { fonts, useColors } from "@/theme";

const STATUS_TONE: Record<string, "ok" | "wait" | "end"> = {
  transmise: "wait",
  recue: "wait",
  en_cours: "wait",
  prise_en_charge_confirmee: "ok",
  non_prise_en_charge: "end",
  cloturee: "end",
  annulee: "end",
};

const STATUS_EN: Record<string, string> = {
  transmise: "Sent",
  recue: "Received",
  en_cours: "In progress",
  prise_en_charge_confirmee: "Care confirmed",
  non_prise_en_charge: "Not taken on",
  cloturee: "Closed",
  annulee: "Cancelled",
};

/** Écran 4 — Sunu Session : carnet des demandes, code de retour, effacement des traces. */
export default function Session() {
  const c = useColors();
  const { lang, tx } = useLang();
  const account = useSession((s) => s.account);
  const [items, setItems] = useState<StoredReferral[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
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
  }, [refreshAll, account]);

  const wipe = async () => {
    setWiping(true);
    await panicWipe();
    setWiping(false);
    router.dismissTo("/");
  };

  const toneColor = (s: string) => ({ ok: c.success, wait: c.ochre, end: c.muted })[STATUS_TONE[s] ?? "wait"];

  return (
    <Screen back nav={false}>
      <View style={{ gap: 12 }}><Eyebrow>{tx("Votre espace", "Your space")}</Eyebrow><T variant="title">{lang === "en" ? <>My requests and <Em>privacy</Em></> : <>Mes demandes et <Em>confidentialité</Em></>}</T></View>

      <Notice tone="info">
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <ShieldCheck color={c.accent} size={20} />
          <T style={{ fontFamily: fonts.semibold, flex: 1 }}>{tx("Vos conversations ne sont pas stockées sur nos serveurs par défaut.", "Your conversations are not stored on our servers by default.")}</T>
        </View>
        <T variant="small">
          {tx("L'échange avec l'assistant reste sur ce téléphone le temps de la session. Le serveur ne garde que des chiffres anonymes (langue, thème), jamais vos messages.", "The exchange with the assistant stays on this phone for the session. The server only keeps anonymous figures (language, topic), never your messages.")}
        </T>
      </Notice>

      <Pressable accessibilityRole="link" onPress={() => router.push("/account")}>
        <Card flat style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <UserRound color={c.accent} size={20} />
          <T variant="small" style={{ flex: 1 }}>
            {account ? `${tx("Connectée", "Signed in")} : ${account.name}` : tx("Sans compte : vos demandes restent seulement sur ce téléphone. Se connecter ou créer un compte", "No account: your requests stay only on this phone. Sign in or create an account")}
          </T>
        </Card>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <T variant="heading">{tx("Demandes en cours", "Current requests")}</T>
        <Pressable accessibilityRole="button" accessibilityLabel={tx("Actualiser", "Refresh")} onPress={() => void refreshAll()} hitSlop={10} disabled={refreshing}>
          {refreshing ? <ActivityIndicator color={c.accent} /> : <RefreshCw color={c.accent} size={20} />}
        </Pressable>
      </View>
      {offline && (
        <Notice tone="warn">
          <T variant="small">{tx("Certains statuts n'ont pas pu être actualisés. Le dernier état connu est affiché.", "Some statuses could not be refreshed. The last known status is shown.")}</T>
        </Notice>
      )}
      {items?.length === 0 && <T variant="muted">{tx("Aucune demande pour le moment.", "No requests yet.")}</T>}
      {items?.map((r) => (
        <Card key={r.code} style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <T style={{ fontFamily: fonts.bold, letterSpacing: 1 }} selectable>{r.code}</T>
            <Pressable accessibilityRole="button" accessibilityLabel={`${tx("Retirer", "Remove")} ${r.code} ${tx("de ce téléphone", "from this phone")}`} hitSlop={10} onPress={() => void removeReferral(r.code).then(setItems)}>
              <Trash2 color={c.muted} size={18} />
            </Pressable>
          </View>
          <T variant="small">{r.organization}</T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneColor(r.status) }} />
            <T variant="small" style={{ flex: 1, color: toneColor(r.status), fontFamily: fonts.semibold }}>{lang === "en" ? STATUS_EN[r.status] ?? r.label : r.label}</T>
          </View>
          <T variant="muted" style={{ fontSize: 12 }}>
            {tx("Créée le", "Created on")} {fmtDate(r.createdAt, lang)} · {tx("vérifiée le", "checked on")} {fmtDateTime(r.checkedAt, lang)}
          </T>
        </Card>
      ))}

      <T variant="heading" style={{ marginTop: 8 }}>{tx("Sortie rapide", "Quick exit")}</T>
      <Card style={{ gap: 10 }}>
        <T variant="small">
          {tx("Le bouton rouge « Sortir », en haut de chaque écran, efface la conversation et ferme l'application aussitôt.", "The red “Exit” button, at the top of every screen, erases the conversation and closes the app at once.")}
        </T>
        <T variant="muted" style={{ fontSize: 13 }}>
          {tx("Sur iPhone, le système ne laisse pas une application se fermer seule : l'écran devient noir et vide. Touchez-le pour revenir à l'accueil.", "On iPhone, the system does not let an app close itself: the screen turns plain black. Tap it to return to the home screen.")}
        </T>
      </Card>

      <T variant="heading" style={{ marginTop: 8 }}>{tx("Effacer toute trace", "Erase all traces")}</T>
      <Card style={{ gap: 10 }}>
        <T variant="small">
          {tx("Supprime de ce téléphone : la conversation, les codes de suivi et vos réglages.", "Deletes from this phone: the conversation, tracking codes and your settings.")}
        </T>
        <T variant="small" style={{ fontFamily: fonts.semibold }}>
          {tx("Une demande déjà envoyée reste chez la structure : l'effacement ne l'annule pas.", "A request already sent stays with the organisation: erasing does not cancel it.")}
        </T>
        {confirmWipe ? (
          <View style={{ gap: 8 }}>
            <Button kind="danger" label={tx("Oui, tout effacer maintenant", "Yes, erase everything now")} loading={wiping} onPress={() => void wipe()} />
            <Button kind="ghost" label={tx("Annuler", "Cancel")} onPress={() => setConfirmWipe(false)} />
          </View>
        ) : (
          <Button kind="outline" label={tx("Effacer toute trace", "Erase all traces")} icon={<Trash2 color={c.alert} size={18} />} onPress={() => setConfirmWipe(true)} />
        )}
      </Card>
    </Screen>
  );
}
