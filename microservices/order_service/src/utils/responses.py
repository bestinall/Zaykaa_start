from datetime import date, datetime, time, timedelta
from decimal import Decimal

from flask import g, jsonify


def _serialize_value(value):
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    if isinstance(value, tuple):
        return [_serialize_value(item) for item in value]
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, time):
        return value.isoformat()
    if isinstance(value, timedelta):
        total_seconds = int(value.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    if isinstance(value, Decimal):
        return float(value)
    return value


def success_response(data=None, message="Success", status_code=200):
    payload = {
        "success": True,
        "message": message,
        "data": _serialize_value(data),
    }
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
            "details": _serialize_value(details or {}),
        },
    }
    request_id = getattr(g, "request_id", None)
    if request_id:
        payload["request_id"] = request_id
    return jsonify(payload), status_code
