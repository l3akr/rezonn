# REZONN — site vitrine

Site statique (HTML/CSS/JS, sans build) avec mise à jour automatique des photos
via GitHub Actions.

## Mise en ligne (une seule fois)

1. Crée un dépôt GitHub et pousse tout ce dossier dedans (branche `main`).
2. Dans le dépôt : **Settings → Pages → Build and deployment → Source : "GitHub Actions"**.
3. Pousse un commit (ou relance le workflow manuellement dans l'onglet **Actions**) :
   le site se déploie automatiquement à l'URL `https://<utilisateur>.github.io/<depot>/`.

Chaque `push` sur `main` régénère `manifest.json` à partir du contenu de `/photos`
et redéploie le site — aucune action manuelle supplémentaire n'est nécessaire.

## Ajouter des photos

### CLUB / SHOOTING / FAUNE / ARCHIVES

Chaque sous-dossier de série devient une entrée sur le site. Le nom du dossier
devient le titre affiché (tirets/underscores → espaces, en majuscules).

```
photos/
  club/
    nuit-blanche/
      01.jpg
      02.jpg
      03.jpg
    after-hours/
      01.jpg
      02.jpg
  shooting/
    studio-01/
      01.jpg
      ...
  faune/
    ...
  archives/
    ...
```

- Formats acceptés : `.jpg`, `.jpeg`, `.png`, `.webp`.
- Les images sont triées par ordre alphabétique/numérique (`01.jpg` avant `02.jpg`).
- La première image du dossier sert de couverture (vignette de la série).
- Une série sans image n'apparaît pas — le placeholder reste affiché tant que le
  dossier est vide.

### PRINTS

Les images se placent directement dans `photos/prints/` (pas de sous-dossier) :

```
photos/prints/
  nuit-blanche-04.jpg
  reserve-02.jpg
  prints.json   (optionnel)
```

Sans `prints.json`, le titre est déduit du nom de fichier, et le format/prix
affichent `—`. Pour préciser ces informations, complète `prints.json` :

```json
{
  "nuit-blanche-04.jpg": { "title": "NUIT BLANCHE — 04", "format": "30×40 cm — éd. 25", "price": "180 €" },
  "reserve-02.jpg": { "title": "RÉSERVE — 02", "format": "40×60 cm — éd. 15", "price": "260 €" }
}
```

(la clé est le nom du fichier tel qu'il apparaît dans le dossier `photos/prints/`)

## Structure du projet

```
index.html               page + squelette (header, footer, #app)
styles.css                design (fond anthracite, grilles décalées, grain)
script.js                 routeur + fusion des données réelles/placeholder
scripts/generate-manifest.js   génère manifest.json à partir de /photos
.github/workflows/deploy.yml   build + déploiement GitHub Pages automatique
photos/                   tes photos, organisées par catégorie
```

## Typo de marque

Le wordmark REZONN utilise pour l'instant Big Shoulders Display en placeholder
(mention "TYPO — À VENIR" sous le logo). Une fois la typo définitive prête,
remplace la référence dans `styles.css` (`--font-display`) et retire la mention
`.wordmark-note` dans `index.html`.
