from src.database.connection import DatabasePoolManager
from src.repositories.chef_repository import ChefRepository
from src.repositories.recipe_repository import RecipeRepository
from src.utils.exceptions import NotFoundError
from src.utils.validators import (
    slugify,
    validate_recipe_filters,
    validate_recipe_payload,
)


class RecipeService:
    def __init__(self):
        self.chef_repository = ChefRepository()
        self.recipe_repository = RecipeRepository()

    def create_recipe(self, user_id, payload):
        recipe_data, ingredients, steps = validate_recipe_payload(payload, partial=False)
        connection = DatabasePoolManager.get_connection()
        try:
            chef_profile = self._get_chef_profile_by_user_id_or_raise(connection, user_id)
            recipe_data["chef_id"] = chef_profile["id"]
            recipe_data["slug"] = self._generate_unique_slug(
                connection,
                chef_profile["id"],
                recipe_data["name"],
            )
            recipe_id = self.recipe_repository.create_recipe(connection, recipe_data)
            self.recipe_repository.replace_ingredients(connection, recipe_id, ingredients or [])
            self.recipe_repository.replace_steps(connection, recipe_id, steps or [])
            connection.commit()
            return {"recipe": self._fetch_formatted_recipe(connection, recipe_id, chef_profile["id"])}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_own_recipes(self, user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            chef_profile = self._get_chef_profile_by_user_id_or_raise(connection, user_id)
            recipes = self.recipe_repository.list_recipes_by_chef(connection, chef_profile["id"])
            formatted = self._format_recipes_with_children(connection, recipes)
            return {"recipes": formatted}
        finally:
            connection.close()

    def get_own_recipe(self, user_id, recipe_id):
        connection = DatabasePoolManager.get_connection()
        try:
            chef_profile = self._get_chef_profile_by_user_id_or_raise(connection, user_id)
            recipe = self.recipe_repository.get_recipe_by_id(
                connection,
                recipe_id,
                chef_id=chef_profile["id"],
            )
            if not recipe:
                raise NotFoundError("Recipe was not found")
            return {"recipe": self._format_recipes_with_children(connection, [recipe])[0]}
        finally:
            connection.close()

    def update_recipe(self, user_id, recipe_id, payload):
        recipe_data, ingredients, steps = validate_recipe_payload(payload, partial=True)
        connection = DatabasePoolManager.get_connection()
        try:
            chef_profile = self._get_chef_profile_by_user_id_or_raise(connection, user_id)
            existing_recipe = self.recipe_repository.get_recipe_by_id(
                connection,
                recipe_id,
                chef_id=chef_profile["id"],
            )
            if not existing_recipe:
                raise NotFoundError("Recipe was not found")

            if "name" in recipe_data and "slug" not in recipe_data:
                recipe_data["slug"] = self._generate_unique_slug(
                    connection,
                    chef_profile["id"],
                    recipe_data["name"],
                    exclude_recipe_id=recipe_id,
                )

            if recipe_data:
                self.recipe_repository.update_recipe(
                    connection,
                    recipe_id,
                    chef_profile["id"],
                    recipe_data,
                )
            if ingredients is not None:
                self.recipe_repository.replace_ingredients(connection, recipe_id, ingredients)
            if steps is not None:
                self.recipe_repository.replace_steps(connection, recipe_id, steps)
            connection.commit()
            return {"recipe": self._fetch_formatted_recipe(connection, recipe_id, chef_profile["id"])}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def delete_recipe(self, user_id, recipe_id):
        connection = DatabasePoolManager.get_connection()
        try:
            chef_profile = self._get_chef_profile_by_user_id_or_raise(connection, user_id)
            deleted_rows = self.recipe_repository.delete_recipe(connection, recipe_id, chef_profile["id"])
            if deleted_rows == 0:
                raise NotFoundError("Recipe was not found")
            connection.commit()
            return {"deleted": True, "recipeId": recipe_id}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_public_recipes(self, args):
        filters = validate_recipe_filters(args)
        connection = DatabasePoolManager.get_connection()
        try:
            recipes = self.recipe_repository.list_public_recipes(connection, filters)
            formatted = self._format_recipes_with_children(connection, recipes)
            return {
                "recipes": formatted,
                "pagination": {
                    "limit": filters["limit"],
                    "offset": filters["offset"],
                    "count": len(formatted),
                },
            }
        finally:
            connection.close()

    def get_public_recipe(self, recipe_id):
        connection = DatabasePoolManager.get_connection()
        try:
            recipe = self.recipe_repository.get_recipe_by_id(connection, recipe_id, public_only=True)
            if not recipe:
                raise NotFoundError("Recipe was not found")
            return {"recipe": self._format_recipes_with_children(connection, [recipe])[0]}
        finally:
            connection.close()

    def list_public_recipes_for_chef(self, chef_id):
        connection = DatabasePoolManager.get_connection()
        try:
            chef_profile = self.chef_repository.get_profile_by_id(connection, chef_id)
            if not chef_profile or not chef_profile.get("is_active"):
                raise NotFoundError("Chef profile was not found")
            recipes = self.recipe_repository.list_recipes_by_chef(
                connection,
                chef_id,
                public_only=True,
            )
            formatted = self._format_recipes_with_children(connection, recipes)
            return {"recipes": formatted}
        finally:
            connection.close()

    def _fetch_formatted_recipe(self, connection, recipe_id, chef_id):
        recipe = self.recipe_repository.get_recipe_by_id(connection, recipe_id, chef_id=chef_id)
        if not recipe:
            raise NotFoundError("Recipe was not found")
        return self._format_recipes_with_children(connection, [recipe])[0]

    def _format_recipes_with_children(self, connection, recipes):
        recipe_ids = [recipe["id"] for recipe in recipes]
        ingredients_map = self.recipe_repository.get_ingredients(connection, recipe_ids)
        steps_map = self.recipe_repository.get_steps(connection, recipe_ids)
        return [
            self._format_recipe(
                recipe,
                ingredients_map.get(recipe["id"], []),
                steps_map.get(recipe["id"], []),
            )
            for recipe in recipes
        ]

    def _format_recipe(self, recipe, ingredients, steps):
        return {
            "id": recipe["id"],
            "chefId": recipe["chef_id"],
            "chefName": recipe.get("chef_name"),
            "chefImage": recipe.get("chef_image_url"),
            "name": recipe["name"],
            "slug": recipe["slug"],
            "category": recipe["category"],
            "description": recipe.get("description"),
            "cuisine": recipe.get("cuisine"),
            "difficultyLevel": recipe.get("difficulty_level"),
            "difficulty_level": recipe.get("difficulty_level"),
            "preparationTime": recipe.get("preparation_time_label")
            or f"{recipe.get('preparation_time_minutes') or 0} mins",
            "preparationTimeMinutes": recipe.get("preparation_time_minutes"),
            "cookTimeMinutes": recipe.get("cook_time_minutes"),
            "servings": recipe.get("servings"),
            "calories": recipe.get("calories"),
            "image": recipe.get("image_url"),
            "imageUrl": recipe.get("image_url"),
            "isPublic": bool(recipe.get("is_public")),
            "views": int(recipe.get("views_count") or 0),
            "ingredients": [
                {
                    "name": ingredient["ingredient_name"],
                    "ingredient_name": ingredient["ingredient_name"],
                    "quantity": ingredient.get("quantity"),
                    "unit": ingredient.get("unit"),
                    "sortOrder": ingredient.get("sort_order"),
                }
                for ingredient in ingredients
            ],
            "steps": [
                {
                    "stepNumber": step["step_number"],
                    "instruction": step["instruction"],
                }
                for step in steps
            ],
            "createdAt": recipe.get("created_at"),
            "updatedAt": recipe.get("updated_at"),
        }

    def _get_chef_profile_by_user_id_or_raise(self, connection, user_id):
        chef_profile = self.chef_repository.get_profile_by_user_id(connection, user_id)
        if not chef_profile:
            raise NotFoundError("Chef profile was not found for this user")
        return chef_profile

    def _generate_unique_slug(self, connection, chef_id, recipe_name, exclude_recipe_id=None):
        base_slug = slugify(recipe_name)
        candidate = base_slug
        suffix = 2
        while self.recipe_repository.slug_exists(
            connection,
            chef_id,
            candidate,
            exclude_recipe_id=exclude_recipe_id,
        ):
            candidate = f"{base_slug}-{suffix}"
            suffix += 1
        return candidate
