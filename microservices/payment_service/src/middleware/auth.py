from functools import wraps

from flask import g, request

from src.utils.exceptions import AuthenticationError, AuthorizationError
from src.utils.jwt_utils import decode_access_token


ADMIN_ALLOWED_ROLES = {"admin"}


def _extract_token():
    auth_header = request.headers.get("Authorization", "")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError("Authorization header must be a Bearer token")
    return parts[1]


def _authenticate_request():
    token = _extract_token()
    g.jwt_claims = decode_access_token(token)
    g.current_user_id = int(g.jwt_claims["sub"])
    g.current_user_role = g.jwt_claims["role"]


def auth_required(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        _authenticate_request()
        return handler(*args, **kwargs)

    return wrapper


def admin_role_required(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        _authenticate_request()
        if g.current_user_role not in ADMIN_ALLOWED_ROLES:
            raise AuthorizationError("Admin role is required for this resource")
        return handler(*args, **kwargs)

    return wrapper
