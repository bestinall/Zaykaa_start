import jwt

from src.config import Config


config = Config()


def decode_token(token):
    return jwt.decode(
        token,
        config.jwt_secret,
        algorithms=["HS256"],
        issuer=config.jwt_issuer,
    )
