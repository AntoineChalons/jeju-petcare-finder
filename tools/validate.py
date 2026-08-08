"""
Row-level and file-level validation for the canonical pet-service CSVs
(data/places.csv and data/reviews.csv). Shared by import_csv.py (fail
before touching the database) and usable standalone
(`python tools/validate.py data/places.csv [data/reviews.csv]`) to
check the files without regenerating anything.
"""

import datetime
import re

from schema import (
    REQUIRED_COLUMNS,
    PET_TYPE_VALUES,
    CONTACT_TYPES,
    BOOLEAN_COLUMNS,
    DEFAULT_TRUE_BOOLEAN_COLUMNS,
    INTEGER_COLUMNS,
    FLOAT_COLUMNS,
    TRUE_STRINGS,
    FALSE_STRINGS,
    REVIEW_KINDS,
    SOURCE_KINDS,
)

# Deliberately loose BCP-47 shape check ("ko", "en", "zh-Hans"): catches
# typos like "korean" without embedding the full registry.
_LANG_RE = re.compile(r"^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{1,8})*$")


class ValidationError(Exception):
    """Raised with a list of human-readable row/column errors."""

    def __init__(self, errors):
        self.errors = errors
        super().__init__(f"{len(errors)} validation error(s) found")


def _parse_bool(raw, row_num, column, errors):
    if raw is None or raw.strip() == "":
        return None
    v = raw.strip().lower()
    if v in TRUE_STRINGS:
        return 1
    if v in FALSE_STRINGS:
        return 0
    errors.append(f"row {row_num}: column '{column}' has invalid boolean value '{raw}' (expected yes/no, true/false, 1/0)")
    return None


def _parse_int(raw, row_num, column, errors):
    if raw is None or raw.strip() == "":
        return None
    try:
        return int(raw.strip())
    except ValueError:
        errors.append(f"row {row_num}: column '{column}' has non-integer value '{raw}'")
        return None


def _parse_float(raw, row_num, column, errors):
    if raw is None or raw.strip() == "":
        return None
    try:
        return float(raw.strip())
    except ValueError:
        errors.append(f"row {row_num}: column '{column}' has non-numeric value '{raw}'")
        return None


def parse_contact_methods(raw, row_num, errors):
    """'email:a@b.com;instagram:handle|1234' -> [(type, value, followers), ...]

    The optional '|<int>' suffix carries a follower count (issue #6) and is
    only meaningful for instagram entries; followers is None when absent.
    '|' cannot appear in handles, phone numbers, or the chat URLs we store,
    so splitting on the last '|' is unambiguous.
    """
    result = []
    if not raw or not raw.strip():
        return result
    for entry in raw.split(";"):
        entry = entry.strip()
        if not entry:
            continue
        if ":" not in entry:
            errors.append(f"row {row_num}: contact_methods entry '{entry}' must be 'type:value'")
            continue
        ctype, value = entry.split(":", 1)
        ctype = ctype.strip().lower()
        value = value.strip()
        if ctype not in CONTACT_TYPES:
            errors.append(f"row {row_num}: contact_methods type '{ctype}' not in {sorted(CONTACT_TYPES)}")
            continue
        followers = None
        if "|" in value:
            value, _, raw_followers = value.rpartition("|")
            value = value.strip()
            raw_followers = raw_followers.strip()
            if ctype != "instagram":
                errors.append(
                    f"row {row_num}: contact_methods followers suffix '|{raw_followers}' is only allowed on instagram entries"
                )
                continue
            if not raw_followers.isdigit():
                errors.append(
                    f"row {row_num}: contact_methods followers '{raw_followers}' must be a non-negative integer"
                )
                continue
            followers = int(raw_followers)
        if not value:
            errors.append(f"row {row_num}: contact_methods entry '{entry}' is missing a value")
            continue
        if ctype == "instagram":
            if value.startswith("@"):
                value = value[1:]
            if "/" in value or " " in value:
                errors.append(
                    f"row {row_num}: contact_methods instagram value '{value}' must be a bare handle, not a URL"
                )
                continue
        result.append((ctype, value, followers))
    return result


def _parse_iso_date(raw, row_num, column, errors):
    if raw is None or raw.strip() == "":
        return None
    v = raw.strip()
    try:
        datetime.date.fromisoformat(v)
    except ValueError:
        errors.append(f"row {row_num}: column '{column}' has invalid date '{raw}' (expected YYYY-MM-DD)")
        return None
    return v


def _parse_lang(raw, row_num, errors):
    if raw is None or raw.strip() == "":
        return None
    v = raw.strip()
    if not _LANG_RE.match(v):
        errors.append(f"row {row_num}: column 'lang' has invalid language tag '{raw}' (expected BCP-47, e.g. 'ko', 'en', 'zh-Hans')")
        return None
    return v


