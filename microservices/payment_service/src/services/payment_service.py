import json
import uuid
from datetime import datetime, timezone

from src.clients.order_client import OrderServiceClient
from src.config import Config
from src.database.connection import DatabasePoolManager
from src.providers.factory import get_payment_provider
from src.repositories.payment_repository import PaymentRepository
from src.utils.exceptions import AuthorizationError, ConflictError, NotFoundError
from src.utils.validators import (
    validate_initiate_payment_payload,
    validate_payment_list_filters,
    validate_payout_filters,
    validate_payout_payload,
    validate_refund_payload,
    validate_verify_payload,
)


ADMIN_ALLOWED_ROLES = {"admin"}
BLOCKING_PAYMENT_STATUSES = {"initiated", "captured", "partially_refunded"}
REFUNDABLE_PAYMENT_STATUSES = {"captured", "partially_refunded"}


class PaymentService:
    def __init__(self):
        self.config = Config()
        self.payment_repository = PaymentRepository()
        self.order_client = OrderServiceClient()

    def initiate_payment(self, auth_header, current_user_id, current_user_role, payload):
        validated_payload = validate_initiate_payment_payload(payload, self.config.payment_provider)
        order_payload = self.order_client.get_order(validated_payload["order_id"], auth_header)
        order = self._extract_order(order_payload)
        self._assert_order_access(order, current_user_id, current_user_role)
        self._assert_payable_order(order)

        provider = get_payment_provider(self.config, validated_payload["provider"])
        amount = round(float(order.get("totalAmount") or order.get("amount") or 0), 2)
        if amount <= 0:
            raise ConflictError("Order amount must be greater than zero to initiate payment")

        connection = DatabasePoolManager.get_connection()
        try:
            latest_payment = self.payment_repository.get_latest_payment_for_order(connection, order["id"])
            if latest_payment and latest_payment["status"] in BLOCKING_PAYMENT_STATUSES:
                raise ConflictError(
                    "An active payment already exists for this order",
                    {
                        "payment_id": latest_payment["id"],
                        "payment_status": latest_payment["status"],
                    },
                )

            payment_reference = f"PAY-{uuid.uuid4().hex[:10].upper()}"
            provider_result = provider.initiate_payment(
                payment_reference,
                amount,
                order.get("currency") or self.config.default_currency,
                {
                    "orderId": order["id"],
                    "orderReference": order.get("orderReference"),
                    "notes": validated_payload.get("notes"),
                },
            )

            metadata = {
                "provider": provider.provider_name,
                "orderSnapshot": {
                    "orderId": order["id"],
                    "orderReference": order.get("orderReference"),
                    "restaurantName": order.get("restaurantName"),
                    "status": order.get("status"),
                },
                "providerPayload": provider_result.get("providerPayload", {}),
                "notes": validated_payload.get("notes"),
            }
            payment_id = self.payment_repository.create_payment(
                connection,
                {
                    "payment_reference": payment_reference,
                    "order_id": order["id"],
                    "order_reference": order.get("orderReference") or f"ORD-{order['id']}",
                    "user_id": order["userId"],
                    "provider": provider.provider_name,
                    "payment_method": validated_payload["payment_method"],
                    "provider_payment_id": provider_result.get("providerPaymentId"),
                    "client_secret": provider_result.get("clientSecret"),
                    "amount": amount,
                    "currency": order.get("currency") or self.config.default_currency,
                    "status": provider_result.get("status", "initiated"),
                    "metadata_json": self._dump_json(metadata),
                },
            )
            self.payment_repository.insert_payment_event(
                connection,
                {
                    "payment_id": payment_id,
                    "event_type": "payment_initiated",
                    "actor_user_id": current_user_id,
                    "actor_role": current_user_role,
                    "event_payload": self._dump_json(
                        {
                            "provider": provider.provider_name,
                            "paymentMethod": validated_payload["payment_method"],
                            "providerPayload": provider_result.get("providerPayload", {}),
                        }
                    ),
                },
            )
            connection.commit()
            return {"payment": self._fetch_payment_detail(connection, payment_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_payments_for_actor(self, current_user_id, current_user_role, args):
        filters = validate_payment_list_filters(args)
        connection = DatabasePoolManager.get_connection()
        try:
            if current_user_role in ADMIN_ALLOWED_ROLES:
                payments = self.payment_repository.list_all_payments(connection, status=filters["status"])
            else:
                payments = self.payment_repository.list_payments_for_user(
                    connection,
                    current_user_id,
                    status=filters["status"],
                )
            return {"payments": [self._format_payment_summary(payment) for payment in payments]}
        finally:
            connection.close()

    def list_my_payments(self, current_user_id, args):
        filters = validate_payment_list_filters(args)
        connection = DatabasePoolManager.get_connection()
        try:
            payments = self.payment_repository.list_payments_for_user(
                connection,
                current_user_id,
                status=filters["status"],
            )
            return {"payments": [self._format_payment_summary(payment) for payment in payments]}
        finally:
            connection.close()

    def get_payment_for_actor(self, current_user_id, current_user_role, payment_id):
        connection = DatabasePoolManager.get_connection()
        try:
            payment = self._get_payment_or_raise(connection, payment_id)
            self._assert_payment_access(payment, current_user_id, current_user_role)
            return {"payment": self._format_payment_detail(connection, payment)}
        finally:
            connection.close()

    def list_payments_for_order(self, auth_header, current_user_id, current_user_role, order_id):
        order_payload = self.order_client.get_order(order_id, auth_header)
        order = self._extract_order(order_payload)
        self._assert_order_access(order, current_user_id, current_user_role)

        connection = DatabasePoolManager.get_connection()
        try:
            payments = self.payment_repository.list_payments_for_order(connection, order_id)
            return {"payments": [self._format_payment_summary(payment) for payment in payments]}
        finally:
            connection.close()

    def verify_payment(self, current_user_id, current_user_role, payment_id, payload):
        validated_payload = validate_verify_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            payment = self._get_payment_or_raise(connection, payment_id)
            self._assert_payment_access(payment, current_user_id, current_user_role)
            if payment["status"] != "initiated":
                raise ConflictError(
                    "Only initiated payments can be verified",
                    {"current_status": payment["status"]},
                )

            provider = get_payment_provider(self.config, payment["provider"])
            provider_result = provider.verify_payment(payment, validated_payload)
            metadata = self._merge_json(
                payment.get("metadata_json"),
                {
                    "verification": {
                        "notes": validated_payload.get("notes"),
                        "providerPayload": provider_result.get("providerPayload", {}),
                    }
                },
            )
            status = provider_result.get("status", "failed")
            self.payment_repository.update_payment_verification(
                connection,
                payment_id,
                {
                    "provider_payment_id": provider_result.get("providerPaymentId"),
                    "status": status,
                    "failure_reason": None if status == "captured" else "Payment verification failed",
                    "metadata_json": self._dump_json(metadata),
                    "verified_at": datetime.now(timezone.utc) if status == "captured" else None,
                },
            )
            self.payment_repository.insert_payment_event(
                connection,
                {
                    "payment_id": payment_id,
                    "event_type": "payment_verified",
                    "actor_user_id": current_user_id,
                    "actor_role": current_user_role,
                    "event_payload": self._dump_json(
                        {
                            "status": status,
                            "providerPaymentId": provider_result.get("providerPaymentId"),
                            "providerPayload": provider_result.get("providerPayload", {}),
                        }
                    ),
                },
            )
            connection.commit()
            return {"payment": self._fetch_payment_detail(connection, payment_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def refund_payment(self, current_user_id, current_user_role, payment_id, payload):
        validated_payload = validate_refund_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            payment = self._get_payment_or_raise(connection, payment_id)
            self._assert_payment_access(payment, current_user_id, current_user_role)
            if payment["status"] not in REFUNDABLE_PAYMENT_STATUSES:
                raise ConflictError(
                    "Only captured or partially refunded payments can be refunded",
                    {"current_status": payment["status"]},
                )

            refundable_balance = round(float(payment["amount"]) - float(payment["refunded_amount"] or 0), 2)
            refund_amount = round(float(validated_payload["amount"] or refundable_balance), 2)
            if refund_amount <= 0:
                raise ConflictError("Refund amount must be greater than zero")
            if refund_amount > refundable_balance:
                raise ConflictError(
                    "Refund amount exceeds remaining refundable balance",
                    {
                        "requested_amount": refund_amount,
                        "refundable_balance": refundable_balance,
                    },
                )

            provider = get_payment_provider(self.config, payment["provider"])
            provider_result = provider.refund_payment(
                payment,
                refund_amount,
                validated_payload.get("reason"),
            )
            refund_id = self.payment_repository.create_refund(
                connection,
                {
                    "refund_reference": f"REF-{uuid.uuid4().hex[:10].upper()}",
                    "payment_id": payment["id"],
                    "order_id": payment["order_id"],
                    "user_id": payment["user_id"],
                    "provider": payment["provider"],
                    "provider_refund_id": provider_result.get("providerRefundId"),
                    "amount": refund_amount,
                    "currency": payment["currency"],
                    "reason": validated_payload.get("reason"),
                    "status": provider_result.get("status", "processed"),
                    "metadata_json": self._dump_json(
                        {
                            "providerPayload": provider_result.get("providerPayload", {}),
                            "requestedBy": current_user_role,
                        }
                    ),
                },
            )

            refunded_total = round(float(payment["refunded_amount"] or 0) + refund_amount, 2)
            new_status = "refunded" if refunded_total >= round(float(payment["amount"]), 2) else "partially_refunded"
            metadata = self._merge_json(
                payment.get("metadata_json"),
                {
                    "lastRefund": {
                        "refundId": refund_id,
                        "amount": refund_amount,
                        "reason": validated_payload.get("reason"),
                    }
                },
            )
            self.payment_repository.update_payment_refund_state(
                connection,
                payment["id"],
                new_status,
                refunded_total,
                self._dump_json(metadata),
            )
            self.payment_repository.insert_payment_event(
                connection,
                {
                    "payment_id": payment["id"],
                    "event_type": "payment_refunded",
                    "actor_user_id": current_user_id,
                    "actor_role": current_user_role,
                    "event_payload": self._dump_json(
                        {
                            "refundId": refund_id,
                            "amount": refund_amount,
                            "status": provider_result.get("status", "processed"),
                        }
                    ),
                },
            )
            connection.commit()
            return {"payment": self._fetch_payment_detail(connection, payment["id"])}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_refunds_for_payment(self, current_user_id, current_user_role, payment_id):
        connection = DatabasePoolManager.get_connection()
        try:
            payment = self._get_payment_or_raise(connection, payment_id)
            self._assert_payment_access(payment, current_user_id, current_user_role)
            refunds = self.payment_repository.list_refunds_for_payment(connection, payment_id)
            return {"refunds": [self._format_refund(refund) for refund in refunds]}
        finally:
            connection.close()

    def list_payment_events(self, current_user_id, current_user_role, payment_id):
        connection = DatabasePoolManager.get_connection()
        try:
            payment = self._get_payment_or_raise(connection, payment_id)
            self._assert_payment_access(payment, current_user_id, current_user_role)
            events = self.payment_repository.list_payment_events(connection, payment_id)
            return {"events": [self._format_payment_event(event) for event in events]}
        finally:
            connection.close()

    def create_payout(self, current_user_id, current_user_role, payload):
        validated_payload = validate_payout_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            source_payment = None
            gross_amount = validated_payload.get("amount")
            source_order_id = validated_payload.get("source_order_id")

            if validated_payload.get("source_payment_id"):
                source_payment = self._get_payment_or_raise(connection, validated_payload["source_payment_id"])
                if source_payment["status"] not in {"captured", "partially_refunded", "refunded"}:
                    raise ConflictError(
                        "Payouts can only be created from paid payments",
                        {"payment_status": source_payment["status"]},
                    )
                remaining_balance = round(
                    float(source_payment["amount"]) - float(source_payment["refunded_amount"] or 0),
                    2,
                )
                if gross_amount is None:
                    gross_amount = remaining_balance
                if gross_amount > remaining_balance:
                    raise ConflictError(
                        "Payout amount exceeds payment balance after refunds",
                        {
                            "requested_amount": gross_amount,
                            "available_amount": remaining_balance,
                        },
                    )
                source_order_id = source_order_id or source_payment["order_id"]

            gross_amount = round(float(gross_amount), 2)
            if gross_amount <= 0:
                raise ConflictError("Payout amount must be greater than zero")

            fee_amount = round(gross_amount * (self.config.platform_fee_percent / 100), 2)
            net_amount = round(max(gross_amount - fee_amount, 0), 2)
            payout_reference = f"PO-{uuid.uuid4().hex[:10].upper()}"
            provider = get_payment_provider(self.config)
            provider_result = provider.create_payout(
                payout_reference,
                gross_amount,
                self.config.default_currency,
                validated_payload["recipient_user_id"],
                validated_payload.get("notes"),
            )
            payout_id = self.payment_repository.create_payout(
                connection,
                {
                    "payout_reference": payout_reference,
                    "recipient_user_id": validated_payload["recipient_user_id"],
                    "source_payment_id": source_payment["id"] if source_payment else None,
                    "source_order_id": source_order_id,
                    "provider": provider.provider_name,
                    "provider_payout_id": provider_result.get("providerPayoutId"),
                    "amount": gross_amount,
                    "currency": self.config.default_currency,
                    "fee_amount": fee_amount,
                    "net_amount": net_amount,
                    "status": provider_result.get("status", "processed"),
                    "notes": validated_payload.get("notes"),
                    "metadata_json": self._dump_json(
                        {
                            "providerPayload": provider_result.get("providerPayload", {}),
                            "createdBy": {
                                "userId": current_user_id,
                                "role": current_user_role,
                            },
                        }
                    ),
                    "processed_at": datetime.now(timezone.utc),
                },
            )
            connection.commit()
            return {"payout": self._fetch_payout_detail(connection, payout_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_payouts(self, args):
        filters = validate_payout_filters(args)
        connection = DatabasePoolManager.get_connection()
        try:
            payouts = self.payment_repository.list_payouts(connection, status=filters["status"])
            return {"payouts": [self._format_payout(payout) for payout in payouts]}
        finally:
            connection.close()

    def get_payout(self, payout_id):
        connection = DatabasePoolManager.get_connection()
        try:
            payout = self.payment_repository.get_payout_by_id(connection, payout_id)
            if not payout:
                raise NotFoundError("Payout was not found")
            return {"payout": self._format_payout(payout)}
        finally:
            connection.close()

    def _extract_order(self, payload):
        if isinstance(payload, dict) and "order" in payload:
            return payload["order"]
        if isinstance(payload, dict):
            return payload
        raise NotFoundError("Order payload was invalid")

    def _assert_order_access(self, order, current_user_id, current_user_role):
        if int(order["userId"]) == int(current_user_id):
            return
        if current_user_role in ADMIN_ALLOWED_ROLES:
            return
        raise AuthorizationError("You are not allowed to access payments for this order")

    def _assert_payable_order(self, order):
        if order.get("status") == "cancelled":
            raise ConflictError("Cancelled orders cannot be paid")

    def _get_payment_or_raise(self, connection, payment_id):
        payment = self.payment_repository.get_payment_by_id(connection, payment_id)
        if not payment:
            raise NotFoundError("Payment was not found")
        return payment

    def _assert_payment_access(self, payment, current_user_id, current_user_role):
        if int(payment["user_id"]) == int(current_user_id):
            return
        if current_user_role in ADMIN_ALLOWED_ROLES:
            return
        raise AuthorizationError("You are not allowed to access this payment")

    def _fetch_payment_detail(self, connection, payment_id):
        payment = self._get_payment_or_raise(connection, payment_id)
        return self._format_payment_detail(connection, payment)

    def _fetch_payout_detail(self, connection, payout_id):
        payout = self.payment_repository.get_payout_by_id(connection, payout_id)
        if not payout:
            raise NotFoundError("Payout was not found")
        return self._format_payout(payout)

    def _format_payment_summary(self, payment):
        metadata = self._load_json(payment.get("metadata_json"))
        return {
            "id": payment["id"],
            "paymentReference": payment["payment_reference"],
            "orderId": payment["order_id"],
            "orderReference": payment["order_reference"],
            "userId": payment["user_id"],
            "provider": payment["provider"],
            "paymentMethod": payment["payment_method"],
            "providerPaymentId": payment.get("provider_payment_id"),
            "clientSecret": payment.get("client_secret"),
            "amount": float(payment["amount"]),
            "currency": payment["currency"],
            "status": payment["status"],
            "failureReason": payment.get("failure_reason"),
            "refundedAmount": float(payment["refunded_amount"] or 0),
            "verifiedAt": payment.get("verified_at"),
            "createdAt": payment.get("created_at"),
            "updatedAt": payment.get("updated_at"),
            "metadata": metadata,
        }

    def _format_payment_detail(self, connection, payment):
        refunds = self.payment_repository.list_refunds_for_payment(connection, payment["id"])
        events = self.payment_repository.list_payment_events(connection, payment["id"])
        return {
            **self._format_payment_summary(payment),
            "refunds": [self._format_refund(refund) for refund in refunds],
            "events": [self._format_payment_event(event) for event in events],
        }

    def _format_refund(self, refund):
        return {
            "id": refund["id"],
            "refundReference": refund["refund_reference"],
            "paymentId": refund["payment_id"],
            "orderId": refund["order_id"],
            "userId": refund["user_id"],
            "provider": refund["provider"],
            "providerRefundId": refund.get("provider_refund_id"),
            "amount": float(refund["amount"]),
            "currency": refund["currency"],
            "reason": refund.get("reason"),
            "status": refund["status"],
            "metadata": self._load_json(refund.get("metadata_json")),
            "createdAt": refund.get("created_at"),
            "updatedAt": refund.get("updated_at"),
        }

    def _format_payment_event(self, event):
        return {
            "id": event["id"],
            "paymentId": event["payment_id"],
            "eventType": event["event_type"],
            "actorUserId": event["actor_user_id"],
            "actorRole": event["actor_role"],
            "eventPayload": self._load_json(event.get("event_payload")),
            "createdAt": event.get("created_at"),
        }

    def _format_payout(self, payout):
        return {
            "id": payout["id"],
            "payoutReference": payout["payout_reference"],
            "recipientUserId": payout["recipient_user_id"],
            "sourcePaymentId": payout.get("source_payment_id"),
            "sourceOrderId": payout.get("source_order_id"),
            "provider": payout["provider"],
            "providerPayoutId": payout.get("provider_payout_id"),
            "amount": float(payout["amount"]),
            "currency": payout["currency"],
            "feeAmount": float(payout["fee_amount"]),
            "netAmount": float(payout["net_amount"]),
            "status": payout["status"],
            "notes": payout.get("notes"),
            "metadata": self._load_json(payout.get("metadata_json")),
            "processedAt": payout.get("processed_at"),
            "createdAt": payout.get("created_at"),
            "updatedAt": payout.get("updated_at"),
        }

    def _load_json(self, raw_value):
        if not raw_value:
            return {}
        try:
            return json.loads(raw_value)
        except (TypeError, ValueError):
            return {}

    def _merge_json(self, raw_value, updates):
        merged = self._load_json(raw_value)
        merged.update(updates)
        return merged

    def _dump_json(self, value):
        return json.dumps(value or {}, separators=(",", ":"), default=str)
