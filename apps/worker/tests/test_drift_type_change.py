from pathlib import Path

from core.drift import diff_profiles, export_column_snapshot
from core.stats import profile_dataset
from models import ColumnProfile, TopValue

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_diff_profiles_reports_type_changes(tmp_path: Path):
    before_path = tmp_path / "before.csv"
    after_path = tmp_path / "after.csv"
    before_path.write_text("value\n1\n2\n", encoding="utf-8")
    after_path.write_text("value\n1.5\n2.5\n", encoding="utf-8")

    before = profile_dataset(before_path, profile_mode="drift")
    after = profile_dataset(after_path, profile_mode="drift")
    drift = diff_profiles(before, after)

    assert drift.typeChanges
    assert drift.typeChanges[0].column == "value"
    assert drift.typeChanges[0].patchHint is not None


def test_export_column_snapshot_clamps_impossible_unique_percent():
    column = ColumnProfile(
        name="score",
        inferredType="int",
        nullable=False,
        nullCount=0,
        nullPct=0,
        uniqueCount=51,
        uniquePct=1020.0,
        topValues=[],
        piiFlags=[],
        anomalies=[],
        confidence=1.0,
    )
    snapshot = export_column_snapshot(column)
    assert snapshot["uniquePct"] <= 100
