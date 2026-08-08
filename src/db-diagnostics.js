import { t } from './i18n/i18n.js';

// The DB diagnostics banner (row counts + list of places missing GPS) is a
// developer aid, not intended for end users. It is only rendered when the
// page URL carries `?debug=1` (or `?debug=true`). Anything else — no query
// string, `?debug=0`, unrelated params — returns an empty string so the
// #status element stays blank in production.
function isDebugEnabled() {
  if (typeof window === 'undefined') return false;
  const value = new URLSearchParams(window.location.search).get('debug');
  return value === '1' || value === 'true';
}

export function buildDbStatusReport(places) {
  if (!isDebugEnabled()) return '';

  const totalCount = places.length;
  const mappable = places.filter(p => p.gps_lat != null && p.gps_lng != null);
  const unmappable = places.filter(p => p.gps_lat == null || p.gps_lng == null);

  let statusHtml = t('dbStatus', {
    total: totalCount,
    mappable: mappable.length,
    unmappable: unmappable.length
  });

  if (unmappable.length > 0) {
    const lines = unmappable.map(p =>
      `  - id=${p.place_id} name="${p.name}" url=${p.website_url || 'N/A'}`
    ).join('<br>');
    statusHtml += `<br><span style="color:#d9534f">[WARN] ${t('dbWarnUnmappable', { count: unmappable.length })}</span><br>${lines}`;
  }

  return statusHtml;
}
