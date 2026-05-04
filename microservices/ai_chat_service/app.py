import os
import secrets
import logging
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
from gemini_services import GeminiService
from memory_store import MemoryStore
from recipe_context import fetch_recipe_context
from google.genai import errors as genai_errors

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", secrets.token_hex(32))

CORS(app,
     resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}},
     supports_credentials=True)

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
gemini = GeminiService(API_KEY) if API_KEY else None

if gemini is None:
    logger.warning(
        "GEMINI_API_KEY missing; ai_chat_service is starting in degraded mode. "
        "Set microservices/ai_chat_service/.env to enable chat responses."
    )
memory = MemoryStore()


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "healthy" if gemini else "degraded",
            "service": "ai_chat_service",
            "gemini_configured": gemini is not None,
        }
    ), 200


@app.route("/api/ai/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        user_msg = (data.get("message") or "").strip()
        session_id = data.get("session_id") or session.get("chat_sid")

        if not user_msg:
            return jsonify({"error": "message is required"}), 400

        if gemini is None:
            return jsonify(
                {
                    "error": (
                        "AI chat is not configured. Set GEMINI_API_KEY in "
                        "microservices/ai_chat_service/.env and restart the service."
                    )
                }
            ), 503

        if not session_id:
            session_id = secrets.token_hex(12)
            session["chat_sid"] = session_id

        history = memory.get(session_id)

        # Hybrid: fetch recipes from chef_service to give AI context
        recipe_context = fetch_recipe_context(user_msg)

        reply = gemini.generate(user_msg, history, recipe_context)

        memory.append(session_id, "user", user_msg)
        memory.append(session_id, "model", reply)

        return jsonify({"reply": reply, "session_id": session_id}), 200
    except genai_errors.ClientError:
        logger.exception("gemini client error")
        return jsonify(
            {
                "error": (
                    "The AI provider rejected the request. Check GEMINI_API_KEY "
                    "and try again."
                )
            }
        ), 502
    except genai_errors.ServerError:
        logger.exception("gemini server error")
        return jsonify(
            {"error": "The AI provider is temporarily unavailable. Please try again."}
        ), 503
    except Exception as e:
        logger.exception("chat error")
        return jsonify({"error": "Something went wrong, please try again"}), 500


@app.route("/api/ai/clear", methods=["POST"])
def clear():
    data = request.get_json(silent=True) or {}
    sid = data.get("session_id") or session.get("chat_sid")
    if sid:
        memory.clear(sid)
    return jsonify({"status": "cleared"}), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5007))
    app.run(host="127.0.0.1", port=port, debug=False)
