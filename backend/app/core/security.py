"""Lightweight demo-grade protection: optional API key + in-memory rate limiting.

Both features are opt-in via settings so local development stays frictionless:
  * API_KEY unset/empty  -> no key required.
  * RATE_LIMIT_PER_MINUTE=0 -> rate limiting disabled.
"""
import hmac
import logging
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Optional

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

logger = logging.getLogger(__name__)


async def verify_api_key(request: Request) -> None:
    """FastAPI dependency: require a matching X-API-Key header when API_KEY is configured."""
    expected = settings.API_KEY
    if not expected:
        return
    provided = request.headers.get("x-api-key", "")
    if not hmac.compare_digest(provided.encode(), expected.encode()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
        )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Per-client sliding-window limiter for API routes (single-process, in-memory).

    Good enough for a demo behind one container; use a shared store (e.g. Redis)
    or an API gateway if you ever run multiple replicas.
    """

    def __init__(self, app, limit_per_minute: int, api_prefix: str, trust_proxy: bool = False):
        super().__init__(app)
        self.limit = limit_per_minute
        self.api_prefix = api_prefix
        self.trust_proxy = trust_proxy
        self.window = 60.0
        self.hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._last_sweep = time.monotonic()

    def _client_id(self, request: Request) -> str:
        if self.trust_proxy:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _sweep(self, now: float) -> None:
        """Drop idle clients so the dict cannot grow without bound."""
        if now - self._last_sweep < self.window:
            return
        self._last_sweep = now
        for key in [k for k, q in self.hits.items() if not q or now - q[-1] > self.window]:
            del self.hits[key]

    async def dispatch(self, request: Request, call_next):
        if (
            self.limit <= 0
            or request.method == "OPTIONS"
            or not request.url.path.startswith(self.api_prefix)
        ):
            return await call_next(request)

        now = time.monotonic()
        self._sweep(now)
        q = self.hits[self._client_id(request)]
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.limit:
            retry_after = max(1, int(self.window - (now - q[0])))
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Please slow down."},
                headers={"Retry-After": str(retry_after)},
            )
        q.append(now)
        return await call_next(request)
