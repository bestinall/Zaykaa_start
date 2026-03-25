from flask import g, jsonify


def success_response(data=None, message="Success", status_code=200):
    payload = {"success": True, "message": message, "data": data}
    request_id = getattr(g, "request_id", None)
    if request_id:
        payload["request_id"] = request_id
    return jsonify(payload), status_code


def error_response(message, status_code=400, error_code="bad_request", details=None):
    payload = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "details": details or {},
        },
    }
    request_id = getattr(g, "request_id", None)
    if request_id:
        payload["request_id"] = request_id
    return jsonify(payload), status_code
