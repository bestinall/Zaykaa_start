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
    service_name: str = os.getenv("SERVICE_NAME", "payment-service")
    service_port: int = int(os.getenv("PAYMENT_SERVICE_PORT", "5006"))
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
    db_name: str = os.getenv("DB_NAME", "zaykaa_payment_service")
    mysql_pool_name: str = os.getenv("MYSQL_POOL_NAME", "payment_service_pool")
    mysql_pool_size: int = int(os.getenv("MYSQL_POOL_SIZE", "10"))
    jwt_secret: str = os.getenv("JWT_SECRET", "zaykaa-secret-key-2025")
    jwt_issuer: str = os.getenv("JWT_ISSUER", "zaykaa.user-service")
    order_service_url: str = os.getenv("ORDER_SERVICE_URL", "http://127.0.0.1:5005")
    upstream_timeout_seconds: int = int(os.getenv("UPSTREAM_TIMEOUT_SECONDS", "10"))
    upstream_max_retries: int = int(os.getenv("UPSTREAM_MAX_RETRIES", "2"))
    payment_provider: str = os.getenv("PAYMENT_PROVIDER", "mock").strip().lower()
    default_currency: str = os.getenv("DEFAULT_CURRENCY", "INR")
    platform_fee_percent: float = float(os.getenv("PLATFORM_FEE_PERCENT", "15"))
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    razorpay_key_id: str = os.getenv("RAZORPAY_KEY_ID", "")
    razorpay_key_secret: str = os.getenv("RAZORPAY_KEY_SECRET", "")
