from __future__ import annotations

from typing import Any, Dict

from core.response import json_response, not_found
from routes.applications import (
    create_application,
    get_application,
    list_applications,
    patch_application,
    delete_application,
)


def handler(event: Dict[str, Any], context: Any):
    request_ctx = event.get("requestContext", {})
    method = request_ctx.get("http", {}).get("method")
    path = event.get("rawPath") or request_ctx.get("http", {}).get("path") or ""


    route_key = request_ctx.get("routeKey") or event.get("routeKey")


    if route_key == "GET /health":
        return json_response({"ok": True, "message": "Backend alive"})


    if route_key == "GET /applications":
        return list_applications(event)

    if route_key == "POST /applications":
        return create_application(event)

    # Application by ID
    if (route_key == "GET /applications/{id}") or (method == "GET" and path.startswith("/applications/")):
        path_params = event.get("pathParameters") or {}
        app_id = path_params.get("id")

        # Fallback: derive id from the path (keeps routing resilient in local tests)
        if not app_id:
            app_id = path[len("/applications/") :].strip("/")

        if not app_id:
            return not_found("Missing application id")

        if method == "GET":
            return get_application(event, app_id)

        if method == "PATCH":
            return patch_application(event, app_id)

        if method == "DELETE":
            return delete_application(event, app_id)

    return not_found("Route not matched")