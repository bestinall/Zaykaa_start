from src.providers.mock_provider import MockPaymentProvider
from src.providers.razorpay_provider import RazorpayPaymentProvider
from src.providers.stripe_provider import StripePaymentProvider
from src.utils.exceptions import ProviderConfigurationError


def get_payment_provider(config, provider_name=None):
    provider_name = (provider_name or config.payment_provider).strip().lower()
    if provider_name == "mock":
        return MockPaymentProvider()
    if provider_name == "stripe":
        return StripePaymentProvider(config)
    if provider_name == "razorpay":
        return RazorpayPaymentProvider(config)
    raise ProviderConfigurationError(
        "Unsupported payment provider configured",
        {"provider": provider_name},
    )
