import requests

from src.config import Config
from src.database.connection import DatabasePoolManager
from src.repositories.chef_repository import ChefRepository
from src.repositories.recipe_repository import RecipeRepository
from src.utils.exceptions import ConflictError, NotFoundError, ValidationError
from src.utils.logger import get_logger
from src.utils.validators import (
    validate_availability_payload,
    validate_availability_query,
    validate_chef_filters,
    validate_chef_profile_payload,
    validate_rating_payload,
)


PROFILE_PLACEHOLDER_IMAGE = "https://via.placeholder.com/300?text=Chef"
logger = get_logger("chef_service.profile")


class ChefProfileService:
    def __init__(self):
        self.config = Config()
        self.chef_repository = ChefRepository()
        self.recipe_repository = RecipeRepository()

    def create_profile(self, user_id, payload):
        profile_data, specialties = validate_chef_profile_payload(payload, partial=False)
        connection = DatabasePoolManager.get_connection()
        try:
            existing_profile = self.chef_repository.get_profile_by_user_id(connection, user_id)
            if existing_profile:
                raise ConflictError("Chef profile already exists for this user")

            profile_data["user_id"] = user_id
            profile_data.setdefault("location_label", self._compose_location(profile_data))
            profile_data.setdefault("service_country", "India")

            chef_id = self.chef_repository.create_profile(connection, profile_data)
            self.chef_repository.replace_specialties(connection, chef_id, specialties or [])
            connection.commit()
            return {"chef": self._fetch_formatted_profile(connection, chef_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def get_own_profile(self, user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            profile = self._get_profile_by_user_id_or_raise(connection, user_id)
            specialties = self.chef_repository.get_specialties(connection, [profile["id"]])
            return {"chef": self._format_profile(profile, specialties.get(profile["id"], []))}
        finally:
            connection.close()

    def update_profile(self, user_id, payload):
        profile_data, specialties = validate_chef_profile_payload(payload, partial=True)
        connection = DatabasePoolManager.get_connection()
        try:
            existing_profile = self._get_profile_by_user_id_or_raise(connection, user_id)

            if profile_data and "location_label" not in profile_data:
                merged_location = {
                    "service_city": profile_data.get("service_city", existing_profile.get("service_city")),
                    "service_state": profile_data.get("service_state", existing_profile.get("service_state")),
                    "service_country": profile_data.get(
                        "service_country",
                        existing_profile.get("service_country"),
                    ),
                }
                if any(merged_location.values()):
                    profile_data["location_label"] = self._compose_location(merged_location)

            if profile_data:
                self.chef_repository.update_profile(connection, existing_profile["id"], profile_data)
            if specialties is not None:
                self.chef_repository.replace_specialties(connection, existing_profile["id"], specialties)
            connection.commit()
            return {"chef": self._fetch_formatted_profile(connection, existing_profile["id"])}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_public_profiles(self, args):
        filters = validate_chef_filters(args)
        connection = DatabasePoolManager.get_connection()
        try:
            profiles = self.chef_repository.list_public_profiles(connection, filters)
            chef_ids = [profile["id"] for profile in profiles]
            specialties = self.chef_repository.get_specialties(connection, chef_ids)
            return {
                "chefs": [
                    self._format_profile(profile, specialties.get(profile["id"], []))
                    for profile in profiles
                ],
                "pagination": {
                    "limit": filters["limit"],
                    "offset": filters["offset"],
                    "count": len(profiles),
                },
            }
        finally:
            connection.close()

    def get_public_profile(self, chef_id):
        connection = DatabasePoolManager.get_connection()
        try:
            profile = self._get_public_profile_or_raise(connection, chef_id)
            specialties = self.chef_repository.get_specialties(connection, [chef_id])
            return {"chef": self._format_profile(profile, specialties.get(chef_id, []))}
        finally:
            connection.close()

    def get_public_availability(self, chef_id, args):
        filters = validate_availability_query(args)
        connection = DatabasePoolManager.get_connection()
        try:
            profile = self._get_public_profile_or_raise(connection, chef_id)
            slots = self.chef_repository.get_availability(connection, chef_id, filters)
            return {
                "chefId": chef_id,
                "chefName": profile["display_name"],
                "availability": self._group_availability(slots),
            }
        finally:
            connection.close()

    def get_own_availability(self, user_id, args):
        filters = validate_availability_query(args)
        connection = DatabasePoolManager.get_connection()
        try:
            profile = self._get_profile_by_user_id_or_raise(connection, user_id)
            slots = self.chef_repository.get_availability(connection, profile["id"], filters)
            return {
                "chefId": profile["id"],
                "availability": self._group_availability(slots),
            }
        finally:
            connection.close()

    def update_availability(self, user_id, payload):
        validated_payload = validate_availability_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            profile = self._get_profile_by_user_id_or_raise(connection, user_id)
            dates_to_replace = sorted(
                {slot["available_date"] for slot in validated_payload["slots"]}
            )
            self.chef_repository.delete_availability_for_dates(connection, profile["id"], dates_to_replace)
            self.chef_repository.insert_availability_slots(
                connection,
                profile["id"],
                validated_payload["slots"],
            )
            if validated_payload.get("available_days_label"):
                self.chef_repository.update_profile(
                    connection,
                    profile["id"],
                    {"available_days_label": validated_payload["available_days_label"]},
                )
            connection.commit()
            slots = self.chef_repository.get_availability(
                connection,
                profile["id"],
                {
                    "start_date": min(dates_to_replace),
                    "end_date": max(dates_to_replace),
                    "status": None,
                },
            )
            return {
                "chefId": profile["id"],
                "availability": self._group_availability(slots),
            }
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def add_rating_event(self, chef_id, reviewer_user_id, payload):
        validated_payload = validate_rating_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            profile = self._get_public_profile_or_raise(connection, chef_id)
            if reviewer_user_id == profile["user_id"]:
                raise ValidationError("You cannot rate your own chef profile")
            self.chef_repository.insert_rating_event(
                connection,
                chef_id,
                reviewer_user_id,
                validated_payload,
            )
            summary = self.chef_repository.aggregate_rating_summary(connection, chef_id)
            self.chef_repository.upsert_rating_summary(connection, chef_id, summary)
            connection.commit()
            refreshed_profile = self.chef_repository.get_profile_by_id(connection, chef_id)
            return {
                "chefId": chef_id,
                "ratingSummary": self._format_rating_summary(refreshed_profile),
            }
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def get_analytics(self, user_id, auth_header=""):
        connection = DatabasePoolManager.get_connection()
        try:
            profile = self._get_profile_by_user_id_or_raise(connection, user_id)
            availability_metrics = self.chef_repository.get_availability_metrics(connection, profile["id"]) or {}
            recipe_metrics = self.recipe_repository.get_recipe_metrics(connection, profile["id"]) or {}
            booking_metrics = self._get_booking_metrics(auth_header)
            average_rating = float(profile.get("average_rating") or 0)
            total_reviews = int(profile.get("total_reviews") or 0)
            return {
                "totalBookings": int(booking_metrics.get("totalBookings") or 0),
                "completedBookings": int(booking_metrics.get("completedBookings") or 0),
                "upcomingBookings": int(booking_metrics.get("upcomingBookings") or 0),
                "totalEarnings": float(booking_metrics.get("totalEarnings") or 0),
                "averageRating": round(average_rating, 2),
                "totalReviews": total_reviews,
                "totalRecipes": int(recipe_metrics.get("total_recipes") or 0),
                "publicRecipes": int(recipe_metrics.get("public_recipes") or 0),
                "totalRecipeViews": int(recipe_metrics.get("total_recipe_views") or 0),
                "openAvailabilitySlots": int(availability_metrics.get("upcoming_open_slots") or 0),
                "reservedAvailabilitySlots": int(
                    availability_metrics.get("upcoming_reserved_slots") or 0
                ),
            }
        finally:
            connection.close()

    def _fetch_formatted_profile(self, connection, chef_id):
        profile = self.chef_repository.get_profile_by_id(connection, chef_id)
        specialties = self.chef_repository.get_specialties(connection, [chef_id])
        return self._format_profile(profile, specialties.get(chef_id, []))

    def _get_profile_by_user_id_or_raise(self, connection, user_id):
        profile = self.chef_repository.get_profile_by_user_id(connection, user_id)
        if not profile:
            raise NotFoundError("Chef profile was not found for this user")
        return profile

    def _get_public_profile_or_raise(self, connection, chef_id):
        profile = self.chef_repository.get_profile_by_id(connection, chef_id)
        if not profile or not profile.get("is_active"):
            raise NotFoundError("Chef profile was not found")
        return profile

    def _format_profile(self, profile, specialties):
        location = profile.get("location_label") or self._compose_location(profile)
        available_days = profile.get("available_days_label") or "Schedule available on request"
        average_rating = float(profile.get("average_rating") or 0)
        return {
            "id": profile["id"],
            "userId": profile["user_id"],
            "name": profile["display_name"],
            "displayName": profile["display_name"],
            "headline": profile.get("headline"),
            "bio": profile.get("bio"),
            "specialties": specialties,
            "rating": round(average_rating, 2),
            "reviews": int(profile.get("total_reviews") or 0),
            "averageRating": round(average_rating, 2),
            "hourlyRate": float(profile.get("hourly_rate") or 0),
            "hourly_rate": float(profile.get("hourly_rate") or 0),
            "experienceYears": int(profile.get("experience_years") or 0),
            "location": location,
            "city": profile.get("service_city"),
            "state": profile.get("service_state"),
            "country": profile.get("service_country"),
            "availableDays": available_days,
            "available_days": available_days,
            "image": profile.get("profile_image_url") or PROFILE_PLACEHOLDER_IMAGE,
            "profileImageUrl": profile.get("profile_image_url") or PROFILE_PLACEHOLDER_IMAGE,
            "coverImageUrl": profile.get("cover_image_url"),
            "isActive": bool(profile.get("is_active")),
            "verificationStatus": profile.get("verification_status"),
            "ratingSummary": self._format_rating_summary(profile),
            "createdAt": profile.get("created_at"),
            "updatedAt": profile.get("updated_at"),
        }

    def _format_rating_summary(self, profile):
        return {
            "averageRating": round(float(profile.get("average_rating") or 0), 2),
            "totalReviews": int(profile.get("total_reviews") or 0),
            "fiveStarCount": int(profile.get("five_star_count") or 0),
            "fourStarCount": int(profile.get("four_star_count") or 0),
            "threeStarCount": int(profile.get("three_star_count") or 0),
            "twoStarCount": int(profile.get("two_star_count") or 0),
            "oneStarCount": int(profile.get("one_star_count") or 0),
        }

    def _group_availability(self, slots):
        grouped = {}
        for slot in slots:
            date_key = slot["available_date"].isoformat()
            grouped.setdefault(
                date_key,
                {
                    "date": date_key,
                    "slots": [],
                    "slotDetails": [],
                },
            )
            if slot["slot_name"] not in grouped[date_key]["slots"] and slot["status"] == "open":
                grouped[date_key]["slots"].append(slot["slot_name"])
            grouped[date_key]["slotDetails"].append(
                {
                    "id": slot["id"],
                    "slotName": slot["slot_name"],
                    "startTime": slot["start_time"],
                    "endTime": slot["end_time"],
                    "capacity": slot["capacity"],
                    "reservedCount": slot["reserved_count"],
                    "status": slot["status"],
                    "notes": slot.get("notes"),
                }
            )
        return list(grouped.values())

    def _compose_location(self, payload):
        parts = [
            payload.get("service_city"),
            payload.get("service_state"),
            payload.get("service_country"),
        ]
        return ", ".join([part for part in parts if part]) or None

    def _get_booking_metrics(self, auth_header):
        if not auth_header:
            return {}
        try:
            response = requests.get(
                f"{self.config.booking_service_url}/api/v1/bookings/chef/analytics",
                headers={"Authorization": auth_header},
                timeout=self.config.upstream_timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict) and "data" in payload:
                return payload["data"]
        except (requests.RequestException, ValueError) as exc:
            logger.warning("booking_metrics_unavailable error=%s", exc)
        return {}
