import mysql.connector
from flask import Flask

from src.utils.exceptions import AppError
from src.utils.logger import get_logger
from src.utils.responses import error_response


logger = get_logger("payment_service.errors")


def register_error_handlers(app: Flask):
    @app.errorhandler(AppError)
    def handle_app_error(error):
        logger.warning("application_error code=%s message=%s", error.error_code, error.message)
        return error_response(error.message, error.status_code, error.error_code, error.details)

    @app.errorhandler(mysql.connector.Error)
    def handle_database_error(error):
        logger.exception("database_error: %s", error)
        return error_response("A database error occurred", 500, "database_error")

    @app.errorhandler(Exception)
    def handle_unknown_error(error):
        logger.exception("unexpected_error: %s", error)
        return error_response("An unexpected error occurred", 500, "internal_server_error")
