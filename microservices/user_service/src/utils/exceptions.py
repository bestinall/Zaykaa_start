class AppError(Exception):
    def __init__(self, message, status_code=400, error_code="bad_request", details=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class ValidationError(AppError):
    def __init__(self, message, details=None):
        super().__init__(message, 400, "validation_error", details)


class AuthenticationError(AppError):
    def __init__(self, message="Authentication failed", details=None):
        super().__init__(message, 401, "authentication_error", details)


class AuthorizationError(AppError):
    def __init__(self, message="Access denied", details=None):
        super().__init__(message, 403, "authorization_error", details)


class NotFoundError(AppError):
    def __init__(self, message="Resource not found", details=None):
        super().__init__(message, 404, "not_found", details)


class ConflictError(AppError):
    def __init__(self, message="Resource already exists", details=None):
        super().__init__(message, 409, "conflict", details)
