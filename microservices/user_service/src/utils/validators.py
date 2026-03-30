import re
from datetime import datetime

from src.utils.exceptions import ValidationError


EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
VALID_ROLES = {"user", "chef", "seller", "agent", "vlogger", "admin"}
PUBLIC_DIRECTORY_ALLOWED_ROLES = ("seller", "agent", "vlogger")
VALID_GENDERS = {"male", "female", "other", "prefer_not_to_say"}
VALID_ACTIVITY_LEVELS = {"low", "moderate", "high"}
VALID_SPICE_LEVELS = {"mild", "medium", "hot"}
VALID_BUDGETS = {"economy", "standard", "premium"}
VALID_MEAL_COMPLEXITY = {"simple", "balanced", "advanced"}
VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack", "water"}
VALID_MEAL_PLAN_STATUS = {"draft", "active", "archived"}
VALID_DIRECTORY_SORTS = {"recent", "name"}


def require_fields(payload, required_fields):
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        raise ValidationError("Missing required fields", {"missing_fields": missing})


def validate_email(email):
    if not EMAIL_REGEX.match(email or ""):
        raise ValidationError("A valid email address is required")


def validate_password(password):
    if not password or len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")


def parse_date(value, field_name):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValidationError(f"{field_name} must be in YYYY-MM-DD format") from exc


def parse_time(value, field_name):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%H:%M:%S").time()
    except ValueError as exc:
        raise ValidationError(f"{field_name} must be in HH:MM:SS format") from exc


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


def validate_role(role):
    if role not in VALID_ROLES:
        raise ValidationError("Role is invalid", {"allowed_roles": sorted(VALID_ROLES)})


def validate_public_directory_filters(args):
    requested_roles = []
    if hasattr(args, "getlist"):
        requested_roles.extend(args.getlist("role"))
    if args.get("roles"):
        requested_roles.extend(str(args.get("roles")).split(","))

    normalized_roles = []
    for role in requested_roles or PUBLIC_DIRECTORY_ALLOWED_ROLES:
        normalized_role = str(role).strip().lower()
        if not normalized_role:
            continue
        if normalized_role not in PUBLIC_DIRECTORY_ALLOWED_ROLES:
            raise ValidationError(
                "role filter is invalid",
                {"allowed_roles": list(PUBLIC_DIRECTORY_ALLOWED_ROLES)},
            )
        if normalized_role not in normalized_roles:
            normalized_roles.append(normalized_role)

    if not normalized_roles:
        normalized_roles = list(PUBLIC_DIRECTORY_ALLOWED_ROLES)

    sort = str(args.get("sort", "recent")).strip().lower()
    if sort not in VALID_DIRECTORY_SORTS:
        raise ValidationError(
            "sort is invalid",
            {"allowed_values": sorted(VALID_DIRECTORY_SORTS)},
        )

    return {
        "roles": normalized_roles,
        "q": str(args.get("q", "")).strip() or None,
        "limit": parse_int(args.get("limit", 12), "limit", minimum=1, maximum=50),
        "offset": parse_int(args.get("offset", 0), "offset", minimum=0),
        "sort": sort,
    }


def validate_profile_payload(payload):
    allowed_fields = {
        "full_name",
        "phone",
        "native_state",
        "native_region",
        "date_of_birth",
        "gender",
        "height_cm",
        "weight_kg",
        "activity_level",
    }
    alias_payload = dict(payload)
    if "nativeState" in payload:
        alias_payload["native_state"] = payload.get("nativeState")
    if "nativeRegion" in payload:
        alias_payload["native_region"] = payload.get("nativeRegion")
    filtered = {key: value for key, value in alias_payload.items() if key in allowed_fields}
    if not filtered:
        raise ValidationError("At least one profile field must be provided")
    for field_name in ["full_name", "phone", "native_state", "native_region"]:
        if field_name in filtered:
            filtered[field_name] = str(filtered[field_name]).strip() or None
    if "date_of_birth" in filtered:
        filtered["date_of_birth"] = parse_date(filtered["date_of_birth"], "date_of_birth")
    if "gender" in filtered and filtered["gender"] not in VALID_GENDERS:
        raise ValidationError("gender is invalid", {"allowed_values": sorted(VALID_GENDERS)})
    if "activity_level" in filtered and filtered["activity_level"] not in VALID_ACTIVITY_LEVELS:
        raise ValidationError(
            "activity_level is invalid",
            {"allowed_values": sorted(VALID_ACTIVITY_LEVELS)},
        )
    return filtered


