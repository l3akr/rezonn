#!/usr/bin/env node
/**
 * Build du site REZONN → dossier dist/ (c'est lui qui est publié sur GitHub Pages).
 *
 *  1. Copie les fichiers du site (index.html, styles.css, script.js, assets/).
 *  2. Optimise chaque photo de /photos : version plein écran (≤ 2000 px, WebP)
 *     + miniature HD (≤ 1600 px) pour les tuiles + petite vignette (≤ 800 px). Les originaux
 *     ne sont JAMAIS publiés — le site charge donc beaucoup plus vite.
 *  3. Génère dist/manifest.json (séries, titres, descriptions, dimensions).
 *
 * Structure attendue :
 *   photos/events|shooting|performances|animal/<série>/01.jpg, 02.jpg, ...
 *       <série> peut commencer par un numéro d'ordre : "12 Toad & Akusis 2026".
 *       Description après un tiret entouré d'espaces :
 *       "12 flashday tattoo - le confidentiel".
 *       Le numéro sert uniquement au tri (plus grand = plus récent = affiché
 *       en premier) et n'apparaît jamais sur le site.
 *   photos/archives/01.jpg, 02.jpg, ...        (galerie plate)
 *   photos/prints/visuel.jpg (+ prints.json optionnel : titre / format / prix)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PHOTOS_DIR = path.join(ROOT, 'photos');

const IMAGE_EXT = /\.(jpe?g|png|webp|heic)$/i;
const SERIES_CATEGORIES = ['events', 'shooting', 'performances', 'animal'];
const FLAT_CATEGORIES = ['archives'];

const FULL_MAX = 2000;   // px, plus grand côté de la version plein écran
const THUMB_MAX = 1600;  // px, tuiles du menu / accueil (grandes tuiles → haute définition)
const SMALL_MAX = 800;   // px, couvertures de séries et tirages (petites vignettes)
const FULL_QUALITY = 82;
const THUMB_QUALITY = 82;
const SMALL_QUALITY = 76;

/* ---------- utilitaires ---------- */

function stripOrderPrefix(name) {
  return name.replace(/^\s*\d+[\s\-_.]*/, '');
}

function orderOf(name) {
  const m = name.match(/^\s*(\d+)/);
  return m ? parseInt(m[1], 10) : -1;
}

/* "12 flashday tattoo - le confidentiel" → titre "FLASHDAY TATTOO",
   description "le confidentiel" (séparateur : tiret entouré d'espaces) */
function parseFolderName(name) {
  const parts = stripOrderPrefix(name).split(/\s+[-–—]\s+/);
  return {
    title: parts[0].replace(/[-_]+/g, ' ').trim().toUpperCase(),
    description: parts.slice(1).join(' — ').trim()
  };
}

function titleize(name) {
  return stripOrderPrefix(name).replace(/[-_]+/g, ' ').trim().toUpperCase();
}

const enc = parts => parts.map(encodeURIComponent).join('/');

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => IMAGE_EXT.test(f))
    .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
}

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else if (entry.name !== '.gitkeep') fs.copyFileSync(s, d);
  }
}

/* pool de tâches pour ne pas saturer la mémoire */
async function runPool(tasks, limit = 4) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

/* ---------- traitement d'une photo ---------- */

/* srcFile : chemin absolu de l'original ; relParts : segments relatifs sous photos/
   (dernier segment = nom de fichier original). Retourne {src, thumb, w, h}. */
