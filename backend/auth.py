import json
import os
import hashlib
import secrets
from datetime import datetime

AUTH_DB_PATH = os.path.join(os.path.dirname(__file__), 'users.json')

def load_users():
    if not os.path.exists(AUTH_DB_PATH):
        return {}
    with open(AUTH_DB_PATH, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(AUTH_DB_PATH, 'w') as f:
        json.dump(users, f, indent=2)

def hash_password(password):
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(password, stored):
    try:
        salt, hashed = stored.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == hashed
    except:
        return False

def register_user(username, password, full_name, role='Doctor'):
    users = load_users()
    if username in users:
        return False, "Username already exists"
    users[username] = {
        "username":   username,
        "password":   hash_password(password),
        "full_name":  full_name,
        "role":       role,
        "created_at": datetime.now().isoformat(),
        "last_login": None
    }
    save_users(users)
    return True, "Account created successfully"

def login_user(username, password):
    users = load_users()
    if username not in users:
        return False, "User not found"
    user = users[username]
    if not verify_password(password, user['password']):
        return False, "Incorrect password"
    # Update last login
    users[username]['last_login'] = datetime.now().isoformat()
    save_users(users)
    return True, user

def get_all_users():
    users = load_users()
    # Return without passwords
    return [
        {
            "username":   u["username"],
            "full_name":  u["full_name"],
            "role":       u["role"],
            "created_at": u["created_at"],
            "last_login": u["last_login"]
        }
        for u in users.values()
    ]

def delete_user(username):
    users = load_users()
    if username in users:
        del users[username]
        save_users(users)
        return True
    return False

def update_user(username, full_name=None, role=None, password=None):
    users = load_users()
    if username not in users:
        return False
    if full_name: users[username]['full_name'] = full_name
    if role:      users[username]['role'] = role
    if password:  users[username]['password'] = hash_password(password)
    save_users(users)
    return True

# Create default admin on first run
def init_default_admin():
    users = load_users()
    if 'admin' not in users:
        register_user('admin', 'admin123', 'Dr. Ranveer Singh', 'Admin')
        print("✅ Default admin created: username=admin, password=admin123")