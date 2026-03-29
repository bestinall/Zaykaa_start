import re
import uuid

import jwt
import requests
from flask import Blueprint, g, request

from src.config import Config
from src.middleware.rate_limit import InMemoryRateLimiter
from src.services.proxy_service import ProxyService
from src.utils.jwt_utils import decode_token
from src.utils.responses import error_response, success_response


gateway_blueprint = Blueprint("gateway", __name__)
config = Config()
rate_limiter = InMemoryRateLimiter()
proxy_service = ProxyService()

PUBLIC_USER_ROUTES = {
    ("/api/v1/users/auth/register", "POST"),
    ("/api/v1/users/auth/login", "POST"),
}


@gateway_blueprint.before_app_request
def apply_rate_limit():
    if not getattr(g, "request_id", None):
        g.request_id = str(uuid.uuid4())
    return rate_limiter.check_limit()


def _validate_jwt():
    auth_header = request.headers.get("Authorization", "")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return error_response("Authorization header must be a Bearer token", 401, "authentication_error")
    try:
        claims = decode_token(parts[1])
        g.jwt_claims = claims
        return None
    except jwt.ExpiredSignatureError:
        return error_response("JWT token has expired", 401, "authentication_error")
    except jwt.InvalidTokenError:
        return error_response("JWT token is invalid", 401, "authentication_error")


def _proxy_service(base_url, path, require_auth):
    if request.method == "OPTIONS":
        return proxy_service.proxy(base_url, path)
    if require_auth:
        auth_error = _validate_jwt()
        if auth_error:
            return auth_error
    return proxy_service.proxy(base_url, path)


def _chef_route_requires_auth(normalized_path):
    if request.method != "GET":
        return True
    public_patterns = [
        r"^/api/v1/chefs$",
        r"^/api/v1/chefs/\d+$",
        r"^/api/v1/chefs/\d+/availability$",
        r"^/api/v1/chefs/\d+/recipes$",
        r"^/api/v1/recipes$",
        r"^/api/v1/recipes/\d+$",
    ]
    return not any(re.match(pattern, normalized_path) for pattern in public_patterns)


def _booking_route_requires_auth(normalized_path):
    if request.method == "GET" and re.match(r"^/api/v1/bookings/chefs/\d+/availability$", normalized_path):
        return False
    return True


def _order_route_requires_auth(normalized_path):
    if request.method == "GET" and re.match(r"^/api/v1/restaurants(?:/\d+)?$", normalized_path):
        return False
    return True


@gateway_blueprint.get("/api/health")
def aggregated_health():
    health_data = {
        "gateway": "healthy",
        "user_service": "unknown",
        "chef_service": "unknown",
        "booking_service": "unknown",
        "order_service": "unknown",
        "payment_service": "unknown",
        "legacy_backend": "unknown",
    }
    for service_name, base_url, health_key in [
        ("user_service", config.user_service_url, "user_service"),
        ("chef_service", config.chef_service_url, "chef_service"),
        ("booking_service", config.booking_service_url, "booking_service"),
        ("order_service", config.order_service_url, "order_service"),
        ("payment_service", config.payment_service_url, "payment_service"),
    ]:
        try:
            response = requests.get(f"{base_url}/health", timeout=2)
            health_data[health_key] = "healthy" if response.status_code == 200 else "degraded"
        except requests.RequestException:
            health_data[health_key] = "unreachable"

    if config.legacy_backend_url:
        try:
            legacy_response = requests.get(f"{config.legacy_backend_url}/api/health", timeout=2)
            health_data["legacy_backend"] = (
                "healthy" if legacy_response.status_code == 200 else "degraded"
            )
        except requests.RequestException:
            health_data["legacy_backend"] = "unreachable"
    return success_response(health_data, "Gateway health snapshot")


@gateway_blueprint.route("/api/auth/register", methods=["POST"])
def register_alias():
    return _proxy_service(config.user_service_url, "/api/v1/users/auth/register", require_auth=False)


@gateway_blueprint.route("/api/auth/login", methods=["POST"])
def login_alias():
    return _proxy_service(config.user_service_url, "/api/v1/users/auth/login", require_auth=False)


@gateway_blueprint.route("/api/auth/logout", methods=["POST"])
def logout_alias():
    return _proxy_service(config.user_service_url, "/api/v1/users/auth/logout", require_auth=True)


