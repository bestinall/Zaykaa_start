SELECT
    id,
    payment_reference,
    order_id,
    order_reference,
    user_id,
    provider,
    payment_method,
    provider_payment_id,
    amount,
    currency,
    status,
    refunded_amount
FROM payments
WHERE user_id = %s
ORDER BY created_at DESC, id DESC;

INSERT INTO payments (
    payment_reference,
    order_id,
    order_reference,
    user_id,
    provider,
    payment_method,
    provider_payment_id,
    client_secret,
    amount,
    currency,
    status,
    metadata_json
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);

INSERT INTO payment_events (
    payment_id,
    event_type,
    actor_user_id,
    actor_role,
    event_payload
) VALUES (%s, %s, %s, %s, %s);

UPDATE payments
SET
    provider_payment_id = %s,
    status = %s,
    failure_reason = %s,
    metadata_json = %s,
    verified_at = %s,
    updated_at = CURRENT_TIMESTAMP
WHERE id = %s;

INSERT INTO refunds (
    refund_reference,
    payment_id,
    order_id,
    user_id,
    provider,
    provider_refund_id,
    amount,
    currency,
    reason,
    status,
    metadata_json
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);

INSERT INTO payouts (
    payout_reference,
    recipient_user_id,
    source_payment_id,
    source_order_id,
    provider,
    provider_payout_id,
    amount,
    currency,
    fee_amount,
    net_amount,
    status,
    notes,
    metadata_json,
    processed_at
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
