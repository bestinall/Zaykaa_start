# Booking Service

## 1. Explanation

This service is the booking microservice for Zaykaa. It uses Flask, JWT auth, raw SQL with MySQL, connection pooling, and a layered `Controller -> Service -> Repository` structure. It coordinates with the user service for customer profile snapshots and with the chef service for chef profile and availability checks.

Core responsibilities implemented:

- booking creation
- availability validation against chef schedules
- slot reservation checks
- user booking history
- chef booking queue and status updates
- cancellation flow
- booking analytics for chefs

## 2. Folder Structure

```text
microservices/booking_service
|-- app.py
|-- .env
|-- .env.example
|-- Dockerfile
|-- requirements.txt
|-- README.md
`-- src
    |-- __init__.py
    |-- config.py
    |-- clients
    |   |-- base_client.py
    |   |-- chef_client.py
    |   `-- user_client.py
    |-- controllers
    |   `-- booking_controller.py
    |-- database
    |   |-- bootstrap.py
    |   |-- connection.py
    |   |-- queries.sql
    |   `-- schema.sql
    |-- middleware
    |   |-- auth.py
    |   `-- error_handlers.py
    |-- repositories
    |   `-- booking_repository.py
    |-- services
    |   `-- booking_service.py
    `-- utils
        |-- exceptions.py
        |-- jwt_utils.py
        |-- logger.py
        |-- responses.py
        `-- validators.py
```

## 3. Database Schema

The full MySQL schema is in [schema.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/booking_service/src/database/schema.sql).

Main tables:

- `bookings`
- `booking_status_history`

## 4. SQL Queries For Operations

The full raw SQL operation set is in [queries.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/booking_service/src/database/queries.sql).

## 5. API Routes

Base path: `/api/v1/bookings`

Public:

- `GET /api/v1/bookings/chefs/{chef_id}/availability`
- `GET /health`

Protected:

- `POST /api/v1/bookings`
- `GET /api/v1/bookings`
- `GET /api/v1/bookings/my`
- `GET /api/v1/bookings/{booking_id}`
- `PATCH /api/v1/bookings/{booking_id}/cancel`
- `GET /api/v1/bookings/chef`
- `GET /api/v1/bookings/chef/{booking_id}`
- `PATCH /api/v1/bookings/chef/{booking_id}/status`
- `GET /api/v1/bookings/chef/analytics`

## 6. Full Working Code

Run locally:

```powershell
cd microservices/booking_service
python app.py
```

## 7. Sample Requests / Responses

Create booking:

```http
POST /api/v1/bookings
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "chefId": 1,
  "date": "2026-03-26",
  "timeSlot": "dinner",
  "guestCount": 4,
  "menuPreferences": "North Indian vegetarian",
  "dietaryRestrictions": "No peanuts",
  "specialRequests": "Please prepare mild spice."
}
```

Chef bookings response:

```json
{
  "success": true,
  "message": "Chef bookings fetched successfully",
  "data": {
    "bookings": [
      {
        "id": 1,
        "userName": "Aditya Raj",
        "chefName": "Chef Priya Sharma",
        "date": "2026-03-26",
        "timeSlot": "dinner",
        "guestCount": 4,
        "amount": 3600,
        "status": "pending"
      }
    ]
  }
}
```
