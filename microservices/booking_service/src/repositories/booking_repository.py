class BookingRepository:
    BOOKING_COLUMNS = """
        id,
        booking_reference,
        user_id,
        user_name,
        user_email,
        user_phone,
        chef_id,
        chef_user_id,
        chef_name,
        booking_date,
        time_slot,
        slot_start_time,
        slot_end_time,
        guest_count,
        session_hours,
        menu_preferences,
        dietary_restrictions,
        special_requests,
        amount,
        currency,
        status,
        cancellation_reason,
        cancelled_by_user_id,
        cancelled_by_role,
        created_at,
        updated_at
    """

    def create_booking(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO bookings (
                booking_reference,
                user_id,
                user_name,
                user_email,
                user_phone,
                chef_id,
                chef_user_id,
                chef_name,
                booking_date,
                time_slot,
                slot_start_time,
                slot_end_time,
                guest_count,
                session_hours,
                menu_preferences,
                dietary_restrictions,
                special_requests,
                amount,
                currency,
                status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload["booking_reference"],
                payload["user_id"],
                payload["user_name"],
                payload["user_email"],
                payload.get("user_phone"),
                payload["chef_id"],
                payload["chef_user_id"],
                payload["chef_name"],
                payload["booking_date"],
                payload["time_slot"],
                payload.get("slot_start_time"),
                payload.get("slot_end_time"),
                payload["guest_count"],
                payload["session_hours"],
                payload.get("menu_preferences"),
                payload.get("dietary_restrictions"),
                payload.get("special_requests"),
                payload["amount"],
                payload.get("currency", "INR"),
                payload["status"],
            ),
        )
        return cursor.lastrowid

    def get_booking_by_id(self, connection, booking_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.BOOKING_COLUMNS}
            FROM bookings
            WHERE id = %s
            LIMIT 1
            """,
            (booking_id,),
        )
        return cursor.fetchone()

    def list_bookings_for_user(self, connection, user_id, status=None):
        query = f"""
            SELECT
                {self.BOOKING_COLUMNS}
            FROM bookings
            WHERE user_id = %s
        """
        params = [user_id]
        if status:
            query += " AND status = %s"
            params.append(status)
        query += " ORDER BY booking_date DESC, created_at DESC, id DESC"
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def list_bookings_for_chef(self, connection, chef_user_id, status=None):
        query = f"""
            SELECT
                {self.BOOKING_COLUMNS}
            FROM bookings
            WHERE chef_user_id = %s
        """
        params = [chef_user_id]
        if status:
            query += " AND status = %s"
            params.append(status)
        query += " ORDER BY booking_date DESC, created_at DESC, id DESC"
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def update_booking_status(
        self,
        connection,
        booking_id,
        new_status,
        cancellation_reason=None,
        cancelled_by_user_id=None,
        cancelled_by_role=None,
    ):
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE bookings
            SET
                status = %s,
                cancellation_reason = %s,
                cancelled_by_user_id = %s,
                cancelled_by_role = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (
                new_status,
                cancellation_reason,
                cancelled_by_user_id,
                cancelled_by_role,
                booking_id,
            ),
        )
        return cursor.rowcount

    def insert_status_history(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO booking_status_history (
                booking_id,
                old_status,
                new_status,
                actor_user_id,
                actor_role,
                notes
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                payload["booking_id"],
                payload.get("old_status"),
                payload["new_status"],
                payload["actor_user_id"],
                payload["actor_role"],
                payload.get("notes"),
            ),
        )

    def get_status_history(self, connection, booking_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                booking_id,
                old_status,
                new_status,
                actor_user_id,
                actor_role,
                notes,
                created_at
            FROM booking_status_history
            WHERE booking_id = %s
            ORDER BY created_at ASC, id ASC
            """,
            (booking_id,),
        )
        return cursor.fetchall()

    def count_active_bookings_for_slot(self, connection, chef_id, booking_date, time_slot):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT COUNT(*) AS total_active_bookings
            FROM bookings
            WHERE chef_id = %s
              AND booking_date = %s
              AND time_slot = %s
              AND status IN ('pending', 'confirmed')
            """,
            (chef_id, booking_date, time_slot),
        )
        result = cursor.fetchone() or {}
        return int(result.get("total_active_bookings") or 0)

    def user_has_active_booking_for_slot(self, connection, user_id, chef_id, booking_date, time_slot):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id
            FROM bookings
            WHERE user_id = %s
              AND chef_id = %s
              AND booking_date = %s
              AND time_slot = %s
              AND status IN ('pending', 'confirmed')
            LIMIT 1
            """,
            (user_id, chef_id, booking_date, time_slot),
        )
        return cursor.fetchone() is not None

    def get_slot_booking_counts(self, connection, chef_id, start_date, end_date):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                booking_date,
                time_slot,
                COUNT(*) AS total_active_bookings
            FROM bookings
            WHERE chef_id = %s
              AND booking_date BETWEEN %s AND %s
              AND status IN ('pending', 'confirmed')
            GROUP BY booking_date, time_slot
            """,
            (chef_id, start_date, end_date),
        )
        return cursor.fetchall()

    def get_chef_metrics(self, connection, chef_user_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_bookings,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
                SUM(CASE WHEN booking_date >= CURDATE() AND status IN ('pending', 'confirmed') THEN 1 ELSE 0 END) AS upcoming_bookings,
                COALESCE(SUM(CASE WHEN status IN ('confirmed', 'completed') THEN amount ELSE 0 END), 0) AS total_earnings
            FROM bookings
            WHERE chef_user_id = %s
            """,
            (chef_user_id,),
        )
        return cursor.fetchone()
