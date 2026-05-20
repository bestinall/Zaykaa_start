import os
import uuid
import jwt
import mysql.connector
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=os.environ.get("CORS_ORIGINS", "*").split(","))

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), os.environ.get("UPLOAD_FOLDER", "uploads"))
MAX_SIZE_MB = int(os.environ.get("MAX_UPLOAD_SIZE_MB", 50))
app.config["MAX_CONTENT_LENGTH"] = MAX_SIZE_MB * 1024 * 1024

ALLOWED_IMAGE = {"png", "jpg", "jpeg", "gif", "webp"}
ALLOWED_VIDEO = {"mp4", "webm", "mov"}

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ISSUER = os.environ.get("JWT_ISSUER", "zaykaa")

# ---------- DB ----------
def get_db():
    return mysql.connector.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ["DB_PORT"]),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
    )

def bootstrap_schema():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS zaykaa_vlogger_service (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            username VARCHAR(120),
            caption TEXT,
            dish_name VARCHAR(200),
            restaurant_name VARCHAR(200),
            media_type ENUM('image','video') NOT NULL,
            media_url VARCHAR(500) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_created (created_at)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_like (post_id, user_id),
            INDEX idx_post (post_id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id VARCHAR(36) PRIMARY KEY,
            post_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            username VARCHAR(120),
            text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_post (post_id)
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

# ---------- Auth ----------
def jwt_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "missing_token"}), 401
        try:
            payload = jwt.decode(auth.split()[1], JWT_SECRET, algorithms=["HS256"], issuer=JWT_ISSUER)
            request.user_id = payload.get("user_id") or payload.get("sub")
            request.username = payload.get("name") or payload.get("email", "user")
            request.role = payload.get("role", "user")
        except jwt.InvalidTokenError as e:
            return jsonify({"error": "invalid_token", "detail": str(e)}), 401
        return f(*args, **kwargs)
    return wrapper

# ---------- Helpers ----------
def allowed(filename, allowed_set):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_set

def save_upload(file, subfolder, allowed_set):
    if not allowed(file.filename, allowed_set):
        return None
    ext = file.filename.rsplit(".", 1)[1].lower()
    fname = f"{uuid.uuid4().hex}.{ext}"
    folder = os.path.join(UPLOAD_FOLDER, subfolder)
    os.makedirs(folder, exist_ok=True)
    file.save(os.path.join(folder, fname))
    return f"/api/vlogger/media/{subfolder}/{fname}"

# ---------- Routes ----------
@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "vlogger_service"})

@app.get("/api/vlogger/media/<subfolder>/<filename>")
def serve_media(subfolder, filename):
    return send_from_directory(os.path.join(UPLOAD_FOLDER, subfolder), filename)

@app.post("/api/posts")
@jwt_required
def create_post():
    if "file" not in request.files:
        return jsonify({"error": "file_required"}), 400
    file = request.files["file"]
    caption = request.form.get("caption", "")
    dish = request.form.get("dish_name", "")
    restaurant = request.form.get("restaurant_name", "")

    if allowed(file.filename, ALLOWED_IMAGE):
        media_type = "image"
        url = save_upload(file, "images", ALLOWED_IMAGE)
    elif allowed(file.filename, ALLOWED_VIDEO):
        media_type = "video"
        url = save_upload(file, "videos", ALLOWED_VIDEO)
    else:
        return jsonify({"error": "unsupported_file_type"}), 400

    post_id = str(uuid.uuid4())
    conn = get_db(); cur = conn.cursor()
    cur.execute("""
        INSERT INTO posts (id, user_id, username, caption, dish_name, restaurant_name, media_type, media_url)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (post_id, request.user_id, request.username, caption, dish, restaurant, media_type, url))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"id": post_id, "media_url": url, "media_type": media_type}), 201

@app.get("/api/posts")
def list_posts():
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT p.*,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
        FROM posts p ORDER BY p.created_at DESC LIMIT 100
    """)
    rows = cur.fetchall(); cur.close(); conn.close()
    for r in rows:
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
    return jsonify(rows)

@app.post("/api/posts/<post_id>/like")
@jwt_required
def toggle_like(post_id):
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT id FROM likes WHERE post_id=%s AND user_id=%s", (post_id, request.user_id))
    existing = cur.fetchone()
    if existing:
        cur.execute("DELETE FROM likes WHERE id=%s", (existing[0],))
        liked = False
    else:
        cur.execute("INSERT INTO likes (post_id, user_id) VALUES (%s,%s)", (post_id, request.user_id))
        liked = True
    conn.commit(); cur.close(); conn.close()
    return jsonify({"liked": liked})

