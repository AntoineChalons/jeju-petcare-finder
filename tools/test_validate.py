"""
Tests for the CSV validation layer and the import/export round trip.

Run from the repo root with:  python -m pytest tools/
"""

import csv
import io
import os
import subprocess
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

import db  # noqa: E402
from schema import CSV_COLUMNS, REVIEWS_CSV_COLUMNS, SERVICE_COLUMNS  # noqa: E402
from validate import (  # noqa: E402
    ValidationError,
    parse_contact_methods,
    validate_review_rows,
    validate_rows,
)

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))


def make_row(**overrides):
    """A minimal valid places.csv row, as csv.DictReader would return it."""
    row = {col: "" for col in CSV_COLUMNS}
    row.update({
        "name": "Happy Paws Grooming",
        "city": "Jeju City",
        "gps_lat": "33.499",
        "gps_lng": "126.531",
        "grooming": "yes",
    })
    row.update(overrides)
    return row


def make_review_row(**overrides):
    """A minimal valid reviews.csv platform row."""
    row = {col: "" for col in REVIEWS_CSV_COLUMNS}
    row.update({
        "place_id": "1",
        "source": "naver_map",
        "rating": "4.8",
        "review_count": "120",
        "url": "https://map.naver.com/p/entry/place/123",
        "last_checked": "2026-08-01",
    })
    row.update(overrides)
    return row


class TestValidateRows:
    def test_valid_row_passes(self):
        rows = validate_rows([make_row()])
        assert len(rows) == 1
        assert rows[0]["name"] == "Happy Paws Grooming"
        assert rows[0]["grooming"] == 1

    def test_missing_name_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_rows([make_row(name="")])
        assert any("'name' is empty" in err for err in e.value.errors)

    def test_missing_city_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_rows([make_row(city="")])
        assert any("'city' is empty" in err for err in e.value.errors)

    def test_service_booleans_tri_state(self):
        rows = validate_rows([make_row(boarding="yes", dog_walking="no", pet_training="")])
        assert rows[0]["boarding"] == 1
        assert rows[0]["dog_walking"] == 0
        assert rows[0]["pet_training"] is None

    def test_all_service_columns_parsed(self):
        rows = validate_rows([make_row(**{col: "yes" for col in SERVICE_COLUMNS})])
        for col in SERVICE_COLUMNS:
            assert rows[0][col] == 1

    def test_invalid_boolean_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_rows([make_row(grooming="maybe")])
        assert any("invalid boolean" in err for err in e.value.errors)

    def test_active_defaults_true_when_blank(self):
        rows = validate_rows([make_row(active="")])
        assert rows[0]["active"] is True

    def test_active_explicit_false(self):
        rows = validate_rows([make_row(active="no")])
        assert rows[0]["active"] == 0

    def test_partial_gps_pair_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_rows([make_row(gps_lng="")])
        assert any("partial GPS pair" in err for err in e.value.errors)

    def test_gps_out_of_range_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_rows([make_row(gps_lat="133.5")])
        assert any("out of range" in err for err in e.value.errors)

    def test_pet_types_vocabulary(self):
        rows = validate_rows([make_row(pet_types="dogs, cats")])
        assert rows[0]["pet_types"] == ["dogs", "cats"]
        with pytest.raises(ValidationError) as e:
            validate_rows([make_row(pet_types="dogs, hamsters")])
        assert any("pet_types value 'hamsters'" in err for err in e.value.errors)

    def test_price_must_be_integer(self):
        with pytest.raises(ValidationError) as e:
            validate_rows([make_row(price_from_krw="cheap")])
        assert any("non-integer" in err for err in e.value.errors)

    def test_duplicate_place_id_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_rows([make_row(place_id="7"), make_row(name="Other", place_id="7")])
        assert any("duplicate place_id 7" in err for err in e.value.errors)

    def test_duplicate_name_city_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_rows([make_row(), make_row()])
        assert any("duplicate place name+city" in err for err in e.value.errors)


class TestContactMethods:
    def test_parses_multiple_entries(self):
        errors = []
        result = parse_contact_methods(
            "mobile_phone:+82-10-1234-5678;instagram:@happy_paws;kakaotalk:https://pf.kakao.com/_abc123",
            2, errors,
        )
        assert errors == []
        assert ("mobile_phone", "+82-10-1234-5678", None) in result
        assert ("instagram", "happy_paws", None) in result  # @ stripped
        assert ("kakaotalk", "https://pf.kakao.com/_abc123", None) in result

    def test_instagram_followers_suffix(self):
        errors = []
        result = parse_contact_methods("instagram:happy_paws|1234", 2, errors)
        assert errors == []
        assert result == [("instagram", "happy_paws", 1234)]

    def test_followers_suffix_rejected_on_other_types(self):
        errors = []
        parse_contact_methods("mobile_phone:+82-10-1234-5678|99", 2, errors)
        assert any("only allowed on instagram" in err for err in errors)

    def test_non_numeric_followers_rejected(self):
        errors = []
        parse_contact_methods("instagram:happy_paws|lots", 2, errors)
        assert any("non-negative integer" in err for err in errors)

    def test_unknown_type_fails(self):
        errors = []
        parse_contact_methods("fax:123", 2, errors)
        assert any("not in" in err for err in errors)

    def test_instagram_url_rejected(self):
        errors = []
        parse_contact_methods("instagram:https://instagram.com/foo", 2, errors)
        assert any("bare handle" in err for err in errors)


