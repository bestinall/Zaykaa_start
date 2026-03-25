SELECT
    id,
    name,
    slug,
    location,
    cuisine,
    rating,
    reviews_count,
    image_url,
    estimated_delivery_minutes
FROM restaurants
WHERE is_active = 1
ORDER BY rating DESC, reviews_count DESC, id ASC;

SELECT
    id,
    restaurant_id,
    name,
    category,
    description,
    price,
    image_url,
    sort_order,
    is_available
FROM menu_items
WHERE restaurant_id IN (%s)
  AND is_available = 1
ORDER BY restaurant_id ASC, sort_order ASC, id ASC;

SELECT
    id,
    code,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    per_user_limit
FROM coupons
WHERE code = %s
  AND is_active = 1
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (ends_at IS NULL OR ends_at >= NOW())
LIMIT 1;

INSERT INTO carts (
    user_id,
    restaurant_id,
    coupon_id,
    coupon_code
) VALUES (%s, %s, %s, %s);

INSERT INTO cart_items (
    cart_id,
    menu_item_id,
    item_name,
    unit_price,
    quantity,
    line_total
) VALUES (%s, %s, %s, %s, %s, %s);

INSERT INTO orders (
    order_reference,
    user_id,
    restaurant_id,
    restaurant_name,
    delivery_address,
    coupon_id,
    coupon_code,
    subtotal_amount,
    tax_amount,
    delivery_fee,
    discount_amount,
    total_amount,
    currency,
    item_count,
    status,
    estimated_delivery_minutes
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);

INSERT INTO order_items (
    order_id,
    menu_item_id,
    item_name,
    unit_price,
    quantity,
    total_price
) VALUES (%s, %s, %s, %s, %s, %s);

INSERT INTO order_status_history (
    order_id,
    old_status,
    new_status,
    actor_user_id,
    actor_role,
    notes
) VALUES (%s, %s, %s, %s, %s, %s);

UPDATE orders
SET
    status = %s,
    cancellation_reason = %s,
    updated_at = CURRENT_TIMESTAMP
WHERE id = %s;
