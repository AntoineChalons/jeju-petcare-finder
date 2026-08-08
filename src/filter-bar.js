// Renders and wires the filter bar. Options are populated once from the
// full dataset; user interaction only updates the shared state store via
// setFilter(), never touches places/table/map rendering directly.

import { t } from './i18n/i18n.js';
import { SERVICE_FILTERS } from './filters.js';

function optionsHtml(values, allLabel, labelFor) {
  const opts = [`<option value="all">${allLabel}</option>`];
  for (const v of values) {
    opts.push(`<option value="${v}">${labelFor ? labelFor(v) : v}</option>`);
  }
  return opts.join('');
}

/** Re-render the static filter bar labels (not the dynamic options) for the active locale. */
export function renderFilterLabels() {
  document.querySelector('label[for="filter-city"]').textContent = t('filters.city');
  document.querySelector('label[for="filter-pet-type"]').textContent = t('filters.petType');
  document.querySelector('label[for="filter-language"]').textContent = t('filters.language');
  document.getElementById('filter-reset').textContent = t('filters.reset');
  // Service checkboxes: the label element wraps the input and a <span>,
  // so we set the span text and leave the checkbox alone.
  for (const { key } of SERVICE_FILTERS) {
    document.querySelector(`#filter-${key} + span`).textContent = t('services.' + key);
  }
  document.querySelector('.filter-checks').setAttribute('aria-label', t('filters.services'));
}

/** Populate the <select> elements once the place dataset has loaded (or locale changes). */
export function renderFilterOptions(options) {
  document.getElementById('filter-city').innerHTML =
    optionsHtml(options.city, t('filters.allCities'));
  document.getElementById('filter-pet-type').innerHTML =
    optionsHtml(options.petType, t('filters.allPetTypes'), v => t('petTypes.' + v));
  document.getElementById('filter-language').innerHTML =
    optionsHtml(options.language, t('filters.allLanguages'), v => t('languages.' + v) || v);
}

/** Reflect the current filters onto the controls (used on state changes). */
export function syncFilterControls(filters) {
  document.getElementById('filter-city').value = filters.city;
  document.getElementById('filter-pet-type').value = filters.petType;
  document.getElementById('filter-language').value = filters.language;
  for (const { key } of SERVICE_FILTERS) {
    document.getElementById(`filter-${key}`).checked = filters[key];
  }
}

/** Show how many places matched vs. the total, and enable/disable reset. */
export function updateFilterSummary(filteredCount, totalCount) {
  const el = document.getElementById('filter-summary');
  el.textContent = filteredCount === totalCount
    ? t('filters.showingAll', { total: totalCount })
    : t('filters.showingFiltered', { filtered: filteredCount, total: totalCount });

  document.getElementById('filter-reset').disabled = filteredCount === totalCount &&
    isDefaultFilterUi();
}

function isDefaultFilterUi() {
  return document.getElementById('filter-city').value === 'all' &&
    document.getElementById('filter-pet-type').value === 'all' &&
    document.getElementById('filter-language').value === 'all' &&
    SERVICE_FILTERS.every(({ key }) => !document.getElementById(`filter-${key}`).checked);
}

/**
 * Wire user interaction on the filter bar to a single callback:
 * onChange(key, value). Keeps this module free of any dependency on the
 * state store, so it stays easy to test/reuse.
 */
export function bindFilterHandlers(onChange, onReset) {
  document.getElementById('filter-city')
    .addEventListener('change', e => onChange('city', e.target.value));
  document.getElementById('filter-pet-type')
    .addEventListener('change', e => onChange('petType', e.target.value));
  document.getElementById('filter-language')
    .addEventListener('change', e => onChange('language', e.target.value));
  for (const { key } of SERVICE_FILTERS) {
    document.getElementById(`filter-${key}`)
      .addEventListener('change', e => onChange(key, e.target.checked));
  }
  document.getElementById('filter-reset').addEventListener('click', onReset);
}
