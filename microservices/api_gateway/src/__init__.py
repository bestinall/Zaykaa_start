import uuid
import warnings

from flask import g, request
from flask_cors import CORS
from requests import RequestsDependencyWarning

warnings.simplefilter("ignore", RequestsDependencyWarning)

from src.config import Config
from src.routes import gateway_blueprint
from src.utils.logger import configure_logging, get_logger
from src.utils.responses import success_response


def create_app():
    from flask import Flask

    config = Config()
    configure_logging(config.log_level)
    app = Flask(__name__)
    CORS(
        app,
        resources={r"/api/*": {"origins": config.cors_origins}},
        supports_credentials=False,
    )
    logger = get_logger("api_gateway")

    @app.before_request
    def set_request_context():
        g.request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        logger.info(
            "gateway_request method=%s path=%s request_id=%s",
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
                "user_service_url": config.user_service_url,
                "legacy_backend_url": config.legacy_backend_url,
            },
            "API gateway is healthy",
        )

    app.register_blueprint(gateway_blueprint)
    return app
