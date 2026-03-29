import re
from datetime import date, datetime, timedelta

from src.utils.exceptions import ValidationError


VALID_SLOT_NAMES = {"breakfast", "lunch", "dinner", "custom"}
VALID_AVAILABILITY_STATUSES = {"open", "blocked", "reserved"}
VALID_DIFFICULTIES = {"easy", "medium", "hard"}
VALID_VERIFICATION_STATUSES = {"pending", "verified", "rejected"}
DEFAULT_SLOT_WINDOWS = {
    "breakfast": ("07:00:00", "10:00:00"),
    "lunch": ("12:00:00", "14:00:00"),
    "dinner": ("18:00:00", "21:00:00"),
}
SLUG_REGEX = re.compile(r"[^a-z0-9]+")
DURATION_REGEX = re.compile(r"(\d+)")


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


def parse_time(value, field_name):
    if value in (None, ""):
        return None
    if hasattr(value, "hour") and hasattr(value, "minute"):
        return value
    normalized = str(value)
    time_formats = ("%H:%M:%S", "%H:%M")
    for time_format in time_formats:
        try:
            return datetime.strptime(normalized, time_format).time()
        except ValueError:
            continue
    raise ValidationError(f"{field_name} must be in HH:MM or HH:MM:SS format")


def parse_bool(value, field_name):
    if isinstance(value, bool):
        return value
    if value in (None, ""):
        return None
    normalized = str(value).strip().lower()
    if normalized in {"true", "1", "yes"}:
        return True
    if normalized in {"false", "0", "no"}:
        return False
    raise ValidationError(f"{field_name} must be a boolean value")


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


def parse_float(value, field_name, minimum=None, maximum=None):
    if value in (None, ""):
        return None
    try:
        parsed = round(float(value), 2)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{field_name} must be a number") from exc
    if minimum is not None and parsed < minimum:
        raise ValidationError(f"{field_name} must be at least {minimum}")
    if maximum is not None and parsed > maximum:
        raise ValidationError(f"{field_name} must be at most {maximum}")
    return parsed


def _clean_string(value):
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def _normalize_string_list(values, field_name):
    if values is None:
        return None
    if not isinstance(values, list):
        raise ValidationError(f"{field_name} must be a list of strings")
    normalized = [_clean_string(item) for item in values]
    return [item for item in normalized if item]


def _duration_minutes_and_label(value, explicit_minutes):
    if explicit_minutes not in (None, ""):
        minutes = parse_int(explicit_minutes, "preparation_time_minutes", minimum=0)
        label = f"{minutes} mins" if minutes is not None else None
        return minutes, label
    if value in (None, ""):
        return None, None
    if isinstance(value, (int, float)):
        minutes = int(value)
        return minutes, f"{minutes} mins"
    label = str(value).strip()
    match = DURATION_REGEX.search(label)
    if not match:
        raise ValidationError("preparationTime must contain a numeric duration")
    minutes = int(match.group(1))
    return minutes, label


