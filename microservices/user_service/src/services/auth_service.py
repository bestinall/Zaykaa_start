import bcrypt

from src.database.connection import DatabasePoolManager
from src.repositories.user_repository import UserRepository
from src.utils.exceptions import AuthenticationError, ConflictError, NotFoundError
from src.utils.jwt_utils import generate_access_token
from src.utils.validators import validate_login_payload, validate_registration_payload


class AuthService:
    def __init__(self):
        self.user_repository = UserRepository()

    def register(self, payload):
        validated_payload = validate_registration_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            existing_user = self.user_repository.get_user_by_email(
                connection, validated_payload["email"]
            )
            if existing_user:
                raise ConflictError("Email is already registered")

            validated_payload["password_hash"] = bcrypt.hashpw(
                validated_payload["password"].encode("utf-8"),
                bcrypt.gensalt(),
            ).decode("utf-8")

            user_id = self.user_repository.create_user(connection, validated_payload)
            self.user_repository.upsert_preferences(connection, user_id, {})
            connection.commit()
            user = self.user_repository.get_user_by_id(connection, user_id)
            token = generate_access_token(user)
            return {"token": token, "user": user}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def login(self, payload):
        validated_payload = validate_login_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            user = self.user_repository.get_user_by_email(connection, validated_payload["email"])
            if not user:
                raise AuthenticationError("Invalid email or password")

            if not bcrypt.checkpw(
                validated_payload["password"].encode("utf-8"),
                user["password_hash"].encode("utf-8"),
            ):
                raise AuthenticationError("Invalid email or password")

            self.user_repository.update_last_login(connection, user["id"])
            connection.commit()
            user = self.user_repository.get_user_by_id(connection, user["id"])
            token = generate_access_token(user)
            return {"token": token, "user": user}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def verify_session(self, user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            user = self.user_repository.get_user_by_id(connection, user_id)
            if not user:
                raise NotFoundError("User account was not found")
            return {"user": user}
        finally:
            connection.close()

    def logout(self):
        return {"logged_out": True}
