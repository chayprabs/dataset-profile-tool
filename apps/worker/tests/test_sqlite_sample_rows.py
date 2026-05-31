from pathlib import Path

from core.stats import profile_dataset

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_sqlite_sample_row_keys_match_column_names():
    profile = profile_dataset(SAMPLES_DIR / "chinook.sqlite")
    column_names = {column.name for column in profile.columns}
    assert profile.sampleRows
    for row in profile.sampleRows:
        assert set(row.keys()).issubset(column_names)
