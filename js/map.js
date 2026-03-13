// ── map.js — Leaflet init, markers, openPlace coordinator ──

const map = L.map('map', {
  zoomControl: true,
  tap: true  // mobile touch
});

// CartoDB Positron — light, minimal, editorial (like Eater maps)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// Map of place id → { marker, popup }
const markers = {};

function createPinIcon(place) {
  return L.divIcon({
    className: '',  // suppress default leaflet styles
    html: `<div class="map-pin" data-category="${place.category}" id="pin-${place.id}">
             <span class="pin-icon">${place.icon}</span>
           </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38]
  });
}

function createPopupContent(place) {
  return `
    <div class="popup-inner">
      <div class="popup-num" data-category="${place.category}">${place.order}</div>
      <div class="popup-name">${place.name}</div>
      <div class="popup-cuisine">${place.cuisine} · ${place.priceRange}</div>
      <div class="popup-tagline">${place.tagline}</div>
      <a class="popup-link" href="#place-${place.id}" onclick="openPlace(${place.id}, false)">View stop →</a>
    </div>
  `;
}

// Build all markers
const bounds = [];

PLACES.forEach(place => {
  const icon = createPinIcon(place);
  const marker = L.marker(place.coordinates, { icon }).addTo(map);
  const popup = L.popup({ closeButton: false, maxWidth: 240 })
    .setContent(createPopupContent(place));

  marker.bindPopup(popup);

  marker.on('click', () => {
    openPlace(place.id, false);  // false = don't fly (already on pin)
  });

  markers[place.id] = { marker, popup };
  bounds.push(place.coordinates);
});

// Fit map to all pins
if (bounds.length > 0) {
  if (bounds.length === 1) {
    map.setView(bounds[0], 15);
  } else {
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

// ── openPlace — the coordinator called by both map & ui ─
// scrollToCard: if true, scroll the card list to the card
// flyToPin:     if true, animate map to pin
function openPlace(id, scrollToCard = true, flyToPin = true) {
  const place = PLACES.find(p => p.id === id);
  if (!place) return;

  const { marker } = markers[id];

  // Fly map to pin
  if (flyToPin) {
    map.flyTo(place.coordinates, Math.max(map.getZoom(), 16), {
      animate: true,
      duration: 0.6
    });
  }

  // Open popup (slight delay so flyTo doesn't fight it)
  setTimeout(() => {
    marker.openPopup();
    // Mark pin active
    document.querySelectorAll('.map-pin').forEach(el => el.classList.remove('is-active'));
    const pinEl = document.getElementById(`pin-${id}`);
    if (pinEl) pinEl.classList.add('is-active');
  }, flyToPin ? 300 : 0);

  // Scroll card into view
  if (scrollToCard) {
    const card = document.getElementById(`place-${id}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      card.classList.add('pulse');
      setTimeout(() => card.classList.remove('pulse'), 700);
    }
  }

  // Highlight active card
  document.querySelectorAll('.place-card').forEach(el => el.classList.remove('is-active'));
  const card = document.getElementById(`place-${id}`);
  if (card) card.classList.add('is-active');

  // Update URL hash without triggering scroll
  history.replaceState(null, '', `#place-${id}`);
}

// Expose globally for popup onclick
window.openPlace = openPlace;

// Lightweight pan used by mobile scroll sync (no popup, no URL update)
function panToPlace(id) {
  const place = PLACES.find(p => p.id === id);
  if (!place) return;
  map.panTo(place.coordinates, { animate: true, duration: 0.4 });
  document.querySelectorAll('.map-pin').forEach(el => el.classList.remove('is-active'));
  const pin = document.getElementById(`pin-${id}`);
  if (pin) pin.classList.add('is-active');
  document.querySelectorAll('.place-card').forEach(el => el.classList.remove('is-active'));
  const card = document.getElementById(`place-${id}`);
  if (card) card.classList.add('is-active');
}
window.panToPlace = panToPlace;

// Remeasure after layout settles (fixes blank map on mobile)
setTimeout(() => map.invalidateSize(), 100);