def validate_review_row(raw_row, row_num, errors):
    """
    Validate and normalize one data/reviews.csv row. Per-kind rules:
    platform rows carry rating/review_count/url/last_checked and an
    optional authored summary; local_owner rows require a quote, may
    carry author_alias/quoted_at, and must NOT carry any of the
    platform-only fields.
    """
    n = {}

    place_id_raw = (raw_row.get("place_id") or "").strip()
    n["place_id"] = _parse_int(raw_row.get("place_id"), row_num, "place_id", errors)
    if not place_id_raw:
        errors.append(f"row {row_num}: required column 'place_id' is empty")

    source = (raw_row.get("source") or "").strip()
    n["source"] = source or None
    if not source:
        errors.append(f"row {row_num}: required column 'source' is empty")
    elif source not in SOURCE_KINDS:
        errors.append(f"row {row_num}: column 'source' has invalid value '{source}' (expected one of {sorted(SOURCE_KINDS)})")

    # kind is derivable from source; a filled cell must agree with it.
    kind_raw = (raw_row.get("kind") or "").strip()
    derived = SOURCE_KINDS.get(source)
    if kind_raw and kind_raw not in REVIEW_KINDS:
        errors.append(f"row {row_num}: column 'kind' has invalid value '{kind_raw}' (expected one of {sorted(REVIEW_KINDS)})")
        kind_raw = ""
    if kind_raw and derived and kind_raw != derived:
        errors.append(f"row {row_num}: column 'kind' is '{kind_raw}' but source '{source}' implies '{derived}'")
    n["kind"] = kind_raw or derived

    n["rating"] = _parse_float(raw_row.get("rating"), row_num, "rating", errors)
    if n["rating"] is not None and not (0 <= n["rating"] <= 5):
        errors.append(f"row {row_num}: column 'rating' value '{n['rating']}' out of range [0, 5]")
    n["review_count"] = _parse_int(raw_row.get("review_count"), row_num, "review_count", errors)
    if n["review_count"] is not None and n["review_count"] < 0:
        errors.append(f"row {row_num}: column 'review_count' must be >= 0, got '{n['review_count']}'")
    n["url"] = (raw_row.get("url") or "").strip() or None
    n["summary_or_quote"] = (raw_row.get("summary_or_quote") or "").strip() or None
    n["author_alias"] = (raw_row.get("author_alias") or "").strip() or None
    n["quoted_at"] = _parse_iso_date(raw_row.get("quoted_at"), row_num, "quoted_at", errors)
    n["lang"] = _parse_lang(raw_row.get("lang"), row_num, errors)
    n["last_checked"] = _parse_iso_date(raw_row.get("last_checked"), row_num, "last_checked", errors)

    if n["kind"] == "local_owner":
        if n["summary_or_quote"] is None:
            errors.append(f"row {row_num}: local_owner review requires 'summary_or_quote' (the quote)")
        for col in ("rating", "review_count", "url", "last_checked"):
            if n[col] is not None:
                errors.append(f"row {row_num}: column '{col}' does not apply to local_owner reviews")
    elif n["kind"] == "platform":
        for col in ("author_alias", "quoted_at"):
            if n[col] is not None:
                errors.append(f"row {row_num}: column '{col}' does not apply to platform reviews")

    return n


def validate_review_rows(raw_rows, known_place_ids=None):
    """Validate every data/reviews.csv row; raise ValidationError with all
    issues if any fail. Checks place_id references against known_place_ids
    (when given) and rejects duplicate (place_id, source) pairs for platform
    rows, which would violate place_feedback's UNIQUE constraint. Multiple
    local_owner rows per place are expected and allowed.
    """
    errors = []
    normalized_rows = []
    seen_platform_pairs = {}

    for i, raw_row in enumerate(raw_rows, start=2):  # row 1 is the header
        n = validate_review_row(raw_row, i, errors)
        normalized_rows.append(n)

        if (
            known_place_ids is not None
            and n["place_id"] is not None
            and n["place_id"] not in known_place_ids
        ):
            errors.append(f"row {i}: place_id {n['place_id']} does not match any place in places.csv")

        if n["kind"] == "platform" and n["place_id"] is not None and n["source"]:
            key = (n["place_id"], n["source"])
            if key in seen_platform_pairs:
                errors.append(f"row {i}: duplicate platform review for place_id {key[0]} and source '{key[1]}' (first seen at row {seen_platform_pairs[key]})")
            else:
                seen_platform_pairs[key] = i

    if errors:
        raise ValidationError(errors)

    return normalized_rows


