# REZONN — site vitrine

Site statique (HTML/CSS/JS). À chaque `push` sur `main`, GitHub Actions optimise
les photos (WebP + miniatures), génère le site dans `dist/` et le publie sur
GitHub Pages. Les originaux ne sont jamais publiés → le site charge vite.

## Mise en ligne (une seule fois)

1. Pousse tout ce dossier sur ton dépôt GitHub (branche `main`).
2. **Settings → Pages → Build and deployment → Source : "GitHub Actions"**.
3. Le workflow `.github/workflows/deploy.yml` se lance tout seul à chaque push.

## Logo et icône

Dépose tes deux fichiers dans `assets/` :

```
assets/logo.png       ← RESONN.PNG   (header, écran de chargement, accueil)
assets/favicon.png    ← REZONNICON.PNG (icône d'onglet)
```

Tant que `logo.png` est absent, le site affiche le texte "REZONN" à la place.

## Ajouter des photos

### ÉVÈNEMENTS / SHOOTING / PERFORMANCES / ANIMAL — séries

Un sous-dossier = une série. Son nom devient le titre affiché (en majuscules).

**Ordre** : commence le nom du dossier par un numéro suivi d'un espace
(`12 Toad & Akusis 2026`). **Plus le numéro est grand, plus la série est
récente → elle s'affiche en premier.** Le numéro n'apparaît jamais sur le site.

**Description** (optionnelle) : ajoute-la dans le nom du dossier après un tiret
entouré d'espaces : `12 flashday tattoo - le confidentiel` → titre
« FLASHDAY TATTOO », description « le confidentiel ». Un tiret sans espaces
(`after-hours`) reste dans le titre.

```
photos/
  events/
    12 Toad & Akusis 2026 - Soirée au Bikini/
      01.jpg
      02.jpg
    3 After Hours/
      01.jpg
  shooting/ ...
  performances/ ...
  animal/ ...
```

- Formats : `.jpg`, `.jpeg`, `.png`, `.webp`. (Les `.heic` d'iPhone ne sont pas toujours lisibles : exporte-les en JPG.)
- Dans une série, les photos sont triées par nom (`01.jpg` avant `02.jpg`) ;
  la première sert de couverture.
- Les photos gardent leur format d'origine (portrait / paysage), sans recadrage.

### ARCHIVES — galerie plate

Photos directement dans `photos/archives/` (pas de sous-dossier).

### PRINTS

Images directement dans `photos/prints/`, plus un `prints.json` optionnel :

```json
{
  "nuit-blanche-04.jpg": { "title": "NUIT BLANCHE — 04", "format": "30×40 cm — éd. 25", "price": "180 €" }
}
```

## Tester en local

```
npm install
node scripts/build.js      # génère dist/
cd dist && python3 -m http.server 8000
```

## Structure

```
index.html, styles.css, script.js   le site
assets/                             logo.png, favicon.png
photos/                             tes photos (originaux)
scripts/build.js                    optimisation + manifest.json → dist/
package.json                        dépendance : sharp
.github/workflows/deploy.yml        build + déploiement GitHub Pages
```

## Référencement (SEO)

- `site.config.json` : `siteUrl` = adresse publique du site (mets ton domaine Porkbun
  une fois branché, ex. `https://tondomaine.com`) ; `googleVerification` = code de la
  balise Search Console (voir ci-dessous).
- Le build génère automatiquement `robots.txt` et `sitemap.xml`.
- Un fichier `googleXXXX.html` (méthode « fichier HTML » de Google) placé à la racine
  du dépôt est copié tel quel sur le site.

### Search Console
1. https://search.google.com/search-console → « Ajouter une propriété ».
2. Domaine perso : « Domaine » + enregistrement TXT chez Porkbun (DNS) ; sinon
   « Préfixe d'URL » + méthode « Balise HTML » : copie uniquement la valeur de `content="…"`
   dans `googleVerification`, push, puis « Valider ».
3. Menu « Sitemaps » → saisis `sitemap.xml` → Envoyer.
