from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from boto3.dynamodb.conditions import Key

from core.auth import get_sub
from core.response import bad_request, json_response, server_error, unauthorized, not_found
from data.dynamo import get_table


def _now_iso() -> str:
    """UTC timestamp in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


def list_applications(event: Dict[str, Any]):
    """GET /applications - List all applications for the authenticated user."""
    sub = get_sub(event)
    if not sub:
        return unauthorized()

    pk = f"USER#{sub}"

    table = get_table()
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(pk),
        )
    except Exception:
        return server_error("Failed to query applications")

    items = response.get("Items", [])
    return json_response({"items": items})


def create_application(event: Dict[str, Any]):
    """POST /applications - Create a new application card."""
    sub = get_sub(event)
    if not sub:
        return unauthorized()

    raw_body = event.get("body") or "{}"
    try:
        body = json.loads(raw_body)
    except json.JSONDecodeError:
        return bad_request("Invalid JSON body")

    title = (body.get("title") or "").strip()
    company = (body.get("company") or "").strip()
    if not title or not company:
        return bad_request("title and company are required")

    pk = f"USER#{sub}"
    app_id = str(uuid.uuid4())
    sk = f"APP#{app_id}"

    now = _now_iso()

    item: Dict[str, Any] = {
        "PK": pk,
        "SK": sk,
        "applicationId": app_id,
        "title": title,
        "company": company,
        "location": (body.get("location") or "").strip(),
        "appliedDate": (body.get("appliedDate") or "").strip(),
        "jobUrl": (body.get("jobUrl") or "").strip(),
        "mission": (body.get("mission") or "").strip(),
        "notes": (body.get("notes") or "").strip(),
        "contact": (body.get("contact") or "").strip(),
        "status": "IN_PROGRESS",
        "history": [
            {
                "at": now,
                "from": None,
                "to": "IN_PROGRESS",
            }
        ],
        "createdAt": now,
        "updatedAt": now,
    }

    table = get_table()
    try:
        table.put_item(Item=item)
    except Exception:
        return server_error("Failed to create application")

    return json_response(item, status=201)


def get_application(event: Dict[str, Any], app_id: str):
    sub = get_sub(event)
    if not sub:
        return unauthorized()

    pk = f"USER#{sub}"
    sk = f"APP#{app_id}"

    table = get_table()
    try:
        response = table.get_item(Key={"PK": pk, "SK": sk})
    except Exception:
        return server_error("Failed to get application")

    item = response.get("Item")
    if not item:
        return not_found("Application not found")

    return json_response(item)