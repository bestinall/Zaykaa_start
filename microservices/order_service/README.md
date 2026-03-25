# Order Service

## 1. Explanation

This service is the order microservice for Zaykaa. It uses Flask, JWT auth, raw SQL with MySQL, connection pooling, and a layered `Controller -> Service -> Repository` structure.

Core responsibilities implemented:

- restaurant catalog with seeded menu data
- cart management
- coupon validation
- order creation
- order history and recent orders
- order tracking
- order cancellation
- admin-only order status progression

## 2. Folder Structure

```text
microservices/order_service
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
    |   `-- order_controller.py
    |-- database
    |   |-- bootstrap.py
    |   |-- connection.py
    |   |-- queries.sql
    |   `-- schema.sql
    |-- middleware
    |   |-- auth.py
    |   `-- error_handlers.py
    |-- repositories
    |   `-- order_repository.py
    |-- services
    |   `-- order_service.py
    `-- utils
        |-- exceptions.py
        |-- jwt_utils.py
        |-- logger.py
        |-- responses.py
        `-- validators.py
```

## 3. Database Schema

The full MySQL schema is in [schema.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/order_service/src/database/schema.sql).

Main tables:

- `restaurants`
- `menu_items`
- `coupons`
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `order_status_history`
- `coupon_redemptions`

## 4. SQL Queries For Operations

The full raw SQL operation set is in [queries.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/order_service/src/database/queries.sql).

## 5. API Routes

Base paths:

- `/api/v1/restaurants`
- `/api/v1/coupons`
- `/api/v1/orders`

Public:

- `GET /api/v1/restaurants`
- `GET /api/v1/restaurants/{restaurant_id}`
- `GET /health`

Protected:

- `POST /api/v1/coupons/validate`
- `GET /api/v1/orders/cart`
- `PUT /api/v1/orders/cart`
- `DELETE /api/v1/orders/cart`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/my`
- `GET /api/v1/orders/recent`
- `GET /api/v1/orders/{order_id}`
- `GET /api/v1/orders/{order_id}/track`
- `PATCH /api/v1/orders/{order_id}/cancel`

Admin:

- `PATCH /api/v1/orders/{order_id}/status`

## 6. Full Working Code

Run locally:

```powershell
cd microservices/order_service
python app.py
```

## 7. Sample Requests / Responses

Create order:

```http
POST /api/v1/orders
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "restaurantId": 1,
  "items": [
    { "id": 101, "quantity": 1 },
    { "id": 103, "quantity": 2 }
  ],
  "couponCode": "WELCOME100",
  "deliveryAddress": "221B Baker Street, Delhi"
}
```

Recent orders response:

```json
{
  "success": true,
  "message": "Recent orders fetched successfully",
  "data": {
    "orders": [
      {
        "id": 1,
        "orderReference": "ORD-A1B2C3D4E5",
        "restaurantName": "Aroma North Indian",
        "status": "confirmed",
        "totalAmount": 714,
        "itemCount": 3
      }
    ]
  }
}
```
