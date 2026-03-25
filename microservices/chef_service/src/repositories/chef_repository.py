class ChefRepository:
    PROFILE_COLUMNS = """
        cp.id,
        cp.user_id,
        cp.display_name,
        cp.headline,
        cp.bio,
        cp.hourly_rate,
        cp.experience_years,
        cp.service_city,
        cp.service_state,
        cp.service_country,
        cp.location_label,
        cp.available_days_label,
        cp.profile_image_url,
        cp.cover_image_url,
        cp.is_active,
        cp.verification_status,
        cp.created_at,
        cp.updated_at,
        COALESCE(crs.average_rating, 0) AS average_rating,
        COALESCE(crs.total_reviews, 0) AS total_reviews,
        COALESCE(crs.five_star_count, 0) AS five_star_count,
        COALESCE(crs.four_star_count, 0) AS four_star_count,
        COALESCE(crs.three_star_count, 0) AS three_star_count,
        COALESCE(crs.two_star_count, 0) AS two_star_count,
        COALESCE(crs.one_star_count, 0) AS one_star_count
    """

    def create_profile(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO chef_profiles (
                user_id,
                display_name,
                headline,
                bio,
                hourly_rate,
                experience_years,
                service_city,
                service_state,
                service_country,
                location_label,
                available_days_label,
                profile_image_url,
                cover_image_url,
                is_active,
                verification_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload["user_id"],
                payload["display_name"],
                payload.get("headline"),
                payload.get("bio"),
                payload["hourly_rate"],
                payload.get("experience_years", 0),
                payload.get("service_city"),
                payload.get("service_state"),
                payload.get("service_country", "India"),
                payload.get("location_label"),
                payload.get("available_days_label"),
                payload.get("profile_image_url"),
                payload.get("cover_image_url"),
                1 if payload.get("is_active", True) else 0,
                payload.get("verification_status", "pending"),
            ),
        )
        return cursor.lastrowid

    def _build_public_profile_where_clause(self, filters):
        clauses = ["cp.is_active = 1"]
        params = []

        if filters.get("verified_only"):
            clauses.append("cp.verification_status = 'verified'")
        if filters.get("city"):
            clauses.append("cp.service_city LIKE %s")
            params.append(f"%{filters['city']}%")
        if filters.get("location"):
            clauses.append(
                "(cp.location_label LIKE %s OR cp.service_city LIKE %s OR cp.service_state LIKE %s)"
            )
            params.extend([f"%{filters['location']}%"] * 3)
        if filters.get("cuisine"):
            clauses.append(
                """
                EXISTS (
                    SELECT 1
                    FROM chef_specialties cs
                    WHERE cs.chef_id = cp.id
                      AND cs.specialty_name LIKE %s
                )
                """
            )
            params.append(f"%{filters['cuisine']}%")
        if filters.get("q"):
            clauses.append("(cp.display_name LIKE %s OR cp.headline LIKE %s OR cp.bio LIKE %s)")
            params.extend([f"%{filters['q']}%"] * 3)
        if filters.get("min_rating") is not None:
            clauses.append("COALESCE(crs.average_rating, 0) >= %s")
            params.append(filters["min_rating"])
        if filters.get("max_hourly_rate") is not None:
            clauses.append("cp.hourly_rate <= %s")
            params.append(filters["max_hourly_rate"])
        return " AND ".join(clauses), params

    def list_public_profiles(self, connection, filters):
        where_clause, params = self._build_public_profile_where_clause(filters)
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.PROFILE_COLUMNS}
            FROM chef_profiles cp
            LEFT JOIN chef_rating_summary crs ON crs.chef_id = cp.id
            WHERE {where_clause}
            ORDER BY COALESCE(crs.average_rating, 0) DESC, cp.updated_at DESC, cp.id DESC
            LIMIT %s OFFSET %s
            """,
            tuple(params + [filters["limit"], filters["offset"]]),
        )
        return cursor.fetchall()

    def get_profile_by_id(self, connection, chef_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.PROFILE_COLUMNS}
            FROM chef_profiles cp
            LEFT JOIN chef_rating_summary crs ON crs.chef_id = cp.id
            WHERE cp.id = %s
            LIMIT 1
            """,
            (chef_id,),
        )
        return cursor.fetchone()

    def get_profile_by_user_id(self, connection, user_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.PROFILE_COLUMNS}
            FROM chef_profiles cp
            LEFT JOIN chef_rating_summary crs ON crs.chef_id = cp.id
            WHERE cp.user_id = %s
            LIMIT 1
            """,
            (user_id,),
        )
        return cursor.fetchone()

    def update_profile(self, connection, chef_id, payload):
        mapping = {
            "display_name": "display_name",
            "headline": "headline",
            "bio": "bio",
            "hourly_rate": "hourly_rate",
            "experience_years": "experience_years",
            "service_city": "service_city",
            "service_state": "service_state",
            "service_country": "service_country",
            "location_label": "location_label",
            "available_days_label": "available_days_label",
            "profile_image_url": "profile_image_url",
            "cover_image_url": "cover_image_url",
            "is_active": "is_active",
            "verification_status": "verification_status",
        }
        assignments = []
        values = []
        for key, column in mapping.items():
            if key in payload:
                assignments.append(f"{column} = %s")
                value = payload[key]
                if key == "is_active":
                    value = 1 if value else 0
                values.append(value)

        if not assignments:
            return 0

        values.append(chef_id)
        cursor = connection.cursor()
        cursor.execute(
            f"""
            UPDATE chef_profiles
            SET {", ".join(assignments)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            tuple(values),
        )
        return cursor.rowcount

    def replace_specialties(self, connection, chef_id, specialties):
        cursor = connection.cursor()
        cursor.execute("DELETE FROM chef_specialties WHERE chef_id = %s", (chef_id,))
        if specialties:
            cursor.executemany(
                """
                INSERT INTO chef_specialties (chef_id, specialty_name, sort_order)
                VALUES (%s, %s, %s)
                """,
                [(chef_id, specialty, index + 1) for index, specialty in enumerate(specialties)],
            )

    def get_specialties(self, connection, chef_ids):
        if not chef_ids:
            return {}
        placeholders = ", ".join(["%s"] * len(chef_ids))
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                chef_id,
                specialty_name,
                sort_order
            FROM chef_specialties
            WHERE chef_id IN ({placeholders})
            ORDER BY chef_id ASC, sort_order ASC, specialty_name ASC
            """,
            tuple(chef_ids),
        )
        rows = cursor.fetchall()
        specialties = {chef_id: [] for chef_id in chef_ids}
        for row in rows:
            specialties.setdefault(row["chef_id"], []).append(row["specialty_name"])
        return specialties

    def delete_availability_for_dates(self, connection, chef_id, dates):
        if not dates:
            return
        placeholders = ", ".join(["%s"] * len(dates))
        cursor = connection.cursor()
        cursor.execute(
            f"""
            DELETE FROM chef_availability_slots
            WHERE chef_id = %s
              AND available_date IN ({placeholders})
            """,
            tuple([chef_id] + list(dates)),
        )

    def insert_availability_slots(self, connection, chef_id, slots):
        if not slots:
            return
        cursor = connection.cursor()
        cursor.executemany(
            """
            INSERT INTO chef_availability_slots (
                chef_id,
                available_date,
                slot_name,
                start_time,
                end_time,
                capacity,
                reserved_count,
                status,
                notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                (
                    chef_id,
                    slot["available_date"],
                    slot["slot_name"],
                    slot["start_time"],
                    slot["end_time"],
                    slot["capacity"],
                    slot["reserved_count"],
                    slot["status"],
                    slot.get("notes"),
                )
                for slot in slots
            ],
        )

    def get_availability(self, connection, chef_id, filters):
        query = """
            SELECT
                id,
                chef_id,
                available_date,
                slot_name,
                start_time,
                end_time,
                capacity,
                reserved_count,
                status,
                notes,
                created_at,
                updated_at
            FROM chef_availability_slots
            WHERE chef_id = %s
              AND available_date BETWEEN %s AND %s
        """
        params = [chef_id, filters["start_date"], filters["end_date"]]
        if filters.get("status"):
            query += " AND status = %s"
            params.append(filters["status"])
        query += " ORDER BY available_date ASC, start_time ASC, id ASC"
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def insert_rating_event(self, connection, chef_id, reviewer_user_id, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO chef_rating_events (
                chef_id,
                reviewer_user_id,
                rating_value,
                comment,
                source
            ) VALUES (%s, %s, %s, %s, %s)
            """,
            (
                chef_id,
                reviewer_user_id,
                payload["rating_value"],
                payload.get("comment"),
                payload["source"],
            ),
        )
        return cursor.lastrowid

    def aggregate_rating_summary(self, connection, chef_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                COALESCE(ROUND(AVG(rating_value), 2), 0) AS average_rating,
                COUNT(*) AS total_reviews,
                SUM(CASE WHEN rating_value = 5 THEN 1 ELSE 0 END) AS five_star_count,
                SUM(CASE WHEN rating_value = 4 THEN 1 ELSE 0 END) AS four_star_count,
                SUM(CASE WHEN rating_value = 3 THEN 1 ELSE 0 END) AS three_star_count,
                SUM(CASE WHEN rating_value = 2 THEN 1 ELSE 0 END) AS two_star_count,
                SUM(CASE WHEN rating_value = 1 THEN 1 ELSE 0 END) AS one_star_count
            FROM chef_rating_events
            WHERE chef_id = %s
            """,
            (chef_id,),
        )
        return cursor.fetchone()

    def upsert_rating_summary(self, connection, chef_id, summary):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO chef_rating_summary (
                chef_id,
                average_rating,
                total_reviews,
                five_star_count,
                four_star_count,
                three_star_count,
                two_star_count,
                one_star_count
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                average_rating = VALUES(average_rating),
                total_reviews = VALUES(total_reviews),
                five_star_count = VALUES(five_star_count),
                four_star_count = VALUES(four_star_count),
                three_star_count = VALUES(three_star_count),
                two_star_count = VALUES(two_star_count),
                one_star_count = VALUES(one_star_count),
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                chef_id,
                summary["average_rating"],
                summary["total_reviews"],
                summary["five_star_count"] or 0,
                summary["four_star_count"] or 0,
                summary["three_star_count"] or 0,
                summary["two_star_count"] or 0,
                summary["one_star_count"] or 0,
            ),
        )

    def get_rating_summary(self, connection, chef_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                chef_id,
                average_rating,
                total_reviews,
                five_star_count,
                four_star_count,
                three_star_count,
                two_star_count,
                one_star_count,
                updated_at
            FROM chef_rating_summary
            WHERE chef_id = %s
            LIMIT 1
            """,
            (chef_id,),
        )
        return cursor.fetchone()

    def get_availability_metrics(self, connection, chef_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_slots,
                SUM(CASE WHEN status = 'open' AND available_date >= CURDATE() THEN 1 ELSE 0 END) AS upcoming_open_slots,
                SUM(CASE WHEN status = 'reserved' AND available_date >= CURDATE() THEN 1 ELSE 0 END) AS upcoming_reserved_slots
            FROM chef_availability_slots
            WHERE chef_id = %s
            """,
            (chef_id,),
        )
        return cursor.fetchone()
