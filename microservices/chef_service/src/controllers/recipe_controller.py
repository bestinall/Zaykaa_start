from flask import Blueprint, g, request

from src.middleware.auth import chef_role_required
from src.services.recipe_service import RecipeService
from src.utils.responses import success_response


recipe_blueprint = Blueprint("chef_recipe", __name__, url_prefix="/api/v1")
recipe_service = RecipeService()


@recipe_blueprint.get("/recipes")
def list_public_recipes():
    result = recipe_service.list_public_recipes(request.args)
    return success_response(result, "Recipes fetched successfully")


@recipe_blueprint.get("/recipes/<int:recipe_id>")
def get_public_recipe(recipe_id):
    result = recipe_service.get_public_recipe(recipe_id)
    return success_response(result, "Recipe fetched successfully")


@recipe_blueprint.get("/chefs/<int:chef_id>/recipes")
def list_public_chef_recipes(chef_id):
    result = recipe_service.list_public_recipes_for_chef(chef_id)
    return success_response(result, "Chef recipes fetched successfully")


@recipe_blueprint.get("/chefs/recipes")
@chef_role_required
def list_my_recipes():
    result = recipe_service.list_own_recipes(g.current_user_id)
    return success_response(result, "Chef recipes fetched successfully")


@recipe_blueprint.post("/chefs/recipes")
@chef_role_required
def create_recipe():
    payload = request.get_json(silent=True) or {}
    result = recipe_service.create_recipe(g.current_user_id, payload)
    return success_response(result, "Recipe created successfully", 201)


@recipe_blueprint.get("/chefs/recipes/<int:recipe_id>")
@chef_role_required
def get_my_recipe(recipe_id):
    result = recipe_service.get_own_recipe(g.current_user_id, recipe_id)
    return success_response(result, "Recipe fetched successfully")


@recipe_blueprint.put("/chefs/recipes/<int:recipe_id>")
@chef_role_required
def update_my_recipe(recipe_id):
    payload = request.get_json(silent=True) or {}
    result = recipe_service.update_recipe(g.current_user_id, recipe_id, payload)
    return success_response(result, "Recipe updated successfully")


@recipe_blueprint.delete("/chefs/recipes/<int:recipe_id>")
@chef_role_required
def delete_my_recipe(recipe_id):
    result = recipe_service.delete_recipe(g.current_user_id, recipe_id)
    return success_response(result, "Recipe deleted successfully")
