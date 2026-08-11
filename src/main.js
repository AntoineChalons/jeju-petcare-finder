import { loadPlacesFromDb } from './db-loader.js';
import { buildDbStatusReport } from './db-diagnostics.js';
import { initMap, renderMap, focusMarker } from './map-controller.js';
import { initDrawer, renderDrawer } from './drawer-controller.js';
import { sortPlaces, renderTable, renderTableHeaders, updateSortArrows, bindSortHandlers } from './table-controller.js';
import { getState, setState, setFilter, subscribe } from './state.js';
import { buildFilterOptions, applyFilters, SERVICE_FILTERS } from './filters.js';
import { renderFilterLabels, renderFilterOptions, syncFilterControls, updateFilterSummary, bindFilterHandlers } from './filter-bar.js';
import { getInitialLocale, setLocale, t } from './i18n/i18n.js';
import { renderLanguageSwitcher, bindLanguageSwitcher } from './i18n/language-switcher.js';

const DEFAULT_FILTERS = {
  city: 'all',
  petType: 'all',
  language: 'all',
  ...Object.fromEntries(SERVICE_FILTERS.map(({ key }) => [key, false]))
};

function selectPlace(placeId) {
  const { selectedPlaceId } = getState();
  setState({ selectedPlaceId: selectedPlaceId === placeId ? null : placeId });
  const next = getState().selectedPlaceId;
  if (next != null) focusMarker(next);
}

/**
 * The drawer's own close button / Esc / backdrop clear the selection, which
 * funnels back through the normal render pipeline so the table row and map
 * marker de-highlight in step with the drawer closing.
 */
function onDrawerClose() {
  if (getState().selectedPlaceId != null) setState({ selectedPlaceId: null });
}

function onSortChange(key) {
  const { sortKey, sortAsc } = getState();
  setState(sortKey === key
    ? { sortAsc: !sortAsc }
    : { sortKey: key, sortAsc: true });
}

function onFilterChange(key, value) {
  setFilter(key, value);
}

function onFilterReset() {
  setState({ filters: { ...DEFAULT_FILTERS } });
}

function onLocaleChange(locale) {
  setLocale(locale);
  setState({ locale });
}

/**
 * Apply every static (non-data-dependent) translated string: page title,
 * headers, filter bar labels, footer, language switcher. Called on init
 * and whenever the locale changes.
 */
function renderStaticText(state) {
  document.title = t('title');
  document.documentElement.lang = state.locale;
  document.getElementById('page-title').textContent = t('title');
  document.getElementById('page-subtitle').textContent = t('subtitle');
  document.getElementById('footer-prompt').textContent = t('footer.prompt');
  document.getElementById('footer-link').textContent = t('footer.link');
  // The #status element is used for the developer diagnostics banner,
  // gated behind ?debug=1 (see db-diagnostics.js). In non-debug mode
  // buildDbStatusReport() returns '', so we don't render the transient
  // "Loading…" text either — the header row alone is enough for users.
  const statusEl = document.getElementById('status');
  if (state.places.length) {
    statusEl.innerHTML = buildDbStatusReport(state.places);
    renderFilterOptions(buildFilterOptions(state.places));
    // Rebuilding the <select> options above resets the DOM selection, so
    // restore it from state immediately (independent of the main render
    // pipeline, which only fires on setState()).
    syncFilterControls(state.filters);
    updateFilterSummary(applyFilters(state.places, state.filters).length, state.places.length);
  } else {
    const debugReport = buildDbStatusReport(state.places);
    statusEl.innerHTML = debugReport || '';
    if (!debugReport) statusEl.textContent = '';
    else statusEl.textContent = t('loading');
  }
  renderTableHeaders();
  renderFilterLabels();
  renderLanguageSwitcher();
}

/**
 * Single render pipeline: derive the filtered + sorted list from state,
 * then let every view react. Every state mutation funnels through here via
 * the subscribe() callback below, so views never fall out of sync with
 * each other or with the filters/locale.
 */
function render(state) {
  const filtered = applyFilters(state.places, state.filters);
  const sorted = sortPlaces(filtered, state.sortKey, state.sortAsc);

  renderTable(sorted, state.selectedPlaceId, selectPlace);
  updateSortArrows(state.sortKey, state.sortAsc);
  renderMap(sorted, state.selectedPlaceId, selectPlace);
  // Drive the drawer off the filtered list, not state.places: if the
  // selected place is filtered out, find() returns undefined and the drawer
  // closes rather than describing a place that is no longer on screen.
  renderDrawer(sorted.find(p => p.place_id === state.selectedPlaceId) || null);

  syncFilterControls(state.filters);
  updateFilterSummary(filtered.length, state.places.length);
}

async function init() {
  const locale = getInitialLocale();
  setLocale(locale);
  setState({ locale });

  renderStaticText(getState());
  bindLanguageSwitcher((newLocale) => {
    onLocaleChange(newLocale);
    renderStaticText(getState());
    render(getState());
  });

  initMap();
  initDrawer(onDrawerClose);
  bindSortHandlers(onSortChange);
  bindFilterHandlers(onFilterChange, onFilterReset);
  subscribe(render);

  try {
    const places = await loadPlacesFromDb();
    document.getElementById('status').innerHTML = buildDbStatusReport(places);
    renderFilterOptions(buildFilterOptions(places));
    setState({ places });
  } catch (err) {
    document.getElementById('status').textContent = t('errorLoading', { error: err });
    console.error(err);
  }
}

init();
