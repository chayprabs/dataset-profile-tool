from __future__ import annotations

from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
import socketserver
from threading import Thread

from fastapi.testclient import TestClient

from core.stats import prepare_url_source
from main import app

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "web" / "public" / "samples"


@contextmanager
def serve_directory(directory: Path):
    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_address[1]}"
        finally:
            server.shutdown()
            thread.join(timeout=5)


def test_prepare_url_source_uses_httpfs_without_creating_local_copy(tmp_path: Path):
    with serve_directory(SAMPLES_DIR) as base_url:
        prepared = prepare_url_source(f"{base_url}/ecommerce-events.csv", tmp_path)

    assert prepared.source == f"{base_url}/ecommerce-events.csv"
    assert prepared.local_path is None
    assert prepared.format == "csv"
    assert prepared.size_bytes > 0
    assert "httpfs" in prepared.warnings[0]
    assert list(tmp_path.iterdir()) == []


def test_profile_and_drift_endpoints_support_remote_csv_urls():
    client = TestClient(app)

    with serve_directory(SAMPLES_DIR) as base_url:
        profile_response = client.post(
            "/v1/profile",
            data={"url": f"{base_url}/ecommerce-events.csv"},
        )
        drift_response = client.post(
            "/v1/drift",
            data={
                "before_url": f"{base_url}/drift-week-1.csv",
                "after_url": f"{base_url}/drift-week-2.csv",
            },
        )

    assert profile_response.status_code == 200
    profile_payload = profile_response.json()
    assert profile_payload["columns"]
    assert any("httpfs" in warning for warning in profile_payload["warnings"])

    assert drift_response.status_code == 200
    drift_payload = drift_response.json()
    assert drift_payload["added"] == ["loyalty_points"]
