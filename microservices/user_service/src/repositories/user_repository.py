class UserRepository:
    def create_user(self, connection, payload):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO users (
                full_name,
                email,
                password_hash,
                phone,
                role,
                date_of_birth,
                gender,
                height_cm,
                weight_kg,
                activity_level
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload["full_name"],
                payload["email"],
                payload["password_hash"],
                payload.get("phone"),
                payload.get("role", "user"),
                payload.get("date_of_birth"),
                payload.get("gender", "prefer_not_to_say"),
                payload.get("height_cm"),
                payload.get("weight_kg"),
                payload.get("activity_level", "moderate"),
            ),
        )
        return cursor.lastrowid

    def get_user_by_email(self, connection, email):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                full_name,
                email,
                password_hash,
                phone,
                role,
                date_of_birth,
                gender,
                height_cm,
                weight_kg,
                activity_level,
                created_at,
                updated_at,
                last_login_at
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,),
        )
        return cursor.fetchone()

    def get_user_by_id(self, connection, user_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                id,
                full_name,
                email,
                phone,
                role,
                date_of_birth,
                gender,
                height_cm,
                weight_kg,
                activity_level,
                created_at,
                updated_at,
                last_login_at
            FROM users
            WHERE id = %s
            LIMIT 1
            """,
            (user_id,),
        )
        return cursor.fetchone()

    def update_last_login(self, connection, user_id):
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE users
            SET last_login_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (user_id,),
        )

    def update_profile(self, connection, user_id, payload):
        mapping = {
            "full_name": "full_name",
            "phone": "phone",
            "date_of_birth": "date_of_birth",
            "gender": "gender",
            "height_cm": "height_cm",
            "weight_kg": "weight_kg",
            "activity_level": "activity_level",
        }
        assignments = []
        values = []
        for key, column in mapping.items():
            if key in payload:
                assignments.append(f"{column} = %s")
                values.append(payload[key])
        values.append(user_id)

        cursor = connection.cursor()
        cursor.execute(
            f"""
            UPDATE users
            SET {", ".join(assignments)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            tuple(values),
        )
        return cursor.rowcount

    def upsert_preferences(self, connection, user_id, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO user_preferences (
                user_id,
                calorie_target,
                protein_target_g,
                carbs_target_g,
                fats_target_g,
                spice_level,
                budget_preference,
                meal_complexity
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                calorie_target = VALUES(calorie_target),
                protein_target_g = VALUES(protein_target_g),
                carbs_target_g = VALUES(carbs_target_g),
                fats_target_g = VALUES(fats_target_g),
                spice_level = VALUES(spice_level),
                budget_preference = VALUES(budget_preference),
                meal_complexity = VALUES(meal_complexity),
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                user_id,
                payload.get("calorie_target"),
                payload.get("protein_target_g"),
                payload.get("carbs_target_g"),
                payload.get("fats_target_g"),
                payload.get("spice_level", "medium"),
                payload.get("budget_preference", "standard"),
                payload.get("meal_complexity", "balanced"),
            ),
        )

    def get_preferences(self, connection, user_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                user_id,
                calorie_target,
                protein_target_g,
                carbs_target_g,
                fats_target_g,
                spice_level,
                budget_preference,
                meal_complexity,
                created_at,
                updated_at
            FROM user_preferences
            WHERE user_id = %s
            """,
            (user_id,),
        )
        return cursor.fetchone()

    def replace_preference_tags(self, connection, user_id, tag_rows):
        cursor = connection.cursor()
        cursor.execute(
            """
            DELETE FROM user_preference_tags
            WHERE user_id = %s
            """,
            (user_id,),
        )
        if tag_rows:
            cursor.executemany(
                """
                INSERT INTO user_preference_tags (user_id, tag_type, tag_value)
                VALUES (%s, %s, %s)
                """,
                tag_rows,
            )

    def get_preference_tags(self, connection, user_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                tag_type,
                tag_value
            FROM user_preference_tags
            WHERE user_id = %s
            ORDER BY tag_type, tag_value
            """,
            (user_id,),
        )
        return cursor.fetchall()
