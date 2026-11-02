# SunuSafeguard — application mobile (« Sunu »)

Application Android / iOS (React Native, Expo SDK 58, Expo Router, TypeScript), branchée sur l'API FastAPI du projet.
Même design que le site (palette Teranga, logo cœur, Fraunces + Plus Jakarta Sans), thème sombre par défaut.
Spécification : cahier des charges mobile v1.0. Guide utilisatrice : `docs/user-guides/guide-app-mobile.md`.

## Lancer en développement

```powershell
.\scripts\dev-mobile.ps1        # API joignable sur le Wi-Fi (port 8001) + Expo
```

- **Sur le PC** : ouvrir http://localhost:8081 (extension « Simulateur téléphone mobile » de Chrome, ou mode mobile du navigateur).
- **Sur un téléphone** : Expo Go, même Wi-Fi que le PC, adresse `exp://<IP du PC>:8081`.
  Sur iPhone, Expo Go exige d'être connecté au même compte Expo que le PC (`npx expo login`).
  Le réseau Wi-Fi du PC doit être en « Privé » dans Windows.

## Écrans (CDC mobile §3)

| Espace | Fichier | Contenu |
|---|---|---|
| Accueil | `src/app/index.tsx` | Accroche du site, accès à l'assistant et à l'annuaire, sujets en photos, numéros d'urgence |
| Sunu Écoute + Réponse | `src/app/response.tsx` | Micro (« Je parle » Français / Wolof), puis chat : `POST /api/chat` (canal `mobile`), alerte de crise, Être orientée / Réécouter / Autre question |
| Sunu Ressources | `src/app/resources/` | Annuaire `GET /api/directory`, recherche, région, département, besoin, fiche, Appeler, copie hors connexion |
| Mise en relation | `src/app/referral/[id].tsx` | Données transmises, niveau d'information choisi, consentement, `POST /api/referrals`, code de suivi |
| Sunu Session | `src/app/session.tsx` | Statut réel (`GET /api/referrals/status/{code}`), « Effacer toute trace » |
| Sortie rapide | `src/components/security/QuickExit.tsx`, `src/components/security/ExitScreen.tsx` | « Sortir » efface la conversation et ferme l'app (Android) ; écran noir vide sur iPhone |

## Voix (gratuite, locale)

- Reconnaissance : `POST /api/voice/transcribe` (Whisper-small pour le français, `M9and2M/whisper-small-wolof` pour le wolof, licence MIT),
  sur processeur, ~6 s par message. Installer `backend/requirements-voice.txt`. L'audio reste en mémoire, le fichier est supprimé du téléphone.
- Le texte reconnu est placé dans le champ : l'utilisatrice le relit avant d'envoyer.
- Lecture des réponses : voix française du téléphone (`expo-speech`). **Pas de voix wolof** : aucune solution gratuite et fiable trouvée.

## Confidentialité, côté téléphone

- Conversation en mémoire seulement (effacée à la fermeture, à « Sortir », à l'effacement).
- Codes de suivi, réglages : stockage chiffré du système (`expo-secure-store`). Demande close effacée 30 jours après, toute demande après 180 jours.
- Annuaire public copié localement pour le hors connexion (aucune donnée personnelle), effacé par « Effacer toute trace ».
- Android : écran masqué dans les apps récentes et captures bloquées. iOS : flou dans le sélecteur d'apps.
- Micro et lecture coupés en arrière-plan et à « Sortir ». Aucune notification. Permissions : micro uniquement.

## Fabriquer la version Android (gratuit)

1. `npx eas-cli@latest login` (compte Expo).
2. Remplacer l'adresse de l'API dans `eas.json` (l'API doit être en ligne, en HTTPS).
3. `npx eas-cli@latest build -p android --profile preview` → lien de téléchargement d'un APK.

iOS : nécessite un compte Apple Developer (payant).

## Vérifications

```powershell
npx tsc --noEmit     # typage
npx jest             # 8 tests (disponibilité, conservation locale, lecture vocale)
npx expo-doctor      # configuration Expo (20/20)
```
Côté serveur : `backend/tests/test_mobile.py` (canal mobile, limites de l'API vocale).

## Pas encore fait

- Voix parlée en wolof ; traduction de l'interface en wolof (sélecteur masqué tant que les contenus ne sont pas validés).
- Tests avec des locutrices wolof et sur des téléphones d'entrée de gamme.
- Mise en ligne de l'API et publication sur les stores.
