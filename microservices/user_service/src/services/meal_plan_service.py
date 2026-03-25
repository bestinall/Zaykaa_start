from src.database.connection import DatabasePoolManager
from src.repositories.meal_plan_repository import MealPlanRepository
from src.utils.exceptions import NotFoundError
from src.utils.validators import validate_meal_plan_payload


class MealPlanService:
    def __init__(self):
        self.meal_plan_repository = MealPlanRepository()

    def create_meal_plan(self, user_id, payload):
        validated_payload = validate_meal_plan_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            meal_plan_id = self.meal_plan_repository.create_meal_plan(
                connection, user_id, validated_payload
            )
            self.meal_plan_repository.create_meal_plan_items(
                connection, meal_plan_id, validated_payload.get("items", [])
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()
        return self.get_meal_plan(user_id, meal_plan_id)

    def list_meal_plans(self, user_id, status=None):
        connection = DatabasePoolManager.get_connection()
        try:
            meal_plans = self.meal_plan_repository.list_meal_plans(connection, user_id, status)
            for meal_plan in meal_plans:
                meal_plan["items"] = self.meal_plan_repository.list_meal_plan_items(
                    connection, meal_plan["id"]
                )
            return meal_plans
        finally:
            connection.close()

    def get_meal_plan(self, user_id, meal_plan_id):
        connection = DatabasePoolManager.get_connection()
        try:
            meal_plan = self.meal_plan_repository.get_meal_plan(connection, user_id, meal_plan_id)
            if not meal_plan:
                raise NotFoundError("Meal plan was not found")
            meal_plan["items"] = self.meal_plan_repository.list_meal_plan_items(
                connection, meal_plan_id
            )
            return meal_plan
        finally:
            connection.close()

    def update_meal_plan(self, user_id, meal_plan_id, payload):
        validated_payload = validate_meal_plan_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            updated_rows = self.meal_plan_repository.update_meal_plan(
                connection, user_id, meal_plan_id, validated_payload
            )
            if updated_rows == 0:
                raise NotFoundError("Meal plan was not found")
            self.meal_plan_repository.delete_meal_plan_items(connection, meal_plan_id)
            self.meal_plan_repository.create_meal_plan_items(
                connection, meal_plan_id, validated_payload.get("items", [])
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()
        return self.get_meal_plan(user_id, meal_plan_id)

    def delete_meal_plan(self, user_id, meal_plan_id):
        connection = DatabasePoolManager.get_connection()
        try:
            deleted_rows = self.meal_plan_repository.delete_meal_plan(
                connection, user_id, meal_plan_id
            )
            if deleted_rows == 0:
                raise NotFoundError("Meal plan was not found")
            connection.commit()
            return {"deleted": True, "meal_plan_id": meal_plan_id}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()
