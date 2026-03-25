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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
