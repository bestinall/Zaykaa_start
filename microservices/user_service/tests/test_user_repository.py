import unittest

from src.repositories.user_repository import UserRepository


class FakeCursor:
    def __init__(self):
        self.lastrowid = 42
        self.query = None
        self.params = None

    def execute(self, query, params):
        self.query = query
        self.params = params


class FakeConnection:
    def __init__(self):
        self.cursor_instance = FakeCursor()
        self.requested_dictionary = None

    def cursor(self, dictionary=False):
        self.requested_dictionary = dictionary
        return self.cursor_instance


class UserRepositoryTests(unittest.TestCase):
    def test_create_user_uses_matching_insert_placeholders(self):
        repository = UserRepository()
        connection = FakeConnection()

        user_id = repository.create_user(
            connection,
            {
                "full_name": "Test User",
                "email": "test@example.com",
                "password_hash": "hashed-password",
                "phone": "1234567890",
                "role": "user",
                "native_state": "Maharashtra",
                "native_region": "West",
                "date_of_birth": None,
                "gender": "prefer_not_to_say",
                "height_cm": None,
                "weight_kg": None,
                "activity_level": "moderate",
            },
        )

        self.assertTrue(connection.requested_dictionary)
        self.assertEqual(user_id, 42)
        self.assertEqual(connection.cursor_instance.query.count("%s"), len(connection.cursor_instance.params))
        self.assertEqual(len(connection.cursor_instance.params), 12)


if __name__ == "__main__":
    unittest.main()
