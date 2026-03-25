from flask import Blueprint, g, request

from src.middleware.auth import auth_required, chef_role_required
from src.services.booking_service import BookingService
from src.utils.responses import success_response


booking_blueprint = Blueprint("booking", __name__, url_prefix="/api/v1/bookings")
booking_service = BookingService()


@booking_blueprint.route("", methods=["GET", "POST"])
@auth_required
def bookings_root():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        result = booking_service.create_booking(
            request.headers.get("Authorization", ""),
            g.current_user_id,
            payload,
        )
        return success_response(result, "Booking request created successfully", 201)

    result = booking_service.list_my_bookings(g.current_user_id, request.args)
    return success_response(result, "User bookings fetched successfully")


@booking_blueprint.get("/my")
@auth_required
def get_my_bookings():
    result = booking_service.list_my_bookings(g.current_user_id, request.args)
    return success_response(result, "User bookings fetched successfully")


@booking_blueprint.get("/<int:booking_id>")
@auth_required
def get_booking_detail(booking_id):
    result = booking_service.get_booking_for_actor(
        g.current_user_id,
        g.current_user_role,
        booking_id,
    )
    return success_response(result, "Booking fetched successfully")


@booking_blueprint.patch("/<int:booking_id>/cancel")
@auth_required
def cancel_booking(booking_id):
    payload = request.get_json(silent=True) or {}
    result = booking_service.cancel_booking_for_actor(
        g.current_user_id,
        booking_id,
        payload,
    )
    return success_response(result, "Booking cancelled successfully")


@booking_blueprint.get("/chefs/<int:chef_id>/availability")
def get_effective_chef_availability(chef_id):
    result = booking_service.get_effective_availability(chef_id, request.args)
    return success_response(result, "Chef availability fetched successfully")


@booking_blueprint.get("/chef")
@chef_role_required
def list_chef_bookings():
    result = booking_service.list_chef_bookings(
        g.current_user_id,
        request.args,
    )
    return success_response(result, "Chef bookings fetched successfully")


@booking_blueprint.get("/chef/<int:booking_id>")
@chef_role_required
def get_chef_booking(booking_id):
    result = booking_service.get_chef_booking(
        g.current_user_id,
        booking_id,
    )
    return success_response(result, "Chef booking fetched successfully")


@booking_blueprint.patch("/chef/<int:booking_id>/status")
@chef_role_required
def update_chef_booking_status(booking_id):
    payload = request.get_json(silent=True) or {}
    result = booking_service.update_chef_booking_status(
        g.current_user_id,
        booking_id,
        payload,
    )
    return success_response(result, "Booking status updated successfully")


@booking_blueprint.get("/chef/analytics")
@chef_role_required
def get_chef_booking_analytics():
    result = booking_service.get_chef_analytics(g.current_user_id)
    return success_response(result, "Chef booking analytics fetched successfully")
