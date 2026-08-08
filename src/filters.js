// Filtering logic, kept separate from rendering and from the state store
// itself so it stays a pure, testable function of (places, filters).

/**
 * Filter key -> database column for the seven service checkboxes.
 * Order matters: it is the display order of the filter bar checkboxes
 * and of the service badges in the table and drawer.
 */
export const SERVICE_FILTERS = [
  { key: 'boarding', column: 'boarding' },
  { key: 'houseSitting', column: 'house_sitting' },
  { key: 'dropInVisit', column: 'drop_in_visit' },
  { key: 'doggyDayCare', column: 'doggy_day_care' },
  { key: 'dogWalking', column: 'dog_walking' },
  { key: 'grooming', column: 'grooming' },
  { key: 'petTraining', column: 'pet_training' }
];

/** Split a comma-joined "A, B, C" field into a trimmed array. */
function splitList(value) {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/** Distinct sorted values for a plain scalar field across all places. */
function distinctScalar(places, field) {
  const set = new Set();
  for (const p of places) {
    if (p[field] != null && p[field] !== '') set.add(p[field]);
  }
  return [...set].sort((a, b) => String(a).localeCompare(String(b)));
}

/** Distinct sorted values for a comma-joined field across all places. */
function distinctFromList(places, field) {
  const set = new Set();
  for (const p of places) {
    for (const v of splitList(p[field])) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Compute the option lists for each filter control from the full,
 * unfiltered place list. Called once the data loads (and again if the
 * dataset is ever refreshed at runtime).
 */
export function buildFilterOptions(places) {
  return {
    city: distinctScalar(places, 'city'),
    petType: distinctFromList(places, 'pet_types')
  };
}

/** Apply the active filters to the full place list, returning a new array. */
export function applyFilters(places, filters) {
  return places.filter(p => {
    if (filters.city !== 'all' && p.city !== filters.city) {
      return false;
    }
    if (filters.petType !== 'all' &&
        !splitList(p.pet_types).includes(filters.petType)) {
      return false;
    }
    // Service checkboxes combine with AND: checking "boarding" and
    // "grooming" means "places that offer both". When a checkbox is on,
    // an unknown (null) value is excluded because we can't confirm the
    // place offers it. Column values are the SQLite integers 0/1, so a
    // strict === 1 check keeps null out too.
    for (const { key, column } of SERVICE_FILTERS) {
      if (filters[key] && p[column] !== 1) return false;
    }
    return true;
  });
}
