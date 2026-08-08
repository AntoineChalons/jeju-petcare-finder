import { describe, it, expect } from 'vitest';
import { groupReviews, isStale, STALE_AFTER_DAYS } from './reviews.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-08-07T00:00:00Z');

describe('isStale', () => {
  it('is false for null, empty, or unparseable dates', () => {
    expect(isStale(null, NOW)).toBe(false);
    expect(isStale('', NOW)).toBe(false);
    expect(isStale(undefined, NOW)).toBe(false);
    expect(isStale('not-a-date', NOW)).toBe(false);
  });

  it('is false at exactly the threshold and true just past it', () => {
    const atThreshold = new Date(NOW - STALE_AFTER_DAYS * DAY).toISOString().slice(0, 10);
    const pastThreshold = new Date(NOW - (STALE_AFTER_DAYS + 1) * DAY).toISOString().slice(0, 10);
    expect(isStale(atThreshold, NOW)).toBe(false);
    expect(isStale(pastThreshold, NOW)).toBe(true);
  });

  it('is false for a recent date', () => {
    expect(isStale('2026-08-01', NOW)).toBe(false);
  });

  it('respects a custom threshold', () => {
    expect(isStale('2026-08-01', NOW, 3)).toBe(true);
    expect(isStale('2026-08-06', NOW, 3)).toBe(false);
  });
});

describe('groupReviews', () => {
  it('returns an empty map for no rows', () => {
    expect(groupReviews([], []).size).toBe(0);
    expect(groupReviews().size).toBe(0);
  });

  it('groups platform rows and quotes under the same place', () => {
    const map = groupReviews(
      [{ place_id: 1, source: 'naver_map' }],
      [{ place_id: 1, quote_id: 1, quote: 'great' }, { place_id: 2, quote_id: 2, quote: 'ok' }]
    );
    expect([...map.keys()].sort()).toEqual([1, 2]);
    expect(map.get(1).platform).toHaveLength(1);
    expect(map.get(1).quotes).toHaveLength(1);
    expect(map.get(2).platform).toHaveLength(0);
    expect(map.get(2).quotes).toHaveLength(1);
  });

  it('omits places with no reviews (undefined lookup is the empty signal)', () => {
    const map = groupReviews([{ place_id: 1, source: 'instagram' }], []);
    expect(map.get(99)).toBeUndefined();
  });

  it('sorts platform rows alphabetically by source', () => {
    const map = groupReviews([
      { place_id: 1, source: 'naver_map' },
      { place_id: 1, source: 'kakao_map' },
      { place_id: 1, source: 'google_maps' }
    ], []);
    expect(map.get(1).platform.map(r => r.source))
      .toEqual(['google_maps', 'kakao_map', 'naver_map']);
  });

  it('sorts quotes newest first, undated last, ties by quote_id', () => {
    const map = groupReviews([], [
      { place_id: 1, quote_id: 1, quoted_at: '2026-01-10' },
      { place_id: 1, quote_id: 2, quoted_at: null },
      { place_id: 1, quote_id: 3, quoted_at: '2026-08-05' },
      { place_id: 1, quote_id: 4, quoted_at: '2026-08-05' }
    ]);
    expect(map.get(1).quotes.map(q => q.quote_id)).toEqual([3, 4, 1, 2]);
  });
});
