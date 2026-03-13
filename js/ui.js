// ── ui.js — Card list rendering, click handlers, scroll sync ──

const placeList = document.getElementById('place-list');

// Sort by order field before rendering
const sorted = [...PLACES].sort((a, b) => a.order - b.order);

// Update stop count badge
const stopCountEl = document.getElementById('stop-count');
if (stopCountEl) {
  stopCountEl.textContent = `${sorted.length} stop${sorted.length !== 1 ? 's' : ''}`;
}

sorted.forEach(place => {
  const card = document.createElement('article');
  card.className = 'place-card';
  card.id = `place-${place.id}`;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Stop ${place.order}: ${place.name}`);

  const photoHTML = place.photo
    ? `<img class="card-photo" src="${place.photo}" alt="${place.name}" loading="lazy" onerror="this.replaceWith(makePlaceholder('${place.category}'))">`
    : `<div class="card-photo-placeholder" data-category="${place.category}"></div>`;

  card.innerHTML = `
    <div class="card-order" data-category="${place.category}">${place.icon}</div>
    <div class="card-body">
      <div class="card-name">${place.name}</div>
      <div class="card-meta">
        ${place.cuisine}
        <span class="price"> · ${place.priceRange}</span>
        ${place.hours ? ` · ${place.hours}` : ''}
      </div>
      <div class="card-tagline">${place.description}</div>
      ${place.mustTry ? `<div class="card-must-try"><strong>Must try:</strong> ${place.mustTry}</div>` : ''}
    </div>
    ${photoHTML}
  `;

  const activate = () => openPlace(place.id, false, true);
  card.addEventListener('click', activate);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
  });

  placeList.appendChild(card);
});

function makePlaceholder(category) {
  const div = document.createElement('div');
  div.className = 'card-photo-placeholder';
  div.dataset.category = category;
  return div;
}
window.makePlaceholder = makePlaceholder;

// ── Mobile scroll sync ──────────────────────────────
if (window.matchMedia('(max-width: 767px)').matches) {
  let scrollTid = null;
  let lastSyncedId = null;

  window.addEventListener('scroll', () => {
    clearTimeout(scrollTid);
    scrollTid = setTimeout(() => {
      const mapEl = document.getElementById('map');
      const headerEl = document.querySelector('.site-header');
      const topOffset = (headerEl?.offsetHeight ?? 0) + (mapEl?.offsetHeight ?? 0);
      const midY = topOffset + (window.innerHeight - topOffset) / 2;

      let best = null, bestDist = Infinity;
      document.querySelectorAll('.place-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const dist = Math.abs((rect.top + rect.height / 2) - midY);
        if (dist < bestDist) { bestDist = dist; best = card; }
      });

      if (best) {
        const id = parseInt(best.id.replace('place-', ''), 10);
        if (id !== lastSyncedId) { lastSyncedId = id; panToPlace(id); }
      }
    }, 80);
  });
}

// ── URL hash deep-link ──────────────────────────────
function handleHashLink() {
  const match = window.location.hash.match(/^#place-(\d+)$/);
  if (match) {
    const id = parseInt(match[1], 10);
    setTimeout(() => openPlace(id, true, true), 400);
  }
}

window.addEventListener('load', handleHashLink);