def validate_preferences_payload(payload):
    allowed_scalar_fields = {
        "calorie_target",
        "protein_target_g",
        "carbs_target_g",
        "fats_target_g",
        "spice_level",
        "budget_preference",
        "meal_complexity",
    }
    tag_groups = {
        "cuisines": "cuisine",
        "dietary_preferences": "diet",
        "allergies": "allergy",
        "ingredient_dislikes": "ingredient_dislike",
    }

    scalar_data = {key: payload.get(key) for key in allowed_scalar_fields if key in payload}
    if "spice_level" in scalar_data and scalar_data["spice_level"] not in VALID_SPICE_LEVELS:
        raise ValidationError(
            "spice_level is invalid",
            {"allowed_values": sorted(VALID_SPICE_LEVELS)},
        )
    if "budget_preference" in scalar_data and scalar_data["budget_preference"] not in VALID_BUDGETS:
        raise ValidationError(
            "budget_preference is invalid",
            {"allowed_values": sorted(VALID_BUDGETS)},
        )
    if "meal_complexity" in scalar_data and scalar_data["meal_complexity"] not in VALID_MEAL_COMPLEXITY:
        raise ValidationError(
            "meal_complexity is invalid",
            {"allowed_values": sorted(VALID_MEAL_COMPLEXITY)},
        )

    tags = {}
    for group_name in tag_groups:
        if group_name in payload:
            group_value = payload[group_name]
            if not isinstance(group_value, list):
                raise ValidationError(f"{group_name} must be a list of strings")
            tags[group_name] = [str(item).strip() for item in group_value if str(item).strip()]

    if not scalar_data and not tags:
        raise ValidationError("At least one preference field must be provided")

    return scalar_data, tags


def validate_registration_payload(payload):
    require_fields(payload, ["full_name", "email", "password"])
    validate_email(payload["email"])
    validate_password(payload["password"])
    role = payload.get("role", "user")
    validate_role(role)
    native_state = str(
        payload.get("native_state", payload.get("nativeState", ""))
    ).strip() or None
    native_region = str(
        payload.get("native_region", payload.get("nativeRegion", ""))
    ).strip() or None
    if role in {"chef", "seller"} and not native_state:
        raise ValidationError("native_state is required for chef and seller accounts")
    return {
        "full_name": payload["full_name"].strip(),
        "email": payload["email"].strip().lower(),
        "password": payload["password"],
        "phone": payload.get("phone"),
        "role": role,
        "native_state": native_state,
        "native_region": native_region,
    }


def validate_login_payload(payload):
    require_fields(payload, ["email", "password"])
    validate_email(payload["email"])
    return {
        "email": payload["email"].strip().lower(),
        "password": payload["password"],
    }


def validate_meal_plan_payload(payload):
    require_fields(payload, ["title", "start_date", "end_date"])
    start_date = parse_date(payload["start_date"], "start_date")
    end_date = parse_date(payload["end_date"], "end_date")
    if end_date < start_date:
        raise ValidationError("end_date cannot be earlier than start_date")

    status = payload.get("status", "draft")
    if status not in VALID_MEAL_PLAN_STATUS:
        raise ValidationError(
            "status is invalid",
            {"allowed_values": sorted(VALID_MEAL_PLAN_STATUS)},
        )

    items = payload.get("items", [])
    if items is not None and not isinstance(items, list):
        raise ValidationError("items must be a list")

    validated_items = []
    for index, item in enumerate(items or []):
        if not isinstance(item, dict):
            raise ValidationError("Each meal plan item must be an object", {"index": index})
        require_fields(item, ["meal_date", "meal_type", "item_name"])
        meal_type = item["meal_type"]
        if meal_type not in VALID_MEAL_TYPES - {"water"}:
            raise ValidationError("meal_type is invalid", {"index": index})
        validated_items.append(
            {
                "meal_date": parse_date(item["meal_date"], "meal_date"),
                "meal_type": meal_type,
                "item_name": item["item_name"].strip(),
                "description": item.get("description"),
                "calories": int(item.get("calories", 0) or 0),
                "protein_g": float(item.get("protein_g", 0) or 0),
                "carbs_g": float(item.get("carbs_g", 0) or 0),
                "fats_g": float(item.get("fats_g", 0) or 0),
                "scheduled_time": parse_time(item.get("scheduled_time"), "scheduled_time"),
                "sort_order": int(item.get("sort_order", index + 1)),
            }
        )

    return {
        "title": payload["title"].strip(),
        "goal": payload.get("goal"),
        "start_date": start_date,
        "end_date": end_date,
        "status": status,
        "notes": payload.get("notes"),
        "items": validated_items,
    }


def validate_nutrition_log_payload(payload, partial=False):
    required = [] if partial else ["logged_on", "meal_type", "food_name"]
    require_fields(payload, required)

    validated = {}
    if "logged_on" in payload:
        validated["logged_on"] = parse_date(payload["logged_on"], "logged_on")
    if "meal_type" in payload:
        if payload["meal_type"] not in VALID_MEAL_TYPES:
            raise ValidationError(
                "meal_type is invalid",
                {"allowed_values": sorted(VALID_MEAL_TYPES)},
            )
        validated["meal_type"] = payload["meal_type"]
    if "food_name" in payload:
        validated["food_name"] = payload["food_name"].strip()

    optional_numeric_fields = {
        "calories": int,
        "protein_g": float,
        "carbs_g": float,
        "fats_g": float,
        "fiber_g": float,
        "water_ml": int,
    }
    for field_name, cast_type in optional_numeric_fields.items():
        if field_name in payload:
            validated[field_name] = cast_type(payload[field_name] or 0)

    for field_name in ["serving_size", "notes"]:
        if field_name in payload:
            validated[field_name] = payload[field_name]

    if partial and not validated:
        raise ValidationError("At least one nutrition log field must be provided")
    return validated
