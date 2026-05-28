from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from main import app
from storage.share_store import ShareStore, share_store


def test_share_store_expires_items_after_ttl():
    store = ShareStore()
    token, artifact = store.create("profile", {"jobId": "job-1"})
    store._items[token] = artifact.__class__(
        kind=artifact.kind,
        payload=artifact.payload,
        created_at=artifact.created_at,
        expires_at=datetime.now(UTC) - timedelta(seconds=1),
    )
    assert store.get(token) is None


def test_share_endpoints_round_trip_payload():
    client = TestClient(app)
    create_response = client.post(
        "/v1/share",
        json={"kind": "profile", "payload": {"jobId": "job-1", "warnings": []}},
    )

    assert create_response.status_code == 200
    token = create_response.json()["token"]

    fetch_response = client.get(f"/v1/share/{token}")
    assert fetch_response.status_code == 200
    payload = fetch_response.json()
    assert payload["kind"] == "profile"
    assert payload["payload"]["jobId"] == "job-1"


def test_share_endpoint_returns_404_after_expiry():
    client = TestClient(app)
    create_response = client.post(
        "/v1/share",
        json={"kind": "profile", "payload": {"jobId": "job-ttl", "warnings": []}},
    )

    assert create_response.status_code == 200
    token = create_response.json()["token"]
    original_artifact = share_store._items[token]
    share_store._items[token] = original_artifact.__class__(
        kind=original_artifact.kind,
        payload=original_artifact.payload,
        created_at=original_artifact.created_at,
        expires_at=datetime.now(UTC) - timedelta(seconds=1),
    )

    fetch_response = client.get(f"/v1/share/{token}")
    assert fetch_response.status_code == 404
