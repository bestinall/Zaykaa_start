class MealPlanRepository:
    def create_meal_plan(self, connection, user_id, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO meal_plans (
                user_id,
                title,
                goal,
                start_date,
                end_date,
                status,
                notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                payload["title"],
                payload.get("goal"),
                payload["start_date"],
                payload["end_date"],
                payload["status"],
                payload.get("notes"),
            ),
        )
        return cursor.lastrowid

    def create_meal_plan_items(self, connection, meal_plan_id, items):
        if not items:
            return
        cursor = connection.cursor()
        cursor.executemany(
            """
            INSERT INTO meal_plan_items (
                meal_plan_id,
                meal_date,
                meal_type,
                item_name,
                description,
                calories,
                protein_g,
                carbs_g,
                fats_g,
                scheduled_time,
                sort_order
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                (
                    meal_plan_id,
                    item["meal_date"],
                    item["meal_type"],
                    item["item_name"],
                    item.get("description"),
                    item.get("calories", 0),
                    item.get("protein_g", 0),
                    item.get("carbs_g", 0),
                    item.get("fats_g", 0),
                    item.get("scheduled_time"),
                    item.get("sort_order", 1),
                )
                for item in items
            ],
        )

    def list_meal_plans(self, connection, user_id, status=None):
        cursor = connection.cursor(dictionary=True)
        query = """
            SELECT
                id,
                user_id,
                title,
                goal,
                start_date,
                end_date,
                status,
                notes,
                created_at,
                updated_at
            FROM meal_plans
            WHERE user_id = %s
        """
        params = [user_id]
        if status:
            query += " AND status = %s"
            params.append(status)
        query += " ORDER BY start_date DESC, id DESC"
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def get_meal_plan(self, connection, user_id, meal_plan_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                user_id,
                title,
                goal,
                start_date,
                end_date,
                status,
                notes,
                created_at,
                updated_at
            FROM meal_plans
            WHERE id = %s AND user_id = %s
            LIMIT 1
            """,
            (meal_plan_id, user_id),
        )
        return cursor.fetchone()

    def list_meal_plan_items(self, connection, meal_plan_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                meal_plan_id,
                meal_date,
                meal_type,
                item_name,
                description,
                calories,
                protein_g,
                carbs_g,
                fats_g,
                scheduled_time,
                sort_order
            FROM meal_plan_items
            WHERE meal_plan_id = %s
            ORDER BY meal_date ASC, meal_type ASC, sort_order ASC
            """,
            (meal_plan_id,),
        )
        return cursor.fetchall()

    def update_meal_plan(self, connection, user_id, meal_plan_id, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE meal_plans
            SET
                title = %s,
                goal = %s,
                start_date = %s,
                end_date = %s,
                status = %s,
                notes = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
            """,
            (
                payload["title"],
                payload.get("goal"),
                payload["start_date"],
                payload["end_date"],
                payload["status"],
                payload.get("notes"),
                meal_plan_id,
                user_id,
            ),
        )
        return cursor.rowcount

    def delete_meal_plan_items(self, connection, meal_plan_id):
        cursor = connection.cursor()
        cursor.execute(
            """
            DELETE FROM meal_plan_items
            WHERE meal_plan_id = %s
            """,
            (meal_plan_id,),
        )

    def delete_meal_plan(self, connection, user_id, meal_plan_id):
        cursor = connection.cursor()
        cursor.execute(
            """
            DELETE FROM meal_plans
            WHERE id = %s AND user_id = %s
            """,
            (meal_plan_id, user_id),
        )
        return cursor.rowcount
