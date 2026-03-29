CREATE DATABASE IF NOT EXISTS zaykaa_payment_service
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE zaykaa_payment_service;

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_reference VARCHAR(40) NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    order_reference VARCHAR(40) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    provider VARCHAR(30) NOT NULL,
    payment_method VARCHAR(60) NOT NULL,
    provider_payment_id VARCHAR(80) NULL,
    client_secret VARCHAR(120) NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    status ENUM('initiated', 'captured', 'failed', 'partially_refunded', 'refunded') NOT NULL DEFAULT 'initiated',
    failure_reason VARCHAR(255) NULL,
    refunded_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    metadata_json LONGTEXT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payments_reference (payment_reference),
    KEY idx_payments_order (order_id, created_at),
    KEY idx_payments_user (user_id, created_at),
    KEY idx_payments_status (status, created_at)
);

CREATE TABLE IF NOT EXISTS payment_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_id BIGINT UNSIGNED NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    actor_user_id BIGINT UNSIGNED NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    event_payload LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_payment_events_payment (payment_id, created_at),
    CONSTRAINT fk_payment_events_payment
        FOREIGN KEY (payment_id) REFERENCES payments(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refunds (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    refund_reference VARCHAR(40) NOT NULL,
    payment_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_refund_id VARCHAR(80) NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    reason VARCHAR(255) NULL,
    status ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'processed',
    metadata_json LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_refunds_reference (refund_reference),
    KEY idx_refunds_payment (payment_id, created_at),
    CONSTRAINT fk_refunds_payment
        FOREIGN KEY (payment_id) REFERENCES payments(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payouts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payout_reference VARCHAR(40) NOT NULL,
    recipient_user_id BIGINT UNSIGNED NOT NULL,
    source_payment_id BIGINT UNSIGNED NULL,
    source_order_id BIGINT UNSIGNED NULL,
    provider VARCHAR(30) NOT NULL,
    provider_payout_id VARCHAR(80) NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('queued', 'processed', 'failed') NOT NULL DEFAULT 'processed',
    notes VARCHAR(255) NULL,
    metadata_json LONGTEXT NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payouts_reference (payout_reference),
    KEY idx_payouts_recipient (recipient_user_id, created_at),
    KEY idx_payouts_status (status, created_at),
    CONSTRAINT fk_payouts_source_payment
        FOREIGN KEY (source_payment_id) REFERENCES payments(id)
        ON DELETE SET NULL
);
