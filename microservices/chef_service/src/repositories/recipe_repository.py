class RecipeRepository:
    RECIPE_COLUMNS = """
        r.id,
        r.chef_id,
        r.contributor_user_id,
        r.contributor_role,
        r.contributor_name,
        r.contributor_image_url,
        r.name,
        r.slug,
        r.category,
        r.description,
        r.cuisine,
        r.difficulty_level,
        r.preparation_time_minutes,
        r.preparation_time_label,
        r.cook_time_minutes,
        r.servings,
        r.calories,
        r.price,
        r.origin_state,
        r.origin_region,
        r.is_authentic_regional,
        r.image_url,
        r.is_public,
        r.views_count,
        r.created_at,
        r.updated_at,
        cp.display_name AS chef_name,
        cp.profile_image_url AS chef_image_url
    """

    def create_recipe(self, connection, payload):
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO recipes (
                chef_id,
                contributor_user_id,
                contributor_role,
                contributor_name,
                contributor_image_url,
                name,
                slug,
                category,
                description,
                cuisine,
                difficulty_level,
                preparation_time_minutes,
                preparation_time_label,
                cook_time_minutes,
                servings,
                calories,
                price,
                origin_state,
                origin_region,
                is_authentic_regional,
                image_url,
                is_public
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload.get("chef_id"),
                payload["contributor_user_id"],
                payload["contributor_role"],
                payload["contributor_name"],
                payload.get("contributor_image_url"),
                payload["name"],
                payload["slug"],
                payload["category"],
                payload.get("description"),
                payload.get("cuisine"),
                payload.get("difficulty_level", "medium"),
                payload.get("preparation_time_minutes", 0),
                payload.get("preparation_time_label"),
                payload.get("cook_time_minutes", 0),
                payload.get("servings", 1),
                payload.get("calories"),
                payload.get("price"),
                payload.get("origin_state"),
                payload.get("origin_region"),
                1 if payload.get("is_authentic_regional", True) else 0,
                payload.get("image_url"),
                1 if payload.get("is_public", True) else 0,
            ),
        )
        return cursor.lastrowid

    def update_recipe(self, connection, recipe_id, contributor_user_id, payload):
        mapping = {
            "chef_id": "chef_id",
            "contributor_role": "contributor_role",
            "contributor_name": "contributor_name",
            "contributor_image_url": "contributor_image_url",
            "name": "name",
            "slug": "slug",
            "category": "category",
            "description": "description",
            "cuisine": "cuisine",
            "difficulty_level": "difficulty_level",
            "preparation_time_minutes": "preparation_time_minutes",
            "preparation_time_label": "preparation_time_label",
            "cook_time_minutes": "cook_time_minutes",
            "servings": "servings",
            "calories": "calories",
            "price": "price",
            "origin_state": "origin_state",
            "origin_region": "origin_region",
            "is_authentic_regional": "is_authentic_regional",
            "image_url": "image_url",
            "is_public": "is_public",
        }
        assignments = []
        values = []
        for key, column in mapping.items():
            if key in payload:
                assignments.append(f"{column} = %s")
                value = payload[key]
                if key in {"is_public", "is_authentic_regional"}:
                    value = 1 if value else 0
                values.append(value)
        if not assignments:
            return 0
        values.extend([recipe_id, contributor_user_id])
        cursor = connection.cursor()
        cursor.execute(
            f"""
            UPDATE recipes
            SET {", ".join(assignments)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND contributor_user_id = %s
            """,
            tuple(values),
        )
        return cursor.rowcount

    def delete_recipe(self, connection, recipe_id, contributor_user_id):
        cursor = connection.cursor()
        cursor.execute(
            """
            DELETE FROM recipes
            WHERE id = %s AND contributor_user_id = %s
            """,
            (recipe_id, contributor_user_id),
        )
        return cursor.rowcount

    def get_recipe_by_id(
        self,
        connection,
        recipe_id,
        contributor_user_id=None,
        chef_id=None,
        public_only=False,
    ):
        query = f"""
            SELECT
                {self.RECIPE_COLUMNS}
            FROM recipes r
            LEFT JOIN chef_profiles cp ON cp.id = r.chef_id
            WHERE r.id = %s
        """
        params = [recipe_id]
        if contributor_user_id is not None:
            query += " AND r.contributor_user_id = %s"
            params.append(contributor_user_id)
        if chef_id is not None:
            query += " AND r.chef_id = %s"
            params.append(chef_id)
        if public_only:
            query += """
                AND r.is_public = 1
                AND (
                    r.contributor_role <> 'chef'
                    OR COALESCE(cp.is_active, 0) = 1
                )
            """
        query += " LIMIT 1"

        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchone()

    def list_recipes_by_contributor(self, connection, contributor_user_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                {self.RECIPE_COLUMNS}
            FROM recipes r
            LEFT JOIN chef_profiles cp ON cp.id = r.chef_id
            WHERE r.contributor_user_id = %s
            ORDER BY r.created_at DESC, r.id DESC
            """,
            (contributor_user_id,),
        )
        return cursor.fetchall()

    def list_recipes_by_chef(self, connection, chef_id, public_only=False):
        query = f"""
            SELECT
                {self.RECIPE_COLUMNS}
            FROM recipes r
            LEFT JOIN chef_profiles cp ON cp.id = r.chef_id
            WHERE r.chef_id = %s
        """
        params = [chef_id]
        if public_only:
            query += " AND r.is_public = 1"
        query += " ORDER BY r.created_at DESC, r.id DESC"
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def list_public_recipes(self, connection, filters):
        order_clause = (
            "r.created_at DESC, r.id DESC"
            if filters.get("sort") == "recent"
            else "r.views_count DESC, r.created_at DESC, r.id DESC"
        )
        query = f"""
            SELECT
                {self.RECIPE_COLUMNS}
            FROM recipes r
            LEFT JOIN chef_profiles cp ON cp.id = r.chef_id
            WHERE r.is_public = 1
              AND (
                  r.contributor_role <> 'chef'
                  OR COALESCE(cp.is_active, 0) = 1
              )
        """
        params = []
        if filters.get("category"):
            query += " AND r.category LIKE %s"
            params.append(f"%{filters['category']}%")
        if filters.get("cuisine"):
            query += " AND r.cuisine LIKE %s"
            params.append(f"%{filters['cuisine']}%")
        if filters.get("state"):
            query += " AND r.origin_state LIKE %s"
            params.append(f"%{filters['state']}%")
        if filters.get("region"):
            query += " AND r.origin_region LIKE %s"
            params.append(f"%{filters['region']}%")
        if filters.get("q"):
            query += """
                AND (
                    r.name LIKE %s
                    OR r.description LIKE %s
                    OR r.contributor_name LIKE %s
                    OR r.origin_state LIKE %s
                    OR cp.display_name LIKE %s
                )
            """
            params.extend([f"%{filters['q']}%"] * 5)
        query += f" ORDER BY {order_clause} LIMIT %s OFFSET %s"
        params.extend([filters["limit"], filters["offset"]])

        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

    def replace_ingredients(self, connection, recipe_id, ingredients):
        cursor = connection.cursor()
        cursor.execute("DELETE FROM recipe_ingredients WHERE recipe_id = %s", (recipe_id,))
        if ingredients:
            cursor.executemany(
                """
                INSERT INTO recipe_ingredients (
                    recipe_id,
                    ingredient_name,
                    quantity,
                    unit,
                    sort_order
                ) VALUES (%s, %s, %s, %s, %s)
                """,
                [
                    (
                        recipe_id,
                        ingredient["ingredient_name"],
                        ingredient.get("quantity"),
                        ingredient.get("unit"),
                        ingredient["sort_order"],
                    )
                    for ingredient in ingredients
                ],
            )

    def replace_steps(self, connection, recipe_id, steps):
        cursor = connection.cursor()
        cursor.execute("DELETE FROM recipe_steps WHERE recipe_id = %s", (recipe_id,))
        if steps:
            cursor.executemany(
                """
                INSERT INTO recipe_steps (
                    recipe_id,
                    step_number,
                    instruction
                ) VALUES (%s, %s, %s)
                """,
                [
                    (
                        recipe_id,
                        step["step_number"],
                        step["instruction"],
                    )
                    for step in steps
                ],
            )

    def get_ingredients(self, connection, recipe_ids):
        if not recipe_ids:
            return {}
        placeholders = ", ".join(["%s"] * len(recipe_ids))
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                recipe_id,
                ingredient_name,
                quantity,
                unit,
                sort_order
            FROM recipe_ingredients
            WHERE recipe_id IN ({placeholders})
            ORDER BY recipe_id ASC, sort_order ASC, id ASC
            """,
            tuple(recipe_ids),
        )
        rows = cursor.fetchall()
        ingredients = {recipe_id: [] for recipe_id in recipe_ids}
        for row in rows:
            ingredients.setdefault(row["recipe_id"], []).append(row)
        return ingredients

    def get_steps(self, connection, recipe_ids):
        if not recipe_ids:
            return {}
        placeholders = ", ".join(["%s"] * len(recipe_ids))
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            f"""
            SELECT
                recipe_id,
                step_number,
                instruction
            FROM recipe_steps
            WHERE recipe_id IN ({placeholders})
            ORDER BY recipe_id ASC, step_number ASC, id ASC
            """,
            tuple(recipe_ids),
        )
        rows = cursor.fetchall()
        steps = {recipe_id: [] for recipe_id in recipe_ids}
        for row in rows:
            steps.setdefault(row["recipe_id"], []).append(row)
        return steps

    def slug_exists(self, connection, contributor_user_id, slug, exclude_recipe_id=None):
        query = """
            SELECT id
            FROM recipes
            WHERE contributor_user_id = %s
              AND slug = %s
        """
        params = [contributor_user_id, slug]
        if exclude_recipe_id is not None:
            query += " AND id <> %s"
            params.append(exclude_recipe_id)
        query += " LIMIT 1"
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchone() is not None

    def get_recipe_metrics(self, connection, chef_id):
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_recipes,
                SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) AS public_recipes,
                COALESCE(SUM(views_count), 0) AS total_recipe_views
            FROM recipes
            WHERE chef_id = %s
            """,
            (chef_id,),
        )
        return cursor.fetchone()
