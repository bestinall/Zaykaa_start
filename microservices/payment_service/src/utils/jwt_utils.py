import jwt

from src.config import Config
from src.utils.exceptions import AuthenticationError


config = Config()


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
