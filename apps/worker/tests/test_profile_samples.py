from pathlib import Path

from core.stats import profile_dataset

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_profile_dataset_supports_head_and_tail_sample_modes():
    head_profile = profile_dataset(SAMPLES_DIR / "drift-week-2.csv", sample_mode="head", sample_size=2)
    tail_profile = profile_dataset(SAMPLES_DIR / "drift-week-2.csv", sample_mode="tail", sample_size=2)

    assert [row["customer_id"] for row in head_profile.sampleRows] == [1001, 1002]
    assert [row["customer_id"] for row in tail_profile.sampleRows] == [1005, 1004]


def test_profile_dataset_surfaces_anomaly_fixture_columns():
    profile = profile_dataset(SAMPLES_DIR / "anomaly-lab.csv")
    columns = {column.name: column for column in profile.columns}

    assert "leading_zero_numeric_string" in columns["zip_code"].anomalies
    assert "mixed_date_formats" in columns["observed_date"].anomalies
    assert "unicode_normalization_mismatch" in columns["unicode_name"].anomalies
    assert "suspicious_null_tokens" in columns["status_token"].anomalies
    assert "high_entropy_strings" in columns["session_hash"].anomalies
