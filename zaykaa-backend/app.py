# app.py
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from urllib.parse import quote

load_dotenv()

app = Flask(__name__)

# ================= DATABASE CONFIG =================
db_user = os.getenv('DB_USER', 'root')
db_password = os.getenv('DB_PASSWORD', '')
db_host = os.getenv('DB_HOST', 'localhost')
db_name = os.getenv('DB_NAME', 'zaykaa_db')

encoded_password = quote(db_password, safe='')

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f'mysql+pymysql://{db_user}:{encoded_password}@{db_host}/{db_name}'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# ================= GLOBAL OPTIONS HANDLER =================
@app.before_request
def handle_global_options():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

JWT_SECRET = os.getenv('JWT_SECRET', 'change-me-in-env')

# ================= MODELS =================

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Chef(db.Model):
    __tablename__ = 'chefs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True)
    name = db.Column(db.String(120), nullable=False)
    specialties = db.Column(db.String(255))
    hourly_rate = db.Column(db.Integer, default=800)
    rating = db.Column(db.Float, default=0)
    reviews = db.Column(db.Integer, default=0)
    image = db.Column(db.String(255))


class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    restaurant_name = db.Column(db.String(120))
    total_amount = db.Column(db.Integer)
    status = db.Column(db.String(50), default='placed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ================= HELPERS =================

def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password, hashed):
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False

def generate_token(user):
    payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def get_token_from_request():
    auth = request.headers.get('Authorization')
    if not auth:
        return None
    parts = auth.split()
    return parts[1] if len(parts) == 2 else None

def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except Exception:
        return None

def get_current_user():
    token = get_token_from_request()
    if not token:
        return None
    payload = verify_token(token)
    if not payload:
        return None
    return User.query.get(payload['user_id'])

# ================= AUTH =================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data or not all(k in data for k in ['name', 'email', 'password', 'role']):
        return jsonify({'message': 'Missing required fields'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 409

    user = User(
        name=data['name'],
        email=data['email'],
        password=hash_password(data['password']),
        role=data['role']
    )

    db.session.add(user)
    db.session.commit()

    if data['role'] == 'chef':
        chef = Chef(
            user_id=user.id,
            name=user.name,
            specialties=",".join(data.get('specialties', []))
        )
        db.session.add(chef)
        db.session.commit()

    return jsonify({'message': 'Registration successful'}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'message': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not verify_password(data['password'], user.password):
        return jsonify({'message': 'Invalid email or password'}), 401

    token = generate_token(user)

    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    }), 200

# ================= CHEFS =================

@app.route('/api/chefs/available', methods=['GET'])
def get_available_chefs():
    chefs = Chef.query.all()
    return jsonify({
        'chefs': [
            {
                'id': c.id,
                'name': c.name,
                'specialties': c.specialties.split(',') if c.specialties else [],
                'hourly_rate': c.hourly_rate,
                'rating': c.rating,
                'reviews': c.reviews,
                'image': c.image or 'https://via.placeholder.com/300'
            } for c in chefs
        ]
    }), 200


@app.route('/api/chefs/<int:chef_id>/availability', methods=['GET'])
def chef_availability(chef_id):
    chef = Chef.query.get(chef_id)
    if not chef:
        return jsonify({'message': 'Chef not found'}), 404

    return jsonify({
        'chefId': chef_id,
        'availability': [
            {'date': '2026-02-08', 'slots': ['breakfast', 'lunch', 'dinner']},
            {'date': '2026-02-09', 'slots': ['lunch', 'dinner']}
        ]
    }), 200

# ================= RESTAURANTS =================

@app.route('/api/restaurants', methods=['GET'])
def get_restaurants():
    location = request.args.get('location')
    return jsonify({
        'restaurants': [
            {
                'id': 1,
                'name': 'Zaykaa Special',
                'location': location or 'Bangalore',
                'rating': 4.5,
                'image': 'https://via.placeholder.com/300',
                'dishes': [],
                'menu': []
            }
        ]
    }), 200

# ================= ORDERS =================

@app.route('/api/orders', methods=['POST'])
def place_order():
    user = get_current_user()
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    data = request.get_json()

    order = Order(
        user_id=user.id,
        restaurant_name=data.get('restaurantName', 'Zaykaa'),
        total_amount=data.get('amount', 0),
        status='placed'
    )

    db.session.add(order)
    db.session.commit()

    return jsonify({
        'message': 'Order placed successfully',
        'order': {
            'id': order.id,
            'restaurant': order.restaurant_name,
            'amount': order.total_amount,
            'status': order.status
        }
    }), 201


@app.route('/api/orders/recent', methods=['GET'])
def recent_orders():
    user = get_current_user()
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    orders = (
        Order.query
        .filter_by(user_id=user.id)
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )

    return jsonify({
        'orders': [
            {
                'id': o.id,
                'restaurant': o.restaurant_name,
                'amount': o.total_amount,
                'status': o.status,
                'createdAt': o.created_at.isoformat()
            } for o in orders
        ]
    }), 200

# ================= BOOKINGS =================

@app.route('/api/bookings', methods=['GET', 'POST'])
def bookings():
    user = get_current_user()
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    if request.method == 'POST':
        return jsonify({
            'message': 'Booking created successfully',
            'booking': {
                'id': 1,
                'status': 'confirmed'
            }
        }), 201

    return jsonify({'bookings': []}), 200

# ================= HEALTH =================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'Backend running correctly'}), 200

# ================= INIT & RUN =================

def init_db():
    with app.app_context():
        db.create_all()
        print("✅ Database checked/created")

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    init_db()
    print(f"Legacy backend bound to port {port}")
    print("🚀 Backend running on http://0.0.0.0:5000")
    app.run(debug=True, host='0.0.0.0', port=port)
