from flask import Blueprint, g, request

from src.middleware.auth import admin_role_required, auth_required
from src.services.payment_service import PaymentService
from src.utils.responses import success_response


payment_blueprint = Blueprint("payments", __name__, url_prefix="/api/v1/payments")
payout_blueprint = Blueprint("payouts", __name__, url_prefix="/api/v1/payouts")
payment_service = PaymentService()


@payment_blueprint.route("", methods=["GET", "POST"])
@auth_required
def payments_root():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        result = payment_service.initiate_payment(
            request.headers.get("Authorization", ""),
            g.current_user_id,
            g.current_user_role,
            payload,
        )
        return success_response(result, "Payment initiated successfully", 201)

    result = payment_service.list_payments_for_actor(
        g.current_user_id,
        g.current_user_role,
        request.args,
    )
    return success_response(result, "Payments fetched successfully")


@payment_blueprint.get("/my")
@auth_required
def my_payments():
    result = payment_service.list_my_payments(g.current_user_id, request.args)
    return success_response(result, "My payments fetched successfully")


@payment_blueprint.get("/order/<int:order_id>")
@auth_required
def payments_for_order(order_id):
    result = payment_service.list_payments_for_order(
        request.headers.get("Authorization", ""),
        g.current_user_id,
        g.current_user_role,
        order_id,
    )
    return success_response(result, "Order payments fetched successfully")


@payment_blueprint.get("/<int:payment_id>")
@auth_required
def payment_detail(payment_id):
    result = payment_service.get_payment_for_actor(
        g.current_user_id,
        g.current_user_role,
        payment_id,
    )
    return success_response(result, "Payment fetched successfully")


@payment_blueprint.post("/<int:payment_id>/verify")
@auth_required
def verify_payment(payment_id):
    payload = request.get_json(silent=True) or {}
    result = payment_service.verify_payment(
        g.current_user_id,
        g.current_user_role,
        payment_id,
        payload,
    )
    return success_response(result, "Payment verified successfully")


@payment_blueprint.post("/<int:payment_id>/refund")
@auth_required
def refund_payment(payment_id):
    payload = request.get_json(silent=True) or {}
    result = payment_service.refund_payment(
        g.current_user_id,
        g.current_user_role,
        payment_id,
        payload,
    )
    return success_response(result, "Payment refunded successfully")


@payment_blueprint.get("/<int:payment_id>/refunds")
@auth_required
def payment_refunds(payment_id):
    result = payment_service.list_refunds_for_payment(
        g.current_user_id,
        g.current_user_role,
        payment_id,
    )
    return success_response(result, "Payment refunds fetched successfully")


@payment_blueprint.get("/<int:payment_id>/events")
@auth_required
def payment_events(payment_id):
    result = payment_service.list_payment_events(
        g.current_user_id,
        g.current_user_role,
        payment_id,
    )
    return success_response(result, "Payment events fetched successfully")


@payout_blueprint.route("", methods=["GET", "POST"])
@admin_role_required
def payouts_root():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        result = payment_service.create_payout(
            g.current_user_id,
            g.current_user_role,
            payload,
        )
        return success_response(result, "Payout created successfully", 201)

    result = payment_service.list_payouts(request.args)
    return success_response(result, "Payouts fetched successfully")


@payout_blueprint.get("/<int:payout_id>")
@admin_role_required
def payout_detail(payout_id):
    result = payment_service.get_payout(payout_id)
    return success_response(result, "Payout fetched successfully")
