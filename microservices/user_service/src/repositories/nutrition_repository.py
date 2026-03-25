class NutritionRepository:
    def create_log(self, connection, user_id, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO nutrition_logs (
                user_id,
                logged_on,
                meal_type,
                food_name,
                serving_size,
                calories,
                protein_g,
                carbs_g,
                fats_g,
                fiber_g,
                water_ml,
                notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                payload["logged_on"],
                payload["meal_type"],
                payload["food_name"],
                payload.get("serving_size"),
                payload.get("calories", 0),
                payload.get("protein_g", 0),
                payload.get("carbs_g", 0),
                payload.get("fats_g", 0),
                payload.get("fiber_g", 0),
                payload.get("water_ml", 0),
                payload.get("notes"),
            ),
        )
        return cursor.lastrowid

    def list_logs(self, connection, user_id, start_date, end_date):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                user_id,
                logged_on,
                meal_type,
                food_name,
                serving_size,
                calories,
                protein_g,
                carbs_g,
                fats_g,
                fiber_g,
                water_ml,
                notes,
                created_at,
                updated_at
            FROM nutrition_logs
            WHERE user_id = %s
              AND logged_on BETWEEN %s AND %s
            ORDER BY logged_on DESC, created_at DESC
            """,
            (user_id, start_date, end_date),
        )
        return cursor.fetchall()

    def get_log(self, connection, user_id, log_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                user_id,
                logged_on,
                meal_type,
                food_name,
                serving_size,
                calories,
                protein_g,
                carbs_g,
                fats_g,
                fiber_g,
                water_ml,
                notes,
                created_at,
                updated_at
            FROM nutrition_logs
            WHERE id = %s AND user_id = %s
            LIMIT 1
            """,
            (log_id, user_id),
        )
        return cursor.fetchone()

    def update_log(self, connection, user_id, log_id, payload):
        mapping = {
            "logged_on": "logged_on",
            "meal_type": "meal_type",
            "food_name": "food_name",
            "serving_size": "serving_size",
            "calories": "calories",
            "protein_g": "protein_g",
            "carbs_g": "carbs_g",
            "fats_g": "fats_g",
            "fiber_g": "fiber_g",
            "water_ml": "water_ml",
            "notes": "notes",
        }
        assignments = []
        values = []
        for key, column in mapping.items():
            if key in payload:
                assignments.append(f"{column} = %s")
                values.append(payload[key])
        values.extend([log_id, user_id])
        cursor = connection.cursor()
        cursor.execute(
            f"""
            UPDATE nutrition_logs
            SET {", ".join(assignments)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
            """,
            tuple(values),
        )
        return cursor.rowcount

    def delete_log(self, connection, user_id, log_id):
        cursor = connection.cursor()
        cursor.execute(
            """
            DELETE FROM nutrition_logs
            WHERE id = %s AND user_id = %s
            """,
            (log_id, user_id),
        )
        return cursor.rowcount

    def get_summary_totals(self, connection, user_id, start_date, end_date):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                COALESCE(SUM(calories), 0) AS total_calories,
                COALESCE(SUM(protein_g), 0) AS total_protein_g,
                COALESCE(SUM(carbs_g), 0) AS total_carbs_g,
                COALESCE(SUM(fats_g), 0) AS total_fats_g,
                COALESCE(SUM(fiber_g), 0) AS total_fiber_g,
                COALESCE(SUM(water_ml), 0) AS total_water_ml,
                COUNT(*) AS total_entries
            FROM nutrition_logs
            WHERE user_id = %s
              AND logged_on BETWEEN %s AND %s
            """,
            (user_id, start_date, end_date),
        )
        return cursor.fetchone()

    def get_daily_breakdown(self, connection, user_id, start_date, end_date):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                logged_on,
                COALESCE(SUM(calories), 0) AS total_calories,
                COALESCE(SUM(protein_g), 0) AS total_protein_g,
                COALESCE(SUM(carbs_g), 0) AS total_carbs_g,
                COALESCE(SUM(fats_g), 0) AS total_fats_g,
                COALESCE(SUM(fiber_g), 0) AS total_fiber_g,
                COALESCE(SUM(water_ml), 0) AS total_water_ml
            FROM nutrition_logs
            WHERE user_id = %s
              AND logged_on BETWEEN %s AND %s
            GROUP BY logged_on
            ORDER BY logged_on ASC
            """,
            (user_id, start_date, end_date),
        )
        return cursor.fetchall()
