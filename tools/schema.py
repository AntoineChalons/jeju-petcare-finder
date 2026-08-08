"""
Canonical CSV schema for Jeju pet service data.

One CSV row = one place (a groomer, trainer, sitter, pet hotel, day
care...). Multi-value fields (pet types, languages, contact methods)
are packed into single delimited cells so the whole dataset stays a
flat, spreadsheet-friendly file that maps 1:1 onto the normalized
SQLite schema in db.py:

    places, contact_methods, languages, place_languages,
    pet_types, place_pet_types, feedback_sources,
    place_feedback, owner_quotes

Delimiter convention (same as sibling project jeju-scuba-finder):
- Comma-joined lists (pet_types, languages_spoken) match the
  GROUP_CONCAT(..., ', ') format used by v_place_dashboard and the
  frontend, so exporting requires no reformatting.
- Semicolon-joined "key:value" pairs (contact_methods) since those
  values are structured (type + value) and commas can legitimately
  appear inside a URL or phone number.

Reviews are NOT packed into places.csv: authored summaries and owner
quotes are prose, and prose cannot survive a colon/semicolon delimiter
convention. They live in a second file, data/reviews.csv, one row per
review entry (see REVIEWS_CSV_COLUMNS below).
"""

# The seven service categories the app filters on. Column order here is
# also the display order in the UI filter bar.
SERVICE_COLUMNS = [
    "boarding",
    "house_sitting",
    "drop_in_visit",
    "doggy_day_care",
    "dog_walking",
    "grooming",
    "pet_training",
]

# Column order in the CSV, matching places table columns first, then the
# packed multi-value columns. place_id is included so re-imports can
# update existing rows; leave it blank when adding a new place.
CSV_COLUMNS = [
    "place_id",
    "name",
    "city",
    "full_address",
    "gps_lat",
    "gps_lng",
    "website_url",
    "naver_map_url",
    "booking_url",
    "active",                 # true/false; blank means true (see DEFAULT_TRUE_BOOLEAN_COLUMNS)
    *SERVICE_COLUMNS,          # true/false/blank(=unknown) per service
    "pet_types",               # comma-joined, e.g. "dogs, cats"
    "price_from_krw",          # representative starting price in KRW
    "price_note",              # what price_from_krw refers to, e.g. "small dog full grooming"
    "languages_spoken",        # comma-joined, e.g. "Korean, English"
    "contact_methods",         # semicolon-joined "type:value", e.g. "mobile_phone:+82-10-...;instagram:handle"
]

# Column order for data/reviews.csv: one row per review entry.
# Platform rows (kind=platform) carry rating/review_count/url/last_checked;
# local-owner rows (kind=local_owner) carry author_alias/quoted_at and MUST
# have a summary_or_quote. `kind` may be left blank and is derived from
# `source` via SOURCE_KINDS; when filled it must agree.
REVIEWS_CSV_COLUMNS = [
    "place_id",           # required; must match a place_id in places.csv
    "source",             # required; one of SOURCE_KINDS keys
    "kind",               # platform / local_owner; blank = derived from source
    "rating",             # platform only; float 0..5
    "review_count",       # platform only; integer >= 0
    "url",                # platform only
    "summary_or_quote",   # authored summary (platform, optional) or quote (local_owner, required)
    "author_alias",       # local_owner only; anonymized, e.g. "poodle owner, Jeju City"
    "quoted_at",          # local_owner only; ISO date YYYY-MM-DD
    "lang",               # BCP-47 tag of summary_or_quote, e.g. "ko", "en"
    "last_checked",       # platform only; ISO date YYYY-MM-DD
]

REVIEW_KINDS = {"platform", "local_owner"}

# Controlled source vocabulary -> kind. naver_map and naver_blog stay
# distinct (a map review and a blog write-up are different evidence;
# provenance is the point).
SOURCE_KINDS = {
    "naver_map": "platform",
    "naver_blog": "platform",
    "kakao_map": "platform",
    "google_maps": "platform",
    "instagram": "platform",
    "petbacker": "platform",
    "local_owner": "local_owner",
}

REQUIRED_COLUMNS = ["name", "city"]

PET_TYPE_VALUES = {"dogs", "cats", "small_pets"}
CONTACT_TYPES = {"email", "mobile_phone", "kakaotalk", "instagram", "naver_talk", "whatsapp"}
BOOLEAN_COLUMNS = [*SERVICE_COLUMNS, "active"]

# Booleans whose absence means "true" rather than "unknown". `active` is the
# only one: a place is assumed to be in business unless we have positive
# evidence otherwise, so an author adding a new row never has to remember
# to type `true`. Every service boolean stays tri-state (true/false/unknown).
DEFAULT_TRUE_BOOLEAN_COLUMNS = {"active"}
INTEGER_COLUMNS = ["price_from_krw"]
FLOAT_COLUMNS = ["gps_lat", "gps_lng"]

TRUE_STRINGS = {"1", "true", "yes", "y"}
FALSE_STRINGS = {"0", "false", "no", "n"}
