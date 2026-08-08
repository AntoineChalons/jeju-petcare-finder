import { describe, it, expect } from 'vitest';
import { translations, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './translations.js';

/**
 * Every locale must expose exactly the same key set as the default locale.
 * t() silently falls back to English for missing keys, which is the right
 * runtime behaviour but means a forgotten translation ships unnoticed —
 * this test turns that silence into a CI failure.
 */
function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? flattenKeys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );
}

describe('translations key parity', () => {
  const reference = flattenKeys(translations[DEFAULT_LOCALE]).sort();

  it('covers every supported locale', () => {
    expect(Object.keys(translations).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  for (const locale of SUPPORTED_LOCALES) {
    it(`"${locale}" has the same keys as "${DEFAULT_LOCALE}"`, () => {
      expect(flattenKeys(translations[locale]).sort()).toEqual(reference);
    });
  }

  it('has no empty strings in any locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const empty = flattenKeys(translations[locale]).filter(key =>
        key.split('.').reduce((acc, k) => acc[k], translations[locale]) === ''
      );
      expect(empty).toEqual([]);
    }
  });
});
