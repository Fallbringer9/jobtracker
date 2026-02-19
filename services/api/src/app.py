import json

def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method")
    path = event.get("rawPath", "")

    if method == "GET" and path == "/health":
        return {
            "statusCode": 200,
            "headers": {"content-type": "application/json"},
            "body": json.dumps({"ok": True, "message": "Backend alive"}),
        }

    return {
        "statusCode": 404,
        "headers": {"content-type": "application/json"},
        "body": json.dumps({"message": "Not Found"}),
    }