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
    role ENUM('user', 'chef', 'agent', 'vlogger', 'admin') NOT NULL DEFAULT 'user',
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