async function processImage(srcFile, relParts) {
  const base = relParts[relParts.length - 1].replace(IMAGE_EXT, '');
  const dirParts = relParts.slice(0, -1);
  const outDir = path.join(DIST, 'photos', ...dirParts);
  fs.mkdirSync(outDir, { recursive: true });

  const fullName = `${base}.webp`;
  const thumbName = `${base}.t.webp`;
  const smallName = `${base}.s.webp`;

  const pipeline = sharp(srcFile, { failOn: 'none' }).rotate(); // respecte l'orientation EXIF
  const full = await pipeline.clone()
    .resize({ width: FULL_MAX, height: FULL_MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: FULL_QUALITY })
    .toFile(path.join(outDir, fullName));

  await pipeline.clone()
    .resize({ width: THUMB_MAX, height: THUMB_MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toFile(path.join(outDir, thumbName));

  await pipeline.clone()
    .resize({ width: SMALL_MAX, height: SMALL_MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: SMALL_QUALITY })
    .toFile(path.join(outDir, smallName));

  return {
    src: enc(['photos', ...dirParts]) + '/' + encodeURIComponent(fullName),
    thumb: enc(['photos', ...dirParts]) + '/' + encodeURIComponent(thumbName),
    small: enc(['photos', ...dirParts]) + '/' + encodeURIComponent(smallName),
    w: full.width,
    h: full.height
  };
}

/* version tolérante : une photo illisible est signalée puis ignorée,
   elle ne bloque plus le déploiement du reste du site */
async function safeProcess(srcFile, relParts) {
  try {
    return await processImage(srcFile, relParts);
  } catch (err) {
    console.warn(`⚠️  Photo ignorée (illisible) : ${relParts.join('/')} — ${err.message}`);
    return null;
  }
}

/* ---------- catégories ---------- */

async function buildSeriesCategory(key) {
  const dir = path.join(PHOTOS_DIR, key);
  // plus grand numéro d'abord (= plus récent), puis ordre alphabétique
  const folders = listDirs(dir).sort((a, b) =>
    orderOf(b) - orderOf(a) || a.localeCompare(b, 'fr', { numeric: true }));

  const series = [];
  for (const folder of folders) {
    const files = listImages(path.join(dir, folder));
    if (!files.length) continue;

    const images = (await runPool(files.map(f => () =>
      safeProcess(path.join(dir, folder, f), [key, folder, f])))).filter(Boolean);
    if (!images.length) continue;

    const { title, description } = parseFolderName(folder);
    series.push({ title, description, order: orderOf(folder), images });
  }
  return series;
}

async function buildFlatCategory(key) {
  const dir = path.join(PHOTOS_DIR, key);
  const files = listImages(dir);
  return (await runPool(files.map(f => () => safeProcess(path.join(dir, f), [key, f])))).filter(Boolean);
}

async function buildPrints() {
  const dir = path.join(PHOTOS_DIR, 'prints');
  const files = listImages(dir);

  let meta = {};
  const metaPath = path.join(dir, 'prints.json');
  if (fs.existsSync(metaPath)) {
    try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); }
    catch (e) { console.warn('⚠️  prints.json invalide, ignoré :', e.message); }
  }

  const imgs = await runPool(files.map(f => () => safeProcess(path.join(dir, f), ['prints', f])));
  return files.map((f, i) => ({ f, img: imgs[i] })).filter(x => x.img).map(({ f, img }) => {
    const info = meta[f] || {};
    return {
      title: info.title || titleize(f.replace(IMAGE_EXT, '')),
      format: info.format || '—',
      price: info.price || '—',
      image: img.small,
      full: img.src
    };
  });
}

/* ---------- main ---------- */

(async () => {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const cfgPath = path.join(ROOT, 'site.config.json');
  const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
  const siteUrl = (process.env.SITE_URL || cfg.siteUrl || '').replace(/\/+$/, '');
  const gsc = (cfg.googleVerification || '').trim();

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    .replace(/__SITE_URL__/g, siteUrl)
    .replace('<!--GSC_VERIFICATION-->', gsc ? `<meta name="google-site-verification" content="${gsc}">` : '');
  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  ['styles.css', 'script.js'].forEach(f => fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f)));

  // SEO : robots.txt + sitemap.xml (+ fichier de vérification Google éventuel)
  fs.writeFileSync(path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>${siteUrl}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n`);
  for (const f of fs.readdirSync(ROOT)) {
    if (/^google[0-9a-f]+\.html$/i.test(f)) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
  }
  copyRecursive(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));

  const manifest = {};
  for (const key of SERIES_CATEGORIES) manifest[key] = await buildSeriesCategory(key);
  for (const key of FLAT_CATEGORIES) manifest[key] = await buildFlatCategory(key);
  manifest.prints = await buildPrints();

  fs.writeFileSync(path.join(DIST, 'manifest.json'), JSON.stringify(manifest));

  console.log('Site généré dans', DIST);
  Object.entries(manifest).forEach(([k, v]) => console.log(` - ${k}: ${v.length} élément(s)`));
})().catch(err => { console.error(err); process.exit(1); });
