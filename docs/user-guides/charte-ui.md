# Charte UI

Palette 60-30-10 définie dans `frontend/tailwind.config.js`.

| Rôle | Token Tailwind | Hex | Usage |
|---|---|---|---|
| Dominante 60 % | `night`, `night-800` | #0F172A, #1E293B | Fonds sombres, textes principaux |
| Secondaire 30 % | `sand` | #F8FAFC | Fonds de lecture (mode clair) |
| Accent 10 % | `teal`, `teal-light` | #0D9488, #14B8A6 | Boutons d'action, liens, graphiques |
| Urgence | `alert` | #E11D48 | **Exclusivement** Sortie rapide et numéros d'urgence |
| Succès | `success` | #10B981 | Ressource validée, orientation transmise |
| Avertissement | `warn` | #F59E0B | Rappels de confidentialité |

Principes appliqués : mode sombre par défaut, bouton Sortie rapide sur chaque écran (Échap ×2),
titre d'onglet neutre (« Sunu — Infos et orientation »), aucune police ni ressource tierce chargée
(discrétion et faible débit), cibles tactiles ≥ 44 px, graphiques chargés uniquement dans les
espaces professionnels.
