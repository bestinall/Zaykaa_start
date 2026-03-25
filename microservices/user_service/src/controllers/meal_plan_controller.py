from flask import Blueprint, g, request

from src.middleware.auth import auth_required
from src.services.meal_plan_service import MealPlanService
from src.utils.responses import success_response


meal_plan_blueprint = Blueprint(
    "user_meal_plans", __name__, url_prefix="/api/v1/users/meal-plans"
)
meal_plan_service = MealPlanService()


@meal_plan_blueprint.post("")
@auth_required
def create_meal_plan():
    payload = request.get_json(silent=True) or {}
    result = meal_plan_service.create_meal_plan(g.current_user_id, payload)
    return success_response(result, "Meal plan created successfully", 201)


@meal_plan_blueprint.get("")
@auth_required
def list_meal_plans():
    status = request.args.get("status")
    result = meal_plan_service.list_meal_plans(g.current_user_id, status)
    return success_response(result, "Meal plans fetched successfully")


@meal_plan_blueprint.get("/<int:meal_plan_id>")
@auth_required
def get_meal_plan(meal_plan_id):
    result = meal_plan_service.get_meal_plan(g.current_user_id, meal_plan_id)
    return success_response(result, "Meal plan fetched successfully")


@meal_plan_blueprint.put("/<int:meal_plan_id>")
@auth_required
def update_meal_plan(meal_plan_id):
    payload = request.get_json(silent=True) or {}
    result = meal_plan_service.update_meal_plan(g.current_user_id, meal_plan_id, payload)
    return success_response(result, "Meal plan updated successfully")


@meal_plan_blueprint.delete("/<int:meal_plan_id>")
@auth_required
def delete_meal_plan(meal_plan_id):
    result = meal_plan_service.delete_meal_plan(g.current_user_id, meal_plan_id)
    return success_response(result, "Meal plan deleted successfully")
