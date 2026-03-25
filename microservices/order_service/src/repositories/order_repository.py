class OrderRepository:
    RESTAURANT_COLUMNS = """
        id,
        name,
        slug,
        location,
        cuisine,
        rating,
        reviews_count,
        image_url,
        estimated_delivery_minutes,
        is_active,
        created_at,
        updated_at
    """

    MENU_ITEM_COLUMNS = """
        id,
        restaurant_id,
        name,
        category,
        description,
        price,
        image_url,
        sort_order,
        is_available,
        created_at,
        updated_at
    """

    ORDER_COLUMNS = """
        id,
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
        cancellation_reason,
        estimated_delivery_minutes,
        created_at,
        updated_at
    """

    def list_restaurants(self, connection, location=None, cuisine=None, search=None):
        query = f"""
            SELECT
                {self.RESTAURANT_COLUMNS}
            FROM restaurants
            WHERE is_active = 1
        """
        params = []
        if location:
            query += " AND LOWER(location) LIKE LOWER(%s)"
            params.append(f"%{location}%")
        if cuisine:
            query += " AND LOWER(cuisine) LIKE LOWER(%s)"
            params.append(f"%{cuisine}%")
        if search:
            query += " AND (LOWER(name) LIKE LOWER(%s) OR LOWER(cuisine) LIKE LOWER(%s))"
            params.extend([f"%{search}%", f"%{search}%"])
        query += " ORDER BY rating DESC, reviews_count DESC, id ASC"

        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def get_restaurant_by_id(self, connection, restaurant_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.RESTAURANT_COLUMNS}
            FROM restaurants
            WHERE id = %s
              AND is_active = 1
            LIMIT 1
            """,
            (restaurant_id,),
        )
        return cursor.fetchone()

    def list_menu_items_for_restaurants(self, connection, restaurant_ids):
        if not restaurant_ids:
            return []
        placeholders = ", ".join(["%s"] * len(restaurant_ids))
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.MENU_ITEM_COLUMNS}
            FROM menu_items
            WHERE restaurant_id IN ({placeholders})
              AND is_available = 1
            ORDER BY restaurant_id ASC, sort_order ASC, id ASC
            """,
            tuple(restaurant_ids),
        )
        return cursor.fetchall()

    def get_menu_items_by_ids(self, connection, menu_item_ids):
        if not menu_item_ids:
            return []
        placeholders = ", ".join(["%s"] * len(menu_item_ids))
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.MENU_ITEM_COLUMNS}
            FROM menu_items
            WHERE id IN ({placeholders})
            ORDER BY restaurant_id ASC, sort_order ASC, id ASC
            """,
            tuple(menu_item_ids),
        )
        return cursor.fetchall()

    def get_active_coupon_by_code(self, connection, code):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
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
                ends_at
            FROM coupons
            WHERE code = %s
              AND is_active = 1
              AND (starts_at IS NULL OR starts_at <= NOW())
              AND (ends_at IS NULL OR ends_at >= NOW())
            LIMIT 1
            """,
            (code,),
        )
        return cursor.fetchone()

    def count_coupon_redemptions(self, connection, coupon_id, user_id=None):
        query = """
            SELECT COUNT(*) AS total_redemptions
            FROM coupon_redemptions
            WHERE coupon_id = %s
        """
        params = [coupon_id]
        if user_id is not None:
            query += " AND user_id = %s"
            params.append(user_id)
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        result = cursor.fetchone() or {}
        return int(result.get("total_redemptions") or 0)

    def get_cart_by_user_id(self, connection, user_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                c.id,
                c.user_id,
                c.restaurant_id,
                c.coupon_id,
                c.coupon_code,
                c.created_at,
                c.updated_at,
                r.name AS restaurant_name,
                r.image_url AS restaurant_image_url
            FROM carts c
            INNER JOIN restaurants r ON r.id = c.restaurant_id
            WHERE c.user_id = %s
            LIMIT 1
            """,
            (user_id,),
        )
        return cursor.fetchone()

    def upsert_cart_header(self, connection, user_id, restaurant_id, coupon_id=None, coupon_code=None):
        existing = self.get_cart_by_user_id(connection, user_id)
        cursor = connection.cursor()
        if existing:
            cursor.execute(
                """
                UPDATE carts
                SET
                    restaurant_id = %s,
                    coupon_id = %s,
                    coupon_code = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (restaurant_id, coupon_id, coupon_code, existing["id"]),
            )
            return existing["id"]

        cursor.execute(
            """
            INSERT INTO carts (
                user_id,
                restaurant_id,
                coupon_id,
                coupon_code
            ) VALUES (%s, %s, %s, %s)
            """,
            (user_id, restaurant_id, coupon_id, coupon_code),
        )
        return cursor.lastrowid

    def delete_cart_items(self, connection, cart_id):
        cursor = connection.cursor()
        cursor.execute("DELETE FROM cart_items WHERE cart_id = %s", (cart_id,))

    def insert_cart_item(self, connection, cart_id, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO cart_items (
                cart_id,
                menu_item_id,
                item_name,
                unit_price,
                quantity,
                line_total
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                cart_id,
                payload["menu_item_id"],
                payload["item_name"],
                payload["unit_price"],
                payload["quantity"],
                payload["line_total"],
            ),
        )

    def get_cart_items(self, connection, cart_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                cart_id,
                menu_item_id,
                item_name,
                unit_price,
                quantity,
                line_total,
                created_at,
                updated_at
            FROM cart_items
            WHERE cart_id = %s
            ORDER BY id ASC
            """,
            (cart_id,),
        )
        return cursor.fetchall()

    def clear_cart_by_user_id(self, connection, user_id):
        cursor = connection.cursor()
        cursor.execute("DELETE FROM carts WHERE user_id = %s", (user_id,))
        return cursor.rowcount

    def create_order(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
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
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload["order_reference"],
                payload["user_id"],
                payload["restaurant_id"],
                payload["restaurant_name"],
                payload["delivery_address"],
                payload.get("coupon_id"),
                payload.get("coupon_code"),
                payload["subtotal_amount"],
                payload["tax_amount"],
                payload["delivery_fee"],
                payload["discount_amount"],
                payload["total_amount"],
                payload["currency"],
                payload["item_count"],
                payload["status"],
                payload["estimated_delivery_minutes"],
            ),
        )
        return cursor.lastrowid

    def insert_order_item(self, connection, order_id, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO order_items (
                order_id,
                menu_item_id,
                item_name,
                unit_price,
                quantity,
                total_price
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                order_id,
                payload["menu_item_id"],
                payload["item_name"],
                payload["unit_price"],
                payload["quantity"],
                payload["line_total"],
            ),
        )

    def get_order_by_id(self, connection, order_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.ORDER_COLUMNS}
            FROM orders
            WHERE id = %s
            LIMIT 1
            """,
            (order_id,),
        )
        return cursor.fetchone()

    def list_orders_for_user(self, connection, user_id, status=None, limit=None):
        query = f"""
            SELECT
                {self.ORDER_COLUMNS}
            FROM orders
            WHERE user_id = %s
        """
        params = [user_id]
        if status:
            query += " AND status = %s"
            params.append(status)
        query += " ORDER BY created_at DESC, id DESC"
        if limit:
            query += " LIMIT %s"
            params.append(limit)
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def get_order_items(self, connection, order_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                order_id,
                menu_item_id,
                item_name,
                unit_price,
                quantity,
                total_price,
                created_at
            FROM order_items
            WHERE order_id = %s
            ORDER BY id ASC
            """,
            (order_id,),
        )
        return cursor.fetchall()

    def insert_status_history(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO order_status_history (
                order_id,
                old_status,
                new_status,
                actor_user_id,
                actor_role,
                notes
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                payload["order_id"],
                payload.get("old_status"),
                payload["new_status"],
                payload["actor_user_id"],
                payload["actor_role"],
                payload.get("notes"),
            ),
        )

    def get_status_history(self, connection, order_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                order_id,
                old_status,
                new_status,
                actor_user_id,
                actor_role,
                notes,
                created_at
            FROM order_status_history
            WHERE order_id = %s
            ORDER BY created_at ASC, id ASC
            """,
            (order_id,),
        )
        return cursor.fetchall()

    def update_order_status(self, connection, order_id, new_status, cancellation_reason=None):
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE orders
            SET
                status = %s,
                cancellation_reason = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (new_status, cancellation_reason, order_id),
        )
        return cursor.rowcount

    def create_coupon_redemption(self, connection, coupon_id, order_id, user_id):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO coupon_redemptions (
                coupon_id,
                order_id,
                user_id
            ) VALUES (%s, %s, %s)
            """,
            (coupon_id, order_id, user_id),
        )
