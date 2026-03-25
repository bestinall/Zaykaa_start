import uuid

from src.clients.chef_client import ChefServiceClient
from src.clients.user_client import UserServiceClient
from src.config import Config
from src.database.connection import DatabasePoolManager
from src.repositories.booking_repository import BookingRepository
from src.utils.exceptions import AuthorizationError, ConflictError, NotFoundError
from src.utils.validators import (
    validate_availability_query,
    validate_booking_list_filters,
    validate_cancel_payload,
    validate_create_booking_payload,
    validate_status_update_payload,
)


CHEF_ALLOWED_ROLES = {"chef", "admin"}
CHEF_STATUS_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}
USER_CANCELLABLE_STATUSES = {"pending", "confirmed"}


class BookingService:
    def __init__(self):
        self.config = Config()
        self.booking_repository = BookingRepository()
        self.user_client = UserServiceClient()
        self.chef_client = ChefServiceClient()

    def create_booking(self, auth_header, user_id, payload):
        validated_payload = validate_create_booking_payload(payload, self.config.default_session_hours)
        user_profile = self._extract_user_profile(self.user_client.get_current_user_profile(auth_header))
        chef_profile = self._extract_chef_profile(self.chef_client.get_public_chef(validated_payload["chef_id"]))
        availability_data = self.chef_client.get_public_availability(
            validated_payload["chef_id"],
            validated_payload["booking_date"],
            validated_payload["booking_date"],
        )
        slot_detail = self._resolve_slot_detail(
            availability_data.get("availability", []),
            validated_payload["booking_date"].isoformat(),
            validated_payload["time_slot"],
        )
        if not slot_detail:
            raise ConflictError("Selected chef slot is not available")

        connection = DatabasePoolManager.get_connection()
        try:
            if self.booking_repository.user_has_active_booking_for_slot(
                connection,
                user_id,
                validated_payload["chef_id"],
                validated_payload["booking_date"],
                validated_payload["time_slot"],
            ):
                raise ConflictError("You already have an active booking for this slot")

            active_bookings = self.booking_repository.count_active_bookings_for_slot(
                connection,
                validated_payload["chef_id"],
                validated_payload["booking_date"],
                validated_payload["time_slot"],
            )
            capacity = int(slot_detail.get("capacity") or 1)
            if active_bookings >= capacity:
                raise ConflictError("Selected slot has already been reserved")

            amount = round(
                float(chef_profile.get("hourlyRate") or 0) * float(validated_payload["session_hours"]),
                2,
            )
            booking_payload = {
                "booking_reference": f"BK-{uuid.uuid4().hex[:10].upper()}",
                "user_id": user_id,
                "user_name": user_profile.get("full_name") or user_profile.get("name") or "User",
                "user_email": user_profile.get("email") or "",
                "user_phone": user_profile.get("phone"),
                "chef_id": validated_payload["chef_id"],
                "chef_user_id": chef_profile.get("userId"),
                "chef_name": chef_profile.get("name") or "Chef",
                "booking_date": validated_payload["booking_date"],
                "time_slot": validated_payload["time_slot"],
                "slot_start_time": slot_detail.get("startTime"),
                "slot_end_time": slot_detail.get("endTime"),
                "guest_count": validated_payload["guest_count"],
                "session_hours": validated_payload["session_hours"],
                "menu_preferences": validated_payload.get("menu_preferences"),
                "dietary_restrictions": validated_payload.get("dietary_restrictions"),
                "special_requests": validated_payload.get("special_requests"),
                "amount": amount,
                "currency": "INR",
                "status": "pending",
            }
            booking_id = self.booking_repository.create_booking(connection, booking_payload)
            self.booking_repository.insert_status_history(
                connection,
                {
                    "booking_id": booking_id,
                    "old_status": None,
                    "new_status": "pending",
                    "actor_user_id": user_id,
                    "actor_role": "user",
                    "notes": "Booking request created",
                },
            )
            connection.commit()
            return {"booking": self._fetch_formatted_booking(connection, booking_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_my_bookings(self, user_id, args):
        filters = validate_booking_list_filters(args)
        connection = DatabasePoolManager.get_connection()
        try:
            bookings = self.booking_repository.list_bookings_for_user(
                connection,
                user_id,
                status=filters["status"],
            )
            return {"bookings": self._format_bookings(connection, bookings)}
        finally:
            connection.close()

    def get_booking_for_actor(self, user_id, user_role, booking_id):
        connection = DatabasePoolManager.get_connection()
        try:
            booking = self._get_booking_or_raise(connection, booking_id)
            self._assert_booking_access(user_id, user_role, booking)
            return {"booking": self._format_booking(connection, booking)}
        finally:
            connection.close()

    def cancel_booking_for_actor(self, user_id, booking_id, payload):
        validated_payload = validate_cancel_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            booking = self._get_booking_or_raise(connection, booking_id)
            if booking["user_id"] == user_id:
                actor_role = "user"
            else:
                if booking["chef_user_id"] != user_id:
                    raise AuthorizationError("You are not allowed to cancel this booking")
                actor_role = "chef"
            self._cancel_booking(
                connection,
                booking,
                user_id,
                actor_role,
                validated_payload.get("reason"),
            )
            connection.commit()
            return {"booking": self._fetch_formatted_booking(connection, booking_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_chef_bookings(self, current_user_id, args):
        filters = validate_booking_list_filters(args)
        connection = DatabasePoolManager.get_connection()
        try:
            bookings = self.booking_repository.list_bookings_for_chef(
                connection,
                current_user_id,
                status=filters["status"],
            )
            return {"bookings": self._format_bookings(connection, bookings)}
        finally:
            connection.close()

    def get_chef_booking(self, current_user_id, booking_id):
        connection = DatabasePoolManager.get_connection()
        try:
            booking = self._get_booking_or_raise(connection, booking_id)
            if booking["chef_user_id"] != current_user_id:
                raise AuthorizationError("You are not allowed to view this booking")
            return {"booking": self._format_booking(connection, booking)}
        finally:
            connection.close()

    def update_chef_booking_status(self, current_user_id, booking_id, payload):
        validated_payload = validate_status_update_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            booking = self._get_booking_or_raise(connection, booking_id)
            if booking["chef_user_id"] != current_user_id:
                raise AuthorizationError("You are not allowed to update this booking")

            target_status = validated_payload["status"]
            allowed_targets = CHEF_STATUS_TRANSITIONS.get(booking["status"], set())
            if target_status not in allowed_targets:
                raise ConflictError(
                    "Booking status transition is not allowed",
                    {
                        "current_status": booking["status"],
                        "allowed_statuses": sorted(allowed_targets),
                    },
                )

            cancellation_reason = validated_payload["notes"] if target_status == "cancelled" else None
            self.booking_repository.update_booking_status(
                connection,
                booking_id,
                target_status,
                cancellation_reason=cancellation_reason,
                cancelled_by_user_id=current_user_id if target_status == "cancelled" else None,
                cancelled_by_role="chef" if target_status == "cancelled" else None,
            )
            self.booking_repository.insert_status_history(
                connection,
                {
                    "booking_id": booking_id,
                    "old_status": booking["status"],
                    "new_status": target_status,
                    "actor_user_id": current_user_id,
                    "actor_role": "chef",
                    "notes": validated_payload.get("notes"),
                },
            )
            connection.commit()
            return {"booking": self._fetch_formatted_booking(connection, booking_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def get_effective_availability(self, chef_id, args):
        filters = validate_availability_query(args)
        availability_data = self.chef_client.get_public_availability(
            chef_id,
            filters["start_date"],
            filters["end_date"],
        )
        connection = DatabasePoolManager.get_connection()
        try:
            booking_counts = self.booking_repository.get_slot_booking_counts(
                connection,
                chef_id,
                filters["start_date"],
                filters["end_date"],
            )
        finally:
            connection.close()

        counts_map = {
            (row["booking_date"].isoformat(), row["time_slot"]): int(row["total_active_bookings"] or 0)
            for row in booking_counts
        }
        enriched_availability = []
        for day in availability_data.get("availability", []):
            enriched_day = {
                "date": day.get("date"),
                "slots": [],
                "slotDetails": [],
            }
            for slot_detail in day.get("slotDetails", []):
                key = (day.get("date"), slot_detail.get("slotName"))
                booked_count = counts_map.get(key, 0)
                capacity = int(slot_detail.get("capacity") or 1)
                remaining_capacity = max(capacity - booked_count, 0)
                effective_status = slot_detail.get("status")
                if remaining_capacity == 0 and effective_status == "open":
                    effective_status = "reserved"
                enriched_detail = {
                    **slot_detail,
                    "bookedCount": booked_count,
                    "remainingCapacity": remaining_capacity,
                    "status": effective_status,
                }
                enriched_day["slotDetails"].append(enriched_detail)
                if effective_status == "open" and remaining_capacity > 0:
                    enriched_day["slots"].append(slot_detail.get("slotName"))
            enriched_availability.append(enriched_day)

        return {
            "chefId": chef_id,
            "chefName": availability_data.get("chefName"),
            "availability": enriched_availability,
        }

    def get_chef_analytics(self, current_user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            metrics = self.booking_repository.get_chef_metrics(connection, current_user_id) or {}
            return {
                "totalBookings": int(metrics.get("total_bookings") or 0),
                "completedBookings": int(metrics.get("completed_bookings") or 0),
                "upcomingBookings": int(metrics.get("upcoming_bookings") or 0),
                "totalEarnings": float(metrics.get("total_earnings") or 0),
            }
        finally:
            connection.close()

    def _cancel_booking(self, connection, booking, actor_user_id, actor_role, reason):
        if booking["status"] not in USER_CANCELLABLE_STATUSES:
            raise ConflictError(
                "Only pending or confirmed bookings can be cancelled",
                {"current_status": booking["status"]},
            )
        self.booking_repository.update_booking_status(
            connection,
            booking["id"],
            "cancelled",
            cancellation_reason=reason,
            cancelled_by_user_id=actor_user_id,
            cancelled_by_role=actor_role,
        )
        self.booking_repository.insert_status_history(
            connection,
            {
                "booking_id": booking["id"],
                "old_status": booking["status"],
                "new_status": "cancelled",
                "actor_user_id": actor_user_id,
                "actor_role": actor_role,
                "notes": reason,
            },
        )

    def _assert_booking_access(self, user_id, user_role, booking):
        if booking["user_id"] == user_id:
            return
        if user_role in CHEF_ALLOWED_ROLES and booking["chef_user_id"] == user_id:
            return
        raise AuthorizationError("You are not allowed to access this booking")

    def _extract_user_profile(self, payload):
        return payload or {}

    def _extract_chef_profile(self, payload):
        return payload.get("chef", payload) if isinstance(payload, dict) else {}

    def _resolve_slot_detail(self, availability, booking_date_iso, time_slot):
        for day in availability:
            if day.get("date") != booking_date_iso:
                continue
            for slot_detail in day.get("slotDetails", []):
                if slot_detail.get("slotName") == time_slot and slot_detail.get("status") == "open":
                    return slot_detail
        return None

    def _get_booking_or_raise(self, connection, booking_id):
        booking = self.booking_repository.get_booking_by_id(connection, booking_id)
        if not booking:
            raise NotFoundError("Booking was not found")
        return booking

    def _fetch_formatted_booking(self, connection, booking_id):
        booking = self._get_booking_or_raise(connection, booking_id)
        return self._format_booking(connection, booking)

    def _format_bookings(self, connection, bookings):
        return [self._format_booking(connection, booking) for booking in bookings]

    def _format_booking(self, connection, booking):
        status_history = self.booking_repository.get_status_history(connection, booking["id"])
        return {
            "id": booking["id"],
            "bookingReference": booking["booking_reference"],
            "userId": booking["user_id"],
            "userName": booking["user_name"],
            "userEmail": booking["user_email"],
            "chefId": booking["chef_id"],
            "chefName": booking["chef_name"],
            "date": booking["booking_date"],
            "timeSlot": booking["time_slot"],
            "slotStartTime": booking.get("slot_start_time"),
            "slotEndTime": booking.get("slot_end_time"),
            "guestCount": booking["guest_count"],
            "sessionHours": float(booking["session_hours"]),
            "menuPreferences": booking.get("menu_preferences") or "",
            "dietaryRestrictions": booking.get("dietary_restrictions") or "",
            "specialRequests": booking.get("special_requests") or "",
            "amount": float(booking["amount"]),
            "currency": booking["currency"],
            "status": booking["status"],
            "cancellationReason": booking.get("cancellation_reason"),
            "createdAt": booking.get("created_at"),
            "updatedAt": booking.get("updated_at"),
            "statusHistory": [
                {
                    "id": event["id"],
                    "oldStatus": event.get("old_status"),
                    "newStatus": event["new_status"],
                    "actorUserId": event["actor_user_id"],
                    "actorRole": event["actor_role"],
                    "notes": event.get("notes"),
                    "createdAt": event.get("created_at"),
                }
                for event in status_history
            ],
        }
