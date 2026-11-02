# SunuSafeguard AI — Tests réalisés et preuves

GREEN T SARL · Préparation de la présentation à UNICEF · Campagne du 2 novembre 2026

Ce document répond au guide « Tests à faire et à documenter ». Chaque statut ci-dessous correspond à un test réellement exécuté le 2 novembre 2026 sur l'installation locale de la plateforme : site web, application mobile (version web d'Expo, écran de téléphone 390 × 844) et API. Quand un test n'a pas pu être fait, ou ne l'a été qu'en partie, c'est écrit.

Environnement : PC portable Windows sans carte graphique, modèle de langue local (Ollama, qwen2.5:3b), reconnaissance vocale locale (Whisper small). Les temps de réponse sont ceux de cette machine. Un serveur avec carte graphique serait nettement plus rapide.

---

## 1. Tableau de preuve

| N° | Test | Statut | Date | Observation | Preuves |
|---|---|---|---|---|---|
| 1 | Inscription et connexion | **Réussi** | 02/11/2026 | Création d'un compte dans l'app, connexion automatique, déconnexion puis reconnexion. Le compte reçoit toujours le profil « Utilisateur ». | `captures/T1-*.png` |
| 2 | Parcours vocal (français) | **Réussi** (fichier audio) | 02/11/2026 | Question enregistrée (voix de synthèse française) transcrite mot pour mot, puis réponse sourcée. Transcription 20 à 39 s, réponse 18 à 36 s. | `api/02-parcours-vocal.json`, `api/02-question-voix-fr.mp3` |
| 2b | Parcours vocal (wolof) | **Non testé** | — | Il faut une vraie personne qui parle wolof : aucune voix de synthèse wolof fiable n'existe pour le tester. | — |
| 3 | Parcours textuel | **Réussi** | 02/11/2026 | La même question par écrit dans l'app et sur le site : réponse en 12 à 57 s. | `captures/T3-1-*.png`, `captures/T5-1-*.png` |
| 4 | Français et wolof | **Partiel** | 02/11/2026 | Les deux langues sont bien reconnues (fr et wo). En wolof, l'assistant répond par une phrase d'accueil en wolof, puis en français, car les ressources validées sont en français. La question wolof doit être relue par une personne wolophone. | `captures/T4-*.png`, `api/04-francais-wolof.json` |
| 5 | Réponse fondée sur les ressources | **Réussi** | 02/11/2026 | La réponse cite sa source : « Violences physiques et verbales — vos droits au Sénégal ». | `captures/T5-1-*.png` et `.json`, `api/05-reponse-sourcee.json` |
| 6 | Question hors périmètre | **Réussi** | 02/11/2026 | Bitcoin, capitale de l'Australie : l'assistant n'invente rien et propose l'annuaire. Demande de diagnostic : il oriente vers un professionnel de santé. Tentative de détournement : la réponse reste sûre, mais le filtre anti-détournement ne s'est pas déclenché (à renforcer). | `captures/T6-1-*.png`, `api/06-hors-perimetre.json` |
| 7 | Orientation humaine avec consentement | **Réussi sur structure de démonstration** | 02/11/2026 | Annuaire → fiche → « Être rappelée » → choix → case de consentement (le bouton reste inactif tant qu'elle n'est pas cochée) → code de suivi → statut réel lu sur le serveur. **La structure est une structure de DÉMONSTRATION.** Vers les 5 vraies structures, l'API refuse l'envoi en ligne (409) : rien n'est transmis. Sans consentement, la demande est refusée (400). | `captures/T7-*.png`, `api/07-orientation.json` |
| 8 | Sécurité des rôles | **Réussi** | 02/11/2026 | 33 contrôles d'accès sur 33 conformes. Utilisateur : « Accès refusé » sur l'espace pro, même par adresse directe, et réponse 403 sur toutes les API d'administration. Admin opérationnel : Impact, Orientation et Ressources, mais pas Tech, comptes ni rôles. Super admin GREEN T : tout, y compris « Comptes & accès ». | `captures/T8-*.png`, `api/08-roles.json`, tests automatiques |
| C1 | Confidentialité (isolation) | **Réussi** | 02/11/2026 | Le compte B ne voit pas la demande du compte A. Le compte A la retrouve depuis un autre appareil. Côté structures, un partenaire ne voit que les demandes de sa structure. | `captures/C1-*.png`, `api/C1-isolation.json` |
| C2 | Déconnexion | **Réussi** | 02/11/2026 | Après déconnexion, la page protégée renvoie vers la connexion. L'ancien jeton, réutilisé, est refusé (401) : la session est fermée côté serveur. | `captures/C2-1-*.png`, journal |
| C3 | Stabilité | **Réussi** | 02/11/2026 | 5 questions écrites sur 5 ont reçu une réponse, en 12,5 à 28,8 s (moyenne 16,7 s). Aucune erreur pendant la campagne de captures (9 questions au total). | `api/C3-stabilite.json` |

