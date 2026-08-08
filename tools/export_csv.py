#!/usr/bin/env python3
"""
Export pet-service place data from a SQLite database into the
canonical CSV format, for manual editing in a spreadsheet before
re-importing with import_csv.py.

Writes two files: the places CSV, and a reviews CSV next to it
(default: reviews.csv in the same directory) with one row per review
entry — platform summaries from place_feedback and local-owner quotes
from owner_quotes.

Usage:
    python tools/export_csv.py public/pet_services.db data/places.csv
    python tools/export_csv.py public/pet_services.db data/places.csv --reviews-csv data/reviews.csv
"""

import argparse
import csv
import os
import sys

import db
from schema import CSV_COLUMNS, REVIEWS_CSV_COLUMNS, SERVICE_COLUMNS


def bool_to_csv(value):
    if value is None:
        return ""
    return "yes" if value else "no"


def num_to_csv(value):
    return "" if value is None else str(value)


def export_rows(conn):
    places = conn.execute("SELECT * FROM places ORDER BY place_id").fetchall()
    rows = []

    for place in places:
        place_id = place["place_id"]

        languages = conn.execute(
            """
            SELECT l.language_name FROM place_languages pl
            JOIN languages l ON l.language_id = pl.language_id
            WHERE pl.place_id = ? ORDER BY l.language_name
            """,
            (place_id,),
        ).fetchall()
        pet_types = conn.execute(
            """
            SELECT pt.pet_type_name FROM place_pet_types ppt
            JOIN pet_types pt ON pt.pet_type_id = ppt.pet_type_id
            WHERE ppt.place_id = ? ORDER BY pt.pet_type_name
            """,
            (place_id,),
        ).fetchall()
        contacts = conn.execute(
            "SELECT contact_type, contact_value FROM contact_methods WHERE place_id = ? ORDER BY contact_id",
            (place_id,),
        ).fetchall()

        row = {
            "place_id": place_id,
            "name": place["name"],
            "name_roman": place["name_roman"],
            "city": place["city"],
            "full_address": place["full_address"] or "",
            "gps_lat": num_to_csv(place["gps_lat"]),
            "gps_lng": num_to_csv(place["gps_lng"]),
            "website_url": place["website_url"] or "",
            "naver_map_url": place["naver_map_url"] or "",
            "booking_url": place["booking_url"] or "",
            "active": bool_to_csv(place["active"]),
            "price_from_krw": num_to_csv(place["price_from_krw"]),
            "price_note": place["price_note"] or "",
            "pet_types": ", ".join(r["pet_type_name"] for r in pet_types),
            "languages_spoken": ", ".join(r["language_name"] for r in languages),
            "contact_methods": ";".join(f"{r['contact_type']}:{r['contact_value']}" for r in contacts),
        }
        for col in SERVICE_COLUMNS:
            row[col] = bool_to_csv(place[col])
        rows.append(row)

    return rows


def export_review_rows(conn):
    """One CSV row per review entry: platform rows from place_feedback,
    local-owner rows from owner_quotes, ordered by place then source so the
    file diffs stably.
    """
    rows = []

    platform = conn.execute(
        """
        SELECT f.place_id, fs.source_name, fs.source_kind, f.rating,
               f.review_count, f.url, f.summary, f.lang, f.last_checked
          FROM place_feedback f
          JOIN feedback_sources fs ON fs.source_id = f.source_id
         ORDER BY f.place_id, fs.source_name
        """
    ).fetchall()
    for r in platform:
        rows.append({
            "place_id": r["place_id"],
            "source": r["source_name"],
            "kind": r["source_kind"],
            "rating": num_to_csv(r["rating"]),
            "review_count": num_to_csv(r["review_count"]),
            "url": r["url"] or "",
            "summary_or_quote": r["summary"] or "",
            "author_alias": "",
            "quoted_at": "",
            "lang": r["lang"] or "",
            "last_checked": r["last_checked"] or "",
        })

    quotes = conn.execute(
        "SELECT place_id, quote, author_alias, quoted_at, lang FROM owner_quotes ORDER BY place_id, quote_id"
    ).fetchall()
    for r in quotes:
        rows.append({
            "place_id": r["place_id"],
            "source": "local_owner",
            "kind": "local_owner",
            "rating": "",
            "review_count": "",
            "url": "",
            "summary_or_quote": r["quote"],
            "author_alias": r["author_alias"] or "",
            "quoted_at": r["quoted_at"] or "",
            "lang": r["lang"] or "",
            "last_checked": "",
        })

    rows.sort(key=lambda r: (r["place_id"], r["kind"], r["source"]))
    return rows


def main():
    parser = argparse.ArgumentParser(description="Export a SQLite pet-service database into the canonical CSV format.")
    parser.add_argument("db_path", help="Path to the input SQLite database")
    parser.add_argument("csv_path", help="Path to the output places CSV file (overwritten)")
    parser.add_argument("--reviews-csv", help="Path to the output reviews CSV (default: reviews.csv next to the places CSV)")
    args = parser.parse_args()

    if not os.path.isfile(args.db_path):
        print(f"error: database file not found: {args.db_path}")
        sys.exit(2)

    conn = db.connect(args.db_path)
    rows = export_rows(conn)
    review_rows = export_review_rows(conn)
    conn.close()

    with open(args.csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    reviews_path = args.reviews_csv or os.path.join(os.path.dirname(args.csv_path), "reviews.csv")
    with open(reviews_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=REVIEWS_CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(review_rows)

    print(f"Wrote {len(rows)} place(s) to {args.csv_path}")
    print(f"Wrote {len(review_rows)} review row(s) to {reviews_path}")


if __name__ == "__main__":
    main()
