import { t } from './i18n/i18n.js';
import { SERVICE_FILTERS } from './filters.js';
import { displayName } from './place-name.js';

export function sortPlaces(places, sortKey, sortAsc) {
  return [...places].sort((a, b) => {
    // Sort the name column by the *displayed* name so the alphabetical
    // order matches what the user sees in the current UI language
    // (romanized names under English, Korean otherwise — issue #5).
    let av = sortKey === 'name' ? displayName(a) : a[sortKey];
    let bv = sortKey === 'name' ? displayName(b) : b[sortKey];
    if (av == null) av = typeof bv === 'number' ? -Infinity : '';
    if (bv == null) bv = typeof av === 'number' ? -Infinity : '';
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });
}

/** Small colored pills for the services a place offers (confirmed = 1 only). */
function serviceBadges(p) {
  const badges = SERVICE_FILTERS
    .filter(({ column }) => p[column] === 1)
    .map(({ key }) => `<span class="service-pill service-${key}">${t('services.' + key)}</span>`);
  return badges.length ? `<span class="service-pills">${badges.join('')}</span>` : t('table.emptyValue');
}

function ratingCell(p) {
  if (p.avg_rating == null) return t('table.emptyValue');
  const rating = `<span class="rating-star">\u2605</span> ${Number(p.avg_rating).toFixed(1)}`;
  const count = p.total_reviews != null
    ? ` <span class="rating-count">(${p.total_reviews})</span>`
    : '';
  return rating + count;
}

/** Re-render the fixed table header labels for the active locale. */
export function renderTableHeaders() {
  document.querySelectorAll('#placeTable th[data-i18n]').forEach(th => {
    th.textContent = t(th.dataset.i18n);
  });
}

export function renderTable(sortedPlaces, selectedPlaceId, onRowClick) {
  const tbody = document.querySelector('#placeTable tbody');
  const empty = t('table.emptyValue');
  tbody.innerHTML = '';

  for (const p of sortedPlaces) {
    const tr = document.createElement('tr');
    if (p.place_id === selectedPlaceId) tr.classList.add('selected-row');
    tr.innerHTML = `
      <td class="cell-name">${displayName(p)}</td>
      <td>${p.city || empty}</td>
      <td class="cell-services">${serviceBadges(p)}</td>
      <td>${ratingCell(p)}</td>
      <td>${p.price_from_krw ? p.price_from_krw.toLocaleString() : empty}</td>
      <td>${p.booking_url ? `<a class="booking-link" href="${p.booking_url}" target="_blank" rel="noopener noreferrer">${t('table.book')}</a>` : empty}</td>
      <td>${p.naver_map_url ? `<a href="${p.naver_map_url}" target="_blank" rel="noopener noreferrer">${t('table.mapLink')}</a>` : empty}</td>
    `;
    tr.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return;
      onRowClick(p.place_id);
    });
    tbody.appendChild(tr);
  }
}

export function updateSortArrows(sortKey, sortAsc) {
  document.querySelectorAll('#placeTable th[data-key]').forEach(th => {
    th.innerHTML = th.textContent.replace(/\s*[▲▼]$/, '');
    if (th.dataset.key === sortKey) {
      th.innerHTML += `<span class="arrow">${sortAsc ? '▲' : '▼'}</span>`;
    }
  });
}

export function bindSortHandlers(onSortChange) {
  // Only headers with a data-key are sortable; the services column is a
  // derived multi-value cell with no meaningful sort order.
  document.querySelectorAll('#placeTable th[data-key]').forEach(th => {
    th.addEventListener('click', () => onSortChange(th.dataset.key));
  });
}