def validate_chef_profile_payload(payload, partial=False):
    normalized = {}

    display_name = _clean_string(payload.get("display_name") or payload.get("name"))
    if display_name:
        normalized["display_name"] = display_name

    headline = _clean_string(payload.get("headline"))
    if headline is not None:
        normalized["headline"] = headline

    bio = _clean_string(payload.get("bio"))
    if bio is not None:
        normalized["bio"] = bio

    hourly_rate = payload.get("hourly_rate", payload.get("hourlyRate"))
    if hourly_rate not in (None, ""):
        normalized["hourly_rate"] = parse_float(hourly_rate, "hourly_rate", minimum=0)

    experience_years = payload.get("experience_years", payload.get("experienceYears"))
    if experience_years not in (None, ""):
        normalized["experience_years"] = parse_int(
            experience_years,
            "experience_years",
            minimum=0,
            maximum=60,
        )

    string_mappings = {
        "native_state": payload.get("native_state") or payload.get("nativeState"),
        "native_region": payload.get("native_region") or payload.get("nativeRegion"),
        "service_city": payload.get("service_city") or payload.get("city"),
        "service_state": payload.get("service_state") or payload.get("state"),
        "service_country": payload.get("service_country") or payload.get("country"),
        "location_label": payload.get("location_label") or payload.get("location"),
        "available_days_label": payload.get("available_days_label") or payload.get("availableDays"),
        "profile_image_url": payload.get("profile_image_url")
        or payload.get("profileImageUrl")
        or payload.get("image"),
        "cover_image_url": payload.get("cover_image_url") or payload.get("coverImageUrl"),
    }
    for key, value in string_mappings.items():
        if value is not None:
            normalized[key] = _clean_string(value)

    verification_status = payload.get("verification_status", payload.get("verificationStatus"))
    if verification_status not in (None, ""):
        verification_status = str(verification_status).strip().lower()
        if verification_status not in VALID_VERIFICATION_STATUSES:
            raise ValidationError(
                "verification_status is invalid",
                {"allowed_values": sorted(VALID_VERIFICATION_STATUSES)},
            )
        normalized["verification_status"] = verification_status

    is_active = payload.get("is_active", payload.get("isActive"))
    if is_active is not None:
        parsed_active = parse_bool(is_active, "is_active")
        if parsed_active is not None:
            normalized["is_active"] = parsed_active

    specialties = None
    if "specialties" in payload:
        specialties = _normalize_string_list(payload.get("specialties"), "specialties")

    if not partial:
        require_fields(normalized, ["display_name", "hourly_rate"])

    if partial and not normalized and specialties is None:
        raise ValidationError("At least one chef profile field must be provided")

    return normalized, specialties


def validate_availability_payload(payload):
    require_fields(payload, ["slots"])
    slots = payload.get("slots")
    if not isinstance(slots, list) or not slots:
        raise ValidationError("slots must be a non-empty list")

    validated_slots = []
    for index, slot in enumerate(slots):
        if not isinstance(slot, dict):
            raise ValidationError("Each availability slot must be an object", {"index": index})

        available_date = parse_date(
            slot.get("available_date") or slot.get("date"),
            f"slots[{index}].date",
        )
        slot_name = str(slot.get("slot_name") or slot.get("slotName") or "custom").strip().lower()
        if slot_name not in VALID_SLOT_NAMES:
            raise ValidationError(
                "slot_name is invalid",
                {"allowed_values": sorted(VALID_SLOT_NAMES), "index": index},
            )

        start_time_value = slot.get("start_time") or slot.get("startTime")
        end_time_value = slot.get("end_time") or slot.get("endTime")
        if slot_name in DEFAULT_SLOT_WINDOWS:
            default_start, default_end = DEFAULT_SLOT_WINDOWS[slot_name]
            start_time_value = start_time_value or default_start
            end_time_value = end_time_value or default_end
        if start_time_value in (None, "") or end_time_value in (None, ""):
            raise ValidationError(
                "start_time and end_time are required for each availability slot",
                {"index": index},
            )

        start_time = parse_time(start_time_value, f"slots[{index}].start_time")
        end_time = parse_time(end_time_value, f"slots[{index}].end_time")
        if end_time <= start_time:
            raise ValidationError("end_time must be later than start_time", {"index": index})

        capacity = parse_int(slot.get("capacity", 1), f"slots[{index}].capacity", minimum=1)
        reserved_count = parse_int(
            slot.get("reserved_count", slot.get("reservedCount", 0)),
            f"slots[{index}].reserved_count",
            minimum=0,
        )
        if reserved_count > capacity:
            raise ValidationError("reserved_count cannot exceed capacity", {"index": index})

        status = str(slot.get("status", "open")).strip().lower()
        if status not in VALID_AVAILABILITY_STATUSES:
            raise ValidationError(
                "status is invalid",
                {"allowed_values": sorted(VALID_AVAILABILITY_STATUSES), "index": index},
            )

        validated_slots.append(
            {
                "available_date": available_date,
                "slot_name": slot_name,
                "start_time": start_time,
                "end_time": end_time,
                "capacity": capacity,
                "reserved_count": reserved_count,
                "status": status,
                "notes": _clean_string(slot.get("notes")),
            }
        )

    return {
        "available_days_label": _clean_string(
            payload.get("available_days_label") or payload.get("availableDays")
        ),
        "slots": validated_slots,
    }


