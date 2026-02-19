

"""Auth helpers.

For HTTP API + Cognito JWT authorizer, claims are available at:
(event['requestContext']['authorizer']['jwt']['claims']).

We keep extraction logic here so routes don't have to know the event shape.
"""

from __future__ import annotations

from typing import Any, Dict, Optional


def get_jwt_claims(event: Dict[str, Any]) -> Dict[str, Any]:
    """Return JWT claims dict or an empty dict if missing."""
    try:
        return event["requestContext"]["authorizer"]["jwt"]["claims"]
    except Exception:
        return {}


def get_sub(event: Dict[str, Any]) -> Optional[str]:
    """Return Cognito user 'sub' (unique user id) from the JWT claims."""
    claims = get_jwt_claims(event)
    sub = claims.get("sub")
    return str(sub) if sub else None


def get_email(event: Dict[str, Any]) -> Optional[str]:
    """Return user's email from the JWT claims (if present)."""
    claims = get_jwt_claims(event)
    email = claims.get("email")
    return str(email) if email else None