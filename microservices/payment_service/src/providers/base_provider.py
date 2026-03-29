class PaymentProvider:
    provider_name = "base"

    def initiate_payment(self, payment_reference, amount, currency, metadata):
        raise NotImplementedError

    def verify_payment(self, payment_record, payload):
        raise NotImplementedError

    def refund_payment(self, payment_record, amount, reason):
        raise NotImplementedError

    def create_payout(self, payout_reference, amount, currency, recipient_user_id, notes):
        raise NotImplementedError
