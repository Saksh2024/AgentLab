"""Tests for the API-key dependency, rate limiter and health endpoint."""
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

VERSIONS = f"{settings.API_V1_STR}/versions/"


@pytest.fixture(scope="module")
def client():
    """Context-managed so the lifespan runs and the DB schema exists (needed on a fresh checkout)."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _reset(monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", None)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_MINUTE", 0)
    yield


def _limiter():
    """Find the live RateLimitMiddleware instance in the built middleware stack."""
    if app.middleware_stack is None:
        app.middleware_stack = app.build_middleware_stack()
    layer = app.middleware_stack
    while layer is not None:
        if layer.__class__.__name__ == "RateLimitMiddleware":
            return layer
        layer = getattr(layer, "app", None)
    raise AssertionError("RateLimitMiddleware not installed")


def test_health_is_public_even_with_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "secret")
    assert client.get("/health").status_code == 200


def test_no_key_required_when_unconfigured(client):
    assert client.get(VERSIONS).status_code == 200


def test_missing_or_wrong_key_rejected(client, monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "secret")
    assert client.get(VERSIONS).status_code == 401
    assert client.get(VERSIONS, headers={"X-API-Key": "nope"}).status_code == 401


def test_correct_key_accepted(client, monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "secret")
    assert client.get(VERSIONS, headers={"X-API-Key": "secret"}).status_code == 200


def test_cors_preflight_not_blocked_by_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "secret")
    r = client.options(
        VERSIONS,
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET",
                 "Access-Control-Request-Headers": "x-api-key"},
    )
    assert r.status_code == 200


def test_rate_limit_returns_429_with_retry_after(client):
    limiter = _limiter()
    limiter.hits.clear()
    limiter.limit = 3
    try:
        codes = [client.get(VERSIONS).status_code for _ in range(5)]
        assert codes[:3] == [200, 200, 200]
        assert codes[3:] == [429, 429]
        r = client.get(VERSIONS)
        assert r.headers["retry-after"].isdigit()
        # Health stays outside the limiter
        assert client.get("/health").status_code == 200
    finally:
        limiter.limit = 0
        limiter.hits.clear()
