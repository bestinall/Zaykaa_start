from flask import Blueprint, g, request

from src.middleware.auth import auth_required
from src.services.auth_service import AuthService
from src.utils.responses import success_response


auth_blueprint = Blueprint("user_auth", __name__, url_prefix="/api/v1/users/auth")
auth_service = AuthService()


@auth_blueprint.post("/register")
def register_user():
    payload = request.get_json(silent=True) or {}
    result = auth_service.register(payload)
    return success_response(result, "User registered successfully", 201)


@auth_blueprint.post("/login")
def login_user():
    payload = request.get_json(silent=True) or {}
    result = auth_service.login(payload)
    return success_response(result, "User login successful")


@auth_blueprint.post("/logout")
@auth_required
def logout_user():
    result = auth_service.logout()
    return success_response(result, "User logged out successfully")


@auth_blueprint.get("/verify")
@auth_required
def verify_user_session():
    result = auth_service.verify_session(g.current_user_id)
    return success_response(result, "User session is valid")
