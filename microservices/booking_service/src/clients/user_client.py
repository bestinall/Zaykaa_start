from src.clients.base_client import ServiceClient
from src.config import Config


class UserServiceClient(ServiceClient):
    def __init__(self):
        config = Config()
        super().__init__("user-service", config.user_service_url)

    def get_current_user_profile(self, auth_header):
        return self.get(
            "/api/v1/users/profile",
            headers={"Authorization": auth_header},
        )
