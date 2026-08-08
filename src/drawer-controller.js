import { t } from './i18n/i18n.js';
import { isStale } from './reviews.js';
import { SERVICE_FILTERS } from './filters.js';

/**
 * Place detail drawer.
 *
 * A single persistent <aside> in the DOM whose contents are re-rendered
 * whenever the selection changes. Keeping one element (rather than
 * creating/destroying it) means focus management and CSS transitions stay
 * simple, and screen readers see a stable landmark.
 *
 * Behaviour contract:
 * - Opens when a place is selected, closes when the selection is cleared.
 * - Esc closes it; closing returns focus to the row that opened it.
 * - Focus is trapped while open on narrow viewports, where the drawer is a
 *   modal sheet covering the page. On wide viewports it is a non-modal
 *   side panel, so focus is *not* trapped and the table stays usable.
 */

const CONTACT_META = {
  email: { icon: '\u2709', labelKey: 'contactEmail', href: v => `mailto:${v}` },
  mobile_phone: { icon: '\u260e', labelKey: 'contactMobilePhone', href: v => `tel:${v.replace(/[^\d+]/g, '')}` },
  whatsapp: { icon: '\u{1F4AC}', labelKey: 'contactWhatsapp', href: v => `https://wa.me/${v.replace(/[^\d]/g, '')}` },
  kakaotalk: { icon: '\u{1F4AD}', labelKey: 'contactKakaotalk', href: v => (/^https?:\/\//.test(v) ? v : null) },
  naver_talk: { icon: '\u{1F4AC}', labelKey: 'contactNaverTalk', href: v => (/^https?:\/\//.test(v) ? v : null) },
  instagram: { icon: '\u{1F4F7}', labelKey: 'contactInstagram', href: v => `https://instagram.com/${v.replace(/^@/, '')}` }
};

/**
 * Display names for review platforms. Sources are a controlled vocabulary
 * (tools/schema.py SOURCE_KINDS), so an unknown name here means the schema
 * gained a source the UI doesn't know yet — fall back to the raw name
 * rather than hiding the row.
 */
const SOURCE_LABEL_KEYS = {
  naver_map: 'sourceNaverMap',
  naver_blog: 'sourceNaverBlog',
  kakao_map: 'sourceKakaoMap',
  google_maps: 'sourceGoogleMaps',
  instagram: 'sourceInstagram',
  petbacker: 'sourcePetbacker'
};

const MODAL_BREAKPOINT = '(max-width: 899px)';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let rootEl = null;
let onCloseCallback = null;
let lastFocusedEl = null;

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function isModal() {
  return window.matchMedia(MODAL_BREAKPOINT).matches;
}

/** One "Label / value" line. Values that are null/empty render as "-". */
function row(labelKey, value) {
  const shown = value === null || value === undefined || value === ''
    ? t('drawer.emptyValue')
    : value;
  return `<div class="drawer-row">
      <dt>${esc(t('drawer.' + labelKey))}</dt>
      <dd>${shown}</dd>
    </div>`;
}

function linkValue(url, labelKey) {
  if (!url) return null;
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t('drawer.' + labelKey))}</a>`;
}

/**
 * `contact_methods` arrives from v_place_dashboard packed with the same
 * delimiters the CSV uses (see tools/schema.py): ";" between entries and
 * ":" between type and value. The value itself can contain ":" (a kakaotalk
 * chat URL, for instance), so only the first ":" is a separator.
 */
function parseContacts(packed) {
  if (!packed) return [];
  return packed.split(';').map(entry => {
    const i = entry.indexOf(':');
    if (i === -1) return null;
    const type = entry.slice(0, i).trim();
    const value = entry.slice(i + 1).trim();
    if (!type || !value || !CONTACT_META[type]) return null;
    return { type, value };
  }).filter(Boolean);
}

function contactsHtml(place) {
  const contacts = parseContacts(place.contact_methods);
  if (!contacts.length) {
    return `<p class="drawer-empty">${esc(t('drawer.noContact'))}</p>`;
  }
  const items = contacts.map(({ type, value }) => {
    const meta = CONTACT_META[type];
    const label = t('drawer.' + meta.labelKey);
    const href = meta.href(value);
    const shown = type === 'instagram' ? '@' + value.replace(/^@/, '') : value;
    const inner = href
      ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(shown)}</a>`
      : esc(shown);
    return `<li class="contact-item">
        <span class="contact-icon" aria-hidden="true">${meta.icon}</span>
        <span class="contact-body">
          <span class="contact-label">${esc(label)}</span>
          <span class="contact-value">${inner}</span>
        </span>
      </li>`;
  }).join('');
  return `<ul class="contact-list">${items}</ul>`;
}

