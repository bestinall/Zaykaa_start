import uuid

from src.config import Config
from src.database.connection import DatabasePoolManager
from src.repositories.order_repository import OrderRepository
from src.utils.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from src.utils.validators import (
    validate_cancel_payload,
    validate_cart_payload,
    validate_coupon_payload,
    validate_create_order_payload,
    validate_order_list_filters,
    validate_restaurant_filters,
    validate_status_update_payload,
)


ADMIN_ALLOWED_ROLES = {"admin"}
USER_CANCELLABLE_STATUSES = {"confirmed", "preparing"}
ORDER_STATUS_TRANSITIONS = {
    "confirmed": {"preparing", "cancelled"},
    "preparing": {"out_for_delivery", "cancelled"},
    "out_for_delivery": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


class OrderService:
    def __init__(self):
        self.config = Config()
        self.order_repository = OrderRepository()

    def list_restaurants(self, args):
        filters = validate_restaurant_filters(args)
        connection = DatabasePoolManager.get_connection()
        try:
            restaurants = self.order_repository.list_restaurants(
                connection,
                location=filters["location"],
                cuisine=filters["cuisine"],
                search=filters["search"],
            )
            menu_items = self.order_repository.list_menu_items_for_restaurants(
                connection,
                [restaurant["id"] for restaurant in restaurants],
            )
            menu_map = self._group_menu_items(menu_items)
            return {
                "restaurants": [
                    self._format_restaurant(restaurant, menu_map.get(restaurant["id"], []))
                    for restaurant in restaurants
                ]
            }
        finally:
            connection.close()

    def get_restaurant_details(self, restaurant_id):
        connection = DatabasePoolManager.get_connection()
        try:
            restaurant = self._get_restaurant_or_raise(connection, restaurant_id)
            menu_items = self.order_repository.list_menu_items_for_restaurants(connection, [restaurant_id])
            return {
                "restaurant": self._format_restaurant(
                    restaurant,
                    self._group_menu_items(menu_items).get(restaurant_id, []),
                )
            }
        finally:
            connection.close()

    def get_cart(self, user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            return {"cart": self._fetch_cart(connection, user_id)}
        finally:
            connection.close()

    def upsert_cart(self, user_id, payload):
        validated_payload = validate_cart_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            if not validated_payload["items"]:
                self.order_repository.clear_cart_by_user_id(connection, user_id)
                connection.commit()
                return {"cart": self._empty_cart()}

            restaurant = self._get_restaurant_or_raise(connection, validated_payload["restaurant_id"])
            priced_items, subtotal_amount = self._build_priced_items(
                connection,
                validated_payload["restaurant_id"],
                validated_payload["items"],
            )

            coupon_result = None
            if validated_payload.get("coupon_code"):
                coupon_result = self._compute_coupon_result(
                    connection,
                    user_id,
                    validated_payload["coupon_code"],
                    subtotal_amount,
                )

            cart_id = self.order_repository.upsert_cart_header(
                connection,
                user_id,
                restaurant["id"],
                coupon_id=coupon_result["couponId"] if coupon_result else None,
                coupon_code=coupon_result["code"] if coupon_result else None,
            )
            self.order_repository.delete_cart_items(connection, cart_id)
            for item in priced_items:
                self.order_repository.insert_cart_item(connection, cart_id, item)
            connection.commit()
            return {"cart": self._fetch_cart(connection, user_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def clear_cart(self, user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            self.order_repository.clear_cart_by_user_id(connection, user_id)
            connection.commit()
            return {"cart": self._empty_cart()}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def validate_coupon_for_payload(self, user_id, payload):
        validated_payload = validate_coupon_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            subtotal_amount = validated_payload["subtotal_amount"]
            if validated_payload["items"]:
                if not validated_payload["restaurant_id"]:
                    raise ValidationError("restaurantId is required when validating a coupon against items")
                _, subtotal_amount = self._build_priced_items(
                    connection,
                    validated_payload["restaurant_id"],
                    validated_payload["items"],
                )

            coupon_result = self._compute_coupon_result(
                connection,
                user_id,
                validated_payload["code"],
                subtotal_amount,
            )
            return {
                "coupon": coupon_result,
                "pricing": self._pricing_summary(
                    subtotal_amount,
                    coupon_result["discountAmount"],
                ),
            }
        finally:
            connection.close()

    def create_order(self, user_id, payload):
        validated_payload = validate_create_order_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            restaurant = self._get_restaurant_or_raise(connection, validated_payload["restaurant_id"])
            priced_items, subtotal_amount = self._build_priced_items(
                connection,
                validated_payload["restaurant_id"],
                validated_payload["items"],
            )

            coupon_result = None
            discount_amount = 0.0
            if validated_payload.get("coupon_code"):
                coupon_result = self._compute_coupon_result(
                    connection,
                    user_id,
                    validated_payload["coupon_code"],
                    subtotal_amount,
                )
                discount_amount = coupon_result["discountAmount"]

            pricing = self._pricing_summary(subtotal_amount, discount_amount)
            order_payload = {
                "order_reference": f"ORD-{uuid.uuid4().hex[:10].upper()}",
                "user_id": user_id,
                "restaurant_id": restaurant["id"],
                "restaurant_name": restaurant["name"],
                "delivery_address": validated_payload["delivery_address"],
                "coupon_id": coupon_result["couponId"] if coupon_result else None,
                "coupon_code": coupon_result["code"] if coupon_result else None,
                "subtotal_amount": pricing["subtotalAmount"],
                "tax_amount": pricing["taxAmount"],
                "delivery_fee": pricing["deliveryFee"],
                "discount_amount": pricing["discountAmount"],
                "total_amount": pricing["totalAmount"],
                "currency": self.config.default_currency,
                "item_count": sum(item["quantity"] for item in priced_items),
                "status": "confirmed",
                "estimated_delivery_minutes": restaurant["estimated_delivery_minutes"],
            }

            order_id = self.order_repository.create_order(connection, order_payload)
            for item in priced_items:
                self.order_repository.insert_order_item(connection, order_id, item)

            self.order_repository.insert_status_history(
                connection,
                {
                    "order_id": order_id,
                    "old_status": None,
                    "new_status": "confirmed",
                    "actor_user_id": user_id,
                    "actor_role": "user",
                    "notes": validated_payload.get("notes") or "Order placed successfully",
                },
            )

            if coupon_result:
                self.order_repository.create_coupon_redemption(
                    connection,
                    coupon_result["couponId"],
                    order_id,
                    user_id,
                )

            self.order_repository.clear_cart_by_user_id(connection, user_id)
            connection.commit()
            return {"order": self._fetch_formatted_order(connection, order_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_my_orders(self, user_id, args):
        filters = validate_order_list_filters(args)
        connection = DatabasePoolManager.get_connection()
        try:
            orders = self.order_repository.list_orders_for_user(
                connection,
                user_id,
                status=filters["status"],
                limit=filters["limit"],
            )
            return {"orders": self._format_orders(connection, orders)}
        finally:
            connection.close()

    def list_recent_orders(self, user_id):
        connection = DatabasePoolManager.get_connection()
        try:
            orders = self.order_repository.list_orders_for_user(
                connection,
                user_id,
                limit=self.config.recent_order_limit,
            )
            return {"orders": self._format_orders(connection, orders)}
        finally:
            connection.close()

    def get_order_for_user(self, user_id, user_role, order_id):
        connection = DatabasePoolManager.get_connection()
        try:
            order = self._get_order_or_raise(connection, order_id)
            self._assert_order_access(user_id, user_role, order)
            return {"order": self._format_order(connection, order)}
        finally:
            connection.close()

    def get_order_tracking(self, user_id, user_role, order_id):
        connection = DatabasePoolManager.get_connection()
        try:
            order = self._get_order_or_raise(connection, order_id)
            self._assert_order_access(user_id, user_role, order)
            formatted_order = self._format_order(connection, order)
            return {
                "tracking": {
                    "orderId": formatted_order["id"],
                    "orderReference": formatted_order["orderReference"],
                    "status": formatted_order["status"],
                    "estimatedDeliveryMinutes": formatted_order["estimatedDeliveryMinutes"],
                    "createdAt": formatted_order["createdAt"],
                    "timeline": formatted_order["statusHistory"],
                }
            }
        finally:
            connection.close()

    def cancel_order_for_user(self, user_id, user_role, order_id, payload):
        validated_payload = validate_cancel_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            order = self._get_order_or_raise(connection, order_id)
            self._assert_order_access(user_id, user_role, order)
            if order["status"] not in USER_CANCELLABLE_STATUSES:
                raise ConflictError(
                    "Only confirmed or preparing orders can be cancelled",
                    {"current_status": order["status"]},
                )

            self.order_repository.update_order_status(
                connection,
                order_id,
                "cancelled",
                cancellation_reason=validated_payload["reason"],
            )
            self.order_repository.insert_status_history(
                connection,
                {
                    "order_id": order_id,
                    "old_status": order["status"],
                    "new_status": "cancelled",
                    "actor_user_id": user_id,
                    "actor_role": user_role,
                    "notes": validated_payload["reason"],
                },
            )
            connection.commit()
            return {"order": self._fetch_formatted_order(connection, order_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def update_order_status(self, actor_user_id, actor_role, order_id, payload):
        validated_payload = validate_status_update_payload(payload)
        connection = DatabasePoolManager.get_connection()
        try:
            order = self._get_order_or_raise(connection, order_id)
            allowed_targets = ORDER_STATUS_TRANSITIONS.get(order["status"], set())
            if validated_payload["status"] not in allowed_targets:
                raise ConflictError(
                    "Order status transition is not allowed",
                    {
                        "current_status": order["status"],
                        "allowed_statuses": sorted(allowed_targets),
                    },
                )

            cancellation_reason = validated_payload["notes"] if validated_payload["status"] == "cancelled" else None
            self.order_repository.update_order_status(
                connection,
                order_id,
                validated_payload["status"],
                cancellation_reason=cancellation_reason,
            )
            self.order_repository.insert_status_history(
                connection,
                {
                    "order_id": order_id,
                    "old_status": order["status"],
                    "new_status": validated_payload["status"],
                    "actor_user_id": actor_user_id,
                    "actor_role": actor_role,
                    "notes": validated_payload["notes"],
                },
            )
            connection.commit()
            return {"order": self._fetch_formatted_order(connection, order_id)}
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def _build_priced_items(self, connection, restaurant_id, requested_items):
        menu_item_ids = [item["menu_item_id"] for item in requested_items]
        menu_items = self.order_repository.get_menu_items_by_ids(connection, menu_item_ids)
        menu_item_map = {item["id"]: item for item in menu_items}
        if len(menu_item_map) != len(set(menu_item_ids)):
            missing_ids = sorted(set(menu_item_ids) - set(menu_item_map))
            raise NotFoundError("One or more menu items were not found", {"menu_item_ids": missing_ids})

        priced_items = []
        subtotal_amount = 0.0
        for requested_item in requested_items:
            menu_item = menu_item_map[requested_item["menu_item_id"]]
            if int(menu_item["restaurant_id"]) != int(restaurant_id):
                raise ValidationError("All items must belong to the selected restaurant")
            if not menu_item["is_available"]:
                raise ConflictError("One or more selected items are unavailable")

            quantity = int(requested_item["quantity"])
            unit_price = round(float(menu_item["price"]), 2)
            line_total = round(unit_price * quantity, 2)
            priced_items.append(
                {
                    "menu_item_id": menu_item["id"],
                    "item_name": menu_item["name"],
                    "unit_price": unit_price,
                    "quantity": quantity,
                    "line_total": line_total,
                }
            )
            subtotal_amount = round(subtotal_amount + line_total, 2)

        return priced_items, subtotal_amount

    def _compute_coupon_result(self, connection, user_id, code, subtotal_amount):
        coupon = self.order_repository.get_active_coupon_by_code(connection, code)
        if not coupon:
            raise NotFoundError("Coupon code is invalid or inactive")

        minimum_amount = round(float(coupon["min_order_amount"] or 0), 2)
        if subtotal_amount < minimum_amount:
            raise ConflictError(
                "Order does not meet coupon minimum amount",
                {
                    "minimum_amount": minimum_amount,
                    "subtotal_amount": subtotal_amount,
                },
            )

        usage_limit = coupon.get("usage_limit")
        if usage_limit is not None:
            total_redemptions = self.order_repository.count_coupon_redemptions(connection, coupon["id"])
            if total_redemptions >= int(usage_limit):
                raise ConflictError("Coupon usage limit has been reached")

        per_user_limit = int(coupon.get("per_user_limit") or 0)
        if per_user_limit > 0:
            user_redemptions = self.order_repository.count_coupon_redemptions(
                connection,
                coupon["id"],
                user_id=user_id,
            )
            if user_redemptions >= per_user_limit:
                raise ConflictError("You have already used this coupon the maximum number of times")

        discount_type = coupon["discount_type"]
        discount_value = round(float(coupon["discount_value"]), 2)
        if discount_type == "percent":
            discount_amount = round(subtotal_amount * (discount_value / 100), 2)
            max_discount_amount = coupon.get("max_discount_amount")
            if max_discount_amount is not None:
                discount_amount = min(discount_amount, round(float(max_discount_amount), 2))
        else:
            discount_amount = discount_value

        discount_amount = round(min(discount_amount, subtotal_amount), 2)
        return {
            "couponId": coupon["id"],
            "code": coupon["code"],
            "description": coupon.get("description"),
            "discountType": discount_type,
            "discountValue": discount_value,
            "discountAmount": discount_amount,
            "minimumAmount": minimum_amount,
        }

    def _pricing_summary(self, subtotal_amount, discount_amount=0.0):
        subtotal_amount = round(float(subtotal_amount), 2)
        discount_amount = round(float(discount_amount or 0), 2)
        tax_amount = round(subtotal_amount * (self.config.tax_rate_percent / 100), 2)
        delivery_fee = round(float(self.config.default_delivery_fee), 2)
        total_amount = round(max(subtotal_amount + tax_amount + delivery_fee - discount_amount, 0), 2)
        return {
            "subtotalAmount": subtotal_amount,
            "taxAmount": tax_amount,
            "deliveryFee": delivery_fee,
            "discountAmount": discount_amount,
            "totalAmount": total_amount,
            "currency": self.config.default_currency,
        }

    def _fetch_cart(self, connection, user_id):
        cart = self.order_repository.get_cart_by_user_id(connection, user_id)
        if not cart:
            return self._empty_cart()

        items = self.order_repository.get_cart_items(connection, cart["id"])
        subtotal_amount = round(sum(float(item["line_total"]) for item in items), 2)
        discount_amount = 0.0
        if cart.get("coupon_code"):
            try:
                coupon_result = self._compute_coupon_result(
                    connection,
                    user_id,
                    cart["coupon_code"],
                    subtotal_amount,
                )
                discount_amount = coupon_result["discountAmount"]
            except (NotFoundError, ConflictError):
                discount_amount = 0.0

        pricing = self._pricing_summary(subtotal_amount, discount_amount)
        return {
            "restaurantId": cart["restaurant_id"],
            "restaurantName": cart["restaurant_name"],
            "couponCode": cart.get("coupon_code"),
            "items": [
                {
                    "id": item["menu_item_id"],
                    "menuItemId": item["menu_item_id"],
                    "name": item["item_name"],
                    "price": float(item["unit_price"]),
                    "quantity": item["quantity"],
                    "lineTotal": float(item["line_total"]),
                }
                for item in items
            ],
            "itemCount": sum(int(item["quantity"]) for item in items),
            **pricing,
            "createdAt": cart.get("created_at"),
            "updatedAt": cart.get("updated_at"),
        }

    def _empty_cart(self):
        return {
            "restaurantId": None,
            "restaurantName": "",
            "couponCode": None,
            "items": [],
            "itemCount": 0,
            "subtotalAmount": 0,
            "taxAmount": 0,
            "deliveryFee": 0,
            "discountAmount": 0,
            "totalAmount": 0,
            "currency": self.config.default_currency,
            "createdAt": None,
            "updatedAt": None,
        }

    def _group_menu_items(self, menu_items):
        grouped_items = {}
        for menu_item in menu_items:
            grouped_items.setdefault(menu_item["restaurant_id"], []).append(menu_item)
        return grouped_items

    def _get_restaurant_or_raise(self, connection, restaurant_id):
        restaurant = self.order_repository.get_restaurant_by_id(connection, restaurant_id)
        if not restaurant:
            raise NotFoundError("Restaurant was not found")
        return restaurant

    def _get_order_or_raise(self, connection, order_id):
        order = self.order_repository.get_order_by_id(connection, order_id)
        if not order:
            raise NotFoundError("Order was not found")
        return order

    def _assert_order_access(self, user_id, user_role, order):
        if order["user_id"] == user_id:
            return
        if user_role in ADMIN_ALLOWED_ROLES:
            return
        raise AuthorizationError("You are not allowed to access this order")

    def _fetch_formatted_order(self, connection, order_id):
        order = self._get_order_or_raise(connection, order_id)
        return self._format_order(connection, order)

    def _format_orders(self, connection, orders):
        return [self._format_order(connection, order) for order in orders]

    def _format_restaurant(self, restaurant, menu_items):
        dishes = [
            {
                "id": item["id"],
                "name": item["name"],
                "category": item["category"],
                "description": item.get("description") or "",
                "price": float(item["price"]),
                "image": item.get("image_url"),
                "available": bool(item["is_available"]),
            }
            for item in menu_items
        ]
        return {
            "id": restaurant["id"],
            "name": restaurant["name"],
            "slug": restaurant["slug"],
            "location": restaurant["location"],
            "cuisine": restaurant["cuisine"],
            "rating": float(restaurant["rating"]),
            "reviews": int(restaurant["reviews_count"]),
            "image": restaurant.get("image_url"),
            "estimatedDeliveryMinutes": restaurant["estimated_delivery_minutes"],
            "dishes": dishes,
            "menu": dishes,
        }

    def _format_order(self, connection, order):
        items = self.order_repository.get_order_items(connection, order["id"])
        status_history = self.order_repository.get_status_history(connection, order["id"])
        return {
            "id": order["id"],
            "orderReference": order["order_reference"],
            "userId": order["user_id"],
            "restaurantId": order["restaurant_id"],
            "restaurantName": order["restaurant_name"],
            "deliveryAddress": order["delivery_address"],
            "couponCode": order.get("coupon_code"),
            "subtotalAmount": float(order["subtotal_amount"]),
            "taxAmount": float(order["tax_amount"]),
            "deliveryFee": float(order["delivery_fee"]),
            "discountAmount": float(order["discount_amount"]),
            "totalAmount": float(order["total_amount"]),
            "amount": float(order["total_amount"]),
            "currency": order["currency"],
            "itemCount": int(order["item_count"]),
            "status": order["status"],
            "cancellationReason": order.get("cancellation_reason"),
            "estimatedDeliveryMinutes": order["estimated_delivery_minutes"],
            "createdAt": order.get("created_at"),
            "updatedAt": order.get("updated_at"),
            "items": [
                {
                    "id": item["id"],
                    "menuItemId": item["menu_item_id"],
                    "name": item["item_name"],
                    "price": float(item["unit_price"]),
                    "quantity": int(item["quantity"]),
                    "lineTotal": float(item["total_price"]),
                }
                for item in items
            ],
            "statusHistory": [
                {
                    "id": event["id"],
                    "oldStatus": event.get("old_status"),
                    "newStatus": event["new_status"],
                    "actorUserId": event["actor_user_id"],
                    "actorRole": event["actor_role"],
                    "notes": event.get("notes"),
                    "createdAt": event.get("created_at"),
                }
                for event in status_history
            ],
        }
