from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from boto3.dynamodb.conditions import Attr, Key

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


def patch_application(event: Dict[str, Any], app_id: str):
    """PATCH /applications/{id} - Partially update an application.

    V1 rules:
    - Allowed fields: title, company, location, appliedDate, jobUrl, mission, notes, contact, status, closedReason
    - status must be one of: IN_PROGRESS, ACCEPTED, CLOSED
    - If status == CLOSED, closedReason must be one of: REFUSED, ABANDONED
    - When status changes, we append an entry to history and update updatedAt.
    """
    sub = get_sub(event)
    if not sub:
        return unauthorized()

    raw_body = event.get("body") or "{}"
    try:
        body = json.loads(raw_body)
    except json.JSONDecodeError:
        return bad_request("Invalid JSON body")

    if not isinstance(body, dict):
        return bad_request("Body must be a JSON object")

    allowed_fields = {
        "title",
        "company",
        "location",
        "appliedDate",
        "jobUrl",
        "mission",
        "notes",
        "contact",
        "status",
        "closedReason",
    }

    unknown_fields = set(body.keys()) - allowed_fields
    if unknown_fields:
        return bad_request(f"Unknown fields: {', '.join(sorted(unknown_fields))}")

    # Validate status / closedReason
    status = body.get("status")
    if status is not None:
        if not isinstance(status, str):
            return bad_request("status must be a string")
        status = status.strip()
        if status not in {"IN_PROGRESS", "ACCEPTED", "CLOSED"}:
            return bad_request("status must be IN_PROGRESS, ACCEPTED, or CLOSED")

    closed_reason = body.get("closedReason")
    if closed_reason is not None:
        if not isinstance(closed_reason, str):
            return bad_request("closedReason must be a string")
        closed_reason = closed_reason.strip()
        if closed_reason not in {"REFUSED", "ABANDONED"}:
            return bad_request("closedReason must be REFUSED or ABANDONED")

    if status == "CLOSED" and not closed_reason:
        return bad_request("closedReason is required when status is CLOSED")

    # Normalize simple string fields (strip)
    normalized: Dict[str, Any] = {}
    for field in {"title", "company", "location", "appliedDate", "jobUrl", "mission", "notes", "contact"}:
        if field in body:
            value = body.get(field)
            if value is None:
                normalized[field] = ""
            elif isinstance(value, str):
                normalized[field] = value.strip()
            else:
                return bad_request(f"{field} must be a string")

    if status is not None:
        normalized["status"] = status

    if closed_reason is not None:
        normalized["closedReason"] = closed_reason

    # Ensure we actually have something to update
    if not normalized:
        return bad_request("No updatable fields provided")

    pk = f"USER#{sub}"
    sk = f"APP#{app_id}"

    table = get_table()

    # Load current item to detect status changes (simple and explicit for V1)
    try:
        current = table.get_item(Key={"PK": pk, "SK": sk}).get("Item")
    except Exception:
        return server_error("Failed to read current application")

    if not current:
        return not_found("Application not found")

    now = _now_iso()

    # Build UpdateExpression dynamically
    expr_names: Dict[str, str] = {}
    expr_values: Dict[str, Any] = {":now": now}
    set_parts = ["updatedAt = :now"]

    # Map safe attribute names
    name_map = {
        "title": "#title",
        "company": "#company",
        "location": "#location",
        "appliedDate": "#appliedDate",
        "jobUrl": "#jobUrl",
        "mission": "#mission",
        "notes": "#notes",
        "contact": "#contact",
        "status": "#status",
        "closedReason": "#closedReason",
        "history": "#history",
    }
    for k, v in name_map.items():
        expr_names[v] = k

    # Regular field updates
    for field, value in normalized.items():
        placeholder = f":{field}"
        expr_values[placeholder] = value
        set_parts.append(f"{name_map[field]} = {placeholder}")

    # History append only if status changes
    new_status = normalized.get("status")
    old_status = current.get("status")
    if new_status is not None and new_status != old_status:
        expr_values[":empty_list"] = []
        expr_values[":history_event"] = [
            {
                "at": now,
                "from": old_status,
                "to": new_status,
            }
        ]
        set_parts.append(
            f"{name_map['history']} = list_append(if_not_exists({name_map['history']}, :empty_list), :history_event)"
        )

    update_expression = "SET " + ", ".join(set_parts)

    # Ensure the item exists (defensive)
    condition_expression = Attr("PK").exists() & Attr("SK").exists()

    try:
        response = table.update_item(
            Key={"PK": pk, "SK": sk},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ConditionExpression=condition_expression,
            ReturnValues="ALL_NEW",
        )
    except Exception:
        return server_error("Failed to update application")

    updated = response.get("Attributes") or {}
    return json_response(updated)