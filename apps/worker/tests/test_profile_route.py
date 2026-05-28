from pathlib import Path

from fastapi.testclient import TestClient

from main import app

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_profile_endpoint_supports_text_and_binary_formats():
    client = TestClient(app)
    samples = [
        "ecommerce-events.csv",
        "weather.tsv",
        "users.json",
        "weather.jsonl",
        "nyc-taxi-sample.parquet",
        "sample.arrow",
        "users.avro",
        "chinook.sqlite",
    ]

    for sample_name in samples:
        sample_path = SAMPLES_DIR / sample_name
        with sample_path.open("rb") as handle:
            response = client.post(
                "/v1/profile",
                files={"file": (sample_path.name, handle, "application/octet-stream")},
            )
        assert response.status_code == 200, sample_name
        payload = response.json()
        assert payload["columns"], sample_name
        assert payload["source"]["rowCount"] >= 1, sample_name


def test_avro_profile_does_not_write_converted_jsonl_next_to_source(tmp_path: Path):
    sample_path = SAMPLES_DIR / "users.avro"
    copied_path = tmp_path / "users.avro"
    copied_path.write_bytes(sample_path.read_bytes())

    client = TestClient(app)
    with copied_path.open("rb") as handle:
        response = client.post(
            "/v1/profile",
            files={"file": (copied_path.name, handle, "application/octet-stream")},
        )

    assert response.status_code == 200
    assert not (tmp_path / "users.jsonl").exists()
