// Minimal centralized state container.
//
// A single source of truth for app state, updated only through setState(),
// with subscribers notified after every change. Same pattern as the sibling
// project jeju-scuba-finder: views never fall out of sync because every
// mutation funnels through one render pipeline.

const state = {
  places: [],         // raw rows loaded from the database, never mutated after load
  sortKey: 'name',
  sortAsc: true,
  selectedPlaceId: null,
  locale: 'en',        // active UI language; set from i18n before first render
  filters: {
    city: 'all',       // 'all' | one city name
    petType: 'all',    // 'all' | 'dogs' | 'cats' | 'small_pets'
    // Service checkboxes. false = don't filter on this, true = keep only
    // places whose column is confirmed 1. Unknown (null) values are
    // excluded when a checkbox is on: we can't confirm the place offers it.
    boarding: false,
    houseSitting: false,
    dropInVisit: false,
    doggyDayCare: false,
    dogWalking: false,
    grooming: false,
    petTraining: false
  }
};

const subscribers = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  subscribers.forEach(fn => fn(state));
}

export function setFilter(key, value) {
  setState({ filters: { ...state.filters, [key]: value } });
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
