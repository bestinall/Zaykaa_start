from datetime import date, timedelta

from src.database.connection import DatabasePoolManager
from src.repositories.nutrition_repository import NutritionRepository
from src.utils.exceptions import NotFoundError
from src.utils.validators import parse_date, validate_nutrition_log_payload


class NutritionService:
    def __init__(self):
        self.nutrition_repository = NutritionRepository()

    def create_log(self, user_id, payload):
        validated_payload = validate_nutrition_log_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            log_id = self.nutrition_repository.create_log(connection, user_id, validated_payload)
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()
        return self.get_log(user_id, log_id)

    def list_logs(self, user_id, start_date=None, end_date=None):
        resolved_start, resolved_end = self._resolve_date_window(start_date, end_date)
        connection = DatabasePoolManager.get_connection()
        try:
            return self.nutrition_repository.list_logs(
                connection, user_id, resolved_start, resolved_end
            )
        finally:
            connection.close()

    def get_log(self, user_id, log_id):
        connection = DatabasePoolManager.get_connection()
        try:
            log = self.nutrition_repository.get_log(connection, user_id, log_id)
            if not log:
                raise NotFoundError("Nutrition log was not found")
            return log
        finally:
            connection.close()

    def update_log(self, user_id, log_id, payload):
        validated_payload = validate_nutrition_log_payload(payload, partial=True)
        connection = DatabasePoolManager.get_connection()
        try:
            updated_rows = self.nutrition_repository.update_log(
                connection, user_id, log_id, validated_payload
            )
            if updated_rows == 0:
                raise NotFoundError("Nutrition log was not found")
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()
        return self.get_log(user_id, log_id)

    def delete_log(self, user_id, log_id):
        connection = DatabasePoolManager.get_connection()
        try:
            deleted_rows = self.nutrition_repository.delete_log(connection, user_id, log_id)
            if deleted_rows == 0:
                raise NotFoundError("Nutrition log was not found")
            connection.commit()
            return {"deleted": True, "nutrition_log_id": log_id}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def get_summary(self, user_id, start_date=None, end_date=None):
        resolved_start, resolved_end = self._resolve_date_window(start_date, end_date)
        connection = DatabasePoolManager.get_connection()
        try:
            totals = self.nutrition_repository.get_summary_totals(
                connection, user_id, resolved_start, resolved_end
            )
            daily_breakdown = self.nutrition_repository.get_daily_breakdown(
                connection, user_id, resolved_start, resolved_end
            )
            return {
                "window": {
                    "start_date": resolved_start,
                    "end_date": resolved_end,
                },
                "totals": totals,
                "daily_breakdown": daily_breakdown,
            }
        finally:
            connection.close()

    def _resolve_date_window(self, start_date, end_date):
        today = date.today()
        resolved_end = parse_date(end_date, "end_date") if end_date else today
        resolved_start = (
            parse_date(start_date, "start_date")
            if start_date
            else resolved_end - timedelta(days=6)
        )
        return resolved_start, resolved_end
