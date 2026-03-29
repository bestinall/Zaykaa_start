# Payment Service

## 1. Explanation

This service is the payment microservice for Zaykaa. It uses Flask, JWT auth, raw SQL with MySQL, connection pooling, and a layered `Controller -> Service -> Repository` structure. It starts with a production-shaped mock payment provider so the rest of the platform can integrate now, while Stripe and Razorpay are already represented as provider abstractions for the real integration phase.

Core responsibilities implemented:

- payment initiation against existing orders
- payment verification using mock provider flows
- payment history and order-linked payment lookup
- partial and full refunds
- payout creation with platform-fee calculation
- payment audit events

## 2. Folder Structure

```text
microservices/payment_service
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
    |   `-- order_client.py
    |-- controllers
    |   `-- payment_controller.py
    |-- database
    |   |-- bootstrap.py
    |   |-- connection.py
    |   |-- queries.sql
    |   `-- schema.sql
    |-- middleware
    |   |-- auth.py
    |   `-- error_handlers.py
    |-- providers
    |   |-- base_provider.py
    |   |-- factory.py
    |   |-- mock_provider.py
    |   |-- razorpay_provider.py
    |   `-- stripe_provider.py
    |-- repositories
    |   `-- payment_repository.py
    |-- services
    |   `-- payment_service.py
    `-- utils
        |-- exceptions.py
        |-- jwt_utils.py
        |-- logger.py
        |-- responses.py
        `-- validators.py
```

## 3. Database Schema

The full MySQL schema is in [schema.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/payment_service/src/database/schema.sql).

Main tables:

- `payments`
- `payment_events`
- `refunds`
- `payouts`

## 4. SQL Queries For Operations

The full raw SQL operation set is in [queries.sql](/c:/Users/Aditya/Desktop/final_year_project/Zaykaa_Start/microservices/payment_service/src/database/queries.sql).

## 5. API Routes

Base paths:

- `/api/v1/payments`
- `/api/v1/payouts`

Protected payment routes:

- `POST /api/v1/payments`
- `GET /api/v1/payments`
- `GET /api/v1/payments/my`
- `GET /api/v1/payments/order/{order_id}`
- `GET /api/v1/payments/{payment_id}`
- `POST /api/v1/payments/{payment_id}/verify`
- `POST /api/v1/payments/{payment_id}/refund`
- `GET /api/v1/payments/{payment_id}/refunds`
- `GET /api/v1/payments/{payment_id}/events`

Admin-only payout routes:

- `POST /api/v1/payouts`
- `GET /api/v1/payouts`
- `GET /api/v1/payouts/{payout_id}`
- `GET /health`

## 6. Full Working Code

Run locally:

```powershell
cd microservices/payment_service
python app.py
```

## 7. Sample Requests / Responses

Initiate payment:

```http
POST /api/v1/payments
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "orderId": 12,
  "provider": "mock",
  "paymentMethod": "upi"
}
```

Verify payment:

```http
POST /api/v1/payments/5/verify
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "simulateStatus": "captured"
}
```

Create payout:

```http
POST /api/v1/payouts
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "recipientUserId": 45,
  "sourcePaymentId": 5,
  "notes": "Chef payout for completed order"
}
```

Payment response:

```json
{
  "success": true,
  "message": "Payment fetched successfully",
  "data": {
    "payment": {
      "id": 5,
      "paymentReference": "PAY-2FC084A7BF",
      "orderId": 12,
      "provider": "mock",
      "amount": 480.5,
      "status": "captured",
      "refundedAmount": 0
    }
  }
}
```
