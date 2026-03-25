# Chef Service

## 1. Explanation

This service is the second production-style microservice in the new Zaykaa backend. It uses Flask for synchronous APIs, JWT for protected chef operations, MySQL with raw SQL only, connection pooling with `mysql-connector-python`, and a layered `Controller -> Service -> Repository` design.

Core responsibilities implemented:

- chef profile create, read, and update
- public chef discovery with filtering
- availability calendar management
- recipe CRUD with ingredients and steps
- ratings aggregation
- chef analytics snapshot for the current dashboard

## 2. Folder Structure

```text
microservices/chef_service
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
    |   |-- chef_profile_controller.py
    |   `-- recipe_controller.py
    |-- database
    |   |-- bootstrap.py
    |   |-- connection.py
    |   |-- queries.sql
    |   `-- schema.sql
    |-- middleware
    |   |-- auth.py
    |   `-- error_handlers.py
    |-- repositories
    |   |-- chef_repository.py
    |   `-- recipe_repository.py
    |-- services
    |   |-- chef_profile_service.py
    |   `-- recipe_service.py
    `-- utils
        |-- exceptions.py
        |-- jwt_utils.py
        |-- logger.py
        |-- responses.py
        `-- validators.py
```

## 3. Database Schema

The full MySQL schema is in [schema.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/chef_service/src/database/schema.sql).

Main tables:

- `chef_profiles`
- `chef_specialties`
- `chef_availability_slots`
- `chef_rating_events`
- `chef_rating_summary`
- `recipes`
- `recipe_ingredients`
- `recipe_steps`

## 4. SQL Queries For Operations

The full raw SQL operation set is in [queries.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/chef_service/src/database/queries.sql).

## 5. API Routes

Base path: `/api/v1`

Public:

- `GET /api/v1/chefs`
- `GET /api/v1/chefs/{chef_id}`
- `GET /api/v1/chefs/{chef_id}/availability`
- `GET /api/v1/chefs/{chef_id}/recipes`
- `GET /api/v1/recipes`
- `GET /api/v1/recipes/{recipe_id}`
- `GET /health`

Protected:

- `POST /api/v1/chefs/profile`
- `GET /api/v1/chefs/profile`
- `PUT /api/v1/chefs/profile`
- `GET /api/v1/chefs/availability`
- `PUT /api/v1/chefs/availability`
- `POST /api/v1/chefs/{chef_id}/ratings`
- `GET /api/v1/chefs/analytics`
- `GET /api/v1/chefs/recipes`
- `POST /api/v1/chefs/recipes`
- `GET /api/v1/chefs/recipes/{recipe_id}`
- `PUT /api/v1/chefs/recipes/{recipe_id}`
- `DELETE /api/v1/chefs/recipes/{recipe_id}`

## 6. Full Working Code

Run locally:

```powershell
cd microservices/chef_service
python app.py
```

## 7. Sample Requests / Responses

Create chef profile:

```http
POST /api/v1/chefs/profile
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "Chef Priya Sharma",
  "headline": "Regional Indian specialist",
  "bio": "Private dining chef focused on South Indian and vegan tasting menus.",
  "hourlyRate": 1200,
  "experienceYears": 8,
  "city": "Bengaluru",
  "state": "Karnataka",
  "country": "India",
  "location": "Bengaluru, Karnataka",
  "availableDays": "Mon-Sat, Lunch and Dinner",
  "specialties": ["South Indian", "Kerala", "Vegan"]
}
```

Update availability:

```http
PUT /api/v1/chefs/availability
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "availableDays": "Mon-Sat, Lunch and Dinner",
  "slots": [
    {
      "date": "2026-03-25",
      "slotName": "lunch"
    },
    {
      "date": "2026-03-25",
      "slotName": "dinner"
    }
  ]
}
```

Add recipe:

```http
POST /api/v1/chefs/recipes
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "Malabar Veg Stew",
  "category": "Main Course",
  "preparationTime": "35 mins",
  "servings": 4,
  "cuisine": "Kerala",
  "ingredients": [
    "Coconut milk",
    "Carrot",
    "Potato"
  ],
  "steps": [
    "Saute whole spices and aromatics.",
    "Simmer vegetables until tender.",
    "Finish with coconut milk."
  ]
}
```

Public chef discovery response:

```json
{
  "success": true,
  "message": "Chef directory fetched successfully",
  "data": {
    "chefs": [
      {
        "id": 1,
        "name": "Chef Priya Sharma",
        "specialties": ["South Indian", "Kerala", "Vegan"],
        "rating": 4.8,
        "reviews": 24,
        "hourlyRate": 1200,
        "availableDays": "Mon-Sat, Lunch and Dinner",
        "location": "Bengaluru, Karnataka",
        "image": "https://via.placeholder.com/300?text=Chef"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "count": 1
    }
  }
}
```
