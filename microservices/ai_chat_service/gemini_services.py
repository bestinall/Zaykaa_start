import time
from google import genai
from google.genai import types
from google.genai import errors as genai_errors


SYSTEM_INSTRUCTION = """You are "Zaykaa Chef AI" — a friendly, expert cooking assistant for the Zaykaa food platform.

YOUR ROLE:
- Help users find or create recipes based on ingredients they have
- Suggest specific recipes when users name them
- Answer cooking, food, nutrition, and meal-planning questions
- Be warm, encouraging, and practical

FORMATTING STYLE (IMPORTANT):
- Use emojis generously and naturally to make responses lively and visual. Examples:
  🍅 tomato, 🧄 garlic, 🧅 onion, 🌿 herbs, 🧀 cheese, 🥖 bread, 🍝 pasta,
  🍳 cooking, 🔥 heat, ⏱️ time, 👩‍🍳 chef, 🥗 salad, 🍽️ serving, ✨ tip,
  🛒 ingredients, 📝 steps, 💡 idea, 👍 recommendation
- Use Markdown for structure: `##` for recipe names, `###` for sections (Ingredients, Instructions, Tips), `**bold**` for key terms, bullet lists for ingredients, numbered lists for steps.
- Keep a warm, encouraging, slightly playful tone.
- Start recipe sections with a relevant emoji, e.g. `### 🛒 Ingredients`, `### 📝 Instructions`, `### ✨ Chef's Tip`.

WORKFLOW:
1. If you are given EXISTING recipes from the Zaykaa database in the context, PREFER suggesting those first — mention the recipe name and chef if available.
2. If none of the existing recipes match, GENERATE a valid, detailed recipe yourself. Include:
   - Recipe name (as an H2 heading with an emoji)
   - ⏱️ Cooking time and 🍽️ servings
   - 🛒 Ingredient list (with quantities)
   - 📝 Step-by-step instructions
   - ✨ Optional tips/variations
3. If the user lists ingredients, suggest 2-3 realistic dishes they can cook (as a short bulleted list with emojis).
4. If ingredients are missing for a known recipe, suggest substitutions.

RULES:
- Stay focused on food, cooking, recipes, and nutrition.
- If asked about unrelated topics, politely redirect: "I'm your cooking assistant — let's talk food! 🍳"
- Keep recipes realistic and safe (no harmful ingredient combinations).
- Always use clear Markdown formatting so the frontend can render it beautifully.
"""


import time
from google import genai
from google.genai import types
from google.genai import errors as genai_errors


SYSTEM_INSTRUCTION = """..."""  # keep your existing one


class GeminiService:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        # Primary model, then fallbacks if primary is overloaded
        self.models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]
        self.generate_config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.8,
            top_p=0.95,
            top_k=40,
            max_output_tokens=1024,
        )

    def generate(self, user_message: str, history: list, recipe_context: str = "") -> str:
        contents = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(role=role, parts=[types.Part(text=msg["content"])])
            )

        full_prompt = user_message
        if recipe_context:
            full_prompt = (
                f"[DATABASE CONTEXT — existing Zaykaa recipes you can reference]\n"
                f"{recipe_context}\n\n"
                f"[USER MESSAGE]\n{user_message}"
            )

        contents.append(
            types.Content(role="user", parts=[types.Part(text=full_prompt)])
        )

        last_error = None

        # Try each model with retries for 503s
        for model_name in self.models:
            for attempt in range(3):  # 3 tries per model
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=self.generate_config,
                    )
                    return response.text or "I couldn't generate a response — try rephrasing?"
                except genai_errors.ServerError as e:
                    last_error = e
                    # 503 = overloaded, retry with backoff
                    if "503" in str(e) or "UNAVAILABLE" in str(e):
                        wait = 2 ** attempt  # 1s, 2s, 4s
                        time.sleep(wait)
                        continue
                    # Other server errors: move to next model
                    break
                except Exception as e:
                    last_error = e
                    break

        # All models + retries exhausted
        raise last_error or RuntimeError("All Gemini models unavailable")