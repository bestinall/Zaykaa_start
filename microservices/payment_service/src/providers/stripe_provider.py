from src.utils.exceptions import ProviderConfigurationError


class StripePaymentProvider:
    provider_name = "stripe"

    def __init__(self, config):
        if not config.stripe_secret_key:
            raise ProviderConfigurationError("Stripe is selected but STRIPE_SECRET_KEY is not configured")

    def initiate_payment(self, payment_reference, amount, currency, metadata):
        raise ProviderConfigurationError("Stripe integration is designed but not activated in mock mode")

    def verify_payment(self, payment_record, payload):
        raise ProviderConfigurationError("Stripe verification flow is designed but not activated in mock mode")

    def refund_payment(self, payment_record, amount, reason):
        raise ProviderConfigurationError("Stripe refund flow is designed but not activated in mock mode")

    def create_payout(self, payout_reference, amount, currency, recipient_user_id, notes):
        raise ProviderConfigurationError("Stripe payout flow is designed but not activated in mock mode")