def validate_and_normalize_row(raw_row, row_num, errors):
    """
    Takes a raw dict from csv.DictReader, returns a normalized dict with
    typed values (or None) for every column. Appends to `errors` in place
    rather than raising, so a whole file can be validated in one pass.
    """
    normalized = dict(raw_row)

    for col in REQUIRED_COLUMNS:
        if not raw_row.get(col, "").strip():
            errors.append(f"row {row_num}: required column '{col}' is empty")

    for col in BOOLEAN_COLUMNS:
        raw = (raw_row.get(col) or "").strip()
        value = _parse_bool(raw_row.get(col), row_num, col, errors)
        # `active` is the one boolean that is not tri-state: an *empty* cell
        # means the place is assumed to be in business, so new rows don't
        # have to spell it out. See DEFAULT_TRUE_BOOLEAN_COLUMNS. Only a
        # genuinely blank cell defaults — an unparseable value keeps its
        # error and stays None rather than silently becoming "active".
        if not raw and col in DEFAULT_TRUE_BOOLEAN_COLUMNS:
            value = True
        normalized[col] = value

    for col in INTEGER_COLUMNS:
        normalized[col] = _parse_int(raw_row.get(col), row_num, col, errors)

    for col in FLOAT_COLUMNS:
        normalized[col] = _parse_float(raw_row.get(col), row_num, col, errors)

    place_id_raw = (raw_row.get("place_id") or "").strip()
    normalized["place_id"] = int(place_id_raw) if place_id_raw else None

    lat, lng = normalized.get("gps_lat"), normalized.get("gps_lng")
    if (lat is None) != (lng is None):
        errors.append(f"row {row_num}: gps_lat and gps_lng must both be set or both be empty (partial GPS pair)")
    if lat is not None and not (-90 <= lat <= 90):
        errors.append(f"row {row_num}: gps_lat '{lat}' out of range [-90, 90]")
    if lng is not None and not (-180 <= lng <= 180):
        errors.append(f"row {row_num}: gps_lng '{lng}' out of range [-180, 180]")

    normalized["languages_spoken"] = [
        s.strip() for s in (raw_row.get("languages_spoken") or "").split(",") if s.strip()
    ]
    pet_types = [
        s.strip() for s in (raw_row.get("pet_types") or "").split(",") if s.strip()
    ]
    for pt in pet_types:
        if pt not in PET_TYPE_VALUES:
            errors.append(f"row {row_num}: pet_types value '{pt}' not in {sorted(PET_TYPE_VALUES)}")
    normalized["pet_types"] = pet_types
    normalized["contact_methods"] = parse_contact_methods(raw_row.get("contact_methods"), row_num, errors)

    normalized["name"] = (raw_row.get("name") or "").strip()
    normalized["city"] = (raw_row.get("city") or "").strip()
    normalized["full_address"] = (raw_row.get("full_address") or "").strip() or None
    normalized["website_url"] = (raw_row.get("website_url") or "").strip() or None
    normalized["naver_map_url"] = (raw_row.get("naver_map_url") or "").strip() or None
    normalized["booking_url"] = (raw_row.get("booking_url") or "").strip() or None
    normalized["price_note"] = (raw_row.get("price_note") or "").strip() or None

    return normalized


def validate_rows(raw_rows):
    """Validate every row; raise ValidationError with all issues if any fail.
    Also checks for duplicate place_id values and duplicate (name, city) pairs
    across the file, which would otherwise silently overwrite each other.
    """
    errors = []
    normalized_rows = []
    seen_ids = {}
    seen_names = {}

    for i, raw_row in enumerate(raw_rows, start=2):  # row 1 is the header
        normalized = validate_and_normalize_row(raw_row, i, errors)
        normalized_rows.append(normalized)

        pid = normalized.get("place_id")
        if pid is not None:
            if pid in seen_ids:
                errors.append(f"row {i}: duplicate place_id {pid} (first seen at row {seen_ids[pid]})")
            else:
                seen_ids[pid] = i

        key = (normalized["name"].lower(), normalized["city"].lower())
        if key[0]:
            if key in seen_names:
                errors.append(f"row {i}: duplicate place name+city '{normalized['name']}' / '{normalized['city']}' (first seen at row {seen_names[key]})")
            else:
                seen_names[key] = i

    if errors:
        raise ValidationError(errors)

    return normalized_rows


if __name__ == "__main__":
    import csv
    import os
    import sys

    if len(sys.argv) not in (2, 3):
        print("Usage: python tools/validate.py <places-csv> [<reviews-csv>]")
        sys.exit(2)

    with open(sys.argv[1], newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    # Default the reviews file to the sibling reviews.csv when present,
    # so `python tools/validate.py data/places.csv` keeps checking everything.
    reviews_path = sys.argv[2] if len(sys.argv) == 3 else os.path.join(os.path.dirname(sys.argv[1]), "reviews.csv")
    review_rows = []
    if os.path.isfile(reviews_path):
        with open(reviews_path, newline="", encoding="utf-8") as f:
            review_rows = list(csv.DictReader(f))
    elif len(sys.argv) == 3:
        print(f"error: reviews CSV not found: {reviews_path}")
        sys.exit(2)

    failed = False
    try:
        normalized = validate_rows(rows)
        print(f"OK: {len(normalized)} place row(s) passed validation.")
    except ValidationError as e:
        print(f"INVALID ({sys.argv[1]}): {e}")
        for err in e.errors:
            print(f"  - {err}")
        failed = True
        normalized = []

    if review_rows or os.path.isfile(reviews_path):
        known_ids = {r["place_id"] for r in normalized if r.get("place_id") is not None} or None
        try:
            normalized_rv = validate_review_rows(review_rows, known_ids)
            print(f"OK: {len(normalized_rv)} review row(s) passed validation.")
        except ValidationError as e:
            print(f"INVALID ({reviews_path}): {e}")
            for err in e.errors:
                print(f"  - {err}")
            failed = True

    if failed:
        sys.exit(1)
