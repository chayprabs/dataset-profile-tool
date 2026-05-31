from pathlib import Path

from fastapi.testclient import TestClient

from main import app
import storage.runtime as runtime


def test_profile_rejects_oversized_upload(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(runtime, "MAX_UPLOAD_BYTES", 1024 * 1024)

    oversized = tmp_path / "too-large.csv"
    oversized.write_bytes(b"x" * (2 * 1024 * 1024))

    client = TestClient(app)
    with oversized.open("rb") as handle:
        response = client.post(
            "/v1/profile",
            files={"file": (oversized.name, handle, "text/csv")},
        )
    assert response.status_code == 413
    assert response.json()["detail"] == "413_FILE_TOO_LARGE"