/** lang="…" attribute when the entry declares its language (BCP-47). */
function langAttr(lang) {
  return lang ? ` lang="${esc(lang)}"` : '';
}

function platformItemHtml(fb) {
  const labelKey = SOURCE_LABEL_KEYS[fb.source];
  const label = esc(labelKey ? t('drawer.' + labelKey) : fb.source);
  const name = fb.url
    ? `<a href="${esc(fb.url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    : label;

  const meta = [];
  if (fb.rating !== null && fb.rating !== undefined) {
    meta.push(`<span class="review-rating">\u2605 ${esc(fb.rating)}</span>`);
  }
  if (fb.review_count !== null && fb.review_count !== undefined) {
    meta.push(`<span>${esc(t('drawer.reviewCount', { count: fb.review_count }))}</span>`);
  }
  if (fb.last_checked) {
    meta.push(`<span>${esc(t('drawer.reviewChecked', { date: fb.last_checked }))}</span>`);
  }
  if (isStale(fb.last_checked)) {
    meta.push(`<span class="review-stale">${esc(t('drawer.reviewStale'))}</span>`);
  }

  const summary = fb.summary
    ? `<p class="review-summary"${langAttr(fb.lang)}>${esc(fb.summary)}</p>`
    : '';

  return `<li class="review-item">
      <div class="review-head">
        <span class="review-source">${name}</span>
        ${meta.length ? `<span class="review-meta">${meta.join(' \u00b7 ')}</span>` : ''}
      </div>
      ${summary}
    </li>`;
}

function quoteItemHtml(q) {
  const attribution = [q.author_alias, q.quoted_at].filter(Boolean).map(esc).join(' \u00b7 ');
  return `<li class="review-item">
      <blockquote class="owner-quote"${langAttr(q.lang)}>${esc(q.quote)}</blockquote>
      ${attribution ? `<footer class="quote-attribution">\u2014 ${attribution}</footer>` : ''}
    </li>`;
}

/**
 * Review sections: "Platform reviews" and "From local pet owners", each
 * rendered only when it has content — sections rather than a source toggle,
 * because only some places have local quotes and an empty toggle state
 * reads as a bug. Falls back to a placeholder when there are no reviews.
 */
function reviewsHtml(place) {
  const rv = place.reviews;
  const sections = [];
  if (rv && rv.platform.length) {
    sections.push(`<section class="drawer-section">
        <h3>${esc(t('drawer.sectionReviewsPlatform'))}</h3>
        <ul class="review-list">${rv.platform.map(platformItemHtml).join('')}</ul>
      </section>`);
  }
  if (rv && rv.quotes.length) {
    sections.push(`<section class="drawer-section">
        <h3>${esc(t('drawer.sectionReviewsLocal'))}</h3>
        <ul class="review-list">${rv.quotes.map(quoteItemHtml).join('')}</ul>
      </section>`);
  }
  if (!sections.length) {
    return `<section class="drawer-section">
        <h3>${esc(t('drawer.sectionReviews'))}</h3>
        <p class="drawer-empty">${esc(t('drawer.reviewsPending'))}</p>
      </section>`;
  }
  return sections.join('');
}

/** Translated pills for every service the place is confirmed to offer. */
function servicesHtml(place) {
  const offered = SERVICE_FILTERS
    .filter(({ column }) => place[column] === 1)
    .map(({ key }) => `<span class="service-pill service-${key}">${esc(t('services.' + key))}</span>`);
  if (!offered.length) {
    return `<p class="drawer-empty">${esc(t('drawer.noServices'))}</p>`;
  }
  return `<div class="service-pills drawer-service-pills">${offered.join('')}</div>`;
}

/** Translate the packed "dogs, cats" list via the petTypes dictionary. */
function petTypesValue(packed) {
  if (!packed) return null;
  return packed.split(',').map(s => s.trim()).filter(Boolean)
    .map(v => esc(t('petTypes.' + v)))
    .join(', ');
}

function bodyHtml(place) {
  const price = place.price_from_krw
    ? esc(place.price_from_krw.toLocaleString()) + ' KRW'
    : null;
  const priceWithNote = price && place.price_note
    ? `${price} <span class="price-note">(${esc(place.price_note)})</span>`
    : price;
  const bookingHref = place.booking_url || place.website_url || place.naver_map_url;
  return `
    <section class="drawer-section">
      <h3>${esc(t('drawer.sectionAbout'))}</h3>
      <dl class="drawer-list">
        ${row('city', esc(place.city))}
        ${row('address', esc(place.full_address))}
        ${row('petTypes', petTypesValue(place.pet_types))}
        ${row('languages', esc(place.languages_spoken))}
        ${row('price', priceWithNote)}
        ${row('website', linkValue(place.website_url, 'website'))}
        ${row('naverMap', linkValue(place.naver_map_url, 'naverMap'))}
      </dl>
    </section>
    <section class="drawer-section">
      <h3>${esc(t('drawer.sectionServices'))}</h3>
      ${servicesHtml(place)}
    </section>
    <section class="drawer-section">
      <h3>${esc(t('drawer.sectionContact'))}</h3>
      ${contactsHtml(place)}
    </section>
    ${reviewsHtml(place)}
    ${bookingHref ? `
    <div class="drawer-cta">
      <a class="btn-book" href="${esc(bookingHref)}" target="_blank" rel="noopener noreferrer">${esc(t('drawer.bookNow'))}</a>
    </div>` : ''}
  `;
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    close();
    return;
  }
  // Trap Tab inside the drawer only in modal (narrow-viewport) mode; on
  // desktop the drawer sits beside the table and must not steal tabbing.
  if (e.key !== 'Tab' || !isModal()) return;
  const items = [...rootEl.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function close() {
  if (!rootEl || rootEl.hidden) return;
  rootEl.hidden = true;
  document.body.classList.remove('drawer-open');
  document.removeEventListener('keydown', onKeydown, true);
  // Return focus to whatever opened the drawer, but only if it is still in
  // the document — the table re-renders on every state change, so the
  // original row element may already have been replaced.
  if (lastFocusedEl && document.contains(lastFocusedEl)) lastFocusedEl.focus();
  lastFocusedEl = null;
  if (onCloseCallback) onCloseCallback();
}

export function initDrawer(onClose) {
  onCloseCallback = onClose;
  rootEl = document.getElementById('place-drawer');
  rootEl.addEventListener('click', e => {
    if (e.target.closest('[data-drawer-close]')) close();
  });
  // Backdrop click (modal mode only — the backdrop is display:none on desktop).
  document.getElementById('drawer-backdrop').addEventListener('click', close);
}

/**
 * Render the drawer for `place`, or close it when `place` is null. Safe to
 * call on every render pass: re-rendering an already-open drawer keeps it
 * open and does not re-steal focus.
 */
export function renderDrawer(place) {
  if (!rootEl) return;
  if (!place) {
    close();
    return;
  }

  const wasOpen = !rootEl.hidden;
  if (!wasOpen) lastFocusedEl = document.activeElement;

  rootEl.querySelector('#drawer-title').textContent = place.name;
  rootEl.querySelector('#drawer-close').setAttribute('aria-label', t('drawer.close'));
  rootEl.querySelector('#drawer-body').innerHTML = bodyHtml(place);

  // aria-modal only applies in the narrow-viewport sheet layout; on desktop
  // the drawer is a complementary panel that leaves the rest of the page
  // reachable, so claiming modality there would mislead screen readers.
  rootEl.setAttribute('aria-modal', String(isModal()));
  rootEl.hidden = false;
  document.body.classList.add('drawer-open');

  if (!wasOpen) {
    document.addEventListener('keydown', onKeydown, true);
    if (isModal()) rootEl.querySelector('#drawer-close').focus();
  }
}
