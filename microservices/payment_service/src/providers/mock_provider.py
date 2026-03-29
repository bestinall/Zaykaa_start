import uuid

from src.providers.base_provider import PaymentProvider


class MockPaymentProvider(PaymentProvider):
    provider_name = "mock"

    def initiate_payment(self, payment_reference, amount, currency, metadata):
        return {
            "providerPaymentId": f"mock_pay_{uuid.uuid4().hex[:12]}",
            "clientSecret": f"mock_secret_{uuid.uuid4().hex[:18]}",
            "status": "initiated",
            "providerPayload": {
                "mode": "mock",
                "paymentReference": payment_reference,
                "amount": amount,
                "currency": currency,
                "metadata": metadata,
                "nextStep": "Call verify endpoint with simulateStatus=captured or failed.",
            },
        }

    def verify_payment(self, payment_record, payload):
        status = payload.get("simulate_status", "captured")
        provider_payment_id = payload.get("provider_payment_id") or payment_record.get("provider_payment_id")
        if not provider_payment_id:
            provider_payment_id = f"mock_pay_{uuid.uuid4().hex[:12]}"
        return {
            "providerPaymentId": provider_payment_id,
            "status": status,
            "providerPayload": {
                "mode": "mock",
                "verified": True,
                "simulateStatus": status,
                "providerSignature": payload.get("provider_signature"),
            },
        }

    def refund_payment(self, payment_record, amount, reason):
        return {
            "providerRefundId": f"mock_ref_{uuid.uuid4().hex[:12]}",
            "status": "processed",
            "providerPayload": {
                "mode": "mock",
                "amount": amount,
                "reason": reason,
                "paymentReference": payment_record["payment_reference"],
            },
        }

    def create_payout(self, payout_reference, amount, currency, recipient_user_id, notes):
        return {
            "providerPayoutId": f"mock_po_{uuid.uuid4().hex[:12]}",
            "status": "processed",
            "providerPayload": {
                "mode": "mock",
                "amount": amount,
                "currency": currency,
                "recipientUserId": recipient_user_id,
                "notes": notes,
                "payoutReference": payout_reference,
            },
        }
