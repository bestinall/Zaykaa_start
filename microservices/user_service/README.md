# User Service

## 1. Explanation

This service is the first production-style microservice in the new Zaykaa backend. It uses Flask for synchronous business logic, JWT for auth, MySQL with raw SQL only, connection pooling through `mysql-connector-python`, layered design (`Controller -> Service -> Repository`), and is meant to sit behind the API gateway.

Core responsibilities implemented:

- user registration and login
- JWT session verification and logout endpoint
- profile read/update
- preferences read/update
- meal plan CRUD
- nutrition log CRUD
- nutrition summary reporting

## 2. Folder Structure

```text
microservices/user_service
|-- app.py
|-- .env
|-- .env.example
|-- Dockerfile
|-- requirements.txt
|-- README.md
`-- src
    |-- __init__.py
    |-- config.py
    |-- controllers
    |   |-- auth_controller.py
    |   |-- meal_plan_controller.py
    |   |-- nutrition_controller.py
    |   `-- profile_controller.py
    |-- database
    |   |-- bootstrap.py
    |   |-- connection.py
    |   |-- queries.sql
    |   `-- schema.sql
    |-- middleware
    |   |-- auth.py
    |   `-- error_handlers.py
    |-- repositories
    |   |-- meal_plan_repository.py
    |   |-- nutrition_repository.py
    |   `-- user_repository.py
    |-- services
    |   |-- auth_service.py
    |   |-- meal_plan_service.py
    |   |-- nutrition_service.py
    |   `-- profile_service.py
    `-- utils
        |-- exceptions.py
        |-- jwt_utils.py
        |-- logger.py
        |-- responses.py
        `-- validators.py
```

## 3. Database Schema

The full MySQL schema is in [schema.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/user_service/src/database/schema.sql).

Main tables:

- `users`
- `user_preferences`
- `user_preference_tags`
- `meal_plans`
- `meal_plan_items`
- `nutrition_logs`

## 4. SQL Queries For Operations

The full raw SQL operation set is in [queries.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/user_service/src/database/queries.sql).

## 5. API Routes

Base path: `/api/v1/users`

Public:

- `POST /api/v1/users/auth/register`
- `POST /api/v1/users/auth/login`
- `GET /health`

Protected:

- `POST /api/v1/users/auth/logout`
- `GET /api/v1/users/auth/verify`
- `GET /api/v1/users/profile`
- `PUT /api/v1/users/profile`
- `GET /api/v1/users/preferences`
- `PUT /api/v1/users/preferences`
- `POST /api/v1/users/meal-plans`
- `GET /api/v1/users/meal-plans`
- `GET /api/v1/users/meal-plans/{meal_plan_id}`
- `PUT /api/v1/users/meal-plans/{meal_plan_id}`
- `DELETE /api/v1/users/meal-plans/{meal_plan_id}`
- `POST /api/v1/users/nutrition/logs`
- `GET /api/v1/users/nutrition/logs`
- `PUT /api/v1/users/nutrition/logs/{log_id}`
- `DELETE /api/v1/users/nutrition/logs/{log_id}`
- `GET /api/v1/users/nutrition/summary`

## 6. Full Working Code

Run locally:

```powershell
cd microservices/user_service
python app.py
```

## 7. Sample Requests / Responses

Register:

```http
POST /api/v1/users/auth/register
Content-Type: application/json

{
  "full_name": "Aditya Raj",
  "email": "aditya.raj@example.com",
  "password": "StrongPass123!",
  "phone": "+919999999999",
  "role": "user"
}
```

Sample response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": 1,
      "full_name": "Aditya Raj",
      "email": "aditya.raj@example.com",
      "role": "user"
    }
  }
}
```

Create meal plan:

```http
POST /api/v1/users/meal-plans
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "title": "Lean Week Plan",
  "goal": "Weight loss",
  "start_date": "2026-03-24",
  "end_date": "2026-03-30",
  "status": "active",
  "notes": "Weekday calorie deficit plan",
  "items": [
    {
      "meal_date": "2026-03-24",
      "meal_type": "breakfast",
      "item_name": "Oats Bowl",
      "description": "Oats, berries, greek yogurt",
      "calories": 320,
      "protein_g": 18,
      "carbs_g": 42,
      "fats_g": 8,
      "scheduled_time": "08:30:00",
      "sort_order": 1
    }
  ]
}
```

Nutrition summary:

```http
GET /api/v1/users/nutrition/summary?start_date=2026-03-24&end_date=2026-03-30
Authorization: Bearer <jwt>
```

Sample response:

```json
{
  "success": true,
  "message": "Nutrition summary fetched successfully",
  "data": {
    "window": {
      "start_date": "2026-03-24",
      "end_date": "2026-03-30"
    },
    "totals": {
      "total_calories": 320,
      "total_protein_g": 18,
      "total_carbs_g": 42,
      "total_fats_g": 8,
      "total_fiber_g": 6,
      "total_water_ml": 250,
      "total_entries": 1
    },
    "daily_breakdown": []
  }
}
```
