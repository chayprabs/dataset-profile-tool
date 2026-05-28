from pathlib import Path

from core.schema import infer_json_schema
from core.stats import profile_dataset
from models import ColumnProfile, TopValue

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_infer_json_schema_builds_draft_2020_document():
    schema = infer_json_schema(
        [
            ColumnProfile(
                name="email",
                inferredType="string",
                nullable=False,
                nullCount=0,
                nullPct=0,
                uniqueCount=2,
                uniquePct=100,
                topValues=[TopValue(value="a@example.com", count=1), TopValue(value="b@example.com", count=1)],
                piiFlags=["email"],
                format="email",
                anomalies=[],
                confidence=0.98,
            )
        ]
    )
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    assert schema["properties"]["email"]["format"] == "email"
    assert schema["properties"]["email"]["x-confidence"] == 0.98
    assert schema["properties"]["email"]["enum"] == ["a@example.com", "b@example.com"]


def test_infer_json_schema_carries_numeric_and_string_bounds():
    schema = infer_json_schema(
        [
            ColumnProfile(
                name="amount",
                inferredType="float",
                nullable=False,
                nullCount=0,
                nullPct=0,
                uniqueCount=3,
                uniquePct=100,
                topValues=[TopValue(value=13.99, count=1), TopValue(value=42.0, count=1), TopValue(value=120.5, count=1)],
                piiFlags=[],
                anomalies=[],
                confidence=0.91,
                numeric={
                    "min": 13.99,
                    "max": 120.5,
                    "mean": 58.83,
                    "p25": 13.99,
                    "p50": 42.0,
                    "p75": 120.5,
                    "p95": 120.5,
                    "p99": 120.5,
                    "stddev": 44.0,
                    "histogram": [1, 1, 1, 0, 0, 0, 0, 0],
                },
            ),
            ColumnProfile(
                name="tier",
                inferredType="string",
                nullable=False,
                nullCount=0,
                nullPct=0,
                uniqueCount=3,
                uniquePct=100,
                topValues=[TopValue(value="gold", count=1), TopValue(value="silver", count=1), TopValue(value="bronze", count=1)],
                piiFlags=[],
                anomalies=[],
                confidence=0.87,
                string={"minLen": 4, "maxLen": 6, "charClasses": {"lower": 16, "upper": 0, "digit": 0, "punct": 0}},
            ),
        ]
    )
    assert schema["properties"]["amount"]["minimum"] == 13.99
    assert schema["properties"]["amount"]["maximum"] == 120.5
    assert schema["properties"]["tier"]["minLength"] == 4
    assert schema["properties"]["tier"]["maxLength"] == 6


def test_profile_schema_keeps_standard_formats_and_custom_hints_separate():
    profile = profile_dataset(SAMPLES_DIR / "pii-laden.csv")
    schema = profile.schemaDocument

    assert schema["properties"]["customer_email"]["format"] == "email"
    assert schema["properties"]["phone"]["x-dataprofile-formatHint"] == "phone"
    assert schema["properties"]["credit_card"]["x-dataprofile-formatHint"] == "credit_card"
