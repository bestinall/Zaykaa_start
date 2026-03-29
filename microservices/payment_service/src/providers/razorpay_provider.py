from src.utils.exceptions import ProviderConfigurationError


class RazorpayPaymentProvider:
    provider_name = "razorpay"

    def __init__(self, config):
        if not config.razorpay_key_id or not config.razorpay_key_secret:
            raise ProviderConfigurationError(
                "Razorpay is selected but RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured"
            )

    def initiate_payment(self, payment_reference, amount, currency, metadata):
        raise ProviderConfigurationError("Razorpay integration is designed but not activated in mock mode")

    def verify_payment(self, payment_record, payload):
        raise ProviderConfigurationError("Razorpay verification flow is designed but not activated in mock mode")

    def refund_payment(self, payment_record, amount, reason):
        raise ProviderConfigurationError("Razorpay refund flow is designed but not activated in mock mode")

    def create_payout(self, payout_reference, amount, currency, recipient_user_id, notes):
        raise ProviderConfigurationError("Razorpay payout flow is designed but not activated in mock mode")
