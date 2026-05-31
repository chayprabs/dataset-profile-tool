from pathlib import Path

from fastapi.testclient import TestClient

from core.drift import diff_profiles
from core.stats import profile_dataset
from main import app

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_drift_added_column_snapshot_has_valid_unique_percent():
    before = profile_dataset(SAMPLES_DIR / "drift-week-1.csv", profile_mode="drift")
    after = profile_dataset(SAMPLES_DIR / "drift-week-2.csv", profile_mode="drift")
    drift = diff_profiles(before, after)
    added = next(change for change in drift.changes if change.column == "loyalty_points")
    assert added.after is not None
    snapshot = added.after
    assert snapshot["uniquePct"] <= 100
    assert snapshot["uniqueCount"] <= after.source.rowCount


def test_drift_endpoint_added_column_stats_are_valid():
    client = TestClient(app)
    with (SAMPLES_DIR / "drift-week-1.csv").open("rb") as before_handle, (
        SAMPLES_DIR / "drift-week-2.csv"
    ).open("rb") as after_handle:
        response = client.post(
            "/v1/drift",
            files={
                "before_file": ("drift-week-1.csv", before_handle, "text/csv"),
                "after_file": ("drift-week-2.csv", after_handle, "text/csv"),
            },
        )
    assert response.status_code == 200
    payload = response.json()
    added = next(item for item in payload["changes"] if item["column"] == "loyalty_points")
    assert added["after"]["uniquePct"] <= 100
