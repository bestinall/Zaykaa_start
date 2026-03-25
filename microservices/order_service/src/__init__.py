from flask import g, request
from flask_cors import CORS

from src.config import Config
from src.controllers.order_controller import (
    catalog_blueprint,
    coupon_blueprint,
    order_blueprint,
)
from src.database.bootstrap import bootstrap_database
from src.database.connection import DatabasePoolManager
from src.middleware.error_handlers import register_error_handlers
from src.utils.logger import configure_logging, get_logger
from src.utils.responses import success_response


def create_app():
    from flask import Flask

    config = Config()
    configure_logging(config.log_level)
    bootstrap_database(config)
    DatabasePoolManager.initialize(config)

    app = Flask(__name__)
    CORS(
        app,
        resources={r"/api/*": {"origins": config.cors_origins}},
        supports_credentials=False,
    )
    logger = get_logger("order_service")

    @app.before_request
    def add_request_metadata():
        g.request_id = request.headers.get("X-Request-ID")
        logger.info(
            "incoming_request service=%s method=%s path=%s request_id=%s",
            config.service_name,
            request.method,
            request.path,
            g.request_id,
        )

    @app.get("/health")
    def health():
        return success_response(
            {
                "service": config.service_name,
                "status": "healthy",
                "database": config.db_name,
            },
            "Order service is healthy",
        )

    app.register_blueprint(catalog_blueprint)
    app.register_blueprint(coupon_blueprint)
    app.register_blueprint(order_blueprint)
    register_error_handlers(app)
    return app
