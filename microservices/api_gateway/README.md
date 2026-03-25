# API Gateway

This gateway is the single entry point for the current migration phase.

Responsibilities implemented:

- request logging
- JWT validation for protected user-service routes
- in-memory rate limiting
- routing to the new user service
- compatibility aliases for the current frontend auth routes
- fallback proxying to the legacy Flask backend for not-yet-migrated modules
