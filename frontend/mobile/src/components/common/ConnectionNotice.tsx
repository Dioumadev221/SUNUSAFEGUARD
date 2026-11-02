import { useQuery } from "@tanstack/react-query";
import { WifiOff } from "lucide-react-native";
import { View } from "react-native";
import { api } from "@/services/api";
import { Button, Notice, T } from "./ui";
import { fonts, useColors } from "@/theme";

/** État « Connexion indisponible » (CDC mobile §3.1 F) : l'annuaire déjà chargé et les numéros d'urgence restent utilisables. */
export default function ConnectionNotice() {
  const c = useColors();
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
        <T style={{ fontFamily: fonts.semibold, flex: 1 }}>Connexion indisponible</T>
      </View>
      <T variant="small">L'assistant ne peut pas répondre pour le moment. Si vous êtes en danger, appelez les numéros d'urgence en bas de cette page.</T>
      <Button kind="outline" label="Réessayer" loading={isFetching} onPress={() => void refetch()} />
    </Notice>
  );
}
