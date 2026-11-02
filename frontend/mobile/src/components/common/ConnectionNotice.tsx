import { useQuery } from "@tanstack/react-query";
import { WifiOff } from "lucide-react-native";
import { View } from "react-native";
import { api } from "@/services/api";
import { Button, Notice, T } from "./ui";
import { fonts, useColors } from "@/theme";
import { useLang } from "@/i18n";

/** État « Connexion indisponible » (CDC mobile §3.1 F) : l'annuaire déjà chargé et les numéros d'urgence restent utilisables. */
export default function ConnectionNotice() {
  const c = useColors();
  const { tx } = useLang();
  const { isError, refetch, isFetching } = useQuery({
    queryKey: ["health"],
    queryFn: () => api<{ status: string }>("/health", { timeoutMs: 8000 }),
    refetchInterval: 30_000,
    retry: 0,
  });
  if (!isError) return null;
  return (
    <Notice tone="warn">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <WifiOff size={18} color={c.ochreSoftText} />
        <T style={{ fontFamily: fonts.semibold, flex: 1 }}>{tx("Connexion indisponible", "No connection")}</T>
      </View>
      <T variant="small">{tx("L'assistant ne peut pas répondre pour le moment. Si vous êtes en danger, appelez les numéros d'urgence en bas de cette page.", "The assistant cannot answer right now. If you are in danger, call the emergency numbers at the bottom of this page.")}</T>
      <Button kind="outline" label={tx("Réessayer", "Try again")} loading={isFetching} onPress={() => void refetch()} />
    </Notice>
  );
}
