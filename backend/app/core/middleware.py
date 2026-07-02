import secrets
import time
from typing import Any, Awaitable, Callable, Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

import structlog

from app.core.logging_config import get_logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id: str = (
            request.headers.get("X-Request-ID")
            or f"req_{secrets.token_hex(6)}"
        )

        structlog.contextvars.bind_contextvars(request_id=request_id)

        logger = get_logger(__name__)
        logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
        )

        start_time = time.perf_counter()

        try:
            response = await call_next(request)

            duration_ms = round(
                (time.perf_counter() - start_time) * 1000, 1
            )

            logger.info(
                "request_completed",
                status_code=response.status_code,
                duration_ms=duration_ms,
            )

            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as exc:  # noqa: BLE001
            logger.error(
                "request_failed",
                exc_type=type(exc).__name__,
                exc_info=True,
            )
            raise
        finally:
            structlog.contextvars.unbind_contextvars("request_id")


def get_bound_logger(name: str):
    return get_logger(name).bind(request_id=structlog.contextvars.get_contextvars().get("request_id"))

