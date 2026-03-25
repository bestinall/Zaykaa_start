from src.utils.exceptions import ValidationError


VALID_ORDER_STATUSES = {
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
}


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


def _normalize_items(items):
    if items in (None, ""):
        return []
    if not isinstance(items, list):
        raise ValidationError("items must be an array")

    merged_items = {}
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValidationError(f"items[{index}] must be an object")
        menu_item_id = parse_int(
            item.get("menuItemId", item.get("id")),
            f"items[{index}].menuItemId",
            minimum=1,
        )
        quantity = parse_int(item.get("quantity"), f"items[{index}].quantity", minimum=1, maximum=50)
        merged_items[menu_item_id] = merged_items.get(menu_item_id, 0) + quantity

    return [
        {"menu_item_id": menu_item_id, "quantity": quantity}
        for menu_item_id, quantity in merged_items.items()
    ]


def validate_restaurant_filters(args):
    return {
        "location": str(args.get("location", "")).strip() or None,
        "cuisine": str(args.get("cuisine", "")).strip() or None,
        "search": str(args.get("search", "")).strip() or None,
    }


def validate_cart_payload(payload):
    items = _normalize_items(payload.get("items"))
    restaurant_id = parse_int(payload.get("restaurantId"), "restaurantId", minimum=1)
    if items and not restaurant_id:
        raise ValidationError("restaurantId is required when cart items are provided")

    return {
        "restaurant_id": restaurant_id,
        "items": items,
        "coupon_code": str(payload.get("couponCode", "")).strip().upper() or None,
    }


def validate_create_order_payload(payload):
    require_fields(payload, ["restaurantId", "items", "deliveryAddress"])
    items = _normalize_items(payload.get("items"))
    if not items:
        raise ValidationError("At least one item is required to place an order")
    delivery_address = str(payload.get("deliveryAddress", "")).strip()
    if not delivery_address:
        raise ValidationError("deliveryAddress is required")

    return {
        "restaurant_id": parse_int(payload.get("restaurantId"), "restaurantId", minimum=1),
        "items": items,
        "delivery_address": delivery_address,
        "coupon_code": str(payload.get("couponCode", "")).strip().upper() or None,
        "notes": str(payload.get("notes", "")).strip() or None,
        "client_subtotal_amount": parse_float(
            payload.get("subtotalAmount", payload.get("totalAmount", payload.get("amount"))),
            "subtotalAmount",
            minimum=0,
        ),
    }


def validate_coupon_payload(payload):
    require_fields(payload, ["code"])
    code = str(payload.get("code", "")).strip().upper()
    if not code:
        raise ValidationError("code is required")
    items = _normalize_items(payload.get("items"))
    subtotal_amount = parse_float(
        payload.get("subtotalAmount", payload.get("totalAmount", payload.get("amount"))),
        "subtotalAmount",
        minimum=0,
    )
    if not items and subtotal_amount is None:
        raise ValidationError("Provide either items or subtotalAmount for coupon validation")

    return {
        "code": code,
        "restaurant_id": parse_int(payload.get("restaurantId"), "restaurantId", minimum=1),
        "items": items,
        "subtotal_amount": subtotal_amount,
    }


def validate_order_list_filters(args):
    status = str(args.get("status", "")).strip().lower() or None
    if status == "all":
        status = None
    if status and status not in VALID_ORDER_STATUSES:
        raise ValidationError(
            "status is invalid",
            {"allowed_values": sorted(VALID_ORDER_STATUSES | {"all"})},
        )

    limit = parse_int(args.get("limit"), "limit", minimum=1, maximum=50)
    return {
        "status": status,
        "limit": limit,
    }


def validate_cancel_payload(payload):
    return {
        "reason": str(payload.get("reason", "")).strip() or None,
    }


def validate_status_update_payload(payload):
    require_fields(payload, ["status"])
    status = str(payload.get("status", "")).strip().lower()
    if status not in VALID_ORDER_STATUSES:
        raise ValidationError(
            "status is invalid",
            {"allowed_values": sorted(VALID_ORDER_STATUSES)},
        )
    return {
        "status": status,
        "notes": str(payload.get("notes", "")).strip() or None,
    }
