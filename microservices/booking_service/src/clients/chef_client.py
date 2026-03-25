from src.clients.base_client import ServiceClient
from src.config import Config


class ChefServiceClient(ServiceClient):
    def __init__(self):
        config = Config()
        super().__init__("chef-service", config.chef_service_url)

    def get_public_chef(self, chef_id):
        return self.get(f"/api/v1/chefs/{chef_id}")

    def get_current_chef_profile(self, auth_header):
        return self.get(
            "/api/v1/chefs/profile",
            headers={"Authorization": auth_header},
        )

    def get_public_availability(self, chef_id, start_date, end_date):
        return self.get(
            f"/api/v1/chefs/{chef_id}/availability",
            params={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
        )
