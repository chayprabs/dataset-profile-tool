from pathlib import Path

from fastapi.testclient import TestClient

from main import app

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


def test_schema_infer_returns_draft_2020_schema():
    client = TestClient(app)
    sample_path = SAMPLES_DIR / "ecommerce-events.csv"
    with sample_path.open("rb") as handle:
        response = client.post(
            "/v1/schema-infer",
            files={"file": (sample_path.name, handle, "text/csv")},
        )
    assert response.status_code == 200
    schema = response.json()
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    assert "properties" in schema
    assert "event_id" in schema["properties"]


def test_schema_infer_rejects_invalid_sample_mode():
    client = TestClient(app)
    sample_path = SAMPLES_DIR / "ecommerce-events.csv"
    with sample_path.open("rb") as handle:
        response = client.post(
            "/v1/schema-infer",
            files={"file": (sample_path.name, handle, "text/csv")},
            data={"sampleMode": "middle"},
        )
    assert response.status_code == 400
