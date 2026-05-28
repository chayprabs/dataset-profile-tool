from pathlib import Path

from core.stats import profile_dataset

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_profile_dataset_returns_expected_per_column_stats():
    profile = profile_dataset(SAMPLES_DIR / "ecommerce-events.csv")
    columns = {column.name: column for column in profile.columns}

    amount = columns["amount"]
    assert amount.inferredType == "float"
    assert amount.numeric is not None
    assert amount.numeric.min == 13.99
    assert amount.numeric.max == 120.5
    assert len(amount.numeric.histogram) == 8
    assert sum(amount.numeric.histogram) == profile.source.rowCount

    event_time = columns["event_time"]
    assert event_time.inferredType == "timestamp"
    assert event_time.date is not None
    assert event_time.date.pattern == "iso-8601"

    is_returned = columns["is_returned"]
    assert is_returned.inferredType == "bool"
    assert is_returned.boolean is not None
    assert is_returned.boolean.trueCount == 1
    assert is_returned.boolean.falseCount == 4

    customer_email = columns["customer_email"]
    assert customer_email.string is not None
    assert customer_email.string.minLen == 15
    assert customer_email.string.maxLen == 18
    assert customer_email.piiFlags == ["email"]


def test_profile_dataset_marks_mixed_type_columns():
    profile = profile_dataset(SAMPLES_DIR / "mixed-types.csv")
    columns = {column.name: column for column in profile.columns}
    assert columns["mixed_value"].inferredType == "mixed"
    assert columns["mixed_value"].string is not None
