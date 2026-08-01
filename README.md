# REZONN — site vitrine

Site statique (HTML/CSS/JS, sans build) avec mise à jour automatique des photos
via GitHub Actions.

## Ajouter des photos

### CLUB / SHOOTING / FAUNE / ARCHIVES

Chaque sous-dossier de série devient une entrée sur le site. Le nom du dossier
devient le titre affiché (tirets/underscores → espaces, en majuscules).

```
photos/
  club/
    bikini/
      01.png
      02.png
      03.png
    mélomane/
      01.png
      02.png
  shooting/
    lac-de-ouf/
      01.png
      ...
  faune/
    ...
  archives/
    ...
```

- Formats acceptés par l'interface (.png recommandé): `.jpg`, `.jpeg`, `.png`
- Les images sont triées par ordre alphabétique/numérique (`01.png` avant `02.ong`).
- La première image du dossier sert de couverture (vignette de la série).
- Une série sans image n'apparaît pas — le placeholder reste affiché tant que le
  dossier est vide.

### PRINTS

Les images se placent directement dans `photos/prints/` (pas de sous-dossier) :

```
photos/prints/
  bikibi-04.png
  chien-02.png
  prints.json   (optionnel)
```

Sans `prints.json`, le titre est déduit du nom de fichier, et le format/prix
affichent `—`. Pour préciser ces informations, complète `prints.json` :

```json
{
  "bikini-04.png": { "title": "BIKINI — 04", "format": "30×40 cm — éd. 25", "price": "20 €" },
  "chien-02.png": { "title": "CHIEN — 02", "format": "40×60 cm — éd. 15", "price": "40 €" }
}
```


## Structure du projet

```
index.html               page + squelette (header, footer, #app)
styles.css                design (fond anthracite, grilles décalées, grain)
script.js                 routeur + fusion des données réelles/placeholder
scripts/generate-manifest.js   génère manifest.json à partir de /photos
.github/workflows/deploy.yml   build + déploiement GitHub Pages automatique
photos/                   tes photos, organisées par catégorie
```

## Typo rezonn

(note perso) une fois la typo définitive prête, remplacer la référence dans `styles.css` (`--font-display`) et retirer la mention
`.wordmark-note` dans `index.html`.
