from pathlib import Path

from core import stats as stats_module
from core.stats import profile_dataset

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_large_parquet_enables_approx_unique_and_view_warnings(monkeypatch):
    monkeypatch.setattr(stats_module, "APPROX_UNIQUE_COUNT_SIZE_BYTES", 500)
    profile = profile_dataset(SAMPLES_DIR / "nyc-taxi-sample.parquet")
    assert any("Approximate unique counts" in warning for warning in profile.warnings)
    assert any("direct scan view" in warning for warning in profile.warnings)
