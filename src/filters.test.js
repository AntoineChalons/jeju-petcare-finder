import { describe, it, expect } from 'vitest';
import { applyFilters, buildFilterOptions, SERVICE_FILTERS } from './filters.js';

const NO_SERVICE_FILTERS = Object.fromEntries(SERVICE_FILTERS.map(({ key }) => [key, false]));

const DEFAULTS = {
  city: 'all',
  petType: 'all',
  ...NO_SERVICE_FILTERS
};

const PLACES = [
  {
    place_id: 1,
    name: 'Happy Paws Grooming',
    city: 'Jeju City',
    pet_types: 'dogs, cats',
    boarding: 0, house_sitting: 0, drop_in_visit: 0, doggy_day_care: 0,
    dog_walking: 0, grooming: 1, pet_training: 0
  },
  {
    place_id: 2,
    name: 'Seogwipo Pet Hotel',
    city: 'Seogwipo',
    pet_types: 'dogs',
    boarding: 1, house_sitting: 0, drop_in_visit: 0, doggy_day_care: 1,
    dog_walking: 0, grooming: 1, pet_training: 0
  },
  {
    place_id: 3,
    name: 'Jeju Dog School',
    city: 'Jeju City',
    pet_types: 'dogs',
    boarding: null, house_sitting: null, drop_in_visit: null, doggy_day_care: null,
    dog_walking: null, grooming: null, pet_training: 1
  },
  {
    place_id: 4,
    name: 'Island Sitters',
    city: 'Aewol',
    pet_types: 'dogs, cats, small_pets',
    boarding: 0, house_sitting: 1, drop_in_visit: 1, doggy_day_care: 0,
    dog_walking: 1, grooming: 0, pet_training: 0
  }
];

describe('applyFilters', () => {
  it('returns everything with default filters', () => {
    expect(applyFilters(PLACES, DEFAULTS)).toHaveLength(4);
  });

  it('filters by city', () => {
    const out = applyFilters(PLACES, { ...DEFAULTS, city: 'Jeju City' });
    expect(out.map(p => p.place_id)).toEqual([1, 3]);
  });

  it('filters by pet type from the comma-joined list', () => {
    const cats = applyFilters(PLACES, { ...DEFAULTS, petType: 'cats' });
    expect(cats.map(p => p.place_id)).toEqual([1, 4]);
    const smallPets = applyFilters(PLACES, { ...DEFAULTS, petType: 'small_pets' });
    expect(smallPets.map(p => p.place_id)).toEqual([4]);
  });

  it('keeps only confirmed (=1) places when a service checkbox is on', () => {
    const out = applyFilters(PLACES, { ...DEFAULTS, grooming: true });
    expect(out.map(p => p.place_id)).toEqual([1, 2]);
  });

  it('excludes unknown (null) service values when the checkbox is on', () => {
    // Place 3 has grooming: null — not confirmed, so it must not appear.
    const out = applyFilters(PLACES, { ...DEFAULTS, grooming: true });
    expect(out.some(p => p.place_id === 3)).toBe(false);
    // But place 3 offers training (=1), so the training filter keeps it.
    const training = applyFilters(PLACES, { ...DEFAULTS, petTraining: true });
    expect(training.map(p => p.place_id)).toEqual([3]);
  });

  it('combines service checkboxes with AND', () => {
    const out = applyFilters(PLACES, { ...DEFAULTS, boarding: true, grooming: true });
    expect(out.map(p => p.place_id)).toEqual([2]);
  });

  it('combines service checkboxes with the selects', () => {
    const out = applyFilters(PLACES, {
      ...DEFAULTS, city: 'Aewol', petType: 'cats', dogWalking: true
    });
    expect(out.map(p => p.place_id)).toEqual([4]);
    const none = applyFilters(PLACES, {
      ...DEFAULTS, city: 'Seogwipo', petType: 'cats'
    });
    expect(none).toHaveLength(0);
  });

  it('returns a new array and does not mutate the input', () => {
    const out = applyFilters(PLACES, DEFAULTS);
    expect(out).not.toBe(PLACES);
    expect(PLACES).toHaveLength(4);
  });
});

describe('buildFilterOptions', () => {
  it('collects sorted distinct cities', () => {
    expect(buildFilterOptions(PLACES).city).toEqual(['Aewol', 'Jeju City', 'Seogwipo']);
  });

  it('collects sorted distinct pet types from comma-joined lists', () => {
    expect(buildFilterOptions(PLACES).petType).toEqual(['cats', 'dogs', 'small_pets']);
  });

  it('ignores null and empty values', () => {
    const places = [...PLACES, { place_id: 5, city: null, pet_types: '' }];
    const opts = buildFilterOptions(places);
    expect(opts.city).toEqual(['Aewol', 'Jeju City', 'Seogwipo']);
    expect(opts.petType).toEqual(['cats', 'dogs', 'small_pets']);
  });
});

describe('SERVICE_FILTERS', () => {
  it('covers the seven services in display order', () => {
    expect(SERVICE_FILTERS.map(s => s.column)).toEqual([
      'boarding', 'house_sitting', 'drop_in_visit', 'doggy_day_care',
      'dog_walking', 'grooming', 'pet_training'
    ]);
  });
});
