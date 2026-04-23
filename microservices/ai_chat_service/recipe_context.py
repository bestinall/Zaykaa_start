import os
import logging
import requests

logger = logging.getLogger(__name__)

CHEF_SERVICE_URL = os.getenv("CHEF_SERVICE_URL", "http://127.0.0.1:5003")
TIMEOUT = 3


def fetch_recipe_context(user_message: str) -> str:
    """Fetch a small slice of recipes from chef_service to give AI context.
    Silently returns '' if service is down so the bot still works via pure AI."""
    try:
        # Try the public recipes endpoint
        r = requests.get(f"{CHEF_SERVICE_URL}/api/v1/recipes", timeout=TIMEOUT)
        if r.status_code != 200:
            return ""

        data = r.json()
        recipes = data.get("data") or data.get("recipes") or data if isinstance(data, list) else []
        if not recipes:
            return ""

        # Keep context short — first 15 recipes, names + ingredients only
        lines = []
        for rec in recipes[:15]:
            name = rec.get("name") or rec.get("title") or "Unnamed"
            ingredients = rec.get("ingredients") or rec.get("ingredient_list") or ""
            chef = rec.get("chef_name") or rec.get("chef") or ""
            line = f"- {name}"
            if chef:
                line += f" (by {chef})"
            if ingredients:
                # Trim long ingredient strings
                ing_str = str(ingredients)[:200]
                line += f" — ingredients: {ing_str}"
            lines.append(line)

        return "\n".join(lines)

    except Exception as e:
        logger.debug(f"Recipe context fetch failed: {e}")
        return ""