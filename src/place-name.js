import { getLocale } from './i18n/i18n.js';

/**
 * Name to display for a place given the active UI language (issue #5).
 *
 * When the UI is in English we show the Romanized Korean name
 * (`name_roman`, Revised Romanization) so non-Korean readers can
 * pronounce and search for the place; every other locale (including
 * Japanese and Chinese) keeps the original Korean `name`, which is
 * what appears on signage and on Naver/Kakao maps.
 *
 * Falls back to the Korean name if a row has no romanization yet, so a
 * data gap can never blank out a place name in the UI.
 */
export function displayName(place) {
  return getLocale() === 'en' && place.name_roman ? place.name_roman : place.name;
}
