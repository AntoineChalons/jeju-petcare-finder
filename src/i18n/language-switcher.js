import { SUPPORTED_LOCALES, LOCALE_META } from './translations.js';
import { getLocale, t } from './i18n.js';

// Compact inline SVG flags (22x16, common 4:3-ish flag aspect). Kept as
// plain geometric shapes rather than photographic/detailed emblems so
// they render crisply at small sizes with zero external image requests.
const FLAGS = {
  en: `
    <svg viewBox="0 0 22 16" width="22" height="16" aria-hidden="true">
      <rect width="22" height="16" fill="#00247d"/>
      <path d="M0 0 L22 16 M22 0 L0 16" stroke="#fff" stroke-width="3"/>
      <path d="M0 0 L22 16 M22 0 L0 16" stroke="#cf142b" stroke-width="1"/>
      <path d="M11 0 V16 M0 8 H22" stroke="#fff" stroke-width="5"/>
      <path d="M11 0 V16 M0 8 H22" stroke="#cf142b" stroke-width="2"/>
    </svg>`,
  zh: `
    <svg viewBox="0 0 22 16" width="22" height="16" aria-hidden="true">
      <rect width="22" height="16" fill="#de2910"/>
      <g fill="#ffde00">
        <path d="M4 2 L4.6 3.8 L2.7 3.8 L4.3 5 L3.7 6.8 L5.3 5.6 L6.9 6.8 L6.3 5 L7.9 3.8 L6 3.8 Z" transform="scale(0.9) translate(0.4,0.3)"/>
        <circle cx="9" cy="1.6" r="0.6"/>
        <circle cx="10.4" cy="3.4" r="0.6"/>
        <circle cx="10.2" cy="5.6" r="0.6"/>
        <circle cx="8.6" cy="6.6" r="0.6"/>
      </g>
    </svg>`,
  ja: `
    <svg viewBox="0 0 22 16" width="22" height="16" aria-hidden="true">
      <rect width="22" height="16" fill="#fff"/>
      <circle cx="11" cy="8" r="4.4" fill="#bc002d"/>
    </svg>`,
  ko: `
    <svg viewBox="0 0 22 16" width="22" height="16" aria-hidden="true">
      <rect width="22" height="16" fill="#fff"/>
      <circle cx="11" cy="8" r="3.6" fill="#cd2e3a"/>
      <path d="M11 4.4 A3.6 1.8 0 0 1 11 8 A1.8 1.8 0 0 0 11 11.6 A3.6 3.6 0 0 1 11 4.4 Z" fill="#0047a0"/>
      <g stroke="#000" stroke-width="0.5">
        <path d="M2.5 3 h4 M2.5 3.9 h4 M2.5 4.8 h4"/>
        <path d="M15.5 3 h4 M15.5 3.9 h4 M15.5 4.8 h4"/>
        <path d="M2.5 11.2 h4 M2.5 12.1 h4 M2.5 13 h4"/>
        <path d="M15.5 11.2 h4 M15.5 12.1 h1.4 M17.6 12.1 h1.9 M15.5 13 h4"/>
      </g>
    </svg>`
};

/** Render the language switcher markup once into its host element. */
export function renderLanguageSwitcher() {
  const host = document.getElementById('language-switcher');
  const active = getLocale();

  host.innerHTML = `
    <button id="language-switcher-toggle" type="button" aria-haspopup="true" aria-expanded="false" title="${t('languageSwitcher.label')}">
      ${FLAGS[active]}
      <span class="lang-code">${LOCALE_META[active].short}</span>
    </button>
    <ul id="language-switcher-menu" role="menu" hidden>
      ${SUPPORTED_LOCALES.map(locale => `
        <li role="none">
          <button role="menuitem" type="button" class="lang-option" data-locale="${locale}" aria-current="${locale === active}">
            ${FLAGS[locale]}
            <span>${LOCALE_META[locale].label}</span>
          </button>
        </li>
      `).join('')}
    </ul>
  `;
}

/** Wire the toggle/menu interaction. Calls onSelect(locale) on a choice. */
export function bindLanguageSwitcher(onSelect) {
  const host = document.getElementById('language-switcher');

  host.addEventListener('click', (e) => {
    const toggle = e.target.closest('#language-switcher-toggle');
    const option = e.target.closest('.lang-option');
    const menu = document.getElementById('language-switcher-menu');

    if (toggle) {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.hidden = expanded;
      return;
    }

    if (option) {
      onSelect(option.dataset.locale);
      menu.hidden = true;
      document.getElementById('language-switcher-toggle')?.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('click', (e) => {
    if (!host.contains(e.target)) {
      const menu = document.getElementById('language-switcher-menu');
      const toggle = document.getElementById('language-switcher-toggle');
      if (menu && !menu.hidden) {
        menu.hidden = true;
        toggle?.setAttribute('aria-expanded', 'false');
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const menu = document.getElementById('language-switcher-menu');
      const toggle = document.getElementById('language-switcher-toggle');
      if (menu && !menu.hidden) {
        menu.hidden = true;
        toggle?.setAttribute('aria-expanded', 'false');
        toggle?.focus();
      }
    }
  });
}
