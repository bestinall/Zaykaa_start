from flask import Blueprint, g, request

from src.middleware.auth import auth_required
from src.services.profile_service import ProfileService
from src.utils.responses import success_response


profile_blueprint = Blueprint("user_profile", __name__, url_prefix="/api/v1/users")
profile_service = ProfileService()


@profile_blueprint.get("/directory")
def get_public_directory():
    result = profile_service.list_public_directory(request.args)
    return success_response(result, "Public member directory fetched successfully")


@profile_blueprint.get("/profile")
@auth_required
def get_profile():
    result = profile_service.get_profile(g.current_user_id)
    return success_response(result, "User profile fetched successfully")


@profile_blueprint.put("/profile")
@auth_required
def update_profile():
    payload = request.get_json(silent=True) or {}
    result = profile_service.update_profile(g.current_user_id, payload)
    return success_response(result, "User profile updated successfully")


@profile_blueprint.get("/preferences")
@auth_required
def get_preferences():
    result = profile_service.get_preferences(g.current_user_id)
    return success_response(result, "User preferences fetched successfully")


@profile_blueprint.put("/preferences")
@auth_required
def update_preferences():
    payload = request.get_json(silent=True) or {}
    result = profile_service.update_preferences(g.current_user_id, payload)
    return success_response(result, "User preferences updated successfully")
