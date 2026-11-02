---
id: kb-006
title: "Confidentialité et limites du prototype"
type: demo
source: "SunuSafeguard AI — notice de confidentialité"
verified: false
last_reviewed: "2026-10-27"
---

# Confidentialité et limites du prototype

SunuSafeguard AI a été conçu selon les principes de confidentialité par conception. Cette fiche explique comment les données sont traitées dans le prototype actuel.

## Données conservées

Le prototype ne conserve pas les messages de conversation. Lorsqu'une requête est envoyée au modèle d'IA, le texte est traité temporairement en mémoire et n'est pas écrit sur disque. Aucun identifiant personnel n'est demandé ni associé à l'usage.

## Mesures agrégées

Le prototype conserve uniquement des compteurs agrégés : nombre total de requêtes, distribution des sujets abordés, et nombre de réponses produites par le modèle. Ces compteurs ne permettent pas de relier une requête à une personne.

## Limites du prototype

Le prototype ne dispose pas encore d'authentification, ne met pas en œuvre de chiffrement de bout en bout au-delà du HTTPS du déploiement, et n'a pas fait l'objet d'une évaluation clinique. Il ne doit pas être utilisé comme seul moyen de soutien en situation de détresse grave.

## Signalement d'un problème

Les utilisateurs qui remarqueraient un comportement anormal ou une erreur peuvent interrompre l'utilisation et, s'ils le souhaitent, faire part de l'observation à l'équipe projet. Aucune donnée nominative n'est collectée à cette fin.
