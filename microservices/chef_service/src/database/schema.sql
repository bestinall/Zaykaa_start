CREATE DATABASE IF NOT EXISTS zaykaa_chef_service
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE zaykaa_chef_service;

CREATE TABLE IF NOT EXISTS chef_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    headline VARCHAR(180) NULL,
    bio TEXT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    experience_years INT NOT NULL DEFAULT 0,
    service_city VARCHAR(80) NULL,
    service_state VARCHAR(80) NULL,
    service_country VARCHAR(80) NULL DEFAULT 'India',
    location_label VARCHAR(160) NULL,
    available_days_label VARCHAR(120) NULL,
    profile_image_url VARCHAR(500) NULL,
    cover_image_url VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_chef_profiles_user_id (user_id),
    KEY idx_chef_profiles_active_city (is_active, service_city),
    KEY idx_chef_profiles_status_rate (verification_status, hourly_rate)
);

CREATE TABLE IF NOT EXISTS chef_specialties (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    chef_id BIGINT UNSIGNED NOT NULL,
    specialty_name VARCHAR(80) NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_chef_specialty (chef_id, specialty_name),
    KEY idx_specialty_lookup (specialty_name),
    CONSTRAINT fk_chef_specialties_profile
        FOREIGN KEY (chef_id) REFERENCES chef_profiles(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chef_availability_slots (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    chef_id BIGINT UNSIGNED NOT NULL,
    available_date DATE NOT NULL,
    slot_name ENUM('breakfast', 'lunch', 'dinner', 'custom') NOT NULL DEFAULT 'custom',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    reserved_count INT NOT NULL DEFAULT 0,
    status ENUM('open', 'blocked', 'reserved') NOT NULL DEFAULT 'open',
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_chef_slot_window (chef_id, available_date, slot_name, start_time, end_time),
    KEY idx_chef_availability_lookup (chef_id, available_date, status),
    CONSTRAINT fk_chef_availability_profile
        FOREIGN KEY (chef_id) REFERENCES chef_profiles(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chef_rating_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    chef_id BIGINT UNSIGNED NOT NULL,
    reviewer_user_id BIGINT UNSIGNED NULL,
    rating_value TINYINT NOT NULL,
    comment VARCHAR(500) NULL,
    source VARCHAR(32) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_chef_rating_events_chef (chef_id, created_at),
    CONSTRAINT fk_chef_rating_events_profile
        FOREIGN KEY (chef_id) REFERENCES chef_profiles(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_rating_value CHECK (rating_value BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS chef_rating_summary (
    chef_id BIGINT UNSIGNED NOT NULL,
    average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    total_reviews INT NOT NULL DEFAULT 0,
    five_star_count INT NOT NULL DEFAULT 0,
    four_star_count INT NOT NULL DEFAULT 0,
    three_star_count INT NOT NULL DEFAULT 0,
    two_star_count INT NOT NULL DEFAULT 0,
    one_star_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (chef_id),
    CONSTRAINT fk_chef_rating_summary_profile
        FOREIGN KEY (chef_id) REFERENCES chef_profiles(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    chef_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT NULL,
    cuisine VARCHAR(80) NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    preparation_time_minutes INT NOT NULL DEFAULT 0,
    preparation_time_label VARCHAR(60) NULL,
    cook_time_minutes INT NOT NULL DEFAULT 0,
    servings INT NOT NULL DEFAULT 1,
    calories INT NULL,
    image_url VARCHAR(500) NULL,
    is_public TINYINT(1) NOT NULL DEFAULT 1,
    views_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_recipe_slug_chef (chef_id, slug),
    KEY idx_recipes_public (is_public, category, cuisine),
    KEY idx_recipes_chef_created (chef_id, created_at),
    CONSTRAINT fk_recipes_profile
        FOREIGN KEY (chef_id) REFERENCES chef_profiles(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    recipe_id BIGINT UNSIGNED NOT NULL,
    ingredient_name VARCHAR(160) NOT NULL,
    quantity VARCHAR(60) NULL,
    unit VARCHAR(40) NULL,
    sort_order INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY idx_recipe_ingredients_order (recipe_id, sort_order),
    CONSTRAINT fk_recipe_ingredients_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_steps (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    recipe_id BIGINT UNSIGNED NOT NULL,
    step_number INT NOT NULL,
    instruction TEXT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_recipe_steps_order (recipe_id, step_number),
    CONSTRAINT fk_recipe_steps_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        ON DELETE CASCADE
);
