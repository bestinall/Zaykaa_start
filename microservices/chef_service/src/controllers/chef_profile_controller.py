from flask import Blueprint, g, request

from src.middleware.auth import auth_required, chef_role_required
from src.services.chef_profile_service import ChefProfileService
from src.utils.responses import success_response


chef_profile_blueprint = Blueprint("chef_profile", __name__, url_prefix="/api/v1/chefs")
chef_profile_service = ChefProfileService()


@chef_profile_blueprint.get("")
def list_public_chefs():
    result = chef_profile_service.list_public_profiles(request.args)
    return success_response(result, "Chef directory fetched successfully")


@chef_profile_blueprint.get("/<int:chef_id>")
def get_public_chef_profile(chef_id):
    result = chef_profile_service.get_public_profile(chef_id)
    return success_response(result, "Chef profile fetched successfully")


@chef_profile_blueprint.post("/profile")
@chef_role_required
def create_chef_profile():
    payload = request.get_json(silent=True) or {}
    result = chef_profile_service.create_profile(g.current_user_id, payload)
    return success_response(result, "Chef profile created successfully", 201)


@chef_profile_blueprint.get("/profile")
@chef_role_required
def get_my_chef_profile():
    result = chef_profile_service.get_own_profile(g.current_user_id)
    return success_response(result, "Chef profile fetched successfully")


@chef_profile_blueprint.put("/profile")
@chef_role_required
def update_my_chef_profile():
    payload = request.get_json(silent=True) or {}
    result = chef_profile_service.update_profile(g.current_user_id, payload)
    return success_response(result, "Chef profile updated successfully")


@chef_profile_blueprint.get("/availability")
@chef_role_required
def get_my_availability():
    result = chef_profile_service.get_own_availability(g.current_user_id, request.args)
    return success_response(result, "Chef availability fetched successfully")


@chef_profile_blueprint.put("/availability")
@chef_role_required
def update_my_availability():
    payload = request.get_json(silent=True) or {}
    result = chef_profile_service.update_availability(g.current_user_id, payload)
    return success_response(result, "Chef availability updated successfully")


@chef_profile_blueprint.get("/<int:chef_id>/availability")
def get_public_availability(chef_id):
    result = chef_profile_service.get_public_availability(chef_id, request.args)
    return success_response(result, "Chef availability fetched successfully")


@chef_profile_blueprint.post("/<int:chef_id>/ratings")
@auth_required
def add_chef_rating(chef_id):
    payload = request.get_json(silent=True) or {}
    result = chef_profile_service.add_rating_event(chef_id, g.current_user_id, payload)
    return success_response(result, "Chef rating captured successfully", 201)


@chef_profile_blueprint.get("/analytics")
@chef_role_required
def get_chef_analytics():
    result = chef_profile_service.get_analytics(
        g.current_user_id,
        request.headers.get("Authorization", ""),
    )
    return success_response(result, "Chef analytics fetched successfully")
