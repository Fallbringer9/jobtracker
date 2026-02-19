from __future__ import annotations

from typing import Any, Dict

from core.response import json_response, not_found
from routes.applications import list_applications, create_application


def handler(event: Dict[str, Any], context: Any):
    method = event.get("requestContext", {}).get("http", {}).get("method")
    path = event.get("rawPath", "")

    # Health
    if method == "GET" and path == "/health":
        return json_response({"ok": True, "message": "Backend alive"})

    # Applications
    if path == "/applications":
        if method == "GET":
            return list_applications(event)
        if method == "POST":
            return create_application(event)

    return not_found()