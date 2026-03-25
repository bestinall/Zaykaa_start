from flask import g, request
from flask_cors import CORS

from src.config import Config
from src.controllers.auth_controller import auth_blueprint
from src.controllers.meal_plan_controller import meal_plan_blueprint
from src.controllers.nutrition_controller import nutrition_blueprint
from src.controllers.profile_controller import profile_blueprint
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
    logger = get_logger("user_service")

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
            "User service is healthy",
        )

    app.register_blueprint(auth_blueprint)
    app.register_blueprint(profile_blueprint)
    app.register_blueprint(meal_plan_blueprint)
    app.register_blueprint(nutrition_blueprint)
    register_error_handlers(app)
    return app