def validate_recipe_payload(payload, partial=False):
    recipe_data = {}

    name = _clean_string(payload.get("name") or payload.get("title"))
    if name:
        recipe_data["name"] = name

    category = _clean_string(payload.get("category"))
    if category:
        recipe_data["category"] = category

    description = _clean_string(payload.get("description"))
    if description is not None:
        recipe_data["description"] = description

    cuisine = _clean_string(payload.get("cuisine"))
    if cuisine is not None:
        recipe_data["cuisine"] = cuisine

    difficulty_level = _clean_string(
        payload.get("difficulty_level") or payload.get("difficultyLevel")
    )
    if difficulty_level:
        difficulty_level = difficulty_level.lower()
        if difficulty_level not in VALID_DIFFICULTIES:
            raise ValidationError(
                "difficulty_level is invalid",
                {"allowed_values": sorted(VALID_DIFFICULTIES)},
            )
        recipe_data["difficulty_level"] = difficulty_level

    cooking_time_value = (
        payload.get("cookingTime")
        or payload.get("cooking_time_label")
        or payload.get("cookingTimeLabel")
    )
    cooking_time_minutes = (
        payload.get("cooking_time_minutes")
        or payload.get("cookingTimeMinutes")
        or payload.get("cookTimeMinutes")
    )

    preparation_minutes, preparation_label = _duration_minutes_and_label(
        payload.get("preparationTime")
        or payload.get("preparation_time_label")
        or cooking_time_value,
        payload.get("preparation_time_minutes"),
    )
    if preparation_minutes is None and cooking_time_minutes not in (None, ""):
        preparation_minutes, preparation_label = _duration_minutes_and_label(
            cooking_time_value or cooking_time_minutes,
            cooking_time_minutes,
        )
    if preparation_minutes is not None:
        recipe_data["preparation_time_minutes"] = preparation_minutes
        recipe_data["preparation_time_label"] = preparation_label

    cook_time_minutes = payload.get("cook_time_minutes", cooking_time_minutes)
    if cook_time_minutes not in (None, ""):
        recipe_data["cook_time_minutes"] = parse_int(
            cook_time_minutes,
            "cook_time_minutes",
            minimum=0,
        )

    servings = payload.get("servings")
    if servings not in (None, ""):
        recipe_data["servings"] = parse_int(servings, "servings", minimum=1, maximum=100)

    calories = payload.get("calories")
    if calories not in (None, ""):
        recipe_data["calories"] = parse_int(calories, "calories", minimum=0)

    price = payload.get("price")
    if price not in (None, ""):
        recipe_data["price"] = parse_float(price, "price", minimum=0)

    image_url = _clean_string(payload.get("image_url") or payload.get("image"))
    if image_url is not None:
        recipe_data["image_url"] = image_url

    is_public = payload.get("is_public", payload.get("isPublic"))
    if is_public is not None:
        parsed_public = parse_bool(is_public, "is_public")
        if parsed_public is not None:
            recipe_data["is_public"] = parsed_public

    ingredients = None
    if "ingredients" in payload:
        if not isinstance(payload["ingredients"], list):
            raise ValidationError("ingredients must be a list")
        ingredients = []
        for index, ingredient in enumerate(payload["ingredients"]):
            if isinstance(ingredient, str):
                ingredient_name = _clean_string(ingredient)
                if ingredient_name:
                    ingredients.append(
                        {
                            "ingredient_name": ingredient_name,
                            "quantity": None,
                            "unit": None,
                            "sort_order": index + 1,
                        }
                    )
                continue
            if not isinstance(ingredient, dict):
                raise ValidationError("Each ingredient must be a string or object", {"index": index})
            ingredient_name = _clean_string(
                ingredient.get("ingredient_name") or ingredient.get("name")
            )
            if not ingredient_name:
                raise ValidationError("ingredient_name is required", {"index": index})
            ingredients.append(
                {
                    "ingredient_name": ingredient_name,
                    "quantity": _clean_string(ingredient.get("quantity")),
                    "unit": _clean_string(ingredient.get("unit")),
                    "sort_order": parse_int(
                        ingredient.get("sort_order", ingredient.get("sortOrder", index + 1)),
                        f"ingredients[{index}].sort_order",
                        minimum=1,
                    ),
                }
            )

    steps = None
    if "steps" in payload:
        if not isinstance(payload["steps"], list):
            raise ValidationError("steps must be a list")
        steps = []
        for index, step in enumerate(payload["steps"]):
            if isinstance(step, str):
                instruction = _clean_string(step)
                if instruction:
                    steps.append({"step_number": index + 1, "instruction": instruction})
                continue
            if not isinstance(step, dict):
                raise ValidationError("Each step must be a string or object", {"index": index})
            instruction = _clean_string(step.get("instruction") or step.get("text"))
            if not instruction:
                raise ValidationError("instruction is required for each step", {"index": index})
            steps.append(
                {
                    "step_number": parse_int(
                        step.get("step_number", step.get("stepNumber", index + 1)),
                        f"steps[{index}].step_number",
                        minimum=1,
                    ),
                    "instruction": instruction,
                }
            )

    if not partial:
        require_fields(recipe_data, ["name", "category", "description", "preparation_time_minutes"])
        recipe_data.setdefault("difficulty_level", "medium")
        recipe_data.setdefault("servings", 2)
        recipe_data.setdefault(
            "cook_time_minutes",
            recipe_data.get("preparation_time_minutes", 0),
        )
        recipe_data.setdefault("is_public", True)
        if not ingredients:
            raise ValidationError("At least one ingredient is required")
        if not steps:
            raise ValidationError("At least one cooking step is required")

    if partial and not recipe_data and ingredients is None and steps is None:
        raise ValidationError("At least one recipe field must be provided")

    return recipe_data, ingredients, steps


