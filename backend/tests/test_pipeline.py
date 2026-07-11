import importlib.util
from pathlib import Path


def test_pipeline_authentication_uses_json_body(monkeypatch):
    module_path = Path(__file__).resolve().parents[2] / "scripts" / "pipeline.py"
    spec = importlib.util.spec_from_file_location("pipeline", module_path)
    pipeline = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pipeline)

    class MockResponse:
        def __init__(self, ok=True, status_code=200, payload=None):
            self.ok = ok
            self.status_code = status_code
            self._json = payload or {"access_token": "abc123"}
            self.text = ""

        def json(self):
            return self._json

    captured = []

    def fake_post(url, **kwargs):
        captured.append((url, kwargs))
        if url.endswith("/auth/login") and len(captured) == 1:
            return MockResponse(ok=False, status_code=401, payload={"detail": "Invalid credentials"})
        if url.endswith("/auth/register"):
            return MockResponse(ok=True, status_code=201, payload={"email": "admin@example.com"})
        return MockResponse(ok=True, status_code=200, payload={"access_token": "abc123"})

    monkeypatch.setattr(pipeline.requests, "post", fake_post)

    headers = pipeline.authenticate("http://localhost:8000", "admin@example.com", "secret123")

    assert headers == {"Authorization": "Bearer abc123"}
    assert captured[0][0] == "http://localhost:8000/api/v1/auth/login"
    assert captured[0][1]["json"] == {
        "email": "admin@example.com",
        "password": "secret123",
    }
    assert "data" not in captured[0][1]
    assert captured[1][0] == "http://localhost:8000/api/v1/auth/register"
    assert captured[2][0] == "http://localhost:8000/api/v1/auth/login"