@gateway_blueprint.route("/api/auth/verify", methods=["GET"])
def verify_alias():
    return _proxy_service(config.user_service_url, "/api/v1/users/auth/verify", require_auth=True)


@gateway_blueprint.route("/api/v1/users/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
@gateway_blueprint.route("/api/v1/users", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def user_service_proxy(path):
    normalized_path = "/api/v1/users" + (f"/{path}" if path else "")
    requires_auth = (normalized_path, request.method) not in PUBLIC_USER_ROUTES
    return _proxy_service(config.user_service_url, normalized_path, require_auth=requires_auth)


@gateway_blueprint.route("/api/v1/chefs/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
@gateway_blueprint.route("/api/v1/chefs", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def chef_service_proxy(path):
    normalized_path = "/api/v1/chefs" + (f"/{path}" if path else "")
    return _proxy_service(
        config.chef_service_url,
        normalized_path,
        require_auth=_chef_route_requires_auth(normalized_path),
    )


@gateway_blueprint.route("/api/v1/recipes/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
@gateway_blueprint.route("/api/v1/recipes", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def recipe_service_proxy(path):
    normalized_path = "/api/v1/recipes" + (f"/{path}" if path else "")
    return _proxy_service(
        config.chef_service_url,
        normalized_path,
        require_auth=_chef_route_requires_auth(normalized_path),
    )


@gateway_blueprint.route("/api/v1/bookings/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@gateway_blueprint.route("/api/v1/bookings", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def booking_service_proxy(path):
    normalized_path = "/api/v1/bookings" + (f"/{path}" if path else "")
    return _proxy_service(
        config.booking_service_url,
        normalized_path,
        require_auth=_booking_route_requires_auth(normalized_path),
    )


@gateway_blueprint.route("/api/v1/restaurants/<path:path>", methods=["GET", "OPTIONS"])
@gateway_blueprint.route("/api/v1/restaurants", defaults={"path": ""}, methods=["GET", "OPTIONS"])
def restaurant_service_proxy(path):
    normalized_path = "/api/v1/restaurants" + (f"/{path}" if path else "")
    return _proxy_service(
        config.order_service_url,
        normalized_path,
        require_auth=_order_route_requires_auth(normalized_path),
    )


@gateway_blueprint.route("/api/v1/coupons/<path:path>", methods=["GET", "POST", "OPTIONS"])
@gateway_blueprint.route("/api/v1/coupons", defaults={"path": ""}, methods=["GET", "POST", "OPTIONS"])
def coupon_service_proxy(path):
    normalized_path = "/api/v1/coupons" + (f"/{path}" if path else "")
    return _proxy_service(
        config.order_service_url,
        normalized_path,
        require_auth=True,
    )


@gateway_blueprint.route("/api/v1/orders/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@gateway_blueprint.route("/api/v1/orders", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def order_service_proxy(path):
    normalized_path = "/api/v1/orders" + (f"/{path}" if path else "")
    return _proxy_service(
        config.order_service_url,
        normalized_path,
        require_auth=True,
    )


@gateway_blueprint.route("/api/v1/payments/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@gateway_blueprint.route("/api/v1/payments", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def payment_service_proxy(path):
    normalized_path = "/api/v1/payments" + (f"/{path}" if path else "")
    return _proxy_service(
        config.payment_service_url,
        normalized_path,
        require_auth=True,
    )


@gateway_blueprint.route("/api/v1/payouts/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@gateway_blueprint.route("/api/v1/payouts", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def payout_service_proxy(path):
    normalized_path = "/api/v1/payouts" + (f"/{path}" if path else "")
    return _proxy_service(
        config.payment_service_url,
        normalized_path,
        require_auth=True,
    )


@gateway_blueprint.get("/api/chefs/available")
def available_chefs_alias():
    return _proxy_service(config.chef_service_url, "/api/v1/chefs", require_auth=False)


@gateway_blueprint.get("/api/chefs/<int:chef_id>")
def chef_profile_alias(chef_id):
    return _proxy_service(config.chef_service_url, f"/api/v1/chefs/{chef_id}", require_auth=False)


@gateway_blueprint.get("/api/chefs/<int:chef_id>/availability")
def chef_availability_alias(chef_id):
    return _proxy_service(
        config.booking_service_url,
        f"/api/v1/bookings/chefs/{chef_id}/availability",
        require_auth=False,
    )


@gateway_blueprint.get("/api/chefs/<int:chef_id>/recipes")
def chef_recipes_alias(chef_id):
    return _proxy_service(config.chef_service_url, f"/api/v1/chefs/{chef_id}/recipes", require_auth=False)


@gateway_blueprint.route("/api/chef/profile", methods=["GET", "POST", "PUT"])
def chef_profile_management_alias():
    return _proxy_service(config.chef_service_url, "/api/v1/chefs/profile", require_auth=True)


@gateway_blueprint.route("/api/chef/availability", methods=["GET", "PUT"])
def chef_availability_management_alias():
    return _proxy_service(config.chef_service_url, "/api/v1/chefs/availability", require_auth=True)


@gateway_blueprint.route("/api/chef/recipes", methods=["GET", "POST"])
def chef_recipe_alias():
    return _proxy_service(config.chef_service_url, "/api/v1/chefs/recipes", require_auth=True)


@gateway_blueprint.route("/api/chef/recipes/<int:recipe_id>", methods=["GET", "PUT", "DELETE"])
def chef_recipe_detail_alias(recipe_id):
    return _proxy_service(config.chef_service_url, f"/api/v1/chefs/recipes/{recipe_id}", require_auth=True)


@gateway_blueprint.route("/api/chef/bookings", methods=["GET"])
def chef_bookings_alias():
    return _proxy_service(config.booking_service_url, "/api/v1/bookings/chef", require_auth=True)


@gateway_blueprint.route("/api/chef/bookings/<int:booking_id>", methods=["GET"])
def chef_booking_detail_alias(booking_id):
    return _proxy_service(
        config.booking_service_url,
        f"/api/v1/bookings/chef/{booking_id}",
        require_auth=True,
    )


@gateway_blueprint.route("/api/chef/bookings/<int:booking_id>/status", methods=["PATCH"])
def chef_booking_status_alias(booking_id):
    return _proxy_service(
        config.booking_service_url,
        f"/api/v1/bookings/chef/{booking_id}/status",
        require_auth=True,
    )


@gateway_blueprint.get("/api/chef/analytics")
def chef_analytics_alias():
    return _proxy_service(config.chef_service_url, "/api/v1/chefs/analytics", require_auth=True)


@gateway_blueprint.route("/api/bookings", methods=["GET", "POST"])
def bookings_alias():
    return _proxy_service(config.booking_service_url, "/api/v1/bookings", require_auth=True)


@gateway_blueprint.route("/api/bookings/my", methods=["GET"])
def my_bookings_alias():
    return _proxy_service(config.booking_service_url, "/api/v1/bookings/my", require_auth=True)


@gateway_blueprint.route("/api/bookings/<int:booking_id>", methods=["GET"])
def booking_detail_alias(booking_id):
    return _proxy_service(
        config.booking_service_url,
        f"/api/v1/bookings/{booking_id}",
        require_auth=True,
    )


@gateway_blueprint.route("/api/bookings/<int:booking_id>/cancel", methods=["PATCH"])
def booking_cancel_alias(booking_id):
    return _proxy_service(
        config.booking_service_url,
        f"/api/v1/bookings/{booking_id}/cancel",
        require_auth=True,
    )


@gateway_blueprint.route("/api/restaurants", methods=["GET"])
def restaurants_alias():
    return _proxy_service(config.order_service_url, "/api/v1/restaurants", require_auth=False)


@gateway_blueprint.route("/api/restaurants/<int:restaurant_id>", methods=["GET"])
def restaurant_detail_alias(restaurant_id):
    return _proxy_service(
        config.order_service_url,
        f"/api/v1/restaurants/{restaurant_id}",
        require_auth=False,
    )


@gateway_blueprint.route("/api/coupons/validate", methods=["POST"])
def validate_coupon_alias():
    return _proxy_service(config.order_service_url, "/api/v1/coupons/validate", require_auth=True)


@gateway_blueprint.route("/api/orders", methods=["GET", "POST"])
def orders_alias():
    return _proxy_service(config.order_service_url, "/api/v1/orders", require_auth=True)


@gateway_blueprint.route("/api/orders/my", methods=["GET"])
def my_orders_alias():
    return _proxy_service(config.order_service_url, "/api/v1/orders/my", require_auth=True)


@gateway_blueprint.route("/api/orders/recent", methods=["GET"])
def recent_orders_alias():
    return _proxy_service(config.order_service_url, "/api/v1/orders/recent", require_auth=True)


@gateway_blueprint.route("/api/orders/cart", methods=["GET", "PUT", "DELETE"])
def order_cart_alias():
    return _proxy_service(config.order_service_url, "/api/v1/orders/cart", require_auth=True)


@gateway_blueprint.route("/api/orders/<int:order_id>", methods=["GET"])
def order_detail_alias(order_id):
    return _proxy_service(
        config.order_service_url,
        f"/api/v1/orders/{order_id}",
        require_auth=True,
    )


@gateway_blueprint.route("/api/orders/<int:order_id>/track", methods=["GET"])
def order_tracking_alias(order_id):
    return _proxy_service(
        config.order_service_url,
        f"/api/v1/orders/{order_id}/track",
        require_auth=True,
    )


@gateway_blueprint.route("/api/orders/<int:order_id>/cancel", methods=["PATCH"])
def order_cancel_alias(order_id):
    return _proxy_service(
        config.order_service_url,
        f"/api/v1/orders/{order_id}/cancel",
        require_auth=True,
    )


@gateway_blueprint.route("/api/orders/<int:order_id>/status", methods=["PATCH"])
def order_status_alias(order_id):
    return _proxy_service(
        config.order_service_url,
        f"/api/v1/orders/{order_id}/status",
        require_auth=True,
    )


@gateway_blueprint.route("/api/payments", methods=["GET", "POST"])
def payments_alias():
    return _proxy_service(config.payment_service_url, "/api/v1/payments", require_auth=True)


@gateway_blueprint.route("/api/payments/my", methods=["GET"])
def my_payments_alias():
    return _proxy_service(config.payment_service_url, "/api/v1/payments/my", require_auth=True)


@gateway_blueprint.route("/api/payments/order/<int:order_id>", methods=["GET"])
def order_payments_alias(order_id):
    return _proxy_service(
        config.payment_service_url,
        f"/api/v1/payments/order/{order_id}",
        require_auth=True,
    )


@gateway_blueprint.route("/api/payments/<int:payment_id>", methods=["GET"])
def payment_detail_alias(payment_id):
    return _proxy_service(
        config.payment_service_url,
        f"/api/v1/payments/{payment_id}",
        require_auth=True,
    )


@gateway_blueprint.route("/api/payments/<int:payment_id>/verify", methods=["POST"])
def payment_verify_alias(payment_id):
    return _proxy_service(
        config.payment_service_url,
        f"/api/v1/payments/{payment_id}/verify",
        require_auth=True,
    )


@gateway_blueprint.route("/api/payments/<int:payment_id>/refund", methods=["POST"])
def payment_refund_alias(payment_id):
    return _proxy_service(
        config.payment_service_url,
        f"/api/v1/payments/{payment_id}/refund",
        require_auth=True,
    )


@gateway_blueprint.route("/api/payments/<int:payment_id>/refunds", methods=["GET"])
def payment_refunds_alias(payment_id):
    return _proxy_service(
        config.payment_service_url,
        f"/api/v1/payments/{payment_id}/refunds",
        require_auth=True,
    )


@gateway_blueprint.route("/api/payments/<int:payment_id>/events", methods=["GET"])
def payment_events_alias(payment_id):
    return _proxy_service(
        config.payment_service_url,
        f"/api/v1/payments/{payment_id}/events",
        require_auth=True,
    )


@gateway_blueprint.route("/api/payouts", methods=["GET", "POST"])
def payouts_alias():
    return _proxy_service(config.payment_service_url, "/api/v1/payouts", require_auth=True)


@gateway_blueprint.route("/api/payouts/<int:payout_id>", methods=["GET"])
def payout_detail_alias(payout_id):
    return _proxy_service(
        config.payment_service_url,
        f"/api/v1/payouts/{payout_id}",
        require_auth=True,
    )


@gateway_blueprint.get("/api/all-recipes")
def all_recipes_alias():
    return _proxy_service(config.chef_service_url, "/api/v1/recipes", require_auth=False)


@gateway_blueprint.get("/api/recipes/<int:recipe_id>")
def public_recipe_alias(recipe_id):
    return _proxy_service(config.chef_service_url, f"/api/v1/recipes/{recipe_id}", require_auth=False)


@gateway_blueprint.route("/api/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def legacy_proxy(path):
    if not config.legacy_backend_url:
        return error_response("No matching service route was found", 404, "route_not_found")
    return proxy_service.proxy(config.legacy_backend_url, f"/api/{path}")
