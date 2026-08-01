#!/usr/bin/env node
/**
 * Génère manifest.json à partir du contenu du dossier /photos.
 * Exécuté automatiquement par le workflow GitHub Actions à chaque déploiement,
 * donc jamais besoin de le lancer à la main — il suffit de pousser des photos.
 *
 * Structure attendue :
 *   photos/club/nom-de-la-serie/01.jpg, 02.jpg, ...
 *   photos/shooting/nom-de-la-serie/...
 *   photos/faune/nom-de-la-serie/...
 *   photos/archives/nom-de-la-serie/...
 *   photos/prints/visuel.jpg (+ prints.json optionnel pour titre/format/prix)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PHOTOS_DIR = path.join(ROOT, 'photos');
const OUTPUT = path.join(ROOT, 'manifest.json');

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const SERIES_CATEGORIES = ['club', 'shooting', 'faune'];
const FLAT_CATEGORIES = ['archives'];

function titleize(name) {
  return name.replace(/[-_]+/g, ' ').trim().toUpperCase();
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => IMAGE_EXT.test(f))
    .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
}

function buildSeriesCategory(key) {
  const dir = path.join(PHOTOS_DIR, key);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => fs.statSync(path.join(dir, f)).isDirectory())
    .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))
    .map(folder => {
      const images = listImages(path.join(dir, folder))
        .map(f => `photos/${key}/${folder}/${f}`);
      return { title: titleize(folder), images };
    })
    .filter(s => s.images.length > 0);
}

function buildFlatCategory(key) {
  const dir = path.join(PHOTOS_DIR, key);
  return listImages(dir).map(f => `photos/${key}/${f}`);
}

function buildPrints() {
  const dir = path.join(PHOTOS_DIR, 'prints');
  const images = listImages(dir);

  let meta = {};
  const metaPath = path.join(dir, 'prints.json');
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (e) {
      console.warn('⚠️  prints.json invalide, ignoré :', e.message);
    }
  }

  return images.map(f => {
    const info = meta[f] || {};
    return {
      title: info.title || titleize(f.replace(IMAGE_EXT, '')),
      format: info.format || '—',
      price: info.price || '—',
      image: `photos/prints/${f}`
    };
  });
}

const manifest = {};
SERIES_CATEGORIES.forEach(key => { manifest[key] = buildSeriesCategory(key); });
FLAT_CATEGORIES.forEach(key => { manifest[key] = buildFlatCategory(key); });
manifest.prints = buildPrints();

fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2));

console.log('manifest.json généré :', OUTPUT);
Object.entries(manifest).forEach(([k, v]) => console.log(` - ${k}: ${v.length} élément(s)`));
