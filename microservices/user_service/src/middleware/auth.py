from functools import wraps

from flask import g, request

from src.utils.exceptions import AuthenticationError
from src.utils.jwt_utils import decode_access_token


def _extract_token():
    auth_header = request.headers.get("Authorization", "")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError("Authorization header must be a Bearer token")
    return parts[1]


def auth_required(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        g.jwt_claims = decode_access_token(token)
        g.current_user_id = int(g.jwt_claims["sub"])
        g.current_user_role = g.jwt_claims["role"]
        return handler(*args, **kwargs)

    return wrapper
