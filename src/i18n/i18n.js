import { translations, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './translations.js';

const STORAGE_KEY = 'jeju-petcare-locale';

/**
 * Map a browser locale (e.g. "zh-CN", "ja-JP", "en-US") to one of our
 * supported locales. Falls back to DEFAULT_LOCALE for anything unmatched.
 * This is what powers "auto-detect where the user is from": the browser's
 * own language/region negotiation (Accept-Language / navigator.language)
 * already encodes the user's OS/browser locale, which is normally set
 * from their region during device setup — no IP geolocation or extra
 * permissions needed.
 */
export function resolveLocale(tag) {
  if (!tag) return DEFAULT_LOCALE;
  const lower = tag.toLowerCase();
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

/** Try every language the browser reports, in preference order. */
export function detectBrowserLocale() {
  const candidates = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language];

  for (const tag of candidates) {
    const resolved = resolveLocale(tag);
    if (SUPPORTED_LOCALES.includes(resolved)) return resolved;
  }
  return DEFAULT_LOCALE;
}

/**
 * Determine the initial locale: an explicit user choice saved in a
 * previous visit takes priority, otherwise auto-detect from the browser.
 */
export function getInitialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {
    // localStorage can throw in some privacy modes; ignore and fall through.
  }
  return detectBrowserLocale();
}

export function persistLocale(locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Best-effort only; a failed write just means no persistence this session.
  }
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));
}

let currentLocale = DEFAULT_LOCALE;

export function setLocale(locale) {
  currentLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  persistLocale(currentLocale);
}

export function getLocale() {
  return currentLocale;
}

/**
 * Look up a dotted key (e.g. "filters.reset") in the current locale's
 * dictionary, falling back to English for any missing key so the UI
 * never shows a raw key or blank string.
 */
export function t(key, vars) {
  const value = getByPath(translations[currentLocale], key) ??
    getByPath(translations[DEFAULT_LOCALE], key) ??
    key;
  return interpolate(value, vars);
}
