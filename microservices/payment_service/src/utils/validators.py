from src.utils.exceptions import ValidationError


ALLOWED_PAYMENT_PROVIDERS = {"mock", "stripe", "razorpay"}
VALID_PAYMENT_STATUSES = {
    "initiated",
    "captured",
    "failed",
    "partially_refunded",
    "refunded",
}
VALID_VERIFY_STATUSES = {"captured", "failed"}
VALID_PAYOUT_STATUSES = {"queued", "processed", "failed"}


def require_fields(payload, required_fields):
    missing = [field for field in required_fields if payload.get(field) in (None, "", [])]
    if missing:
        raise ValidationError("Missing required fields", {"missing_fields": missing})


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


def validate_initiate_payment_payload(payload, default_provider):
    require_fields(payload, ["orderId"])
    provider = str(payload.get("provider", default_provider)).strip().lower()
    if provider not in ALLOWED_PAYMENT_PROVIDERS:
        raise ValidationError(
            "provider is invalid",
            {"allowed_values": sorted(ALLOWED_PAYMENT_PROVIDERS)},
        )
    return {
        "order_id": parse_int(payload.get("orderId"), "orderId", minimum=1),
        "provider": provider,
        "payment_method": str(payload.get("paymentMethod", "mock_card")).strip() or "mock_card",
        "notes": str(payload.get("notes", "")).strip() or None,
    }


def validate_payment_list_filters(args):
    status = str(args.get("status", "")).strip().lower() or None
    if status == "all":
        status = None
    if status and status not in VALID_PAYMENT_STATUSES:
        raise ValidationError(
            "status is invalid",
            {"allowed_values": sorted(VALID_PAYMENT_STATUSES | {"all"})},
        )
    return {"status": status}


def validate_verify_payload(payload):
    simulate_status = str(payload.get("simulateStatus", "captured")).strip().lower()
    if simulate_status not in VALID_VERIFY_STATUSES:
        raise ValidationError(
            "simulateStatus is invalid",
            {"allowed_values": sorted(VALID_VERIFY_STATUSES)},
        )
    return {
        "simulate_status": simulate_status,
        "provider_payment_id": str(payload.get("providerPaymentId", "")).strip() or None,
        "provider_signature": str(payload.get("providerSignature", "")).strip() or None,
        "notes": str(payload.get("notes", "")).strip() or None,
    }


def validate_refund_payload(payload):
    return {
        "amount": parse_float(payload.get("amount"), "amount", minimum=0.01),
        "reason": str(payload.get("reason", "")).strip() or None,
    }


def validate_payout_payload(payload):
    require_fields(payload, ["recipientUserId"])
    source_payment_id = parse_int(payload.get("sourcePaymentId"), "sourcePaymentId", minimum=1)
    amount = parse_float(payload.get("amount"), "amount", minimum=1)
    if not source_payment_id and amount is None:
        raise ValidationError("amount is required when sourcePaymentId is not provided")
    return {
        "recipient_user_id": parse_int(payload.get("recipientUserId"), "recipientUserId", minimum=1),
        "source_payment_id": source_payment_id,
        "source_order_id": parse_int(payload.get("sourceOrderId"), "sourceOrderId", minimum=1),
        "amount": amount,
        "notes": str(payload.get("notes", "")).strip() or None,
    }


def validate_payout_filters(args):
    status = str(args.get("status", "")).strip().lower() or None
    if status == "all":
        status = None
    if status and status not in VALID_PAYOUT_STATUSES:
        raise ValidationError(
            "status is invalid",
            {"allowed_values": sorted(VALID_PAYOUT_STATUSES | {"all"})},
        )
    return {"status": status}
