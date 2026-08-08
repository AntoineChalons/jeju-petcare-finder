// state.js is a singleton module-level store. Every test that mutates
// state resets the fields it touches at the top of the test, so tests
// stay order-independent. We keep tests in one `describe` and use a
// `beforeEach` reset rather than dynamic imports so the module load
// cost is paid once.
import { describe, it, expect, beforeEach } from 'vitest';
import { getState, setState, setFilter, subscribe } from './state.js';

const DEFAULT_FILTERS = () => ({
  city: 'all',
  petType: 'all',
  boarding: false,
  houseSitting: false,
  dropInVisit: false,
  doggyDayCare: false,
  dogWalking: false,
  grooming: false,
  petTraining: false
});

function resetState() {
  setState({
    places: [],
    sortKey: 'name',
    sortAsc: true,
    selectedPlaceId: null,
    locale: 'en',
    filters: DEFAULT_FILTERS(),
  });
}

describe('state store', () => {
  beforeEach(() => {
    resetState();
  });

  it('exposes the current state through getState', () => {
    const s = getState();
    expect(s.sortKey).toBe('name');
    expect(s.sortAsc).toBe(true);
    expect(s.selectedPlaceId).toBe(null);
  });

  it('setState merges a patch into the state without replacing untouched keys', () => {
    setState({ sortKey: 'price_from_krw' });
    const s = getState();
    expect(s.sortKey).toBe('price_from_krw');
    // sortAsc must survive a patch that did not mention it.
    expect(s.sortAsc).toBe(true);
    expect(s.filters.city).toBe('all');
  });

  it('setFilter mutates one filter key without touching the others', () => {
    setFilter('city', 'Jeju City');
    const s = getState();
    expect(s.filters.city).toBe('Jeju City');
    expect(s.filters.petType).toBe('all');
    expect(s.filters.grooming).toBe(false);
  });

  it('setFilter replaces the filters object rather than mutating the old one', () => {
    // Guards against a real bug in the pre-store `let` days: a
    // subscriber that snapshotted `state.filters` would see later
    // filter changes if the object was mutated in place.
    const beforeFilters = getState().filters;
    setFilter('grooming', true);
    const afterFilters = getState().filters;
    expect(afterFilters).not.toBe(beforeFilters);
    expect(beforeFilters.grooming).toBe(false); // snapshot untouched
    expect(afterFilters.grooming).toBe(true);
  });

  it('subscribers are called after every setState, receiving the current state', () => {
    let calls = 0;
    let lastSeen = null;
    const unsubscribe = subscribe(s => {
      calls++;
      lastSeen = s.sortKey;
    });

    setState({ sortKey: 'city' });
    setState({ sortKey: 'avg_rating' });
    expect(calls).toBe(2);
    expect(lastSeen).toBe('avg_rating');

    unsubscribe();
  });

  it('subscribers fire once per setState call, including setFilter', () => {
    let calls = 0;
    const unsubscribe = subscribe(() => {
      calls++;
    });
    setFilter('city', 'Seogwipo');
    setFilter('boarding', true);
    expect(calls).toBe(2);
    unsubscribe();
  });

  it('unsubscribe stops delivering updates to that subscriber', () => {
    let calls = 0;
    const unsubscribe = subscribe(() => {
      calls++;
    });
    setState({ sortKey: 'city' });
    expect(calls).toBe(1);
    unsubscribe();
    setState({ sortKey: 'avg_rating' });
    expect(calls).toBe(1);
  });

  it('supports multiple independent subscribers', () => {
    let a = 0;
    let b = 0;
    const unA = subscribe(() => a++);
    const unB = subscribe(() => b++);
    setState({ sortKey: 'city' });
    expect(a).toBe(1);
    expect(b).toBe(1);
    unA();
    setState({ sortKey: 'avg_rating' });
    // Only B still active.
    expect(a).toBe(1);
    expect(b).toBe(2);
    unB();
  });

  it('setState with selectedPlaceId null clears the current selection', () => {
    setState({ selectedPlaceId: 7 });
    expect(getState().selectedPlaceId).toBe(7);
    setState({ selectedPlaceId: null });
    expect(getState().selectedPlaceId).toBe(null);
  });
});
