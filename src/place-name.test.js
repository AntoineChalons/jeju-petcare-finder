import { describe, it, expect, afterEach } from 'vitest';
import { displayName } from './place-name.js';
import { setLocale } from './i18n/i18n.js';
import { DEFAULT_LOCALE } from './i18n/translations.js';

const PLACE = { name: '가람동물병원', name_roman: 'Garam Dongmul Byeongwon' };
const PLACE_NO_ROMAN = { name: '가람동물병원', name_roman: null };

afterEach(() => setLocale(DEFAULT_LOCALE));

describe('displayName (issue #5)', () => {
  it('shows the romanized name when the UI language is English', () => {
    setLocale('en');
    expect(displayName(PLACE)).toBe('Garam Dongmul Byeongwon');
  });

  it('shows the Korean name for the ko locale', () => {
    setLocale('ko');
    expect(displayName(PLACE)).toBe('가람동물병원');
  });

  it('shows the Korean name for ja and zh locales', () => {
    for (const locale of ['ja', 'zh']) {
      setLocale(locale);
      expect(displayName(PLACE)).toBe('가람동물병원');
    }
  });

  it('falls back to the Korean name when no romanization exists', () => {
    setLocale('en');
    expect(displayName(PLACE_NO_ROMAN)).toBe('가람동물병원');
    expect(displayName({ name: 'X', name_roman: '' })).toBe('X');
  });
});
