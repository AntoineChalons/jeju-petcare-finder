/**
 * Pure review logic for the place drawer.
 *
 * The database stores two kinds of reviews:
 * - `place_feedback` — at most one row per (place, platform source): rating,
 *   review count, url, optional authored summary, `last_checked` date.
 * - `owner_quotes` — free-form quotes from local pet owners, several per
 *   place, anonymized via `author_alias`.
 *
 * This module only groups and orders that data; all DOM rendering lives in
 * drawer-controller.js. Keeping it pure makes it directly unit-testable
 * without a DOM harness.
 */

/** A platform summary older than this is flagged as possibly outdated. */
export const STALE_AFTER_DAYS = 180;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * True when `lastChecked` (ISO `YYYY-MM-DD`) is more than `thresholdDays`
 * before `now`. Rows that were never checked (null/empty) are NOT stale:
 * absence of a date means "no claim about freshness", and a warning badge
 * on every such row would drown out the meaningful ones.
 */
export function isStale(lastChecked, now = Date.now(), thresholdDays = STALE_AFTER_DAYS) {
  if (!lastChecked) return false;
  const checked = Date.parse(lastChecked);
  if (Number.isNaN(checked)) return false;
  return now - checked > thresholdDays * MS_PER_DAY;
}

/**
 * Group raw review rows by place id.
 *
 * Returns a Map of place_id → { platform: [...], quotes: [...] } containing
 * only places that have at least one entry, so `reviewsByPlace.get(id)`
 * being undefined is the "nothing to show" signal.
 *
 * Ordering is part of the contract (stable UI regardless of DB row order):
 * - platform rows: alphabetical by source name;
 * - quotes: newest `quoted_at` first, undated quotes last, ties broken by
 *   `quote_id` so two same-day quotes keep their insertion order.
 */
export function groupReviews(platformRows = [], quoteRows = []) {
  const byPlace = new Map();
  const entry = id => {
    if (!byPlace.has(id)) byPlace.set(id, { platform: [], quotes: [] });
    return byPlace.get(id);
  };

  for (const row of platformRows) entry(row.place_id).platform.push(row);
  for (const row of quoteRows) entry(row.place_id).quotes.push(row);

  for (const { platform, quotes } of byPlace.values()) {
    platform.sort((a, b) => String(a.source).localeCompare(String(b.source)));
    quotes.sort((a, b) => {
      if (a.quoted_at !== b.quoted_at) {
        if (!a.quoted_at) return 1;
        if (!b.quoted_at) return -1;
        return a.quoted_at < b.quoted_at ? 1 : -1;
      }
      return (a.quote_id ?? 0) - (b.quote_id ?? 0);
    });
  }

  return byPlace;
}
