import requests

from src.config import Config
from src.database.connection import DatabasePoolManager
from src.repositories.chef_repository import ChefRepository
from src.repositories.recipe_repository import RecipeRepository
from src.utils.exceptions import NotFoundError, ValidationError
from src.utils.logger import get_logger
from src.utils.validators import (
    slugify,
    validate_recipe_filters,
    validate_recipe_payload,
)


class RecipeService:
    def __init__(self):
        self.config = Config()
        self.chef_repository = ChefRepository()
        self.recipe_repository = RecipeRepository()
        self.logger = get_logger("chef_service.recipe")

    def create_recipe(self, user_id, user_role, payload, auth_header=""):
        recipe_data, ingredients, steps = validate_recipe_payload(payload, partial=False)
        connection = DatabasePoolManager.get_connection()
        try:
            contributor = self._get_recipe_contributor_context(
                connection,
                user_id,
                user_role,
                auth_header,
            )
            if user_role == "seller" and recipe_data.get("price") is None:
                raise ValidationError("price is required for seller food items")
            recipe_data.update(contributor)
            recipe_data["slug"] = self._generate_unique_slug(
                connection,
                user_id,
                recipe_data["name"],
            )
            recipe_id = self.recipe_repository.create_recipe(connection, recipe_data)
            self.recipe_repository.replace_ingredients(connection, recipe_id, ingredients or [])
            self.recipe_repository.replace_steps(connection, recipe_id, steps or [])
            connection.commit()
            return {"recipe": self._fetch_formatted_recipe(connection, recipe_id, user_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_own_recipes(self, user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            recipes = self.recipe_repository.list_recipes_by_contributor(connection, user_id)
            formatted = self._format_recipes_with_children(connection, recipes)
            return {"recipes": formatted}
        finally:
            connection.close()

    def get_own_recipe(self, user_id, recipe_id):
        connection = DatabasePoolManager.get_connection()
        try:
            recipe = self.recipe_repository.get_recipe_by_id(
                connection,
                recipe_id,
                contributor_user_id=user_id,
            )
            if not recipe:
                raise NotFoundError("Recipe was not found")
            return {"recipe": self._format_recipes_with_children(connection, [recipe])[0]}
        finally:
            connection.close()

    def update_recipe(self, user_id, user_role, recipe_id, payload, auth_header=""):
        recipe_data, ingredients, steps = validate_recipe_payload(payload, partial=True)
        connection = DatabasePoolManager.get_connection()
        try:
            existing_recipe = self.recipe_repository.get_recipe_by_id(
                connection,
                recipe_id,
                contributor_user_id=user_id,
            )
            if not existing_recipe:
                raise NotFoundError("Recipe was not found")

            contributor = self._get_recipe_contributor_context(
                connection,
                user_id,
                user_role,
                auth_header,
            )
            if user_role == "seller" and recipe_data.get("price") is None and existing_recipe.get("price") is None:
                raise ValidationError("price is required for seller food items")
            recipe_data.update(
                {
                    "chef_id": contributor["chef_id"],
                    "contributor_role": contributor["contributor_role"],
                    "contributor_name": contributor["contributor_name"],
                    "contributor_image_url": contributor.get("contributor_image_url"),
                    "origin_state": contributor["origin_state"],
                    "origin_region": contributor.get("origin_region"),
                    "is_authentic_regional": contributor.get("is_authentic_regional", True),
                }
            )

            if "name" in recipe_data and "slug" not in recipe_data:
                recipe_data["slug"] = self._generate_unique_slug(
                    connection,
                    user_id,
                    recipe_data["name"],
                    exclude_recipe_id=recipe_id,
                )

            if recipe_data:
                self.recipe_repository.update_recipe(
                    connection,
                    recipe_id,
                    user_id,
                    recipe_data,
                )
            if ingredients is not None:
                self.recipe_repository.replace_ingredients(connection, recipe_id, ingredients)
            if steps is not None:
                self.recipe_repository.replace_steps(connection, recipe_id, steps)
            connection.commit()
            return {"recipe": self._fetch_formatted_recipe(connection, recipe_id, user_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def delete_recipe(self, user_id, recipe_id):
        connection = DatabasePoolManager.get_connection()
        try:
            deleted_rows = self.recipe_repository.delete_recipe(connection, recipe_id, user_id)
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

    def _fetch_formatted_recipe(self, connection, recipe_id, contributor_user_id):
        recipe = self.recipe_repository.get_recipe_by_id(
            connection,
            recipe_id,
            contributor_user_id=contributor_user_id,
        )
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
        author_name = recipe.get("contributor_name") or recipe.get("chef_name")
        author_image = recipe.get("contributor_image_url") or recipe.get("chef_image_url")
        preparation_time = recipe.get("preparation_time_label") or f"{recipe.get('preparation_time_minutes') or 0} mins"
        cooking_time_minutes = recipe.get("cook_time_minutes") or recipe.get("preparation_time_minutes")
        return {
            "id": recipe["id"],
            "chefId": recipe.get("chef_id"),
            "ownerUserId": recipe.get("contributor_user_id"),
            "authorRole": recipe.get("contributor_role"),
            "contributorRole": recipe.get("contributor_role"),
            "authorName": author_name,
            "contributorName": author_name,
            "authorImage": author_image,
            "contributorImage": author_image,
            "chefName": recipe.get("chef_name") or author_name,
            "chefImage": recipe.get("chef_image_url") or author_image,
            "title": recipe["name"],
            "name": recipe["name"],
            "slug": recipe["slug"],
            "category": recipe["category"],
            "description": recipe.get("description"),
            "cuisine": recipe.get("cuisine"),
            "difficultyLevel": recipe.get("difficulty_level"),
            "difficulty_level": recipe.get("difficulty_level"),
            "preparationTime": preparation_time,
            "preparationTimeMinutes": recipe.get("preparation_time_minutes"),
            "cookTimeMinutes": recipe.get("cook_time_minutes"),
            "cookingTimeMinutes": cooking_time_minutes,
            "servings": recipe.get("servings"),
            "calories": recipe.get("calories"),
            "price": float(recipe["price"]) if recipe.get("price") is not None else None,
            "originState": recipe.get("origin_state"),
            "originRegion": recipe.get("origin_region"),
            "isAuthenticRegionalSpecialty": bool(recipe.get("is_authentic_regional")),
            "authenticityTag": "Authentic Regional Specialty"
            if recipe.get("is_authentic_regional")
            else None,
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

    def _generate_unique_slug(self, connection, contributor_user_id, recipe_name, exclude_recipe_id=None):
        base_slug = slugify(recipe_name)
        candidate = base_slug
        suffix = 2
        while self.recipe_repository.slug_exists(
            connection,
            contributor_user_id,
            candidate,
            exclude_recipe_id=exclude_recipe_id,
        ):
            candidate = f"{base_slug}-{suffix}"
            suffix += 1
        return candidate

    def _get_recipe_contributor_context(self, connection, user_id, user_role, auth_header):
        chef_profile = self.chef_repository.get_profile_by_user_id(connection, user_id)
        user = self._fetch_authenticated_user(auth_header)
        contributor_name = None
        contributor_image_url = None
        chef_id = None
        origin_state = None
        origin_region = None

        if chef_profile:
            chef_id = chef_profile["id"]
            contributor_name = chef_profile.get("display_name")
            contributor_image_url = chef_profile.get("profile_image_url")
            origin_state = chef_profile.get("native_state")
            origin_region = chef_profile.get("native_region")

        if not contributor_name:
            contributor_name = (
                (user or {}).get("full_name")
                or (user or {}).get("name")
                or (user or {}).get("displayName")
                or f"User {user_id}"
            )

        origin_state = origin_state or (user or {}).get("native_state")
        origin_region = origin_region or (user or {}).get("native_region")
        if not origin_state:
            raise ValidationError(
                "Set your native state in profile before publishing an authentic regional dish"
            )

        return {
            "chef_id": chef_id,
            "contributor_user_id": user_id,
            "contributor_role": user_role,
            "contributor_name": contributor_name,
            "contributor_image_url": contributor_image_url,
            "origin_state": origin_state,
            "origin_region": origin_region,
            "is_authentic_regional": True,
        }

    def _fetch_authenticated_user(self, auth_header):
        if not auth_header:
            return {}
        try:
            response = requests.get(
                f"{self.config.user_service_url}/api/v1/users/auth/verify",
                headers={"Authorization": auth_header},
                timeout=self.config.upstream_timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                return (payload.get("data") or {}).get("user") or {}
        except (requests.RequestException, ValueError) as exc:
            self.logger.warning("user_profile_lookup_failed error=%s", exc)
        return {}
