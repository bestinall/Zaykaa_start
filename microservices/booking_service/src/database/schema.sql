CREATE DATABASE IF NOT EXISTS zaykaa_booking_service
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE zaykaa_booking_service;

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_reference VARCHAR(40) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    user_name VARCHAR(120) NOT NULL,
    user_email VARCHAR(160) NOT NULL,
    user_phone VARCHAR(30) NULL,
    chef_id BIGINT UNSIGNED NOT NULL,
    chef_user_id BIGINT UNSIGNED NOT NULL,
    chef_name VARCHAR(120) NOT NULL,
    booking_date DATE NOT NULL,
    time_slot ENUM('breakfast', 'lunch', 'dinner', 'custom') NOT NULL,
    slot_start_time TIME NULL,
    slot_end_time TIME NULL,
    guest_count INT NOT NULL DEFAULT 1,
    session_hours DECIMAL(4, 2) NOT NULL DEFAULT 3.00,
    menu_preferences VARCHAR(255) NULL,
    dietary_restrictions TEXT NULL,
    special_requests TEXT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    cancellation_reason VARCHAR(500) NULL,
    cancelled_by_user_id BIGINT UNSIGNED NULL,
    cancelled_by_role VARCHAR(20) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_bookings_reference (booking_reference),
    KEY idx_bookings_user (user_id, booking_date, status),
    KEY idx_bookings_chef (chef_id, booking_date, status),
    KEY idx_bookings_slot (chef_id, booking_date, time_slot, status)
);

CREATE TABLE IF NOT EXISTS booking_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    old_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NOT NULL,
    actor_user_id BIGINT UNSIGNED NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_booking_status_history_booking (booking_id, created_at),
    CONSTRAINT fk_booking_status_history_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE
);
