"""Response helpers.

API Gateway (HTTP API) expects Lambda proxy responses with:
- statusCode: int
- headers: dict
- body: JSON string

These helpers keep responses consistent across all routes.
"""

from __future__ import annotations

import json
from typing import Any, Dict, Optional


DEFAULT_HEADERS: Dict[str, str] = {
    "content-type": "application/json",
}


def json_response(body: Any, status: int = 200, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Return a standard JSON Lambda proxy response."""
    merged_headers = {**DEFAULT_HEADERS, **(headers or {})}
    return {
        "statusCode": status,
        "headers": merged_headers,
        "body": json.dumps(body, ensure_ascii=False),
    }


def bad_request(message: str, *, code: str = "BAD_REQUEST") -> Dict[str, Any]:
    return json_response({"message": message, "code": code}, status=400)


def unauthorized(message: str = "Unauthorized", *, code: str = "UNAUTHORIZED") -> Dict[str, Any]:
    return json_response({"message": message, "code": code}, status=401)


def not_found(message: str = "Not Found", *, code: str = "NOT_FOUND") -> Dict[str, Any]:
    return json_response({"message": message, "code": code}, status=404)


def server_error(message: str = "Internal Server Error", *, code: str = "SERVER_ERROR") -> Dict[str, Any]:
    return json_response({"message": message, "code": code}, status=500)
