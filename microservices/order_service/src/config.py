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
    service_name: str = os.getenv("SERVICE_NAME", "order-service")
    service_port: int = int(os.getenv("ORDER_SERVICE_PORT", "5005"))
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
    db_name: str = os.getenv("DB_NAME", "zaykaa_order_service")
    mysql_pool_name: str = os.getenv("MYSQL_POOL_NAME", "order_service_pool")
    mysql_pool_size: int = int(os.getenv("MYSQL_POOL_SIZE", "10"))
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me-in-env")
    jwt_issuer: str = os.getenv("JWT_ISSUER", "zaykaa.user-service")
    default_currency: str = os.getenv("DEFAULT_CURRENCY", "INR")
    default_delivery_fee: float = float(os.getenv("DEFAULT_DELIVERY_FEE", "40"))
    tax_rate_percent: float = float(os.getenv("TAX_RATE_PERCENT", "5"))
    recent_order_limit: int = int(os.getenv("RECENT_ORDER_LIMIT", "5"))
