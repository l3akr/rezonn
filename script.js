/* ============================================
   REZONN — données de secours (mode "placeholder")
   Utilisées tant qu'aucune vraie photo n'est présente
   dans /photos pour une catégorie donnée.
   ============================================ */
const FALLBACK_SERIES = {
  club: {
    label: 'CLUB', tone: 'club', meta: '4 SÉRIES — NOCTURNE',
    series: [
      { title: 'NUIT BLANCHE', sub: 'CLUB — SÉRIE 01 — 4 PLANCHES', frames: ['f-a','f-b','f-c','f-d'] },
      { title: 'AFTER HOURS', sub: 'CLUB — SÉRIE 02 — 3 PLANCHES', frames: ['f-a','f-b','f-c'] },
      { title: 'BACKSTAGE', sub: 'CLUB — SÉRIE 03 — 4 PLANCHES', frames: ['f-a','f-b','f-c','f-d'] },
      { title: 'SOUS-SOL', sub: 'CLUB — SÉRIE 04 — 3 PLANCHES', frames: ['f-a','f-b','f-c'] },
    ]
  },
  shooting: {
    label: 'SHOOTING', tone: 'shooting', meta: '4 SÉRIES — STUDIO & EXTÉRIEUR',
    series: [
      { title: 'STUDIO 01', sub: 'SHOOTING — SÉRIE 01 — 4 PLANCHES', frames: ['f-a','f-b','f-c','f-d'] },
      { title: 'LOOKBOOK SS26', sub: 'SHOOTING — SÉRIE 02 — 4 PLANCHES', frames: ['f-a','f-b','f-c','f-d'] },
      { title: 'LUMIÈRE NATURELLE', sub: 'SHOOTING — SÉRIE 03 — 3 PLANCHES', frames: ['f-a','f-b','f-c'] },
      { title: 'PORTRAITS', sub: 'SHOOTING — SÉRIE 04 — 3 PLANCHES', frames: ['f-a','f-b','f-c'] },
    ]
  },
  faune: {
    label: 'FAUNE', tone: 'faune', meta: '3 SÉRIES — TERRAIN',
    series: [
      { title: 'RÉSERVE NATURELLE', sub: 'FAUNE — SÉRIE 01 — 4 PLANCHES', frames: ['f-a','f-b','f-c','f-d'] },
      { title: 'NOCTURNES', sub: 'FAUNE — SÉRIE 02 — 3 PLANCHES', frames: ['f-a','f-b','f-c'] },
      { title: 'LITTORAL', sub: 'FAUNE — SÉRIE 03 — 4 PLANCHES', frames: ['f-a','f-b','f-c','f-d'] },
    ]
  }
};

/* ARCHIVES : pas de séries, une galerie plate — les photos vont directement
   à la racine de photos/archives/ (pas de sous-dossier). */
const FALLBACK_ARCHIVES = { label: 'ARCHIVES', tone: 'archives', meta: 'GALERIE', count: 8 };

const FALLBACK_PRINTS = [
  { name: 'NUIT BLANCHE — 04', format: '30×40 CM — ÉD. 25', price: '—', image: null },
  { name: 'RÉSERVE — 02', format: '40×60 CM — ÉD. 15', price: '—', image: null },
  { name: 'STUDIO 01 — 07', format: '30×40 CM — ÉD. 25', price: '—', image: null },
  { name: 'LITTORAL — 03', format: '50×70 CM — ÉD. 10', price: '—', image: null },
  { name: 'AFTER HOURS — 01', format: '30×40 CM — ÉD. 25', price: '—', image: null },
  { name: 'INÉDITES — 05', format: '40×60 CM — ÉD. 15', price: '—', image: null },
  { name: 'PORTRAITS — 02', format: '30×40 CM — ÉD. 25', price: '—', image: null },
  { name: 'NOCTURNES — 06', format: '50×70 CM — ÉD. 10', price: '—', image: null },
];

const FRAME_CLASSES = ['f-a', 'f-b', 'f-c', 'f-d'];
const FLAT_CATEGORIES = ['archives'];
const INSTAGRAM_URL = 'https://www.instagram.com/re__zonn/';

/* Données effectives, complétées au chargement par manifest.json si présent */
let DATA = {};
let PRINTS_DATA = [];

const app = document.getElementById('app');

/* ============================================
   Chargement de manifest.json (généré par le workflow
   à partir du contenu réel de /photos) et fusion
   avec les données de secours.
   ============================================ */