En plus des tests ci-dessus, 7 tests automatiques couvrent le contrôle d'accès (`backend/tests/test_roles.py`). Toute la suite de l'API passe : 53 tests sur 53.

---

## 2. Contrôle d'accès mis en place

| Profil | Compte de démonstration | Ce qu'il peut faire | Ce qui lui est refusé |
|---|---|---|---|
| Utilisateur | `utilisateur@sunusafeguard.local` (ou un compte créé dans l'app) | Assistant, annuaire, demandes d'orientation, suivi de **ses** demandes | Tout l'espace pro et toutes les API d'administration |
| Administrateur opérationnel | `operationnel@sunusafeguard.local` | Ressources et contenus validés, annuaire, orientations, indicateurs | Comptes, rôles, supervision technique, journaux, conservation des données |
| Super administrateur GREEN T | `superadmin@sunusafeguard.local` (compte séparé) | Tout, y compris les comptes, les rôles et la configuration technique | — |

- Le contrôle est fait **sur le serveur**, à chaque appel d'API. Le masquage des menus sur le site n'est qu'un confort.
- L'inscription publique donne toujours le profil « Utilisateur », même si quelqu'un tente de demander un autre rôle (testé).
- La déconnexion ferme la session côté serveur.
- Les actions administratives importantes sont tracées : connexion, déconnexion, création ou modification de compte, de structure, de ressource et de statut de demande.
- Le compte est **facultatif** dans l'app. Une personne peut utiliser l'assistant et l'annuaire sans compte. C'est un choix de sécurité pour les personnes en danger.

---

## 3. Points de vigilance pour la présentation

1. **Orientation (test 7)** : la démonstration se fait sur une structure de démonstration. Les 5 vraies structures de l'annuaire (AJS, Maison Rose, CEGID, CLVF Kédougou, La Palabre) n'ont pas encore de compte. L'app ne leur propose donc pas l'envoi en ligne : elle propose d'appeler. Il ne faut pas présenter le parcours comme une prise en charge effective.
2. **Wolof** : la langue est reconnue à l'écrit. Un modèle de reconnaissance vocale wolof est installé, mais il n'a pas été testé avec un vrai locuteur. Les réponses sont en français. La synthèse vocale wolof n'existe pas encore.
3. **Tableaux de bord** : les chiffres affichés dans l'espace pro (interactions, pourcentages) sont des **données de démonstration générées**, pas une utilisation réelle. Il ne faut pas les présenter comme des résultats.
4. **Temps de réponse** : 12 à 57 s par réponse sur ce PC portable sans carte graphique. C'est une limite de cette machine de démonstration, pas de la plateforme : un serveur adapté réduit fortement ce délai.
5. **Filtre anti-détournement** : une tentative de type « ignore tes instructions » a reçu une réponse sûre, mais le filtre dédié ne s'est pas déclenché. C'est à renforcer.

---

## 4. Ce qui reste à faire par l'équipe

- **Vidéo avec son** (tests 1, 2 et 7, deux minutes au maximum) : à filmer sur le téléphone. Les captures de ce dossier sont des images fixes prises automatiquement.
- **Voix en wolof** : faire poser une question à voix haute par une personne wolophone dans l'app, puis noter le résultat dans le tableau.
- **Relecture du wolof** : faire vérifier la question de test wolof par une personne wolophone.

---

## 5. Contenu du dossier

- `captures/` : captures d'écran du site et de l'app, prises dans un vrai navigateur. On y trouve aussi les réponses brutes de l'API (`.json`) et `journal-captures.txt`, le journal horodaté de chaque étape.
- `api/` : requêtes et réponses de l'API pour chaque test, l'audio utilisé pour le test vocal, et `resultats_api.json`.
- Tests automatiques : `backend/tests/test_roles.py`.
