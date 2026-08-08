import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { groupReviews } from './reviews.js';

function rows(db, sql) {
  const res = db.exec(sql);
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

export async function loadPlacesFromDb(dbPath = 'pet_services.db') {
  const SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl
  });
  const resp = await fetch(dbPath);
  const buf = await resp.arrayBuffer();
  const db = new SQL.Database(new Uint8Array(buf));
  // Places believed to be out of business are kept in the database (so their
  // ids stay stable and the research trail is preserved) but are never shown
  // in the UI. Filtering here rather than in each view means the map, table,
  // filter options and result counts are all consistent by construction:
  // nothing downstream ever sees an inactive place.
  const places = rows(db, 'SELECT * FROM v_place_dashboard WHERE active = 1');

  // Reviews for the drawer. Platform rows and local-owner quotes are
  // attached to each place here rather than queried on drawer open: the
  // whole database is already in memory, and attaching keeps the render
  // pipeline's "views only ever see place objects" contract intact.
  const reviewsByPlace = groupReviews(
    rows(db, `SELECT pf.place_id, fs.source_name AS source, pf.rating,
                     pf.review_count, pf.url, pf.summary, pf.lang, pf.last_checked
              FROM place_feedback pf
              JOIN feedback_sources fs ON fs.source_id = pf.source_id
              WHERE fs.source_kind = 'platform'`),
    rows(db, `SELECT quote_id, place_id, quote, author_alias, quoted_at, lang
              FROM owner_quotes`)
  );
  for (const place of places) {
    place.reviews = reviewsByPlace.get(place.place_id) || null;
  }
  return places;
}
