from datetime import datetime, timedelta, timezone

import jwt

from src.config import Config
from src.utils.exceptions import AuthenticationError


config = Config()


def generate_access_token(user):
    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "iss": config.jwt_issuer,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=config.jwt_expiry_hours),
    }
    return jwt.encode(payload, config.jwt_secret, algorithm="HS256")


def decode_access_token(token):
    try:
        return jwt.decode(
            token,
            config.jwt_secret,
            algorithms=["HS256"],
            issuer=config.jwt_issuer,
        )
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationError("JWT token has expired") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError("JWT token is invalid") from exc
