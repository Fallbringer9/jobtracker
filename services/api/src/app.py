from __future__ import annotations

from typing import Any, Dict

from core.response import json_response, not_found
from routes.applications import create_application, get_application, list_applications


def handler(event: Dict[str, Any], context: Any):
    method = event.get("requestContext", {}).get("http", {}).get("method")
    path = event.get("rawPath", "")
    route_key = event.get("routeKey") or f"{method} {path}"

    # Health
    if route_key == "GET /health":
        return json_response({"ok": True, "message": "Backend alive"})

    # Applications collection
    if route_key == "GET /applications":
        return list_applications(event)

    if route_key == "POST /applications":
        return create_application(event)

    # Application by ID
    if route_key == "GET /applications/{id}":
        path_params = event.get("pathParameters") or {}
        app_id = path_params.get("id")
        if not app_id:
            return not_found()
        return get_application(event, app_id)

    return not_found()