from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime
import os
from flask_cors import CORS
import logging
import hashlib  # For password hashing

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Database setup
DATABASE = os.path.join(os.path.dirname(__file__), "../database/db.sqlite3")

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    with app.app_context():
        db = get_db()
        db.execute("""
            CREATE TABLE IF NOT EXISTS issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                location TEXT NOT NULL,
                status TEXT DEFAULT 'reported',
                user_id INTEGER NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                image_data TEXT  -- New column for base64-encoded image
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                phone TEXT,
                dob DATE,
                bio TEXT,
                profile_image TEXT,
                points INTEGER DEFAULT 0,
                daily_points INTEGER DEFAULT 0,
                last_activity_date DATE,
                password TEXT NOT NULL  -- Add password field
            )
        """)
        # Add a default user if the table is empty
        if db.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            hashed_password = hashlib.sha256("bbmp123".encode()).hexdigest()  # Hash the default password
            db.execute("""
                INSERT INTO users (email, phone, dob, bio, profile_image, points, daily_points, last_activity_date, password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ("bbmp@example.com", "+91 9876543210", "1990-01-01", "I love reporting road issues!", "default-profile.png", 0, 0, datetime.today().date(), hashed_password))
        db.commit()

# Helper function to hash passwords
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Helper function to verify passwords
def verify_password(hashed_password, input_password):
    return hashed_password == hash_password(input_password)

# Login endpoint
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email and password are required!"}), 400

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if user and verify_password(user["password"], password):
            return jsonify({
                "message": "Login successful!",
                "user_id": user["id"],
                "email": user["email"],
                "phone": user["phone"],
                "dob": user["dob"],
                "bio": user["bio"],
                "profile_image": user["profile_image"],
                "points": user["points"],
                "daily_points": user["daily_points"]
            })
        else:
            return jsonify({"message": "Invalid email or password!"}), 401

    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return jsonify({"message": "An error occurred during login."}), 500

# Forgot password endpoint
@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.json
        email = data.get("email")

        if not email:
            return jsonify({"message": "Email is required!"}), 400

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if user:
            # Simulate sending a password reset link (replace with actual email sending logic)
            return jsonify({"message": "Password reset link sent to your email."})
        else:
            return jsonify({"message": "Email not found!"}), 404

    except Exception as e:
        logger.error(f"Error during forgot password: {str(e)}")
        return jsonify({"message": "An error occurred during forgot password."}), 500

# Report issue endpoint
@app.route("/api/report-issue", methods=["POST"])
def report_issue():
    try:
        data = request.json
        logger.debug(f"Received data: {data}")

        # Validate required fields
        required_fields = ["type", "location", "user_id", "timestamp", "image_data"]
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return jsonify({"message": f"Missing required field: {field}"}), 400

        issue_type = data.get("type")
        location = data.get("location")
        user_id = data.get("user_id")
        timestamp = data.get("timestamp")
        image_data = data.get("image_data")

        db = get_db()

        # Check if the user exists
        user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({"message": "User not found!"}), 404

        today = datetime.today().date()

        # Reset daily points if it's a new day
        if user["last_activity_date"] != today:
            db.execute("""
                UPDATE users SET daily_points = 0, last_activity_date = ? WHERE id = ?
            """, (today, user_id))
            db.commit()
            daily_points = 0
        else:
            daily_points = user["daily_points"]

        # Check if the user has reached the daily limit
        if daily_points >= 50:
            return jsonify({"message": "Daily points limit reached! Try again tomorrow."}), 400

        # Check if the issue already exists
        existing_issue = db.execute("""
            SELECT * FROM issues
            WHERE type = ? AND location = ?
        """, (issue_type, location)).fetchone()

        points = 0

        if existing_issue:
            # Issue already reported: award 2 points
            points = 2
        else:
            # New issue: award 10 points
            points = 10
            # Insert the new issue
            db.execute("""
                INSERT INTO issues (type, location, user_id, timestamp, image_data)
                VALUES (?, ?, ?, ?, ?)
            """, (issue_type, location, user_id, timestamp, image_data))
            db.commit()

        # Update user points and daily points
        db.execute("""
            UPDATE users
            SET points = points + ?, daily_points = daily_points + ?, last_activity_date = ?
            WHERE id = ?
        """, (points, points, today, user_id))
        db.commit()

        return jsonify({
            "message": f"Issue reported successfully! You earned {points} points.",
            "points": points,
            "daily_points": daily_points + points
        })

    except sqlite3.Error as e:
        logger.error(f"Database error: {str(e)}")
        return jsonify({"message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Error in report_issue: {str(e)}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

# Get user profile endpoint
@app.route("/api/user-profile", methods=["GET"])
def get_user_profile():
    try:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"message": "User ID is required!"}), 400

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({"message": "User not found!"}), 404

        # Fetch user stats
        total_faults = db.execute("SELECT COUNT(*) FROM issues WHERE user_id = ?", (user_id,)).fetchone()[0]
        verified_faults = db.execute("SELECT COUNT(*) FROM issues WHERE user_id = ? AND status = 'verified'", (user_id,)).fetchone()[0]

        return jsonify({
            "email": user["email"],
            "phone": user["phone"],
            "dob": user["dob"],
            "bio": user["bio"],
            "profile_image": user["profile_image"],
            "total_faults": total_faults,
            "verified_faults": verified_faults,
            "total_points": user["points"],
            "todays_earnings": user["daily_points"],
        })

    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        return jsonify({"message": "An error occurred while fetching user profile."}), 500

# Update profile endpoint
@app.route("/api/update-profile", methods=["POST"])
def update_profile():
    try:
        data = request.json
        user_id = data.get("user_id")
        dob = data.get("dob")
        bio = data.get("bio")
        profile_image = data.get("profile_image")

        if not user_id:
            return jsonify({"message": "User ID is required!"}), 400

        db = get_db()
        db.execute("""
            UPDATE users
            SET dob = ?, bio = ?, profile_image = ?
            WHERE id = ?
        """, (dob, bio, profile_image, user_id))
        db.commit()

        return jsonify({"message": "Profile updated successfully!"})

    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        return jsonify({"message": "An error occurred while updating profile."}), 500

# Get all issues endpoint
@app.route("/api/get-issues", methods=["GET"])
def get_issues():
    try:
        db = get_db()
        issues = db.execute("SELECT * FROM issues").fetchall()
        return jsonify([dict(issue) for issue in issues])
    except Exception as e:
        logger.error(f"Error fetching issues: {str(e)}")
        return jsonify({"message": "An error occurred while fetching issues."}), 500

# Get single issue endpoint
@app.route("/api/get-issue", methods=["GET"])
def get_issue():
    try:
        issue_id = request.args.get("id")
        if not issue_id:
            return jsonify({"message": "Issue ID is required!"}), 400

        db = get_db()
        issue = db.execute("SELECT * FROM issues WHERE id = ?", (issue_id,)).fetchone()
        if not issue:
            return jsonify({"message": "Issue not found!"}), 404
        return jsonify(dict(issue))
    except Exception as e:
        logger.error(f"Error fetching issue: {str(e)}")
        return jsonify({"message": "An error occurred while fetching issue."}), 500

# Update issue status endpoint
@app.route("/api/update-issue-status", methods=["POST"])
def update_issue_status():
    try:
        data = request.json
        issue_id = data.get("issue_id")
        new_status = data.get("status")

        if not issue_id or not new_status:
            return jsonify({"message": "Issue ID and status are required!"}), 400

        db = get_db()
        db.execute("""
            UPDATE issues
            SET status = ?
            WHERE id = ?
        """, (new_status, issue_id))
        db.commit()

        return jsonify({"message": "Issue status updated successfully!"})
    except Exception as e:
        logger.error(f"Error updating issue status: {str(e)}")
        return jsonify({"message": "An error occurred while updating issue status."}), 500

# Get zone reports endpoint
@app.route("/api/zone-reports", methods=["GET"])
def get_zone_reports():
    try:
        db = get_db()
        reports = db.execute("""
            SELECT zone, COUNT(*) as issues_reported
            FROM issues
            GROUP BY zone
        """).fetchall()
        return jsonify([dict(report) for report in reports])
    except Exception as e:
        logger.error(f"Error fetching zone reports: {str(e)}")
        return jsonify({"message": "An error occurred while fetching zone reports."}), 500

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)