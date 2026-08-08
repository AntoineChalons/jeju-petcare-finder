"""
SQLite schema definition and connection helper shared by import_csv.py
and export_csv.py. Kept in one place so the schema used to regenerate
`public/pet_services.db` never drifts from what the frontend expects.
"""

import sqlite3

SCHEMA_SQL = """
CREATE TABLE places (
    place_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    full_address TEXT,
    gps_lat REAL,
    gps_lng REAL,
    website_url TEXT,
    naver_map_url TEXT,
    booking_url TEXT,
    -- Whether the place is believed to still be trading. Inactive places are
    -- kept in the database (so their ids and URLs stay stable and the
    -- research trail is preserved) but are not surfaced in the UI.
    active BOOLEAN NOT NULL DEFAULT 1,
    -- The seven service categories the app filters on. Tri-state:
    -- 1 = offers it, 0 = confirmed not offered, NULL = unknown.
    boarding BOOLEAN,
    house_sitting BOOLEAN,
    drop_in_visit BOOLEAN,
    doggy_day_care BOOLEAN,
    dog_walking BOOLEAN,
    grooming BOOLEAN,
    pet_training BOOLEAN,
    price_from_krw INTEGER,
    price_note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE contact_methods (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL REFERENCES places(place_id) ON DELETE CASCADE,
    contact_type TEXT CHECK(contact_type IN ('email','mobile_phone','kakaotalk','instagram','naver_talk','whatsapp')) NOT NULL,
    contact_value TEXT NOT NULL,
    UNIQUE(place_id, contact_type, contact_value)
);

CREATE TABLE languages (
    language_id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_name TEXT UNIQUE NOT NULL
);

CREATE TABLE place_languages (
    place_id INTEGER NOT NULL REFERENCES places(place_id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(language_id) ON DELETE CASCADE,
    PRIMARY KEY (place_id, language_id)
);

CREATE TABLE pet_types (
    pet_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_type_name TEXT UNIQUE NOT NULL
);

CREATE TABLE place_pet_types (
    place_id INTEGER NOT NULL REFERENCES places(place_id) ON DELETE CASCADE,
    pet_type_id INTEGER NOT NULL REFERENCES pet_types(pet_type_id) ON DELETE CASCADE,
    PRIMARY KEY (place_id, pet_type_id)
);

CREATE TABLE feedback_sources (
    source_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name TEXT UNIQUE NOT NULL,
    -- 'platform' (naver_map, naver_blog, kakao_map, google_maps, instagram,
    -- petbacker) or 'local_owner'. The UI groups reviews on this kind.
    source_kind TEXT NOT NULL DEFAULT 'platform'
        CHECK (source_kind IN ('platform', 'local_owner'))
);

-- One row per (place, platform source): structured signals plus an authored
-- per-source summary. Summaries stay per source rather than one blob per
-- place so provenance survives ("Naver reviews praise the groomer's patience,
-- Google reviews mention parking") and last_checked can flag staleness per
-- origin.
CREATE TABLE place_feedback (
    feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL REFERENCES places(place_id) ON DELETE CASCADE,
    source_id INTEGER NOT NULL REFERENCES feedback_sources(source_id),
    rating REAL,
    review_count INTEGER,
    url TEXT,
    summary TEXT,
    lang TEXT,
    last_checked TEXT,
    UNIQUE(place_id, source_id)
);

-- First-hand feedback from local pet owners. Deliberately NOT in
-- place_feedback: several owners can comment on one place (no UNIQUE pair),
-- and none of rating/review_count/url apply. author_alias is anonymized
-- ("poodle owner, Jeju City") -- nothing attributable ships without consent.
CREATE TABLE owner_quotes (
    quote_id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL REFERENCES places(place_id) ON DELETE CASCADE,
    quote TEXT NOT NULL,
    author_alias TEXT,
    quoted_at TEXT,
    lang TEXT
);

CREATE VIEW v_place_dashboard AS
SELECT
    p.place_id,
    p.name,
    p.city,
    p.full_address,
    p.gps_lat,
    p.gps_lng,
    p.website_url,
    p.naver_map_url,
    p.booking_url,
    p.active,
    p.boarding,
    p.house_sitting,
    p.drop_in_visit,
    p.doggy_day_care,
    p.dog_walking,
    p.grooming,
    p.pet_training,
    p.price_from_krw,
    p.price_note,
    (SELECT GROUP_CONCAT(l.language_name, ', ') FROM place_languages pl JOIN languages l ON l.language_id=pl.language_id WHERE pl.place_id=p.place_id) AS languages_spoken,
    (SELECT GROUP_CONCAT(pt.pet_type_name, ', ') FROM place_pet_types ppt JOIN pet_types pt ON pt.pet_type_id=ppt.pet_type_id WHERE ppt.place_id=p.place_id) AS pet_types,
    (SELECT AVG(rating) FROM place_feedback f WHERE f.place_id=p.place_id) AS avg_rating,
    (SELECT SUM(review_count) FROM place_feedback f WHERE f.place_id=p.place_id) AS total_reviews,
    -- Packed multi-value column for the place detail drawer. Same delimiter
    -- convention as the CSV (see tools/schema.py): semicolon between
    -- entries, colon between fields. Packing them into the existing view
    -- keeps the frontend on a single query instead of issuing a follow-up
    -- lookup per selected place.
    (SELECT GROUP_CONCAT(cm.contact_type || ':' || cm.contact_value, ';')
       FROM contact_methods cm WHERE cm.place_id=p.place_id) AS contact_methods
FROM places p;
"""


def create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA_SQL)


def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def get_or_create_language(conn: sqlite3.Connection, name: str) -> int:
    name = name.strip()
    row = conn.execute(
        "SELECT language_id FROM languages WHERE language_name = ?", (name,)
    ).fetchone()
    if row:
        return row["language_id"]
    cur = conn.execute(
        "INSERT INTO languages (language_name) VALUES (?)", (name,)
    )
    return cur.lastrowid


def get_or_create_pet_type(conn: sqlite3.Connection, name: str) -> int:
    name = name.strip()
    row = conn.execute(
        "SELECT pet_type_id FROM pet_types WHERE pet_type_name = ?", (name,)
    ).fetchone()
    if row:
        return row["pet_type_id"]
    cur = conn.execute(
        "INSERT INTO pet_types (pet_type_name) VALUES (?)", (name,)
    )
    return cur.lastrowid


def get_or_create_feedback_source(
    conn: sqlite3.Connection, name: str, kind: str = "platform"
) -> int:
    name = name.strip()
    row = conn.execute(
        "SELECT source_id FROM feedback_sources WHERE source_name = ?", (name,)
    ).fetchone()
    if row:
        return row["source_id"]
    cur = conn.execute(
        "INSERT INTO feedback_sources (source_name, source_kind) VALUES (?, ?)",
        (name, kind),
    )
    return cur.lastrowid
