from flask import Blueprint, g, request

from src.middleware.auth import auth_required
from src.services.nutrition_service import NutritionService
from src.utils.responses import success_response


nutrition_blueprint = Blueprint(
    "user_nutrition", __name__, url_prefix="/api/v1/users/nutrition"
)
nutrition_service = NutritionService()


@nutrition_blueprint.post("/logs")
@auth_required
def create_nutrition_log():
    payload = request.get_json(silent=True) or {}
    result = nutrition_service.create_log(g.current_user_id, payload)
    return success_response(result, "Nutrition log created successfully", 201)


@nutrition_blueprint.get("/logs")
@auth_required
def list_nutrition_logs():
    result = nutrition_service.list_logs(
        g.current_user_id,
        request.args.get("start_date"),
        request.args.get("end_date"),
    )
    return success_response(result, "Nutrition logs fetched successfully")


@nutrition_blueprint.put("/logs/<int:log_id>")
@auth_required
def update_nutrition_log(log_id):
    payload = request.get_json(silent=True) or {}
    result = nutrition_service.update_log(g.current_user_id, log_id, payload)
    return success_response(result, "Nutrition log updated successfully")


@nutrition_blueprint.delete("/logs/<int:log_id>")
@auth_required
def delete_nutrition_log(log_id):
    result = nutrition_service.delete_log(g.current_user_id, log_id)
    return success_response(result, "Nutrition log deleted successfully")


@nutrition_blueprint.get("/summary")
@auth_required
def get_nutrition_summary():
    result = nutrition_service.get_summary(
        g.current_user_id,
        request.args.get("start_date"),
        request.args.get("end_date"),
    )
    return success_response(result, "Nutrition summary fetched successfully")
