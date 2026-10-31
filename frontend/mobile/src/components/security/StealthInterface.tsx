import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getExitCode, leaveStealth } from "@/services/session.service";
import { apply, format, isExitCode, type Op } from "@/utils/calculator";

/**
 * Écran neutre de la sortie rapide (CDC mobile §3.5 B) : une vraie calculatrice, sans aucune
 * mention de l'assistant. Pour revenir : taper le code de retour puis « = » (réglable dans
 * « Mes demandes »). Pas de geste secret : la méthode est expliquée dans l'app.
 */
export default function StealthInterface() {
  const insets = useSafeAreaInsets();
  const [entry, setEntry] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    void getExitCode().then(setCode);
  }, []);

  const value = () => Number.parseFloat(entry.replace(",", "."));

  const digit = (d: string) => {
    if (fresh) {
      setEntry(d === "," ? "0," : d);
      setFresh(false);
    } else if (!(d === "," && entry.includes(",")) && entry.length < 14) {
      setEntry(entry === "0" && d !== "," ? d : entry + d);
    }
  };

  const operator = (next: Op) => {
    if (acc !== null && op && !fresh) {
      const r = apply(acc, value(), op);
      setAcc(r);
      setEntry(format(r));
    } else {
      setAcc(value());
    }
    setOp(next);
    setFresh(true);
  };

  const equals = () => {
    if (!fresh && isExitCode(entry, code, !!op)) {
      setEntry("0");
      setFresh(true);
      void leaveStealth();
      return;
    }
    if (acc !== null && op) {
      const r = apply(acc, value(), op);
      setEntry(format(r));
      setAcc(null);
      setOp(null);
      setFresh(true);
    }
  };

  const clear = () => {
    setEntry("0");
    setAcc(null);
    setOp(null);
    setFresh(true);
  };

  const keys: { k: string; on: () => void; kind?: "op" | "fn" }[][] = [
    [{ k: "C", on: clear, kind: "fn" }, { k: "±", on: () => setEntry(format(-value())), kind: "fn" }, { k: "%", on: () => setEntry(format(value() / 100)), kind: "fn" }, { k: "÷", on: () => operator("÷"), kind: "op" }],
    [{ k: "7", on: () => digit("7") }, { k: "8", on: () => digit("8") }, { k: "9", on: () => digit("9") }, { k: "×", on: () => operator("×"), kind: "op" }],
    [{ k: "4", on: () => digit("4") }, { k: "5", on: () => digit("5") }, { k: "6", on: () => digit("6") }, { k: "−", on: () => operator("−"), kind: "op" }],
    [{ k: "1", on: () => digit("1") }, { k: "2", on: () => digit("2") }, { k: "3", on: () => digit("3") }, { k: "+", on: () => operator("+"), kind: "op" }],
    [{ k: "0", on: () => digit("0") }, { k: ",", on: () => digit(",") }, { k: "⌫", on: () => setEntry(entry.length > 1 && !fresh ? entry.slice(0, -1) : "0"), kind: "fn" }, { k: "=", on: equals, kind: "op" }],
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <StatusBar style="light" />
      <Text style={styles.title}>Calculatrice</Text>
      <View style={styles.display}>
        <Text style={styles.pending}>{acc !== null && op ? `${format(acc)} ${op}` : " "}</Text>
        <Text style={styles.entry} numberOfLines={1} adjustsFontSizeToFit accessibilityLiveRegion="polite">
          {entry}
        </Text>
      </View>
      <View style={styles.pad}>
        {keys.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map(({ k, on, kind }) => (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityLabel={k === "⌫" ? "Effacer" : k}
                onPress={on}
                style={({ pressed }) => [
                  styles.key,
                  kind === "op" ? styles.keyOp : kind === "fn" ? styles.keyFn : styles.keyNum,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.keyText, kind === "fn" && { color: "#1C1C1E" }]}>{k}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000", paddingHorizontal: 16 },
  title: { color: "#8E8E93", fontSize: 15, textAlign: "center" },
  display: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 8, paddingBottom: 12 },
  pending: { color: "#8E8E93", fontSize: 22, textAlign: "right" },
  entry: { color: "#FFFFFF", fontSize: 72, fontWeight: "300", textAlign: "right" },
  pad: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  key: { flex: 1, aspectRatio: 1, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  keyNum: { backgroundColor: "#333333" },
  keyFn: { backgroundColor: "#A5A5A5" },
  keyOp: { backgroundColor: "#FF9F0A" },
  keyText: { color: "#FFFFFF", fontSize: 30 },
});