async function loadManifest() {
  try {
    const res = await fetch('manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('manifest.json introuvable');
    return await res.json();
  } catch (e) {
    // Pas encore de manifest (premier lancement local, ou avant le premier
    // déploiement) : on reste en mode placeholder, sans bloquer le site.
    return null;
  }
}

function mergeData(manifest) {
  Object.keys(FALLBACK_SERIES).forEach(key => {
    const fb = FALLBACK_SERIES[key];
    const real = manifest && Array.isArray(manifest[key]) ? manifest[key] : [];
    DATA[key] = {
      label: fb.label,
      tone: fb.tone,
      meta: real.length ? `${real.length} SÉRIE${real.length > 1 ? 'S' : ''}` : fb.meta,
      series: real.length ? real : fb.series
    };
  });

  FLAT_CATEGORIES.forEach(key => {
    const fb = FALLBACK_ARCHIVES;
    const real = manifest && Array.isArray(manifest[key]) ? manifest[key] : [];
    DATA[key] = {
      label: fb.label,
      tone: fb.tone,
      flat: true,
      meta: real.length ? `${real.length} PHOTO${real.length > 1 ? 'S' : ''}` : fb.meta,
      images: real.length ? real : null,
      count: fb.count
    };
  });

  const realPrints = manifest && Array.isArray(manifest.prints) ? manifest.prints : [];
  PRINTS_DATA = realPrints.length
    ? realPrints.map(p => ({ name: p.title, format: p.format, price: p.price, image: p.image }))
    : FALLBACK_PRINTS;
}

/* ============================================
   Rendu d'un visuel : vraie photo si disponible,
   sinon bloc placeholder (grain + dégradé par catégorie).
   ============================================ */
function media(src, tone, frameLabel) {
  if (src) {
    return `<img class="shot-img" src="${src}" alt="" loading="lazy">
            <span class="frame-num">${frameLabel}</span>`;
  }
  return `<div class="ph tone-${tone}" data-frame="${frameLabel}"></div>`;
}

/* ============================================
   Rendus
   ============================================ */
function categoryCover(key) {
  const cat = DATA[key];
  if (cat.flat) return cat.images ? cat.images[0] : null;
  const first = cat.series[0];
  if (first && first.images && first.images.length) return first.images[0];
  return null;
}

function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <h1 class="hero-word">REZONN</h1>
      <p class="hero-note">Typo à venir</p>
      <p class="hero-tagline">Photographie — Séries — Tirages</p>
      <button class="hero-scroll" id="heroScroll">DÉFILER</button>
    </section>

    <section class="cat-grid view">
      ${tilesHtml()}
    </section>
  `;

  document.getElementById('heroScroll').addEventListener('click', () => {
    document.querySelector('.cat-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function tilesHtml() {
  return [
    catTile('club', 'CLUB', '01'),
    catTile('shooting', 'SHOOTING', '02'),
    catTile('faune', 'FAUNE', '03'),
    catTile('prints', 'PRINTS', '04'),
    catTile('archives', 'ARCHIVES', '05'),
    catTile('contact', 'CONTACT', '06'),
  ].join('');
}

function renderMenuGrid() {
  document.getElementById('menuGrid').innerHTML = tilesHtml();
}

function catTile(key, label, index) {
  let cover = null;
  if (key === 'prints') cover = PRINTS_DATA[0] ? PRINTS_DATA[0].image : null;
  else if (DATA[key]) cover = categoryCover(key);

  return `
    <a href="#/${key}" class="cat-tile c-${key}" data-nav>
      ${media(cover, key, index)}
      <span class="cat-tile-index">${index}</span>
      <span class="cat-tile-label">${label}</span>
    </a>
  `;
}

function renderCategory(key) {
  const cat = DATA[key];
  if (!cat) { renderHome(); return; }

  if (cat.flat) {
    app.innerHTML = `
      <div class="view">
        <div class="cat-header">
          <h1 class="cat-title">${cat.label}</h1>
          <div class="cat-meta"><span>${cat.meta}</span></div>
        </div>
        <div class="series-grid flat-grid">${flatFramesHtml(cat)}</div>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="view">
      <div class="cat-header">
        <h1 class="cat-title">${cat.label}</h1>
        <div class="cat-meta"><span>${cat.meta}</span></div>
      </div>
      <div class="series-list">
        ${cat.series.map((s, i) => seriesItem(cat.tone, s, i)).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.series-head').forEach(head => {
    head.addEventListener('click', () => {
      head.closest('.series-item').classList.toggle('is-open');
    });
  });
}

function flatFramesHtml(cat) {
  const hasImages = Array.isArray(cat.images) && cat.images.length > 0;
  const count = hasImages ? cat.images.length : cat.count;
  return Array.from({ length: count }).map((_, idx) => {
    const cls = FRAME_CLASSES[idx % FRAME_CLASSES.length];
    const src = hasImages ? cat.images[idx] : null;
    const label = String(idx + 1).padStart(2, '0');
    return `<div class="frame ${cls}">${media(src, cat.tone, label)}</div>`;
  }).join('');
}

