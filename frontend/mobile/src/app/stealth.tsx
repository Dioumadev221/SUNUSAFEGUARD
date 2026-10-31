import { useEffect } from "react";
import { View } from "react-native";
import { quickExit } from "@/services/session.service";

/**
 * Écran 5 — Sunu Discret (arborescence du CDC mobile §10). La calculatrice elle-même est affichée
 * par le layout racine, à la place de toute la navigation, pour qu'aucun « retour » n'y ramène.
 * Ouvrir cette route (lien sunusafeguard://stealth) déclenche simplement la sortie rapide.
 */
export default function Stealth() {
  useEffect(() => {
    void quickExit();
  }, []);
  return <View style={{ flex: 1, backgroundColor: "#000000" }} />;
}
