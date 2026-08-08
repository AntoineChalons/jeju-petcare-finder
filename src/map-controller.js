import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// MapLibre GL JS + OpenFreeMap positron style — same map as the sibling
// projects jeju-scuba-finder and jeju-beach-finder. Free tiles, no API key
// required. Marker colors follow the PetBacker-inspired theme: purple for
// default markers, coral for the selected one.

let map;
let onMarkerClickCallback = null;
const markerRefs = {};

const COLOR_DEFAULT_STROKE = '#ffffff';
const COLOR_DEFAULT_FILL = '#7c6fc0';
const COLOR_SELECTED = '#e8794a';
// Vets get their own fill color (teal) plus a stethoscope glyph so they
// read as a different kind of place from the round paw-service dots at a
// glance, per GitHub issue #2 ("use a different icon (stethoscope)").
const COLOR_VET_FILL = '#2f8f83';

// Minimal inline stethoscope glyph. Kept tiny/monochrome (currentColor)
// so it stays legible at marker scale and matches either state's fill.
const STETHOSCOPE_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" width="60%" height="60%">
    <path d="M4 4v5a4 4 0 0 0 8 0V4"></path>
    <path d="M8 15a5 5 0 0 0 5 5 5 5 0 0 0 5-5v-2"></path>
    <circle cx="18" cy="7" r="2"></circle>
  </svg>
`;

function markerEl(isSelected, isVet) {
  const el = document.createElement('div');
  const size = isSelected ? 22 : (isVet ? 18 : 14);
  Object.assign(el.style, {
    width: size + 'px',
    height: size + 'px',
    borderRadius: '50%',
    background: isSelected ? COLOR_SELECTED : (isVet ? COLOR_VET_FILL : COLOR_DEFAULT_FILL),
    border: '2px solid ' + COLOR_DEFAULT_STROKE,
    boxShadow: '0 1px 4px rgba(51,46,78,0.35)',
    cursor: 'pointer',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  if (isVet) el.innerHTML = STETHOSCOPE_SVG;
  return el;
}

export function initMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [126.55, 33.35],
    zoom: 9.2,
    attributionControl: true
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
}

// Basic HTML-attribute escape for values interpolated inside href="" and text.
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// The popup is deliberately minimal: the place detail drawer carries the
// full record, so duplicating services/prices here would just be two places
// to keep in sync. The name links out to the place's Naver Map page
// (falling back to the website when Naver is missing).
function popupHtml(p) {
  const titleHref = p.naver_map_url || p.website_url || null;
  const titleHtml = titleHref
    ? `<a class="popup-title popup-title-link" href="${esc(titleHref)}" target="_blank" rel="noopener noreferrer">${esc(p.name)}</a>`
    : `<div class="popup-title">${esc(p.name)}</div>`;
  return `
    ${titleHtml}
    <div class="popup-row">${esc(p.city)}</div>
  `;
}

export function renderMap(list, selectedPlaceId, onMarkerClick) {
  onMarkerClickCallback = onMarkerClick;

  // Remove previous markers before re-rendering.
  Object.values(markerRefs).forEach(entry => entry.marker.remove());
  Object.keys(markerRefs).forEach(k => delete markerRefs[k]);

  const bounds = new maplibregl.LngLatBounds();
  let plotted = 0;

  for (const p of list) {
    if (p.gps_lat == null || p.gps_lng == null) continue;
    const isSelected = p.place_id === selectedPlaceId;
    const isVet = p.vet === 1;
    const el = markerEl(isSelected, isVet);
    const popup = new maplibregl.Popup({ offset: 14, maxWidth: '260px' }).setHTML(popupHtml(p));
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([p.gps_lng, p.gps_lat])
      .setPopup(popup)
      .addTo(map);
    el.addEventListener('click', () => {
      if (onMarkerClickCallback) onMarkerClickCallback(p.place_id);
    });
    markerRefs[p.place_id] = { marker, popup };
    // Re-open the popup for the currently-selected place so a row click,
    // marker click, filter change or locale switch always ends up with the
    // selected place's details visible over the map. Use
    // marker.togglePopup() rather than popup.addTo(map): the popup is
    // already bound to the marker via setPopup(), and toggle is the
    // documented way to open a bound popup.
    if (isSelected) marker.togglePopup();
    bounds.extend([p.gps_lng, p.gps_lat]);
    plotted++;
  }

  if (plotted > 0) {
    // Defer to next frame so the map has current size when style is still loading.
    const applyFit = () => map.fitBounds(bounds, { padding: 40, maxZoom: 13, duration: 400 });
    if (map.loaded()) applyFit();
    else map.once('load', applyFit);
  }
}

export function focusMarker(placeId) {
  const entry = markerRefs[placeId];
  if (!entry) return;
  const lngLat = entry.marker.getLngLat();
  map.easeTo({ center: lngLat, duration: 400 });
  // renderMap() already opens the popup for the selected place during its
  // pass. focusMarker() only needs to ensure it is open in the (rare) case
  // where the state change reaches focusMarker before renderMap.
  if (!entry.popup.isOpen()) entry.marker.togglePopup();
}
