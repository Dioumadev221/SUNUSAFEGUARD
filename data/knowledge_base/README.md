# Base documentaire de démonstration

⚠️ **Contenus de démonstration (Phase 1).** Ils ont été rédigés pour tester la
chaîne RAG et **doivent être revus, corrigés et validés** par les experts
habilités (juristes, professionnel·les psychosociaux, santé, linguistes)
avant toute ouverture au public (CDC §5.2, §11.2).

Chaque fichier commence par un en-tête de métadonnées (`---`) lu par
`scripts/seed.py` : titre, source, catégorie, langue, statut, dates.

Seuls les documents au statut `publie` sont accessibles à l'assistant.

## Sous-dossier `connaissance/`

Fiches reprises de la base de connaissances d'un projet précédent (bien-être, stress, soutien
d'un proche, idées suicidaires, ressources au Sénégal, confidentialité). Leur en-tête d'origine est
conservé ; `_manifest.json` leur attribue une catégorie et un statut. La fiche
`06_confidentialite.md` reste « à vérifier » car elle décrit un prototype sans authentification.

Tout sous-dossier de `knowledge_base/` est chargé par `python -m app.cli seed`.
