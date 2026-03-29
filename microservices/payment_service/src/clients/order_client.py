from src.clients.base_client import ServiceClient
from src.config import Config


class OrderServiceClient(ServiceClient):
    def __init__(self):
        config = Config()
        super().__init__("order-service", config.order_service_url)

    def get_order(self, order_id, auth_header):
        return self.get(
            f"/api/v1/orders/{order_id}",
            headers={"Authorization": auth_header},
        )
