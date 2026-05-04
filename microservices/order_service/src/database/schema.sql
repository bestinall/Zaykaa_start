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
    (3, 'Continental Express', 'continental-express', 'Mumbai', 'Continental', 4.60, 189, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 42, 1),
    (4, 'Mumbai Local Flavours', 'mumbai-local-flavours', 'Maharashtra', 'Regional Indian', 4.50, 178, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 35, 1),
    (5, 'Punjab Dhaba', 'punjab-dhaba', 'Punjab', 'North Indian', 4.80, 256, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 40, 1),
    (6, 'Royal Rajasthan Kitchen', 'royal-rajasthan-kitchen', 'Rajasthan', 'Rajasthani', 4.60, 198, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 45, 1),
    (7, 'Gujarati Thali House', 'gujarati-thali-house', 'Gujarat', 'Gujarati', 4.70, 212, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 35, 1),
    (8, 'Hyderabadi Bawarchi', 'hyderabadi-bawarchi', 'Telangana', 'Hyderabadi', 4.90, 342, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=80', 42, 1),
    (9, 'Karnataka Cuisine', 'karnataka-cuisine', 'Karnataka', 'South Indian', 4.60, 187, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 38, 1),
    (10, 'Kerala Kitchen', 'kerala-kitchen', 'Kerala', 'Kerala', 4.80, 276, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 40, 1),
    (11, 'Tamil Nadu Tiffins', 'tamil-nadu-tiffins', 'Tamil Nadu', 'Tamil', 4.70, 234, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 36, 1),
    (12, 'Bengal Sweet House', 'bengal-sweet-house', 'West Bengal', 'Bengali', 4.80, 289, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 38, 1),
    (13, 'Kashmir Valley Kitchen', 'kashmir-valley-kitchen', 'Jammu & Kashmir', 'Kashmiri', 4.70, 201, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 45, 1),
    (14, 'Goan Viva', 'goan-viva', 'Goa', 'Goan', 4.60, 195, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80', 35, 1),
    (15, 'Andhra Spice', 'andhra-spice', 'Andhra Pradesh', 'Andhra', 4.70, 223, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 38, 1),
    (16, 'Odisha Kitchen', 'odisha-kitchen', 'Odisha', 'Odiya', 4.50, 167, 'https://images.unsplash.com/photo-1604908176997-431d26a0f76b?auto=format&fit=crop&w=900&q=80', 40, 1),
    (17, 'Awadh Delight', 'awadh-delight', 'Uttar Pradesh', 'Awadhi', 4.80, 267, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80', 42, 1),
    (18, 'Bihar Rasoi', 'bihar-rasoi', 'Bihar', 'Bihari', 4.60, 189, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=80', 38, 1),
    (19, 'Assamese Flavours', 'assamese-flavours', 'Assam', 'Assamese', 4.70, 178, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 40, 1),
    (20, 'Arunachal Kitchen', 'arunachal-kitchen', 'Arunachal Pradesh', 'North-Eastern', 4.50, 145, 'https://images.unsplash.com/photo-1604908176997-431d26a0f76b?auto=format&fit=crop&w=900&q=80', 45, 1),
    (21, 'Chhattisgarh Foods', 'chhattisgarh-foods', 'Chhattisgarh', 'Regional', 4.60, 156, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 38, 1),
    (22, 'Haryana Healthy', 'haryana-healthy', 'Haryana', 'North Indian', 4.70, 198, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 35, 1),
    (23, 'Himachali Dham', 'himachali-dham', 'Himachal Pradesh', 'Himachali', 4.80, 212, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 42, 1),
    (24, 'Jharkhand Kitchen', 'jharkhand-kitchen', 'Jharkhand', 'Regional', 4.50, 134, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 40, 1),
    (25, 'Ladakh Kitchen', 'ladakh-kitchen', 'Ladakh', 'Himalayan', 4.60, 167, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 45, 1),
    (26, 'MP Spice Route', 'mp-spice-route', 'Madhya Pradesh', 'Central Indian', 4.70, 223, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 38, 1),
    (27, 'Manipur Kitchen', 'manipur-kitchen', 'Manipur', 'North-Eastern', 4.60, 145, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 42, 1),
    (28, 'Meghalaya Kitchen', 'meghalaya-kitchen', 'Meghalaya', 'North-Eastern', 4.70, 156, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 40, 1),
    (29, 'Mizoram Foods', 'mizoram-foods', 'Mizoram', 'North-Eastern', 4.50, 123, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 45, 1),
    (30, 'Naga Kitchen', 'naga-kitchen', 'Nagaland', 'Naga', 4.80, 189, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 42, 1),
    (31, 'Sikkim Kitchen', 'sikkim-kitchen', 'Sikkim', 'Himalayan', 4.70, 167, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 40, 1),
    (32, 'Tripura Kitchen', 'tripura-kitchen', 'Tripura', 'North-Eastern', 4.60, 134, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 38, 1),
    (33, 'Uttarakhand Dhaba', 'uttarakhand-dhaba', 'Uttarakhand', 'Himalayan', 4.80, 201, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 42, 1),
    (34, 'Chandigarh Kitchen', 'chandigarh-kitchen', 'Chandigarh', 'North Indian', 4.70, 234, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 35, 1),
    (35, 'Dadra Kitchen', 'dadra-kitchen', 'Dadra & Nagar Haveli', 'Regional', 4.50, 112, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 40, 1),
    (36, 'Daman Kitchen', 'daman-kitchen', 'Daman', 'Coastal', 4.60, 123, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 38, 1),
    (37, 'Diu Kitchen', 'diu-kitchen', 'Diu', 'Coastal', 4.70, 134, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 35, 1),
    (38, 'Pondicherry Kitchen', 'pondicherry-kitchen', 'Puducherry', 'French-Tamil', 4.80, 178, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 36, 1),
    (39, 'Pune Spice Hub', 'pune-spice-hub', 'Maharashtra', 'Maharashtrian', 4.60, 201, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 32, 1),
    (40, 'Amritsari Kitchen', 'amritsari-kitchen', 'Punjab', 'Punjabi', 4.90, 289, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 38, 1),
    (41, 'Jaipur Royal Kitchen', 'jaipur-royal-kitchen', 'Rajasthan', 'Rajasthani', 4.70, 234, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 40, 1),
    (42, 'Ahmedabad Thali', 'ahmedabad-thali', 'Gujarat', 'Gujarati', 4.80, 256, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 35, 1),
    (43, 'Hyderabad Nizam', 'hyderabad-nizam', 'Telangana', 'Hyderabadi', 4.85, 312, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 40, 1),
    (44, 'Bengaluru Kitchen', 'bengaluru-kitchen', 'Karnataka', 'Kannada', 4.70, 198, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 32, 1),
    (45, 'Cochin Kitchen', 'cochin-kitchen', 'Kerala', 'Malayalam', 4.80, 245, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 38, 1),
    (46, 'Chennai Spice', 'chennai-spice', 'Tamil Nadu', 'Tamil', 4.75, 267, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 35, 1),
    (47, 'Kolkata Kitchen', 'kolkata-kitchen', 'West Bengal', 'Bengali', 4.80, 278, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 36, 1),
    (48, 'Srinagar Kitchen', 'srinagar-kitchen', 'Jammu & Kashmir', 'Kashmiri', 4.70, 189, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 45, 1),
    (49, 'Panaji Kitchen', 'panaji-kitchen', 'Goa', 'Goan', 4.70, 212, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80', 32, 1),
    (50, 'Vijayawada Kitchen', 'vijayawada-kitchen', 'Andhra Pradesh', 'Andhra', 4.80, 234, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 38, 1),
    (51, 'Bhubaneswar Kitchen', 'bhubaneswar-kitchen', 'Odisha', 'Odiya', 4.60, 178, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 35, 1),
    (52, 'Lucknowi Kitchen', 'lucknowi-kitchen', 'Uttar Pradesh', 'Awadhi', 4.90, 301, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 40, 1),
    (53, 'Patna Kitchen', 'patna-kitchen', 'Bihar', 'Bihari', 4.70, 189, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 38, 1),
    (54, 'Guwahati Kitchen', 'guwahati-kitchen', 'Assam', 'Assamese', 4.75, 223, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 40, 1),
    (55, 'Itanagar Kitchen', 'itanagar-kitchen', 'Arunachal Pradesh', 'North-Eastern', 4.60, 134, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 42, 1),
    (56, 'Raipur Kitchen', 'raipur-kitchen', 'Chhattisgarh', 'Regional', 4.65, 145, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 38, 1),
    (57, 'Gurgaon Kitchen', 'gurgaon-kitchen', 'Haryana', 'North Indian', 4.70, 201, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 32, 1),
    (58, 'Shimla Kitchen', 'shimla-kitchen', 'Himachal Pradesh', 'Himachali', 4.80, 212, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 40, 1),
    (59, 'Ranchi Kitchen', 'ranchi-kitchen', 'Jharkhand', 'Regional', 4.55, 123, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 38, 1),
    (60, 'Leh Kitchen', 'leh-kitchen', 'Ladakh', 'Himalayan', 4.70, 178, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 45, 1),
    (61, 'Indore Kitchen', 'indore-kitchen', 'Madhya Pradesh', 'Central Indian', 4.75, 234, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 35, 1),
    (62, 'Imphal Kitchen', 'imphal-kitchen', 'Manipur', 'North-Eastern', 4.70, 156, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 40, 1),
    (63, 'Shillong Kitchen', 'shillong-kitchen', 'Meghalaya', 'North-Eastern', 4.75, 167, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 38, 1),
    (64, 'Aizawl Kitchen', 'aizawl-kitchen', 'Mizoram', 'North-Eastern', 4.65, 112, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 42, 1),
    (65, 'Kohima Kitchen', 'kohima-kitchen', 'Nagaland', 'Naga', 4.85, 201, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 40, 1),
    (66, 'Gangtok Kitchen', 'gangtok-kitchen', 'Sikkim', 'Himalayan', 4.75, 189, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 38, 1),
    (67, 'Agartala Kitchen', 'agartala-kitchen', 'Tripura', 'North-Eastern', 4.65, 134, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 38, 1),
    (68, 'Dehradun Kitchen', 'dehradun-kitchen', 'Uttarakhand', 'Himalayan', 4.80, 223, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 35, 1),
    (69, 'Silvassa Kitchen', 'silvassa-kitchen', 'Dadra & Nagar Haveli', 'Regional', 4.55, 98, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 40, 1),
    (70, 'Puducherry Kitchen', 'puducherry-kitchen-2', 'Puducherry', 'French-Tamil', 4.75, 189, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80', 34, 1)
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
    (304, 3, 'Chocolate Cake', 'Dessert', 'Rich dark chocolate slice.', 150.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Maharashtra dishes (restaurant 4)
    (401, 4, 'Vada Pav', 'Street Food', 'Soft pav with crisp potato filling, garlic chutney, and fried green chilli.', 45.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (402, 4, 'Misal Pav', 'Breakfast', 'Sprouted curry topped with farsan for a fiery, layered breakfast bowl.', 85.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 2, 1),
    (403, 4, 'Puran Poli', 'Dessert', 'Sweet lentil-stuffed flatbread served warm with ghee.', 55.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 3, 1),
    (404, 4, 'Pav Bhaji', 'Street Food', 'Buttered pav served with a silky, spice-forward mixed vegetable mash.', 120.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Punjab dishes (restaurant 5)
    (501, 5, 'Sarson Da Saag', 'Main Course', 'Slow-cooked mustard greens finished with butter.', 180.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 1, 1),
    (502, 5, 'Amritsari Kulcha', 'Bread', 'Stuffed tandoor bread with spiced filling and chole.', 95.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 2, 1),
    (503, 5, 'Tandoori Chicken', 'Main Course', 'Yoghurt-marinated chicken roasted over live heat.', 320.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 3, 1),
    (504, 5, 'Rajma Chawal', 'Main Course', 'Slow-cooked kidney beans and rice that define everyday Punjabi comfort.', 150.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Rajasthan dishes (restaurant 6)
    (601, 6, 'Dal Baati Churma', 'Main Course', 'Baked wheat dumplings with lentils and sweet crumbled churma.', 165.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (602, 6, 'Laal Maas', 'Main Course', 'A fiery red mutton curry with signature chilli heat.', 380.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 2, 1),
    (603, 6, 'Ghevar', 'Dessert', 'Honeycomb dessert soaked lightly and finished with rabri.', 95.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 3, 1),
    (604, 6, 'Ker Sangri', 'Side Dish', 'Desert beans and berries sauteed with spices for a deeply local side.', 120.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Gujarat dishes (restaurant 7)
    (701, 7, 'Dhokla', 'Snack', 'Steamed gram flour cake with mustard seed tempering.', 55.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (702, 7, 'Undhiyu', 'Main Course', 'Winter vegetable medley slow-cooked with masala and herbs.', 180.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 2, 1),
    (703, 7, 'Khandvi', 'Snack', 'Silky gram flour rolls tempered with sesame and curry leaves.', 65.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 3, 1),
    (704, 7, 'Thepla', 'Bread', 'Soft spiced flatbread that travels well and pairs with pickle or curd.', 45.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Telangana dishes (restaurant 8)
    (801, 8, 'Hyderabadi Dum Biryani', 'Main Course', 'Fragrant rice and masala sealed and cooked under dum.', 320.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (802, 8, 'Haleem', 'Main Course', 'Slow-cooked grain and meat porridge with rich spice depth.', 240.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (803, 8, 'Double Ka Meetha', 'Dessert', 'Bread pudding infused with saffron, nuts, and reduced milk.', 110.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 3, 1),
    (804, 8, 'Mirchi Ka Salan', 'Side Dish', 'Nutty, tangy chilli curry that often accompanies Hyderabadi rice dishes.', 140.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Karnataka dishes (restaurant 9)
    (901, 9, 'Bisi Bele Bath', 'Main Course', 'Rice-lentil comfort dish with vegetables and aromatic masala.', 145.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (902, 9, 'Mangalorean Ghee Roast', 'Main Course', 'Deep red roast masala lifted with generous ghee.', 280.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 2, 1),
    (903, 9, 'Mysore Pak', 'Dessert', 'Rich gram flour sweet with a delicate crumb.', 75.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 3, 1),
    (904, 9, 'Neer Dosa', 'Bread', 'Lacy rice crepes that pair beautifully with coastal curries.', 85.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Kerala dishes (restaurant 10)
    (1001, 10, 'Appam and Stew', 'Main Course', 'Lacy fermented appam served with fragrant coconut stew.', 165.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1002, 10, 'Prawn Moilee', 'Main Course', 'Seafood simmered in a bright coconut milk gravy.', 340.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1003, 10, 'Ada Pradhaman', 'Dessert', 'Jaggery-coconut dessert made with rice ada.', 95.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1004, 10, 'Puttu Kadala', 'Breakfast', 'Steamed rice cylinders served with black chickpea curry and coconut.', 125.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Tamil Nadu dishes (restaurant 11)
    (1101, 11, 'Kanchipuram Idli', 'Breakfast', 'Seasoned temple-style idli with pepper and ginger.', 75.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1102, 11, 'Chettinad Pepper Chicken', 'Main Course', 'Roasted spices and black pepper lead the finish.', 290.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1103, 11, 'Jigarthanda', 'Beverage', 'Madurai milk drink with almond gum and ice cream.', 85.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1104, 11, 'Kothu Parotta', 'Main Course', 'Shredded parotta tossed on the tawa with egg, salna, and aromatics.', 140.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- West Bengal dishes (restaurant 12)
    (1201, 12, 'Shorshe Ilish', 'Main Course', 'Hilsa in a bright mustard gravy.', 380.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1202, 12, 'Kosha Mangsho', 'Main Course', 'Slow-braised mutton with caramelised spice depth.', 320.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1203, 12, 'Nolen Gur Payesh', 'Dessert', 'Rice pudding perfumed with date palm jaggery.', 90.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1204, 12, 'Macher Jhol', 'Main Course', 'Light fish curry that anchors many home-style Bengali lunches.', 280.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Jammu & Kashmir dishes (restaurant 13)
    (1301, 13, 'Rogan Josh', 'Main Course', 'Aromatic red mutton curry with Kashmiri chilli depth.', 340.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1302, 13, 'Kashmiri Dum Aloo', 'Main Course', 'Baby potatoes simmered in yoghurt and fennel gravy.', 180.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1303, 13, 'Kahwa', 'Beverage', 'Saffron-green tea poured with nuts and warming spice.', 65.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1304, 13, 'Yakhni', 'Main Course', 'Elegant yoghurt-based curry perfumed with fennel and dried mint.', 290.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Goa dishes (restaurant 14)
    (1401, 14, 'Goan Fish Curry', 'Main Course', 'Tangy coconut curry with gentle chilli heat.', 320.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1402, 14, 'Prawn Balchao', 'Main Course', 'Sharp, spiced prawn pickle-style preparation.', 360.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1403, 14, 'Bebinca', 'Dessert', 'Layered coconut dessert baked slowly to caramel richness.', 110.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1404, 14, 'Chicken Cafreal', 'Main Course', 'Herb-green roast with vinegar brightness and a fiery Goan finish.', 310.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Andhra Pradesh dishes (restaurant 15)
    (1501, 15, 'Gongura Mamsam', 'Main Course', 'Meat curry sharpened with sorrel leaf tang.', 320.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1502, 15, 'Pesarattu', 'Breakfast', 'Green gram crepe often paired with ginger chutney.', 75.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1503, 15, 'Pootharekulu', 'Dessert', 'Paper-thin sweet layered with sugar and ghee.', 85.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1504, 15, 'Kodi Vepudu', 'Main Course', 'Spicy Andhra-style chicken fry with curry leaves and a dry masala finish.', 280.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Odisha dishes (restaurant 16)
    (1601, 16, 'Dalma', 'Main Course', 'Lentils and vegetables cooked together with light tempering.', 125.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1602, 16, 'Chhena Poda', 'Dessert', 'Caramel-baked cottage cheese dessert.', 75.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1603, 16, 'Machha Besara', 'Main Course', 'Fish curry lifted with mustard paste.', 280.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1604, 16, 'Pakhala Bhata', 'Main Course', 'Light fermented rice meal prized for comfort and cooling balance.', 95.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Uttar Pradesh dishes (restaurant 17)
    (1701, 17, 'Galouti Kebab', 'Appetizer', 'Melt-soft kebabs traditionally paired with ulte tawe ka paratha.', 320.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1702, 17, 'Tehri', 'Main Course', 'Comfort rice dish brightened with whole spices and vegetables.', 140.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1703, 17, 'Shahi Tukda', 'Dessert', 'Bread dessert finished with saffron rabri.', 110.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1704, 17, 'Kakori Kebab', 'Appetizer', 'Ultra-soft kebab seasoned delicately and traditionally served with roomali roti.', 340.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Bihar dishes (restaurant 18)
    (1801, 18, 'Litti Chokha', 'Main Course', 'Roasted sattu dumplings served with smoky vegetable mash.', 140.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1802, 18, 'Sattu Paratha', 'Bread', 'Stuffed flatbread with roasted gram filling and spice.', 85.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1803, 18, 'Khaja', 'Dessert', 'Layered crisp sweet associated with temple towns.', 70.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1804, 18, 'Champaran Mutton', 'Main Course', 'Slow-cooked handi-style mutton with mustard oil and whole spices.', 360.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Assam dishes (restaurant 19)
    (1901, 19, 'Masor Tenga', 'Main Course', 'Light sour fish curry with tomato or regional citrus.', 280.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 1, 1),
    (1902, 19, 'Duck Curry', 'Main Course', 'Rich duck preparation often paired with ash gourd.', 380.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 2, 1),
    (1903, 19, 'Pitha', 'Snack', 'Rice-based sweet or savoury festive snack.', 65.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 3, 1),
    (1904, 19, 'Khar', 'Side Dish', 'Traditional alkaline preparation that begins many Assamese meals.', 95.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Arunachal Pradesh dishes (restaurant 20)
    (2001, 20, 'Thukpa', 'Main Course', 'Noodle soup layered with vegetables, meat, and warming stock.', 145.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2002, 20, 'Bamboo Shoot Pork', 'Main Course', 'Slow-cooked pork sharpened with local bamboo shoot flavour.', 320.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2003, 20, 'Zan', 'Main Course', 'Traditional millet-based staple served with rich curries or stews.', 110.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2004, 20, 'Momos', 'Snack', 'Steamed dumplings served hot with chilli paste in mountain homes and markets.', 120.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Chhattisgarh dishes (restaurant 21)
    (2101, 21, 'Farra', 'Snack', 'Steamed rice dumplings often tossed with tempering and herbs.', 75.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2102, 21, 'Chila', 'Snack', 'Savory crepe made with rice batter or lentils.', 55.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2103, 21, 'Bafauri', 'Snack', 'Steamed chana dal snack finished with coriander and chilli.', 45.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2104, 21, 'Dehrori', 'Dessert', 'Lentil-rice dessert fritters soaked into a festive sweet finish.', 85.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Haryana dishes (restaurant 22)
    (2201, 22, 'Bajra Khichri', 'Main Course', 'Millet-led comfort bowl often enriched with ghee.', 125.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2202, 22, 'Kadhi Pakora', 'Main Course', 'Tangy yoghurt curry with gram flour fritters.', 110.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2203, 22, 'Mithe Chawal', 'Dessert', 'Sweet saffron-tinted rice cooked for festive occasions.', 95.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2204, 22, 'Bajra Roti', 'Bread', 'Millet flatbread served with white butter and robust village-style sides.', 35.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Himachal Pradesh dishes (restaurant 23)
    (2301, 23, 'Dham', 'Thali', 'Traditional celebratory thali built around lentils, rice, and yoghurt gravies.', 220.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2302, 23, 'Siddu', 'Bread', 'Steamed stuffed bread served hot with ghee.', 85.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2303, 23, 'Chha Gosht', 'Main Course', 'Yoghurt-based mutton curry with warming spice depth.', 320.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2304, 23, 'Madra', 'Main Course', 'Yoghurt-based chickpea curry with the slow depth of festive dham cooking.', 165.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Jharkhand dishes (restaurant 24)
    (2401, 24, 'Dhuska', 'Bread', 'Crisp fried rice-lentil bread often served with curry.', 55.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2402, 24, 'Rugra', 'Main Course', 'Seasonal mushroom preparation prized for its earthy character.', 180.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2403, 24, 'Thekua', 'Dessert', 'Jaggery-sweetened biscuit-like festive treat.', 45.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2404, 24, 'Chilka Roti', 'Bread', 'Rice and lentil roti with a rustic texture and mild savoury depth.', 45.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Ladakh dishes (restaurant 25)
    (2501, 25, 'Skyu', 'Main Course', 'Hand-rolled pasta stew simmered with vegetables or meat.', 165.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2502, 25, 'Butter Tea', 'Beverage', 'Salty, warming tea whisked with butter for cold climates.', 55.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2503, 25, 'Thenthuk', 'Main Course', 'Pulled noodle soup with a hearty mountain broth.', 145.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2504, 25, 'Mokthuk', 'Main Course', 'Dumpling soup that blends momo comfort with a warming broth.', 155.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Madhya Pradesh dishes (restaurant 26)
    (2601, 26, 'Poha Jalebi', 'Breakfast', 'The state iconic sweet-savory breakfast pairing.', 75.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2602, 26, 'Bhutte Ka Kees', 'Snack', 'Grated corn sauteed gently with milk and spices.', 85.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2603, 26, 'Dal Bafla', 'Main Course', 'Central Indian answer to baati, served with lentils and ghee.', 140.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2604, 26, 'Mawa Bati', 'Dessert', 'Rich milk-solid dessert with syrupy festive indulgence.', 95.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Manipur dishes (restaurant 27)
    (2701, 27, 'Eromba', 'Main Course', 'Mashed vegetable and chilli preparation often sharpened with fermented fish.', 145.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2702, 27, 'Chamthong', 'Main Course', 'Light vegetable stew built around fresh local produce.', 125.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2703, 27, 'Singju', 'Salad', 'Crisp herb-led salad with spice and texture.', 95.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2704, 27, 'Chak-Hao Kheer', 'Dessert', 'Black rice pudding with a nutty, aromatic Manipuri identity.', 85.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Meghalaya dishes (restaurant 28)
    (2801, 28, 'Jadoh', 'Main Course', 'Rice dish traditionally cooked with meat and spice.', 180.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2802, 28, 'Dohneiiong', 'Main Course', 'Pork curry enriched with black sesame.', 320.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2803, 28, 'Tungrymbai', 'Side Dish', 'Fermented soybean preparation with layered savouriness.', 85.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2804, 28, 'Dohkhlieh', 'Salad', 'Pork salad with onion, chilli, and bright regional seasoning.', 240.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Mizoram dishes (restaurant 29)
    (2901, 29, 'Bai', 'Main Course', 'Mixed vegetable stew often featuring greens and bamboo shoot.', 125.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (2902, 29, 'Sawhchiar', 'Main Course', 'Rice-and-meat comfort porridge with a soft savoury profile.', 145.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 2, 1),
    (2903, 29, 'Vawksa Rep', 'Main Course', 'Smoked pork preparation with local seasoning.', 280.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 3, 1),
    (2904, 29, 'Koat Pitha', 'Snack', 'Banana-rice fritter snack with a crisp outside and soft centre.', 65.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Nagaland dishes (restaurant 30)
    (3001, 30, 'Smoked Pork with Bamboo Shoot', 'Main Course', 'A signature Naga combination with deep umami and aroma.', 320.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3002, 30, 'Galho', 'Main Course', 'Hearty rice porridge-style dish with vegetables and protein.', 125.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3003, 30, 'Axone Pork', 'Main Course', 'Pork cooked with fermented soybean for a powerful savoury finish.', 310.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 3, 1),
    (3004, 30, 'Anishi Curry', 'Main Course', 'Smoky yam leaf preparation that carries a strong Naga signature.', 165.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Sikkim dishes (restaurant 31)
    (3101, 31, 'Phagshapa', 'Main Course', 'Pork stew balanced with radish and dried chilli.', 320.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3102, 31, 'Gundruk Soup', 'Soup', 'Fermented leafy green soup with refreshing tang.', 95.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3103, 31, 'Momos', 'Snack', 'Steamed dumplings served with bright local chutney.', 110.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 3, 1),
    (3104, 31, 'Thenthuk', 'Main Course', 'Hand-pulled noodle soup built for mountain weather and long evenings.', 145.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Tripura dishes (restaurant 32)
    (3201, 32, 'Mui Borok', 'Thali', 'Traditional Tripuri meal with local fish, herbs, and vegetable dishes.', 240.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3202, 32, 'Chakhwi', 'Main Course', 'Bamboo shoot and vegetable curry with regional character.', 145.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3203, 32, 'Berma Chutney', 'Chutney', 'Fermented fish condiment used for sharp savoury depth.', 55.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    (3204, 32, 'Mosdeng Serma', 'Chutney', 'Fresh tomato-chilli relish that sharpens many Tripuri meals.', 45.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Uttarakhand dishes (restaurant 33)
    (3301, 33, 'Kafuli', 'Main Course', 'Slow-cooked leafy green curry with a silky texture.', 140.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3302, 33, 'Aloo Ke Gutke', 'Main Course', 'Spiced hill potatoes finished with local tempering.', 110.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3303, 33, 'Bal Mithai', 'Dessert', 'Chocolate-brown fudge sweet coated in tiny sugar pearls.', 75.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 3, 1),
    (3304, 33, 'Chainsoo', 'Main Course', 'Roasted black gram curry with a deep, earthy Garhwali flavour.', 155.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Chandigarh dishes (restaurant 34)
    (3401, 34, 'Tandoori Platter', 'Appetizer', 'A city-style mixed grill with strong tandoor character.', 380.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3402, 34, 'Butter Chicken', 'Main Course', 'A restaurant favourite that fits Chandigarh premium dining scene.', 340.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3403, 34, 'Paneer Tikka', 'Appetizer', 'Charred, spiced cottage cheese served with mint chutney.', 240.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 3, 1),
    (3404, 34, 'Dal Makhani', 'Main Course', 'Creamy black lentils that fit the city rich north-Indian dining style.', 220.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Dadra & Nagar Haveli dishes (restaurant 35)
    (3501, 35, 'Ubadiyu-style Vegetables', 'Main Course', 'Slow-cooked mixed vegetables in an earthy spiced style.', 145.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3502, 35, 'Millet Rotla', 'Bread', 'Rustic millet flatbread paired with local sabzis.', 35.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3503, 35, 'River Fish Curry', 'Main Course', 'Light regional curry built around nearby freshwater catch.', 260.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 3, 1),
    (3504, 35, 'Wild Mushroom Curry', 'Main Course', 'Earthy mushroom gravy inspired by local forest produce.', 180.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Daman dishes (restaurant 36)
    (3601, 36, 'Prawn Curry Rice', 'Main Course', 'A bright coastal combination built for everyday comfort.', 280.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3602, 36, 'Grilled Pomfret', 'Main Course', 'Simple seafood centrepiece with citrus and spice.', 340.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3603, 36, 'Coconut Jaggery Sweets', 'Dessert', 'Soft sweets that echo west-coast pantry traditions.', 65.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    (3604, 36, 'Crab Masala', 'Main Course', 'Coastal shellfish cooked in a warmly spiced west-coast gravy.', 320.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Diu dishes (restaurant 37)
    (3701, 37, 'Fish Curry', 'Main Course', 'Light island-style curry with tang and coastal warmth.', 260.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3702, 37, 'Prawn Fry', 'Main Course', 'Quick-cooked seafood with spice crust and crisp edges.', 300.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3703, 37, 'Coconut Desserts', 'Dessert', 'Sweet finishes that lean on coconut and gentle caramel notes.', 70.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 3, 1),
    (3704, 37, 'Chicken Vindaloo', 'Main Course', 'Tangy, chilli-led curry with a strong coastal-Portuguese imprint.', 310.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Puducherry dishes (restaurant 38)
    (3801, 38, 'Pondicherry Fish Curry', 'Main Course', 'Coastal curry with tamarind brightness and Tamil depth.', 290.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3802, 38, 'Creole Chicken', 'Main Course', 'A regional Franco-Tamil favourite with rich savoury sauce.', 280.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3803, 38, 'Stuffed Crepes', 'Main Course', 'Cafe-friendly plates that reflect the enclave French influence.', 180.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 3, 1),
    (3804, 38, 'Prawn Varuval', 'Main Course', 'Tamil-style prawn fry with a crisp spice coating and seaside character.', 320.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 4, 1),
    -- Second Maharashtra restaurant (restaurant 39)
    (3901, 39, 'Pav Bhaji', 'Street Food', 'Buttered pav served with spicy mixed vegetable mash.', 125.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 1, 1),
    (3902, 39, 'Sol Kadhi', 'Beverage', 'Cooling kokum-coconut drink that rounds out rich coastal meals.', 55.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 2, 1),
    (3903, 39, 'Misal Pav', 'Breakfast', 'Spicy sprouted curry with crispy bread.', 90.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Punjab restaurant (restaurant 40)
    (4001, 40, 'Butter Chicken', 'Main Course', 'Creamy tomato curry with tender chicken.', 340.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4002, 40, 'Dal Makhani', 'Main Course', 'Black lentils slow-cooked with cream and butter.', 220.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4003, 40, 'Pinni', 'Dessert', 'Ghee-rich winter sweet made with flour, jaggery, and nuts.', 85.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Rajasthan restaurant (restaurant 41)
    (4101, 41, 'Mirchi Bada', 'Snack', 'Large chillies stuffed and fried into a crisp, spicy street snack.', 45.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4102, 41, 'Ghevar', 'Dessert', 'Honeycomb dessert soaked lightly and finished with rabri.', 95.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4103, 41, 'Pyaz Kachori', 'Snack', 'Fried pastry filled with spiced onion filling.', 55.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Gujarat restaurant (restaurant 42)
    (4201, 42, 'Fafda Jalebi', 'Breakfast', 'Crunchy gram flour snack balanced with syrupy jalebi.', 95.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4202, 42, 'Khandvi', 'Snack', 'Silky gram flour rolls tempered with sesame and curry leaves.', 65.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4203, 42, 'Mohanthal', 'Dessert', 'Gram flour fudge sweet with ghee and nuts.', 75.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Telangana restaurant (restaurant 43)
    (4301, 43, 'Qubani Ka Meetha', 'Dessert', 'Apricot dessert finished with cream or ice cream in Hyderabadi style.', 110.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4302, 43, 'Hyderabadi Dum Biryani', 'Main Course', 'Fragrant rice layered with spicy meat.', 310.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4303, 43, 'Sheer Korma', 'Dessert', 'Vermicelli pudding with dates and nuts.', 95.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Karnataka restaurant (restaurant 44)
    (4401, 44, 'Ragi Mudde', 'Main Course', 'Finger millet dumplings served with assertive saaru or mutton curry.', 85.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4402, 44, 'Mysore Pak', 'Dessert', 'Rich gram flour sweet with ghee.', 70.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4403, 44, 'Bisi Bele Bath', 'Main Course', 'Rice-lentil comfort dish with vegetables and masala.', 140.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Kerala restaurant (restaurant 45)
    (4501, 45, 'Malabar Parotta', 'Bread', 'Layered flaky flatbread built for rich gravies and roast meats.', 45.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4502, 45, 'Appam and Stew', 'Main Course', 'Fermented rice pancakes with coconut milk vegetable stew.', 155.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4503, 45, 'Puttu Kadala', 'Breakfast', 'Steamed rice cylinders with black chickpea curry.', 120.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Tamil Nadu restaurant (restaurant 46)
    (4601, 46, 'Sambar Sadam', 'Main Course', 'Temple-style rice and lentils with vegetables in sambar.', 125.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4602, 46, 'Chettinad Pepper Chicken', 'Main Course', 'Spicy chicken with roasted pepper and curry leaves.', 280.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4603, 46, 'Pongal', 'Breakfast', 'Rice and lentil dish tempered with pepper and cumin.', 85.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second West Bengal restaurant (restaurant 47)
    (4701, 47, 'Luchi Aloor Dom', 'Main Course', 'Puffed flour breads with gently spiced potato curry.', 110.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4702, 47, 'Shorshe Ilish', 'Main Course', 'Hilsa fish in mustard gravy.', 360.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4703, 47, 'Rasgulla', 'Dessert', 'Spongy cottage cheese balls in sugar syrup.', 65.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Jammu & Kashmir restaurant (restaurant 48)
    (4801, 48, 'Gushtaba', 'Main Course', 'Soft mutton dumplings in yoghurt gravy.', 340.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4802, 48, 'Rogan Josh', 'Main Course', 'Aromatic lamb curry with Kashmiri spices.', 320.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4803, 48, 'Kahwa', 'Beverage', 'Green tea with saffron and almonds.', 60.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Goa restaurant (restaurant 49)
    (4901, 49, 'Goan Xacuti', 'Main Course', 'Coconut and spice-roasted curry with deep body.', 290.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 1, 1),
    (4902, 49, 'Goan Fish Curry', 'Main Course', 'Tangy coconut curry with gentle spices.', 280.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 2, 1),
    (4903, 49, 'Bebinca', 'Dessert', 'Layered coconut dessert.', 110.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Andhra Pradesh restaurant (restaurant 50)
    (5001, 50, 'Pulihora', 'Main Course', 'Tamarind rice with peanuts and tempering.', 110.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5002, 50, 'Gongura Pachadi', 'Chutney', 'Tangy sorrel leaf chutney.', 55.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5003, 50, 'Pesarattu Garelu', 'Breakfast', 'Green gram crepe with lentil fritters.', 90.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Odisha restaurant (restaurant 51)
    (5101, 51, 'Rasabali', 'Dessert', 'Fried chhena patties in thickened sweet milk.', 70.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5102, 51, 'Chhena Poda', 'Dessert', 'Caramelised cottage cheese dessert.', 65.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5103, 51, 'Dalma', 'Main Course', 'Lentils and vegetables with light tempering.', 115.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Uttar Pradesh restaurant (restaurant 52)
    (5201, 52, 'Bedmi Puri', 'Breakfast', 'Spiced lentil puri with aloo sabzi.', 95.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5202, 52, 'Galouti Kebab', 'Appetizer', 'Melt-in-mouth kebabs with ulte tawe ka paratha.', 340.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5203, 52, 'Shahi Tukda', 'Dessert', 'Fried bread in saffron rabri.', 100.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Bihar restaurant (restaurant 53)
    (5301, 53, 'Malpua', 'Dessert', 'Fried pancakes soaked in sugar syrup.', 65.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5302, 53, 'Litti Chokha', 'Main Course', 'Roasted wheat balls with smoky vegetable mash.', 125.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5303, 53, 'Sattu Paratha', 'Bread', 'Stuffed flatbread with roasted gram filling.', 80.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Assam restaurant (restaurant 54)
    (5401, 54, 'Aloo Pitika', 'Side Dish', 'Mashed potato with mustard oil and herbs.', 55.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5402, 54, 'Masor Tenga', 'Main Course', 'Sour fish curry with tomatoes.', 260.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5403, 54, 'Pitha', 'Snack', 'Rice cakes with sweet or savoury fillings.', 60.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Arunachal Pradesh restaurant (restaurant 55)
    (5501, 55, 'Thukpa', 'Main Course', 'Noodle soup with vegetables and meat.', 135.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5502, 55, 'Bamboo Shoot Fry', 'Side Dish', 'Stir-fried bamboo shoots with local spices.', 95.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5503, 55, 'Zan', 'Main Course', 'Millet porridge with vegetables.', 100.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Chhattisgarh restaurant (restaurant 56)
    (5601, 56, 'Muthia', 'Snack', 'Steamed rice flour bites.', 45.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5602, 56, 'Farra', 'Snack', 'Steamed rice dumplings with tempering.', 65.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5603, 56, 'Chila', 'Snack', 'Rice batter crepe with spices.', 50.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Haryana restaurant (restaurant 57)
    (5701, 57, 'Bajra Roti', 'Bread', 'Pearl millet flatbread with white butter.', 35.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5702, 57, 'Kadhi Pakora', 'Main Course', 'Yoghurt curry with gram flour fritters.', 105.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5703, 57, 'Hara Dhania Cholia', 'Main Course', 'Fresh green chickpeas with coriander.', 115.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Himachal Pradesh restaurant (restaurant 58)
    (5801, 58, 'Babru', 'Bread', 'Stuffed Himachali bread with tamarind chutney.', 75.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5802, 58, 'Madra', 'Main Course', 'Yoghurt-based chickpea curry.', 155.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5803, 58, 'Siddu', 'Bread', 'Steamed stuffed bread with ghee.', 80.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Jharkhand restaurant (restaurant 59)
    (5901, 59, 'Pua', 'Dessert', 'Sweet fried batter cakes.', 55.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (5902, 59, 'Dhuska', 'Bread', 'Fried rice-lentil bread.', 45.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (5903, 59, 'Chilka Roti', 'Bread', 'Rice lentil roti.', 40.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Ladakh restaurant (restaurant 60)
    (6001, 60, 'Khambir', 'Bread', 'Thick local bread with butter tea.', 45.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6002, 60, 'Skyu', 'Main Course', 'Hand-rolled pasta stew.', 150.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6003, 60, 'Thenthuk', 'Main Course', 'Pulled noodle soup.', 140.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Madhya Pradesh restaurant (restaurant 61)
    (6101, 61, 'Sabudana Khichdi', 'Snack', 'Sago pearls with peanuts and potato.', 110.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6102, 61, 'Bhutte Ka Kees', 'Snack', 'Grated corn with milk and spices.', 85.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6103, 61, 'Dal Bafla', 'Main Course', 'Wheat dumplings with lentils.', 135.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Manipur restaurant (restaurant 62)
    (6201, 62, 'Kangshoi', 'Main Course', 'Simple vegetable stew.', 115.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6202, 62, 'Eromba', 'Main Course', 'Mashed vegetable with fermented fish.', 125.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6203, 62, 'Singju', 'Salad', 'Herb salad with spices.', 85.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Meghalaya restaurant (restaurant 63)
    (6301, 63, 'Jadoh', 'Main Course', 'Rice with meat and spices.', 170.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6302, 63, 'Dohneiiong', 'Main Course', 'Pork with black sesame.', 300.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6303, 63, 'Pumaloi', 'Main Course', 'Steamed rice dish.', 95.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Mizoram restaurant (restaurant 64)
    (6401, 64, 'Bai', 'Main Course', 'Mixed vegetable stew with greens.', 115.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6402, 64, 'Sawhchiar', 'Main Course', 'Rice meat porridge.', 135.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6403, 64, 'Chhum Han', 'Main Course', 'Light vegetable medley.', 105.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Nagaland restaurant (restaurant 65)
    (6501, 65, 'Anishi Curry', 'Main Course', 'Smoky yam leaf curry.', 155.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6502, 65, 'Galho', 'Main Course', 'Rice porridge with vegetables.', 115.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6503, 65, 'Smoked Pork', 'Main Course', 'Smoked pork with bamboo shoot.', 310.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Sikkim restaurant (restaurant 66)
    (6601, 66, 'Momos', 'Snack', 'Steamed dumplings with chutney.', 105.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6602, 66, 'Phagshapa', 'Main Course', 'Pork stew with radish.', 310.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6603, 66, 'Gundruk Soup', 'Soup', 'Fermented leafy green soup.', 85.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Tripura restaurant (restaurant 67)
    (6701, 67, 'Mosdeng Serma', 'Chutney', 'Tomato chilli relish.', 40.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6702, 67, 'Mui Borok', 'Thali', 'Traditional Tripuri meal.', 220.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6703, 67, 'Chakhwi', 'Main Course', 'Bamboo shoot vegetable curry.', 135.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Second Uttarakhand restaurant (restaurant 68)
    (6801, 68, 'Jhangora Kheer', 'Dessert', 'Millet pudding.', 70.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6802, 68, 'Kafuli', 'Main Course', 'Leafy green curry.', 130.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6803, 68, 'Aloo Ke Gutke', 'Main Course', 'Spiced hill potatoes.', 100.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Dadra & Nagar Haveli second restaurant (restaurant 69)
    (6901, 69, 'Millet Rotla', 'Bread', 'Millet flatbread with sabzi.', 35.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80', 1, 1),
    (6902, 69, 'Ubadiyu Vegetables', 'Main Course', 'Slow-cooked mixed vegetables.', 135.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80', 2, 1),
    (6903, 69, 'River Fish Curry', 'Main Course', 'Freshwater fish curry.', 250.00, 'https://images.unsplash.com/photo-1604328763860-4d0c8c7c32de?auto=format&fit=crop&w=900&q=80', 3, 1),
    -- Puducherry second restaurant (restaurant 70)
    (7001, 70, 'Pondicherry Fish Curry', 'Main Course', 'Coastal curry with tamarind.', 280.00, 'https://images.unsplash.com/photo-1626132647523-66d6be816e00?auto=format&fit=crop&w=900&q=80', 1, 1),
    (7002, 70, 'Creole Vegetable Stew', 'Main Course', 'French-Tamil comfort bowl.', 145.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, 1),
    (7003, 70, 'Prawn Varuval', 'Main Course', 'Spicy prawn fry.', 310.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 3, 1)
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
