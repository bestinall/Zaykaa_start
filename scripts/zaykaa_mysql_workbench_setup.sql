-- =========================================================
-- Zaykaa Start MySQL Workbench Setup Script
-- =========================================================
-- Purpose:
--   Create the databases and tables used by the current codebase.
--   This script is structured for MySQL Workbench and matches the
--   final schema shape used by the services in this repository.
--
-- Databases included:
--   1. zaykaa_db                  (legacy compatibility backend)
--   2. zaykaa_user_service        (user service)
--   3. zaykaa_chef_service        (chef service)
--   4. zaykaa_booking_service     (booking service)
--   5. zaykaa_order_service       (order service)
--   6. zaykaa_payment_service     (payment service)
--
-- Notes:
--   - This script is intended for fresh setup in MySQL Workbench.
--   - The current final schema is already merged here, so you do not
--     need to separately run the Python bootstrap migrations after
--     executing this script on a clean database server.
--   - The order service section includes the current seed catalog data.
-- =========================================================

SET NAMES utf8mb4;

-- =========================================================
-- 1. Legacy Compatibility Backend Database
-- =========================================================

CREATE DATABASE IF NOT EXISTS zaykaa_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE zaykaa_db;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_legacy_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chefs (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NULL,
    name VARCHAR(120) NOT NULL,
    specialties VARCHAR(255) NULL,
    hourly_rate INT NOT NULL DEFAULT 800,
    rating FLOAT NOT NULL DEFAULT 0,
    reviews INT NOT NULL DEFAULT 0,
    image VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_legacy_chefs_user_id (user_id),
    CONSTRAINT fk_legacy_chefs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NULL,
    restaurant_name VARCHAR(120) NULL,
    total_amount INT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'placed',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_legacy_orders_user_created (user_id, created_at),
    CONSTRAINT fk_legacy_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;


-- =========================================================
-- 2. User Service Database
-- =========================================================

CREATE DATABASE IF NOT EXISTS zaykaa_user_service
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE zaykaa_user_service;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    role ENUM('user', 'chef', 'seller', 'agent', 'vlogger', 'admin') NOT NULL DEFAULT 'user',
    native_state VARCHAR(80) NULL,
    native_region VARCHAR(120) NULL,
    date_of_birth DATE NULL,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL DEFAULT 'prefer_not_to_say',
    height_cm DECIMAL(5, 2) NULL,
    weight_kg DECIMAL(5, 2) NULL,
    activity_level ENUM('low', 'moderate', 'high') NOT NULL DEFAULT 'moderate',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL,
    INDEX idx_users_role_created (role, created_at),
    INDEX idx_users_last_login (last_login_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id BIGINT PRIMARY KEY,
    calorie_target INT NULL,
    protein_target_g INT NULL,
    carbs_target_g INT NULL,
    fats_target_g INT NULL,
    spice_level ENUM('mild', 'medium', 'hot') NOT NULL DEFAULT 'medium',
    budget_preference ENUM('economy', 'standard', 'premium') NOT NULL DEFAULT 'standard',
    meal_complexity ENUM('simple', 'balanced', 'advanced') NOT NULL DEFAULT 'balanced',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_preferences_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_preference_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    tag_type ENUM('cuisine', 'diet', 'allergy', 'ingredient_dislike') NOT NULL,
    tag_value VARCHAR(120) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_preference_tag (user_id, tag_type, tag_value),
    INDEX idx_user_preference_lookup (user_id, tag_type),
    CONSTRAINT fk_user_preference_tags_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS meal_plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    goal VARCHAR(255) NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_meal_plans_user_date (user_id, start_date, end_date),
    INDEX idx_meal_plans_user_status (user_id, status),
    CONSTRAINT fk_meal_plans_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS meal_plan_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    meal_plan_id BIGINT NOT NULL,
    meal_date DATE NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    calories INT NOT NULL DEFAULT 0,
    protein_g DECIMAL(6, 2) NOT NULL DEFAULT 0,
    carbs_g DECIMAL(6, 2) NOT NULL DEFAULT 0,
    fats_g DECIMAL(6, 2) NOT NULL DEFAULT 0,
    scheduled_time TIME NULL,
    sort_order INT NOT NULL DEFAULT 1,
    INDEX idx_meal_plan_items_lookup (meal_plan_id, meal_date, meal_type),
    CONSTRAINT fk_meal_plan_items_plan
        FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS nutrition_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    logged_on DATE NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack', 'water') NOT NULL,
    food_name VARCHAR(150) NOT NULL,
    serving_size VARCHAR(120) NULL,
    calories INT NOT NULL DEFAULT 0,
    protein_g DECIMAL(6, 2) NOT NULL DEFAULT 0,
    carbs_g DECIMAL(6, 2) NOT NULL DEFAULT 0,
    fats_g DECIMAL(6, 2) NOT NULL DEFAULT 0,
    fiber_g DECIMAL(6, 2) NOT NULL DEFAULT 0,
    water_ml INT NOT NULL DEFAULT 0,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nutrition_logs_user_date (user_id, logged_on),
    INDEX idx_nutrition_logs_user_meal (user_id, meal_type),
    CONSTRAINT fk_nutrition_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 3. Chef Service Database
-- =========================================================

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
    native_state VARCHAR(80) NULL,
    native_region VARCHAR(120) NULL,
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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    chef_id BIGINT UNSIGNED NULL,
    contributor_user_id BIGINT NOT NULL,
    contributor_role VARCHAR(30) NOT NULL,
    contributor_name VARCHAR(120) NOT NULL,
    contributor_image_url VARCHAR(500) NULL,
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
    price DECIMAL(10, 2) NULL,
    origin_state VARCHAR(80) NULL,
    origin_region VARCHAR(120) NULL,
    is_authentic_regional TINYINT(1) NOT NULL DEFAULT 1,
    image_url VARCHAR(500) NULL,
    is_public TINYINT(1) NOT NULL DEFAULT 1,
    views_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_recipe_slug_contributor (contributor_user_id, slug),
    KEY idx_recipes_public (is_public, category, cuisine),
    KEY idx_recipes_contributor_created (contributor_user_id, created_at),
    KEY idx_recipes_chef_created (chef_id, created_at),
    CONSTRAINT fk_recipes_profile
        FOREIGN KEY (chef_id) REFERENCES chef_profiles(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;


-- =========================================================
-- 4. Booking Service Database
-- =========================================================

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;


-- =========================================================
-- 5. Order Service Database
-- =========================================================

CREATE DATABASE IF NOT EXISTS zaykaa_order_service
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE zaykaa_order_service;

CREATE TABLE IF NOT EXISTS restaurants (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    location VARCHAR(120) NOT NULL,
    cuisine VARCHAR(120) NOT NULL,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    reviews_count INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255) NULL,
    estimated_delivery_minutes INT NOT NULL DEFAULT 45,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_restaurants_slug (slug),
    KEY idx_restaurants_location (location),
    KEY idx_restaurants_cuisine (cuisine),
    KEY idx_restaurants_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description VARCHAR(255) NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    image_url VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_menu_items_restaurant (restaurant_id),
    KEY idx_menu_items_restaurant_available (restaurant_id, is_available),
    CONSTRAINT fk_menu_items_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    discount_type ENUM('flat', 'percent') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    max_discount_amount DECIMAL(10, 2) NULL,
    usage_limit INT NULL,
    per_user_limit INT NOT NULL DEFAULT 1,
    starts_at TIMESTAMP NULL,
    ends_at TIMESTAMP NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_coupons_code (code),
    KEY idx_coupons_active_window (is_active, starts_at, ends_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    coupon_id BIGINT UNSIGNED NULL,
    coupon_code VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_carts_user (user_id),
    KEY idx_carts_restaurant (restaurant_id),
    CONSTRAINT fk_carts_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_carts_coupon
        FOREIGN KEY (coupon_id) REFERENCES coupons(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cart_id BIGINT UNSIGNED NOT NULL,
    menu_item_id BIGINT UNSIGNED NOT NULL,
    item_name VARCHAR(120) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL DEFAULT 1,
    line_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cart_items_cart (cart_id),
    KEY idx_cart_items_menu_item (menu_item_id),
    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id) REFERENCES carts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_reference VARCHAR(40) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    restaurant_name VARCHAR(120) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    coupon_id BIGINT UNSIGNED NULL,
    coupon_code VARCHAR(50) NULL,
    subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    item_count INT NOT NULL DEFAULT 0,
    status ENUM('confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'confirmed',
    cancellation_reason VARCHAR(500) NULL,
    estimated_delivery_minutes INT NOT NULL DEFAULT 45,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_orders_reference (order_reference),
    KEY idx_orders_user (user_id, created_at),
    KEY idx_orders_status (status, created_at),
    KEY idx_orders_restaurant (restaurant_id, created_at),
    CONSTRAINT fk_orders_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_orders_coupon
        FOREIGN KEY (coupon_id) REFERENCES coupons(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    menu_item_id BIGINT UNSIGNED NOT NULL,
    item_name VARCHAR(120) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_items_order (order_id),
    KEY idx_order_items_menu_item (menu_item_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_order_items_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    old_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    actor_user_id BIGINT UNSIGNED NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_status_history_order (order_id, created_at),
    CONSTRAINT fk_order_status_history_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    coupon_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_coupon_redemptions_coupon (coupon_id, redeemed_at),
    KEY idx_coupon_redemptions_user_coupon (user_id, coupon_id),
    CONSTRAINT fk_coupon_redemptions_coupon
        FOREIGN KEY (coupon_id) REFERENCES coupons(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_coupon_redemptions_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO restaurants (
    id,
    name,
    slug,
    location,
    cuisine,
    rating,
    reviews_count,
    image_url,
    estimated_delivery_minutes,
    is_active
) VALUES
    (1, 'Aroma North Indian', 'aroma-north-indian', 'Delhi', 'North Indian', 4.70, 245, 'https://images.unsplash.com/photo-1604908176997-431d26a0f76b?auto=format&fit=crop&w=900&q=80', 38, 1),
    (2, 'Spice Garden South Indian', 'spice-garden-south-indian', 'Bangalore', 'South Indian', 4.80, 312, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=80', 32, 1),
    (3, 'Continental Express', 'continental-express', 'Mumbai', 'Continental', 4.60, 189, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 42, 1)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    location = VALUES(location),
    cuisine = VALUES(cuisine),
    rating = VALUES(rating),
    reviews_count = VALUES(reviews_count),
    image_url = VALUES(image_url),
    estimated_delivery_minutes = VALUES(estimated_delivery_minutes),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO menu_items (
    id,
    restaurant_id,
    name,
    category,
    description,
    price,
    image_url,
    sort_order,
    is_available
) VALUES
    (101, 1, 'Butter Chicken', 'Main Course', 'Creamy tomato curry with tender chicken.', 350.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80', 1, 1),
    (102, 1, 'Paneer Tikka', 'Appetizer', 'Charred paneer cubes with mint chutney.', 280.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=80', 2, 1),
    (103, 1, 'Garlic Naan', 'Bread', 'Buttery naan finished with roasted garlic.', 80.00, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=900&q=80', 3, 1),
    (104, 1, 'Dal Makhani', 'Main Course', 'Slow-cooked lentils with cream and butter.', 250.00, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80', 4, 1),
    (201, 2, 'Masala Dosa', 'Main Course', 'Crisp dosa with spiced potato filling.', 180.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (202, 2, 'Idli Sambar', 'Main Course', 'Soft idlis served with sambar and chutney.', 120.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (203, 2, 'Coconut Chutney', 'Side', 'Fresh coconut relish with curry leaves.', 40.00, 'https://images.unsplash.com/photo-1626200419199-391ae4be7a79?auto=format&fit=crop&w=900&q=80', 3, 1),
    (204, 2, 'Medu Vada', 'Appetizer', 'Crispy lentil fritters with sambar.', 60.00, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5971?auto=format&fit=crop&w=900&q=80', 4, 1),
    (301, 3, 'Grilled Chicken Steak', 'Main Course', 'Herb-marinated chicken with pan sauce.', 550.00, 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=900&q=80', 1, 1),
    (302, 3, 'Caesar Salad', 'Salad', 'Classic salad with parmesan and croutons.', 220.00, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80', 2, 1),
    (303, 3, 'Pasta Carbonara', 'Main Course', 'Creamy spaghetti with pepper and cheese.', 380.00, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80', 3, 1),
    (304, 3, 'Chocolate Cake', 'Dessert', 'Rich dark chocolate slice.', 150.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80', 4, 1)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category = VALUES(category),
    description = VALUES(description),
    price = VALUES(price),
    image_url = VALUES(image_url),
    sort_order = VALUES(sort_order),
    is_available = VALUES(is_available),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO coupons (
    id,
    code,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    per_user_limit,
    starts_at,
    ends_at,
    is_active
) VALUES
    (1, 'WELCOME100', 'Flat 100 off on your first qualifying order.', 'flat', 100.00, 500.00, NULL, NULL, 1, '2025-01-01 00:00:00', '2030-12-31 23:59:59', 1),
    (2, 'FEAST20', '20 percent off up to 150 on orders above 600.', 'percent', 20.00, 600.00, 150.00, NULL, 2, '2025-01-01 00:00:00', '2030-12-31 23:59:59', 1)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    discount_type = VALUES(discount_type),
    discount_value = VALUES(discount_value),
    min_order_amount = VALUES(min_order_amount),
    max_discount_amount = VALUES(max_discount_amount),
    usage_limit = VALUES(usage_limit),
    per_user_limit = VALUES(per_user_limit),
    starts_at = VALUES(starts_at),
    ends_at = VALUES(ends_at),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;


-- =========================================================
-- 6. Payment Service Database
-- =========================================================

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

-- =========================================================
-- 7. Data Inspection Queries
-- =========================================================
-- These queries are for checking data table by table in MySQL Workbench.
-- You can run the full section, or run one database block at a time.
-- `LIMIT 20` is used to keep result sets manageable.

-- ---------------------------------------------------------
-- 7.1 Legacy Compatibility Backend Database Checks
-- ---------------------------------------------------------

USE zaykaa_db;

SHOW TABLES;

SELECT 'zaykaa_db.users' AS table_name, COUNT(*) AS row_count FROM users;
SELECT * FROM users ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_db.chefs' AS table_name, COUNT(*) AS row_count FROM chefs;
SELECT * FROM chefs ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_db.orders' AS table_name, COUNT(*) AS row_count FROM orders;
SELECT * FROM orders ORDER BY id DESC LIMIT 20;


-- ---------------------------------------------------------
-- 7.2 User Service Database Checks
-- ---------------------------------------------------------

USE zaykaa_user_service;

SHOW TABLES;

SELECT 'zaykaa_user_service.users' AS table_name, COUNT(*) AS row_count FROM users;
SELECT * FROM users ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_user_service.user_preferences' AS table_name, COUNT(*) AS row_count FROM user_preferences;
SELECT * FROM user_preferences ORDER BY user_id DESC LIMIT 20;

SELECT 'zaykaa_user_service.user_preference_tags' AS table_name, COUNT(*) AS row_count FROM user_preference_tags;
SELECT * FROM user_preference_tags ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_user_service.meal_plans' AS table_name, COUNT(*) AS row_count FROM meal_plans;
SELECT * FROM meal_plans ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_user_service.meal_plan_items' AS table_name, COUNT(*) AS row_count FROM meal_plan_items;
SELECT * FROM meal_plan_items ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_user_service.nutrition_logs' AS table_name, COUNT(*) AS row_count FROM nutrition_logs;
SELECT * FROM nutrition_logs ORDER BY id DESC LIMIT 20;


-- ---------------------------------------------------------
-- 7.3 Chef Service Database Checks
-- ---------------------------------------------------------

USE zaykaa_chef_service;

SHOW TABLES;

SELECT 'zaykaa_chef_service.chef_profiles' AS table_name, COUNT(*) AS row_count FROM chef_profiles;
SELECT * FROM chef_profiles ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_chef_service.chef_specialties' AS table_name, COUNT(*) AS row_count FROM chef_specialties;
SELECT * FROM chef_specialties ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_chef_service.chef_availability_slots' AS table_name, COUNT(*) AS row_count FROM chef_availability_slots;
SELECT * FROM chef_availability_slots ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_chef_service.chef_rating_events' AS table_name, COUNT(*) AS row_count FROM chef_rating_events;
SELECT * FROM chef_rating_events ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_chef_service.chef_rating_summary' AS table_name, COUNT(*) AS row_count FROM chef_rating_summary;
SELECT * FROM chef_rating_summary ORDER BY chef_id DESC LIMIT 20;

SELECT 'zaykaa_chef_service.recipes' AS table_name, COUNT(*) AS row_count FROM recipes;
SELECT * FROM recipes ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_chef_service.recipe_ingredients' AS table_name, COUNT(*) AS row_count FROM recipe_ingredients;
SELECT * FROM recipe_ingredients ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_chef_service.recipe_steps' AS table_name, COUNT(*) AS row_count FROM recipe_steps;
SELECT * FROM recipe_steps ORDER BY id DESC LIMIT 20;


-- ---------------------------------------------------------
-- 7.4 Booking Service Database Checks
-- ---------------------------------------------------------

USE zaykaa_booking_service;

SHOW TABLES;

SELECT 'zaykaa_booking_service.bookings' AS table_name, COUNT(*) AS row_count FROM bookings;
SELECT * FROM bookings ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_booking_service.booking_status_history' AS table_name, COUNT(*) AS row_count FROM booking_status_history;
SELECT * FROM booking_status_history ORDER BY id DESC LIMIT 20;


-- ---------------------------------------------------------
-- 7.5 Order Service Database Checks
-- ---------------------------------------------------------

USE zaykaa_order_service;

SHOW TABLES;

SELECT 'zaykaa_order_service.restaurants' AS table_name, COUNT(*) AS row_count FROM restaurants;
SELECT * FROM restaurants ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_order_service.menu_items' AS table_name, COUNT(*) AS row_count FROM menu_items;
SELECT * FROM menu_items ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_order_service.coupons' AS table_name, COUNT(*) AS row_count FROM coupons;
SELECT * FROM coupons ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_order_service.carts' AS table_name, COUNT(*) AS row_count FROM carts;
SELECT * FROM carts ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_order_service.cart_items' AS table_name, COUNT(*) AS row_count FROM cart_items;
SELECT * FROM cart_items ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_order_service.orders' AS table_name, COUNT(*) AS row_count FROM orders;
SELECT * FROM orders ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_order_service.order_items' AS table_name, COUNT(*) AS row_count FROM order_items;
SELECT * FROM order_items ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_order_service.order_status_history' AS table_name, COUNT(*) AS row_count FROM order_status_history;
SELECT * FROM order_status_history ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_order_service.coupon_redemptions' AS table_name, COUNT(*) AS row_count FROM coupon_redemptions;
SELECT * FROM coupon_redemptions ORDER BY id DESC LIMIT 20;


-- ---------------------------------------------------------
-- 7.6 Payment Service Database Checks
-- ---------------------------------------------------------

USE zaykaa_payment_service;

SHOW TABLES;

SELECT 'zaykaa_payment_service.payments' AS table_name, COUNT(*) AS row_count FROM payments;
SELECT * FROM payments ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_payment_service.payment_events' AS table_name, COUNT(*) AS row_count FROM payment_events;
SELECT * FROM payment_events ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_payment_service.refunds' AS table_name, COUNT(*) AS row_count FROM refunds;
SELECT * FROM refunds ORDER BY id DESC LIMIT 20;

SELECT 'zaykaa_payment_service.payouts' AS table_name, COUNT(*) AS row_count FROM payouts;
SELECT * FROM payouts ORDER BY id DESC LIMIT 20;

-- =========================================================
-- End of Zaykaa Start MySQL Workbench Setup Script
-- =========================================================
