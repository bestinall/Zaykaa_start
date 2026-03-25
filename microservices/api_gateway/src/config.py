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
    service_name: str = os.getenv("SERVICE_NAME", "api-gateway")
    gateway_port: int = int(os.getenv("GATEWAY_PORT", "5000"))
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    cors_origins: list[str] = field(
        default_factory=lambda: _parse_csv(
            os.getenv("CORS_ORIGINS"),
            "http://localhost:3000,http://localhost:19006",
        )
    )
    jwt_secret: str = os.getenv("JWT_SECRET", "zaykaa-secret-key-2025")
    jwt_issuer: str = os.getenv("JWT_ISSUER", "zaykaa.user-service")
    user_service_url: str = os.getenv("USER_SERVICE_URL", "http://127.0.0.1:5001")
    chef_service_url: str = os.getenv("CHEF_SERVICE_URL", "http://127.0.0.1:5003")
    booking_service_url: str = os.getenv("BOOKING_SERVICE_URL", "http://127.0.0.1:5004")
    order_service_url: str = os.getenv("ORDER_SERVICE_URL", "http://127.0.0.1:5005")
    legacy_backend_url: str = os.getenv("LEGACY_BACKEND_URL", "http://127.0.0.1:5002")
    rate_limit_window_seconds: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    rate_limit_max_requests: int = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "120"))
    upstream_timeout_seconds: int = int(os.getenv("UPSTREAM_TIMEOUT_SECONDS", "15"))