class TestValidateReviewRows:
    def test_valid_platform_row(self):
        rows = validate_review_rows([make_review_row()], known_place_ids={1})
        assert rows[0]["kind"] == "platform"
        assert rows[0]["rating"] == 4.8

    def test_unknown_place_id_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_review_rows([make_review_row(place_id="99")], known_place_ids={1})
        assert any("does not match any place" in err for err in e.value.errors)

    def test_unknown_source_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_review_rows([make_review_row(source="yelp")])
        assert any("invalid value 'yelp'" in err for err in e.value.errors)

    def test_rating_out_of_range_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_review_rows([make_review_row(rating="5.5")])
        assert any("out of range" in err for err in e.value.errors)

    def test_local_owner_requires_quote(self):
        row = make_review_row(source="local_owner", rating="", review_count="", url="", last_checked="")
        with pytest.raises(ValidationError) as e:
            validate_review_rows([row])
        assert any("requires 'summary_or_quote'" in err for err in e.value.errors)

    def test_local_owner_rejects_platform_fields(self):
        row = make_review_row(source="local_owner", summary_or_quote="Great sitter!")
        with pytest.raises(ValidationError) as e:
            validate_review_rows([row])
        assert any("does not apply to local_owner" in err for err in e.value.errors)

    def test_duplicate_platform_pair_fails(self):
        with pytest.raises(ValidationError) as e:
            validate_review_rows([make_review_row(), make_review_row()])
        assert any("duplicate platform review" in err for err in e.value.errors)

    def test_multiple_owner_quotes_allowed(self):
        base = {
            "source": "local_owner", "rating": "", "review_count": "",
            "url": "", "last_checked": "",
        }
        rows = validate_review_rows([
            make_review_row(summary_or_quote="Very patient with my poodle.", **base),
            make_review_row(summary_or_quote="Sends photos during boarding.", **base),
        ])
        assert len(rows) == 2


class TestImportExportRoundTrip:
    def test_round_trip(self, tmp_path):
        places_csv = tmp_path / "places.csv"
        reviews_csv = tmp_path / "reviews.csv"
        db_path = tmp_path / "pet_services.db"

        place = make_row(
            place_id="1",
            pet_types="cats, dogs",
            languages_spoken="English, Korean",
            contact_methods="mobile_phone:+82-10-1234-5678;instagram:happy_paws",
            booking_url="https://booking.naver.com/booking/13/bizes/123",
            price_from_krw="35000",
            price_note="small dog full grooming",
            boarding="yes",
            doggy_day_care="no",
        )
        with open(places_csv, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
            w.writeheader()
            w.writerow(place)
        with open(reviews_csv, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=REVIEWS_CSV_COLUMNS)
            w.writeheader()
            w.writerow(make_review_row())

        r = subprocess.run(
            [sys.executable, os.path.join(TOOLS_DIR, "import_csv.py"), str(places_csv), str(db_path)],
            capture_output=True, text=True,
        )
        assert r.returncode == 0, r.stdout + r.stderr

        conn = db.connect(str(db_path))
        dash = conn.execute("SELECT * FROM v_place_dashboard").fetchall()
        assert len(dash) == 1
        row = dash[0]
        assert row["name"] == "Happy Paws Grooming"
        assert row["boarding"] == 1
        assert row["doggy_day_care"] == 0
        assert row["grooming"] == 1
        assert row["pet_types"] == "cats, dogs"
        assert row["avg_rating"] == 4.8
        assert row["total_reviews"] == 120
        assert "mobile_phone:+82-10-1234-5678" in row["contact_methods"]
        conn.close()

        out_places = tmp_path / "out_places.csv"
        r = subprocess.run(
            [sys.executable, os.path.join(TOOLS_DIR, "export_csv.py"), str(db_path), str(out_places)],
            capture_output=True, text=True,
        )
        assert r.returncode == 0, r.stdout + r.stderr

        with open(out_places, newline="", encoding="utf-8") as f:
            exported = list(csv.DictReader(f))
        assert len(exported) == 1
        assert exported[0]["name"] == "Happy Paws Grooming"
        assert exported[0]["boarding"] == "yes"
        assert exported[0]["doggy_day_care"] == "no"
        assert exported[0]["pet_types"] == "cats, dogs"
        assert exported[0]["booking_url"] == "https://booking.naver.com/booking/13/bizes/123"

        # Exported CSV re-validates cleanly (true round trip).
        validate_rows(exported)