function seriesItem(tone, series, i) {
  const num = String(i + 1).padStart(2, '0');
  const hasImages = Array.isArray(series.images) && series.images.length > 0;
  const count = hasImages ? series.images.length : series.frames.length;
  const cover = hasImages ? series.images[0] : null;

  const framesHtml = Array.from({ length: count }).map((_, idx) => {
    const cls = hasImages ? FRAME_CLASSES[idx % FRAME_CLASSES.length] : series.frames[idx];
    const src = hasImages ? series.images[idx] : null;
    return `<div class="frame ${cls}">${media(src, tone, num + '_' + (idx + 1))}</div>`;
  }).join('');

  return `
    <div class="series-item">
      <div class="series-head">
        <div class="series-cover">${media(cover, tone, 'COVER — ' + num)}</div>
        <div class="series-info">
          <h2 class="series-title">${series.title}</h2>
          <p class="series-sub">${series.sub || (series.title + ' — ' + count + ' PLANCHES')}</p>
        </div>
        <span class="series-toggle">+</span>
      </div>
      <div class="series-body">
        <div class="series-grid">${framesHtml}</div>
      </div>
    </div>
  `;
}

function renderPrints() {
  app.innerHTML = `
    <div class="view">
      <div class="cat-header">
        <h1 class="cat-title">PRINTS</h1>
        <div class="cat-meta"><span>TIRAGES NUMÉROTÉS — ÉDITIONS LIMITÉES</span></div>
      </div>
      <p class="prints-note">Boutique en préparation — les visuels sans photo réelle sont des emplacements provisoires, et le bouton "Ajouter" est une démonstration d'interface, sans paiement réel pour l'instant.</p>
      <div class="prints-grid">
        ${PRINTS_DATA.map((p, i) => printCard(p, i)).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.print-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      const added = btn.classList.toggle('is-added');
      btn.textContent = added ? 'AJOUTÉ ✓' : 'AJOUTER AU PANIER';
    });
  });
}

function printCard(p, i) {
  const num = String(i + 1).padStart(2, '0');
  const name = p.name || p.title;
  return `
    <div class="print-card">
      <div class="print-visual">${media(p.image, 'prints', num)}</div>
      <div class="print-info">
        <div>
          <div class="print-name">${name}</div>
          <div class="print-format">${p.format}</div>
        </div>
        <div class="print-price">${p.price}</div>
      </div>
      <button class="print-buy">AJOUTER AU PANIER</button>
    </div>
  `;
}

function renderContact() {
  app.innerHTML = `
    <div class="contact-view view">
      <h1 class="contact-title">CONTACT</h1>
      <p class="contact-sub">Pour toute demande — projet, presse, collaboration — rendez-vous sur Instagram.</p>
      <a class="contact-link" href="${INSTAGRAM_URL}" target="_blank" rel="noopener">@RE__ZONN ↗</a>
    </div>
  `;
}

/* ============================================
   Routeur
   ============================================ */
const ROUTES = {
  '': renderHome,
  '/': renderHome,
  '/club': () => renderCategory('club'),
  '/shooting': () => renderCategory('shooting'),
  '/faune': () => renderCategory('faune'),
  '/archives': () => renderCategory('archives'),
  '/prints': renderPrints,
  '/contact': renderContact,
};

function router() {
  const hash = location.hash.replace('#', '') || '/';
  const render = ROUTES[hash] || renderHome;
  render();
  window.scrollTo(0, 0);
  updateActiveTile(hash);
  closeMenu();
}

function updateActiveTile(hash) {
  document.querySelectorAll('#menuGrid .cat-tile').forEach(tile => {
    tile.classList.toggle('is-active', tile.getAttribute('href') === '#' + hash);
  });
}

/* ============================================
   Menu plein écran
   ============================================ */
const menuToggle = document.getElementById('menuToggle');
const menuToggleLabel = menuToggle.querySelector('.menu-toggle-label');
const menuOverlay = document.getElementById('menuOverlay');
const headerWordmark = document.getElementById('headerWordmark');

function openMenu() {
  menuOverlay.classList.add('is-open');
  menuOverlay.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggleLabel.textContent = 'CLOSE';
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  menuOverlay.classList.remove('is-open');
  menuOverlay.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggleLabel.textContent = 'MENU';
  document.body.style.overflow = '';
}

menuToggle.addEventListener('click', () => {
  menuOverlay.classList.contains('is-open') ? closeMenu() : openMenu();
});
headerWordmark.addEventListener('click', () => {
  if (menuOverlay.classList.contains('is-open')) closeMenu();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
});

/* ============================================
   Init — on attend le manifest (+ durée minimale du
   loader) avant le premier rendu, pour éviter un
   flash placeholder -> vraies photos.
   ============================================ */
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

window.addEventListener('hashchange', router);

window.addEventListener('DOMContentLoaded', async () => {
  const [manifest] = await Promise.all([loadManifest(), wait(900)]);
  mergeData(manifest);
  renderMenuGrid();
  router();
  document.getElementById('loader').classList.add('is-hidden');
});
