from fastapi.testclient import TestClient

from main import app


def test_health_endpoint_reports_extensions_and_runtime_limits():
    client = TestClient(app)
    response = client.get("/v1/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "httpfs" in payload["extensions"]
    assert payload["limits"]["jobMemoryLimitMb"] == 4096
    assert "runtimeLimitState" in payload
