from flask import Blueprint, g, request

from src.middleware.auth import admin_role_required, auth_required
from src.services.order_service import OrderService
from src.utils.responses import success_response


catalog_blueprint = Blueprint("catalog", __name__, url_prefix="/api/v1/restaurants")
coupon_blueprint = Blueprint("coupons", __name__, url_prefix="/api/v1/coupons")
order_blueprint = Blueprint("orders", __name__, url_prefix="/api/v1/orders")
order_service = OrderService()


@catalog_blueprint.get("")
def list_restaurants():
    result = order_service.list_restaurants(request.args)
    return success_response(result, "Restaurants fetched successfully")


@catalog_blueprint.get("/<int:restaurant_id>")
def get_restaurant_details(restaurant_id):
    result = order_service.get_restaurant_details(restaurant_id)
    return success_response(result, "Restaurant fetched successfully")


@coupon_blueprint.post("/validate")
@auth_required
def validate_coupon():
    payload = request.get_json(silent=True) or {}
    result = order_service.validate_coupon_for_payload(g.current_user_id, payload)
    return success_response(result, "Coupon validated successfully")


@order_blueprint.route("", methods=["GET", "POST"])
@auth_required
def orders_root():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        result = order_service.create_order(g.current_user_id, payload)
        return success_response(result, "Order created successfully", 201)

    result = order_service.list_my_orders(g.current_user_id, request.args)
    return success_response(result, "Orders fetched successfully")


@order_blueprint.get("/my")
@auth_required
def get_my_orders():
    result = order_service.list_my_orders(g.current_user_id, request.args)
    return success_response(result, "Orders fetched successfully")


@order_blueprint.get("/recent")
@auth_required
def get_recent_orders():
    result = order_service.list_recent_orders(g.current_user_id)
    return success_response(result, "Recent orders fetched successfully")


@order_blueprint.route("/cart", methods=["GET", "PUT", "DELETE"])
@auth_required
def cart_resource():
    if request.method == "GET":
        result = order_service.get_cart(g.current_user_id)
        return success_response(result, "Cart fetched successfully")
    if request.method == "PUT":
        payload = request.get_json(silent=True) or {}
        result = order_service.upsert_cart(g.current_user_id, payload)
        return success_response(result, "Cart updated successfully")
    result = order_service.clear_cart(g.current_user_id)
    return success_response(result, "Cart cleared successfully")


@order_blueprint.get("/<int:order_id>")
@auth_required
def get_order_details(order_id):
    result = order_service.get_order_for_user(
        g.current_user_id,
        g.current_user_role,
        order_id,
    )
    return success_response(result, "Order fetched successfully")


@order_blueprint.get("/<int:order_id>/track")
@auth_required
def track_order(order_id):
    result = order_service.get_order_tracking(
        g.current_user_id,
        g.current_user_role,
        order_id,
    )
    return success_response(result, "Order tracking fetched successfully")


@order_blueprint.patch("/<int:order_id>/cancel")
@auth_required
def cancel_order(order_id):
    payload = request.get_json(silent=True) or {}
    result = order_service.cancel_order_for_user(
        g.current_user_id,
        g.current_user_role,
        order_id,
        payload,
    )
    return success_response(result, "Order cancelled successfully")


@order_blueprint.patch("/<int:order_id>/status")
@admin_role_required
def update_order_status(order_id):
    payload = request.get_json(silent=True) or {}
    result = order_service.update_order_status(
        g.current_user_id,
        g.current_user_role,
        order_id,
        payload,
    )
    return success_response(result, "Order status updated successfully")