@app.post("/api/posts/<post_id>/comments")
@jwt_required
def add_comment(post_id):
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text_required"}), 400
    cid = str(uuid.uuid4())
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO comments (id, post_id, user_id, username, text) VALUES (%s,%s,%s,%s,%s)",
                (cid, post_id, request.user_id, request.username, text))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"id": cid, "text": text}), 201

@app.get("/api/posts/<post_id>/comments")
def get_comments(post_id):
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM comments WHERE post_id=%s ORDER BY created_at ASC", (post_id,))
    rows = cur.fetchall(); cur.close(); conn.close()
    for r in rows:
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
    return jsonify(rows)

@app.get("/api/top/dishes")
def top_dishes():
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT dish_name,
               COUNT(*) AS post_count,
               (SELECT COUNT(*) FROM likes l JOIN posts p2 ON l.post_id=p2.id WHERE p2.dish_name=p.dish_name) AS likes,
               MAX(media_url) AS sample_image
        FROM posts p
        WHERE dish_name IS NOT NULL AND dish_name <> ''
        GROUP BY dish_name
        ORDER BY likes DESC, post_count DESC
        LIMIT 10
    """)
    rows = cur.fetchall(); cur.close(); conn.close()
    return jsonify(rows)

@app.get("/api/top/restaurants")
def top_restaurants():
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT restaurant_name,
               COUNT(*) AS post_count,
               (SELECT COUNT(*) FROM likes l JOIN posts p2 ON l.post_id=p2.id WHERE p2.restaurant_name=p.restaurant_name) AS likes
        FROM posts p
        WHERE restaurant_name IS NOT NULL AND restaurant_name <> ''
        GROUP BY restaurant_name
        ORDER BY likes DESC, post_count DESC
        LIMIT 10
    """)
    rows = cur.fetchall(); cur.close(); conn.close()
    return jsonify(rows)

@app.delete("/api/posts/<post_id>")
@jwt_required
def delete_post(post_id):
    conn = get_db(); cur = conn.cursor(dictionary=True)
    
    # 1. Verify post exists and belongs to this vlogger
    cur.execute("SELECT user_id, media_url FROM posts WHERE id = %s", (post_id,))
    post = cur.fetchone()
    
    if not post:
        cur.close(); conn.close()
        return jsonify({"error": "post_not_found"}), 404
        
    # Change this line inside your delete_post function in your app.py file:
    if str(post["user_id"]) != str(request.user_id):
        cur.close(); conn.close()
        return jsonify({"error": "unauthorized_delete"}), 403
        
    # 2. Delete the actual file from disk storage
    # Extract relative path from /api/vlogger/media/images/filename.jpg
    media_path = post["media_url"].replace("/api/vlogger/media/", "")
    absolute_path = os.path.join(UPLOAD_FOLDER, media_path.replace("/", os.sep))
    
    if os.path.exists(absolute_path):
        os.remove(absolute_path)
        
    # 3. Clean up DB records (Likes and comments will cascade if foreign keys match)
    cur.execute("DELETE FROM likes WHERE post_id = %s", (post_id,))
    cur.execute("DELETE FROM comments WHERE post_id = %s", (post_id,))
    cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
    
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "post_deleted_successfully"})

@app.get("/api/vlogger/profile/stats")
@jwt_required
def get_vlogger_stats():
    conn = get_db(); cur = conn.cursor(dictionary=True)
    
    # Fetch all posts belonging to the logged-in vlogger
    cur.execute("""
        SELECT p.*,
               (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
               (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
        FROM posts p 
        WHERE p.user_id = %s 
        ORDER BY p.created_at DESC
    """, (request.user_id,))
    my_posts = cur.fetchall()
    
    # Format dates
    total_likes = 0
    for p in my_posts:
        total_likes += p["like_count"]
        if isinstance(p.get("created_at"), datetime):
            p["created_at"] = p["created_at"].isoformat()
            
    stats = {
        "total_posts": len(my_posts),
        "total_likes_received": total_likes,
        "posts": my_posts
    }
    
    cur.close(); conn.close()
    return jsonify(stats)

if __name__ == "__main__":
    bootstrap_schema()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5008)), debug=True)