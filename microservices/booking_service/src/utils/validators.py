from datetime import date, datetime, timedelta

from src.utils.exceptions import ValidationError


VALID_TIME_SLOTS = {"breakfast", "lunch", "dinner", "custom"}
VALID_BOOKING_STATUSES = {"pending", "confirmed", "completed", "cancelled"}
ACTIVE_BOOKING_STATUSES = {"pending", "confirmed"}


def require_fields(payload, required_fields):
    missing = [field for field in required_fields if payload.get(field) in (None, "", [])]
    if missing:
        raise ValidationError("Missing required fields", {"missing_fields": missing})


def parse_date(value, field_name):
    if value in (None, ""):
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValidationError(f"{field_name} must be in YYYY-MM-DD format") from exc


def parse_int(value, field_name, minimum=None, maximum=None):
    if value in (None, ""):
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{field_name} must be an integer") from exc
    if minimum is not None and parsed < minimum:
        raise ValidationError(f"{field_name} must be at least {minimum}")
    if maximum is not None and parsed > maximum:
        raise ValidationError(f"{field_name} must be at most {maximum}")
    return parsed


def parse_float(value, field_name, minimum=None):
    if value in (None, ""):
        return None
    try:
        parsed = round(float(value), 2)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{field_name} must be a number") from exc
    if minimum is not None and parsed < minimum:
        raise ValidationError(f"{field_name} must be at least {minimum}")
    return parsed


def validate_create_booking_payload(payload, default_session_hours):
    require_fields(payload, ["chefId", "date", "timeSlot", "guestCount"])

    booking_date = parse_date(payload.get("date"), "date")
    if booking_date < date.today():
        raise ValidationError("date cannot be in the past")

    time_slot = str(payload.get("timeSlot")).strip().lower()
    if time_slot not in VALID_TIME_SLOTS:
        raise ValidationError("timeSlot is invalid", {"allowed_values": sorted(VALID_TIME_SLOTS)})

    guest_count = parse_int(payload.get("guestCount"), "guestCount", minimum=1, maximum=20)
    session_hours = parse_float(
        payload.get("sessionHours", default_session_hours),
        "sessionHours",
        minimum=1,
    )

    return {
        "chef_id": parse_int(payload.get("chefId"), "chefId", minimum=1),
        "booking_date": booking_date,
        "time_slot": time_slot,
        "guest_count": guest_count,
        "session_hours": session_hours,
        "menu_preferences": str(payload.get("menuPreferences", "")).strip() or None,
        "dietary_restrictions": str(payload.get("dietaryRestrictions", "")).strip() or None,
        "special_requests": str(payload.get("specialRequests", "")).strip() or None,
    }


def validate_booking_list_filters(args):
    status = args.get("status")
    if status:
        status = str(status).strip().lower()
        if status == "all":
            status = None
        elif status not in VALID_BOOKING_STATUSES:
            raise ValidationError(
                "status is invalid",
                {"allowed_values": sorted(VALID_BOOKING_STATUSES | {'all'})},
            )
    return {"status": status}


def validate_cancel_payload(payload):
    reason = str(payload.get("reason", "")).strip() or None
    return {"reason": reason}


def validate_status_update_payload(payload):
    require_fields(payload, ["status"])
    status = str(payload.get("status")).strip().lower()
    if status not in VALID_BOOKING_STATUSES - {"pending"}:
        raise ValidationError(
            "status is invalid",
            {"allowed_values": sorted(VALID_BOOKING_STATUSES - {'pending'})},
        )
    return {
        "status": status,
        "notes": str(payload.get("notes", "")).strip() or None,
    }


def validate_availability_query(args):
    start_date = parse_date(args.get("start_date"), "start_date") or date.today()
    end_date = parse_date(args.get("end_date"), "end_date") or (start_date + timedelta(days=30))
    if end_date < start_date:
        raise ValidationError("end_date cannot be earlier than start_date")
    return {
        "start_date": start_date,
        "end_date": end_date,
    }
