import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv


ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)


def _parse_csv(value, default):
    raw = value or default
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass
class Config:
    service_name: str = os.getenv("SERVICE_NAME", "booking-service")
    service_port: int = int(os.getenv("BOOKING_SERVICE_PORT", "5004"))
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    cors_origins: list[str] = field(
        default_factory=lambda: _parse_csv(
            os.getenv("CORS_ORIGINS"),
            "http://localhost:3000,http://localhost:19006",
        )
    )
    db_host: str = os.getenv("DB_HOST", "127.0.0.1")
    db_port: int = int(os.getenv("DB_PORT", "3306"))
    db_user: str = os.getenv("DB_USER", "root")
    db_password: str = os.getenv("DB_PASSWORD", "")
    db_name: str = os.getenv("DB_NAME", "zaykaa_booking_service")
    mysql_pool_name: str = os.getenv("MYSQL_POOL_NAME", "booking_service_pool")
    mysql_pool_size: int = int(os.getenv("MYSQL_POOL_SIZE", "10"))
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me-in-env")
    jwt_issuer: str = os.getenv("JWT_ISSUER", "zaykaa.user-service")
    user_service_url: str = os.getenv("USER_SERVICE_URL", "http://127.0.0.1:5001")
    chef_service_url: str = os.getenv("CHEF_SERVICE_URL", "http://127.0.0.1:5003")
    upstream_timeout_seconds: int = int(os.getenv("UPSTREAM_TIMEOUT_SECONDS", "10"))
    upstream_max_retries: int = int(os.getenv("UPSTREAM_MAX_RETRIES", "2"))
    default_session_hours: int = int(os.getenv("DEFAULT_SESSION_HOURS", "3"))
