from src.database.connection import DatabasePoolManager
from src.repositories.user_repository import UserRepository
from src.utils.exceptions import NotFoundError
from src.utils.validators import validate_preferences_payload, validate_profile_payload


class ProfileService:
    TAG_TYPE_MAP = {
        "cuisines": "cuisine",
        "dietary_preferences": "diet",
        "allergies": "allergy",
        "ingredient_dislikes": "ingredient_dislike",
    }

    def __init__(self):
        self.user_repository = UserRepository()

    def get_profile(self, user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            user = self.user_repository.get_user_by_id(connection, user_id)
            if not user:
                raise NotFoundError("User account was not found")
            return user
        finally:
            connection.close()

    def update_profile(self, user_id, payload):
        validated_payload = validate_profile_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            updated_rows = self.user_repository.update_profile(connection, user_id, validated_payload)
            if updated_rows == 0:
                raise NotFoundError("User account was not found")
            connection.commit()
            return self.user_repository.get_user_by_id(connection, user_id)
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def get_preferences(self, user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            preferences = self.user_repository.get_preferences(connection, user_id) or {
                "user_id": user_id,
                "calorie_target": None,
                "protein_target_g": None,
                "carbs_target_g": None,
                "fats_target_g": None,
                "spice_level": "medium",
                "budget_preference": "standard",
                "meal_complexity": "balanced",
            }
            tags = self.user_repository.get_preference_tags(connection, user_id)
            return self._format_preferences(preferences, tags)
        finally:
            connection.close()

    def update_preferences(self, user_id, payload):
        scalar_data, tags = validate_preferences_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            existing_preferences = self.user_repository.get_preferences(connection, user_id) or {}
            merged_preferences = {
                "calorie_target": existing_preferences.get("calorie_target"),
                "protein_target_g": existing_preferences.get("protein_target_g"),
                "carbs_target_g": existing_preferences.get("carbs_target_g"),
                "fats_target_g": existing_preferences.get("fats_target_g"),
                "spice_level": existing_preferences.get("spice_level", "medium"),
                "budget_preference": existing_preferences.get("budget_preference", "standard"),
                "meal_complexity": existing_preferences.get("meal_complexity", "balanced"),
            }
            merged_preferences.update(scalar_data)
            self.user_repository.upsert_preferences(connection, user_id, merged_preferences)

            existing_tags = self.user_repository.get_preference_tags(connection, user_id)
            grouped_tags = self._group_tags(existing_tags)
            grouped_tags.update(tags)
            tag_rows = []
            for response_key, tag_type in self.TAG_TYPE_MAP.items():
                for value in grouped_tags.get(response_key, []):
                    tag_rows.append((user_id, tag_type, value))
            self.user_repository.replace_preference_tags(connection, user_id, tag_rows)
            connection.commit()

            preferences = self.user_repository.get_preferences(connection, user_id)
            tags = self.user_repository.get_preference_tags(connection, user_id)
            return self._format_preferences(preferences, tags)
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def _group_tags(self, tags):
        grouped = {
            "cuisines": [],
            "dietary_preferences": [],
            "allergies": [],
            "ingredient_dislikes": [],
        }
        reverse_map = {value: key for key, value in self.TAG_TYPE_MAP.items()}
        for tag in tags:
            response_key = reverse_map[tag["tag_type"]]
            grouped[response_key].append(tag["tag_value"])
        return grouped

    def _format_preferences(self, preferences, tags):
        grouped_tags = self._group_tags(tags)
        return {
            "user_id": preferences["user_id"],
            "targets": {
                "calorie_target": preferences.get("calorie_target"),
                "protein_target_g": preferences.get("protein_target_g"),
                "carbs_target_g": preferences.get("carbs_target_g"),
                "fats_target_g": preferences.get("fats_target_g"),
            },
            "preferences": {
                "spice_level": preferences.get("spice_level"),
                "budget_preference": preferences.get("budget_preference"),
                "meal_complexity": preferences.get("meal_complexity"),
            },
            "tags": grouped_tags,
        }
