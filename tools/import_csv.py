#!/usr/bin/env python3
"""
Import pet-service place data from the canonical CSV format into a
fresh SQLite database, ready to drop into public/pet_services.db.

The import always regenerates the database from scratch (drops and
recreates every table) rather than upserting into an existing file.
This keeps the CSV as the single source of truth: what's in the CSV is
exactly what ends up in the database, with no leftover rows from a
previous version lingering behind.

Reviews live in a second CSV, one row per entry; by default the
importer looks for `reviews.csv` next to the places CSV and refuses to
run if it's missing, so reviews can never be silently dropped from a
regenerated database. Use --no-reviews for a deliberate places-only
import.

Usage:
    python tools/import_csv.py data/places.csv public/pet_services.db
    python tools/import_csv.py data/places.csv public/pet_services.db --reviews-csv data/reviews.csv
    python tools/import_csv.py data/places.csv public/pet_services.db --dry-run

Exit codes:
    0  success
    1  validation errors (see printed report, nothing written)
    2  usage error
"""

import argparse
import csv
import os
import sys

import db
from schema import SOURCE_KINDS, SERVICE_COLUMNS
from validate import ValidationError, validate_rows, validate_review_rows


def import_rows(conn, rows):
    for row in rows:
        # place_id is inserted explicitly when the CSV provides one, so ids
        # stay stable across imports even if a row is removed. Rows in
        # reviews.csv reference these ids; letting AUTOINCREMENT reassign
        # them by row order would silently rebind reviews to the wrong place.
        cur = conn.execute(
            f"""
            INSERT INTO places (
                place_id, name, name_roman, city, full_address, gps_lat, gps_lng,
                website_url, naver_map_url, booking_url, active,
                {', '.join(SERVICE_COLUMNS)},
                price_from_krw, price_note
            ) VALUES ({', '.join(['?'] * (13 + len(SERVICE_COLUMNS)))})
            """,
            (
                row["place_id"],
                row["name"],
                row["name_roman"],
                row["city"],
                row["full_address"],
                row["gps_lat"],
                row["gps_lng"],
                row["website_url"],
                row["naver_map_url"],
                row["booking_url"],
                row["active"],
                *[row[col] for col in SERVICE_COLUMNS],
                row["price_from_krw"],
                row["price_note"],
            ),
        )
        place_id = cur.lastrowid

        for lang_name in row["languages_spoken"]:
            lang_id = db.get_or_create_language(conn, lang_name)
            conn.execute(
                "INSERT OR IGNORE INTO place_languages (place_id, language_id) VALUES (?, ?)",
                (place_id, lang_id),
            )

        for pet_type in row["pet_types"]:
            pt_id = db.get_or_create_pet_type(conn, pet_type)
            conn.execute(
                "INSERT OR IGNORE INTO place_pet_types (place_id, pet_type_id) VALUES (?, ?)",
                (place_id, pt_id),
            )

        for ctype, value in row["contact_methods"]:
            conn.execute(
                "INSERT OR IGNORE INTO contact_methods (place_id, contact_type, contact_value) VALUES (?, ?, ?)",
                (place_id, ctype, value),
            )


def import_review_rows(conn, review_rows):
    for row in review_rows:
        if row["kind"] == "local_owner":
            conn.execute(
                """
                INSERT INTO owner_quotes (place_id, quote, author_alias, quoted_at, lang)
                VALUES (?, ?, ?, ?, ?)
                """,
                (row["place_id"], row["summary_or_quote"], row["author_alias"], row["quoted_at"], row["lang"]),
            )
        else:
            source_id = db.get_or_create_feedback_source(conn, row["source"], SOURCE_KINDS[row["source"]])
            conn.execute(
                """
                INSERT INTO place_feedback (place_id, source_id, rating, review_count, url, summary, lang, last_checked)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (row["place_id"], source_id, row["rating"], row["review_count"], row["url"], row["summary_or_quote"], row["lang"], row["last_checked"]),
            )


def main():
    parser = argparse.ArgumentParser(description="Import canonical CSV place data into a fresh SQLite database.")
    parser.add_argument("csv_path", help="Path to the input places CSV file")
    parser.add_argument("db_path", help="Path to the output SQLite database (overwritten)")
    parser.add_argument("--reviews-csv", help="Path to the reviews CSV (default: reviews.csv next to the places CSV)")
    parser.add_argument("--no-reviews", action="store_true", help="Deliberately import places only, without a reviews CSV")
    parser.add_argument("--dry-run", action="store_true", help="Validate only; do not write the database")
    args = parser.parse_args()

    if not os.path.isfile(args.csv_path):
        print(f"error: CSV file not found: {args.csv_path}")
        sys.exit(2)

    reviews_path = args.reviews_csv or os.path.join(os.path.dirname(args.csv_path), "reviews.csv")
    raw_review_rows = []
    if args.no_reviews:
        pass
    elif not os.path.isfile(reviews_path):
        print(f"error: reviews CSV not found: {reviews_path} (pass --reviews-csv or --no-reviews)")
        sys.exit(2)
    else:
        with open(reviews_path, newline="", encoding="utf-8") as f:
            raw_review_rows = list(csv.DictReader(f))

    with open(args.csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        raw_rows = list(reader)

    if not raw_rows:
        print("error: CSV file has no data rows")
        sys.exit(1)

    errors = []
    rows = []
    try:
        rows = validate_rows(raw_rows)
    except ValidationError as e:
        errors.extend(f"{args.csv_path}: {err}" for err in e.errors)

    review_rows = []
    if raw_review_rows:
        known_ids = {r["place_id"] for r in rows if r.get("place_id") is not None} or None
        try:
            review_rows = validate_review_rows(raw_review_rows, known_ids)
        except ValidationError as e:
            errors.extend(f"{reviews_path}: {err}" for err in e.errors)

    if errors:
        print(f"INVALID: {len(errors)} validation error(s) found")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    print(f"Validated {len(rows)} place row(s) and {len(review_rows)} review row(s), no errors.")

    if args.dry_run:
        print("Dry run: database not written.")
        sys.exit(0)

    if os.path.exists(args.db_path):
        os.remove(args.db_path)

    conn = db.connect(args.db_path)
    try:
        db.create_schema(conn)
        import_rows(conn, rows)
        import_review_rows(conn, review_rows)
        conn.commit()
    except Exception:
        conn.rollback()
        conn.close()
        if os.path.exists(args.db_path):
            os.remove(args.db_path)
        raise
    else:
        conn.close()

    print(f"Wrote {len(rows)} place(s) and {len(review_rows)} review row(s) to {args.db_path}")


if __name__ == "__main__":
    main()