def validate_rating_payload(payload):
    rating_value = parse_int(
        payload.get("rating_value", payload.get("rating")),
        "rating",
        minimum=1,
        maximum=5,
    )
    if rating_value is None:
        raise ValidationError("rating is required")
    return {
        "rating_value": rating_value,
        "comment": _clean_string(payload.get("comment")),
        "source": _clean_string(payload.get("source")) or "manual",
    }


def validate_chef_filters(args):
    limit = parse_int(args.get("limit", 20), "limit", minimum=1, maximum=50)
    offset = parse_int(args.get("offset", 0), "offset", minimum=0)
    min_rating = parse_float(args.get("min_rating"), "min_rating", minimum=0, maximum=5)
    max_hourly_rate = parse_float(
        args.get("max_hourly_rate"),
        "max_hourly_rate",
        minimum=0,
    )
    verified_only = parse_bool(args.get("verified_only", False), "verified_only") or False
    return {
        "limit": limit,
        "offset": offset,
        "city": _clean_string(args.get("city")),
        "location": _clean_string(args.get("location")),
        "cuisine": _clean_string(args.get("cuisine")),
        "q": _clean_string(args.get("q")),
        "min_rating": min_rating,
        "max_hourly_rate": max_hourly_rate,
        "verified_only": verified_only,
    }


def validate_availability_query(args):
    start_date = parse_date(args.get("start_date"), "start_date") or date.today()
    end_date = parse_date(args.get("end_date"), "end_date") or (start_date + timedelta(days=30))
    if end_date < start_date:
        raise ValidationError("end_date cannot be earlier than start_date")
    status = _clean_string(args.get("status"))
    if status:
        status = status.lower()
        if status not in VALID_AVAILABILITY_STATUSES:
            raise ValidationError(
                "status is invalid",
                {"allowed_values": sorted(VALID_AVAILABILITY_STATUSES)},
            )
    return {
        "start_date": start_date,
        "end_date": end_date,
        "status": status,
    }


def validate_recipe_filters(args):
    return {
        "limit": parse_int(args.get("limit", 20), "limit", minimum=1, maximum=50),
        "offset": parse_int(args.get("offset", 0), "offset", minimum=0),
        "category": _clean_string(args.get("category")),
        "cuisine": _clean_string(args.get("cuisine")),
        "state": _clean_string(args.get("state") or args.get("origin_state")),
        "region": _clean_string(args.get("region") or args.get("origin_region")),
        "q": _clean_string(args.get("q")),
    }


def slugify(value):
    normalized = SLUG_REGEX.sub("-", str(value).strip().lower()).strip("-")
    return normalized or "recipe"
