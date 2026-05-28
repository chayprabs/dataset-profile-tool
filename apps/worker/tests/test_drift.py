from pathlib import Path

from fastapi.testclient import TestClient

from core.drift import diff_profiles
from core.stats import profile_dataset
from main import app

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_diff_profiles_matches_week_over_week_golden_changes():
    before = profile_dataset(SAMPLES_DIR / "drift-week-1.csv")
    after = profile_dataset(SAMPLES_DIR / "drift-week-2.csv")

    drift = diff_profiles(before, after)

    assert drift.added == ["loyalty_points"]
    assert drift.removed == []
    assert [change.column for change in drift.rangeChanges] == ["spend"]
    assert drift.rangeChanges[0].severity == "additive"
    assert drift.rangeChanges[0].after == 220.0
    assert [change.column for change in drift.cardinalityChanges] == ["tier"]
    assert drift.cardinalityChanges[0].before == 3
    assert drift.cardinalityChanges[0].after == 5
    assert drift.cardinalityChanges[0].severity == "additive"


def test_drift_profile_mode_keeps_only_fields_needed_for_diffing():
    before = profile_dataset(SAMPLES_DIR / "drift-week-1.csv", profile_mode="drift")
    after = profile_dataset(SAMPLES_DIR / "drift-week-2.csv", profile_mode="drift")

    drift = diff_profiles(before, after)
    spend_column = next(column for column in after.columns if column.name == "spend")

    assert before.sampleRows == []
    assert after.sampleRows == []
    assert before.schemaDocument == {"type": "object", "properties": {}}
    assert spend_column.numeric is not None
    assert spend_column.numeric.max == 220.0
    assert spend_column.topValues == []
    assert [change.column for change in drift.cardinalityChanges] == ["tier"]


def test_drift_endpoint_profiles_files_and_returns_classification():
    client = TestClient(app)
    before_path = SAMPLES_DIR / "drift-week-1.csv"
    after_path = SAMPLES_DIR / "drift-week-2.csv"

    with before_path.open("rb") as before_handle, after_path.open("rb") as after_handle:
        response = client.post(
            "/v1/drift",
            files={
                "before_file": (before_path.name, before_handle, "text/csv"),
                "after_file": (after_path.name, after_handle, "text/csv"),
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["added"] == ["loyalty_points"]
    assert [change["column"] for change in payload["rangeChanges"]] == ["spend"]
    assert [change["column"] for change in payload["cardinalityChanges"]] == ["tier"]
