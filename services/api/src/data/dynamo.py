

"""DynamoDB access helpers.

The table is created by CDK and its name is injected into the Lambda
as the environment variable `TABLE_NAME`.

This module centralizes DynamoDB initialization so routes stay clean.
"""

from __future__ import annotations

import os
import boto3


_dynamodb_resource = None
_table = None


def _get_table_name() -> str:
    table_name = os.environ.get("TABLE_NAME")
    if not table_name:
        raise RuntimeError("TABLE_NAME environment variable is not set")
    return table_name


def get_table():
    """Return a cached DynamoDB Table object."""
    global _dynamodb_resource, _table

    if _table is not None:
        return _table

    if _dynamodb_resource is None:
        _dynamodb_resource = boto3.resource("dynamodb")

    _table = _dynamodb_resource.Table(_get_table_name())
    return _table