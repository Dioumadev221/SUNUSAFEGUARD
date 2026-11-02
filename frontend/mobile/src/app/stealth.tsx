import { useEffect } from "react";
import { View } from "react-native";
import { quickExit } from "@/services/session.service";

/**
 * Lien sunusafeguard://stealth : déclenche la sortie rapide, comme le bouton « Sortir ».
 */
export default function Stealth() {
  useEffect(() => {
    void quickExit();
  }, []);
  return <View style={{ flex: 1, backgroundColor: "#000000" }} />;
}
