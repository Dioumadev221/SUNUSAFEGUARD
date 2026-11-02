# Charte UI « Teranga »

Direction visuelle : un lieu sûr et accueillant (la *teranga* sénégalaise), sobre et institutionnel.
Tokens définis dans `frontend/tailwind.config.js` et `frontend/src/index.css`.

## Palette (60-30-10)

| Rôle | Token Tailwind | Hex | Usage |
|---|---|---|---|
| Dominante 60 % | `night` | #0C1B24 | Bleu nuit « encre » : textes, aplats sombres, mode discret |
| Secondaire 30 % | `sand` | #F5EFE4 | Papier sable chaud : fonds de lecture |
| Accent 10 % | `teal`, `teal-light` | #0E7C70, #4FD1BE | Couleur clé : boutons d'action, liens, graphiques |
| Chaleur | `ochre`, `ochre-light` | #D9902E, #F2C46D | Soleil levant : logo, soulignés, puces — jamais pour l'urgence |
| Urgence | `alert` | #E11D48 | **Exclusivement** Sortie rapide et numéros d'urgence |
| Succès | `success` | #10B981 | Ressource validée, orientation transmise |
| Avertissement | `warn` | #F59E0B | Rappels de confidentialité |

Les gris (`slate`) sont redéfinis en gris chauds, accordés au papier sable.
Graphiques : sarcelle, ocre, encre, sauge, terre, prune (`src/lib/chart.ts`) — sans rouge.

## Typographie

- Titres : **Fraunces** (serif éditoriale, chaleureuse), italique pour le mot clé d'un titre.
- Texte : **Plus Jakarta Sans**.
- Les deux polices sont embarquées (paquets `@fontsource`) : aucune ressource tierce chargée.

## Motifs

- **Logo** : un cœur où le soleil se lève sur la mer. **Arche** (`.arch`) : la porte d'une maison (« kër ») — cadre des photos.
- **Soulignement tracé à la main** (`.scribble`) en ocre, pour un seul mot par titre.

## Principes conservés

Mode discret (sombre) accessible en un clic dans l'en-tête et appliqué automatiquement si le téléphone
est en mode sombre ; photos atténuées dans ce mode. Bouton « Sortir » (sans icône) toujours visible, y compris sur
mobile (Échap ×2) : il efface la session et remplace la page par google.com. Titre d'onglet neutre (« Sunu — Infos et orientation »). Cibles tactiles ≥ 44 px.
Animations désactivées si l'appareil demande moins d'animations. Graphiques chargés uniquement dans les
espaces professionnels.
