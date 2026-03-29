class PaymentRepository:
    PAYMENT_COLUMNS = """
        id,
        payment_reference,
        order_id,
        order_reference,
        user_id,
        provider,
        payment_method,
        provider_payment_id,
        client_secret,
        amount,
        currency,
        status,
        failure_reason,
        refunded_amount,
        metadata_json,
        verified_at,
        created_at,
        updated_at
    """

    REFUND_COLUMNS = """
        id,
        refund_reference,
        payment_id,
        order_id,
        user_id,
        provider,
        provider_refund_id,
        amount,
        currency,
        reason,
        status,
        metadata_json,
        created_at,
        updated_at
    """

    PAYOUT_COLUMNS = """
        id,
        payout_reference,
        recipient_user_id,
        source_payment_id,
        source_order_id,
        provider,
        provider_payout_id,
        amount,
        currency,
        fee_amount,
        net_amount,
        status,
        notes,
        metadata_json,
        processed_at,
        created_at,
        updated_at
    """

    def create_payment(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO payments (
                payment_reference,
                order_id,
                order_reference,
                user_id,
                provider,
                payment_method,
                provider_payment_id,
                client_secret,
                amount,
                currency,
                status,
                metadata_json
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload["payment_reference"],
                payload["order_id"],
                payload["order_reference"],
                payload["user_id"],
                payload["provider"],
                payload["payment_method"],
                payload.get("provider_payment_id"),
                payload.get("client_secret"),
                payload["amount"],
                payload["currency"],
                payload["status"],
                payload.get("metadata_json"),
            ),
        )
        return cursor.lastrowid

    def get_payment_by_id(self, connection, payment_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.PAYMENT_COLUMNS}
            FROM payments
            WHERE id = %s
            LIMIT 1
            """,
            (payment_id,),
        )
        return cursor.fetchone()

    def get_latest_payment_for_order(self, connection, order_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.PAYMENT_COLUMNS}
            FROM payments
            WHERE order_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (order_id,),
        )
        return cursor.fetchone()

    def list_payments_for_user(self, connection, user_id, status=None):
        query = f"""
            SELECT
                {self.PAYMENT_COLUMNS}
            FROM payments
            WHERE user_id = %s
        """
        params = [user_id]
        if status:
            query += " AND status = %s"
            params.append(status)
        query += " ORDER BY created_at DESC, id DESC"
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def list_all_payments(self, connection, status=None):
        query = f"""
            SELECT
                {self.PAYMENT_COLUMNS}
            FROM payments
            WHERE 1 = 1
        """
        params = []
        if status:
            query += " AND status = %s"
            params.append(status)
        query += " ORDER BY created_at DESC, id DESC"
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def list_payments_for_order(self, connection, order_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.PAYMENT_COLUMNS}
            FROM payments
            WHERE order_id = %s
            ORDER BY created_at DESC, id DESC
            """,
            (order_id,),
        )
        return cursor.fetchall()

    def update_payment_verification(self, connection, payment_id, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE payments
            SET
                provider_payment_id = %s,
                status = %s,
                failure_reason = %s,
                metadata_json = %s,
                verified_at = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (
                payload.get("provider_payment_id"),
                payload["status"],
                payload.get("failure_reason"),
                payload.get("metadata_json"),
                payload.get("verified_at"),
                payment_id,
            ),
        )
        return cursor.rowcount

    def update_payment_refund_state(self, connection, payment_id, status, refunded_amount, metadata_json):
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE payments
            SET
                status = %s,
                refunded_amount = %s,
                metadata_json = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (status, refunded_amount, metadata_json, payment_id),
        )
        return cursor.rowcount

    def insert_payment_event(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO payment_events (
                payment_id,
                event_type,
                actor_user_id,
                actor_role,
                event_payload
            ) VALUES (%s, %s, %s, %s, %s)
            """,
            (
                payload["payment_id"],
                payload["event_type"],
                payload["actor_user_id"],
                payload["actor_role"],
                payload.get("event_payload"),
            ),
        )
        return cursor.lastrowid

    def list_payment_events(self, connection, payment_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                payment_id,
                event_type,
                actor_user_id,
                actor_role,
                event_payload,
                created_at
            FROM payment_events
            WHERE payment_id = %s
            ORDER BY created_at ASC, id ASC
            """,
            (payment_id,),
        )
        return cursor.fetchall()

    def create_refund(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO refunds (
                refund_reference,
                payment_id,
                order_id,
                user_id,
                provider,
                provider_refund_id,
                amount,
                currency,
                reason,
                status,
                metadata_json
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload["refund_reference"],
                payload["payment_id"],
                payload["order_id"],
                payload["user_id"],
                payload["provider"],
                payload.get("provider_refund_id"),
                payload["amount"],
                payload["currency"],
                payload.get("reason"),
                payload["status"],
                payload.get("metadata_json"),
            ),
        )
        return cursor.lastrowid

    def list_refunds_for_payment(self, connection, payment_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.REFUND_COLUMNS}
            FROM refunds
            WHERE payment_id = %s
            ORDER BY created_at DESC, id DESC
            """,
            (payment_id,),
        )
        return cursor.fetchall()

    def create_payout(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO payouts (
                payout_reference,
                recipient_user_id,
                source_payment_id,
                source_order_id,
                provider,
                provider_payout_id,
                amount,
                currency,
                fee_amount,
                net_amount,
                status,
                notes,
                metadata_json,
                processed_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload["payout_reference"],
                payload["recipient_user_id"],
                payload.get("source_payment_id"),
                payload.get("source_order_id"),
                payload["provider"],
                payload.get("provider_payout_id"),
                payload["amount"],
                payload["currency"],
                payload["fee_amount"],
                payload["net_amount"],
                payload["status"],
                payload.get("notes"),
                payload.get("metadata_json"),
                payload.get("processed_at"),
            ),
        )
        return cursor.lastrowid

    def list_payouts(self, connection, status=None):
        query = f"""
            SELECT
                {self.PAYOUT_COLUMNS}
            FROM payouts
            WHERE 1 = 1
        """
        params = []
        if status:
            query += " AND status = %s"
            params.append(status)
        query += " ORDER BY created_at DESC, id DESC"
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def get_payout_by_id(self, connection, payout_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.PAYOUT_COLUMNS}
            FROM payouts
            WHERE id = %s
            LIMIT 1
            """,
            (payout_id,),
        )
        return cursor.fetchone()
