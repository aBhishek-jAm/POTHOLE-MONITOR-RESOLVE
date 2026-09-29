from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime
import os
from flask_cors import CORS
import logging
import hashlib

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Database setup
DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "database", "db.sqlite3")


def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db


def init_db():
    """Initialize the database with required tables and seed data."""
    with app.app_context():
        db = get_db()

        # Create issues table
        db.execute("""
            CREATE TABLE IF NOT EXISTS issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                location TEXT NOT NULL,
                zone TEXT DEFAULT 'Unknown',
                status TEXT DEFAULT 'reported',
                user_id INTEGER NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                image_data TEXT
            )
        """)

        # Create users table
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
                password TEXT NOT NULL
            )
        """)

        # Create admins table for BBMP dashboard login
        db.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )
        """)

        # Ensure 'zone' column exists in issues table (migration for older DBs)
        try:
            db.execute("SELECT zone FROM issues LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE issues ADD COLUMN zone TEXT DEFAULT 'Unknown'")
            logger.info("Added 'zone' column to issues table.")

        # Seed default user if table is empty
        if db.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            hashed_password = hash_password("user123")
            db.execute("""
                INSERT INTO users (email, phone, dob, bio, profile_image, points, daily_points, last_activity_date, password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "user@roadhealth.com", "+91 9876543210", "1990-01-01",
                "I love reporting road issues!", None, 0, 0,
                str(datetime.today().date()), hashed_password
            ))

        # Seed default admin if table is empty
        if db.execute("SELECT COUNT(*) FROM admins").fetchone()[0] == 0:
            db.execute("""
                INSERT INTO admins (username, password) VALUES (?, ?)
            """, ("admin", hash_password("admin123")))

        db.commit()
        logger.info("Database initialized successfully.")


# ----- Helpers -----

def hash_password(password):
    """Hash a password with SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(hashed_password, input_password):
    """Verify a password against its hash."""
    return hashed_password == hash_password(input_password)


def extract_zone_from_location(location_str):
    """Extract a rough zone name from lat,lng coordinates.
    
    This maps Bangalore coordinates to BBMP zones for demo purposes.
    """
    try:
        lat, lng = map(float, location_str.split(","))
    except (ValueError, AttributeError):
        return "Unknown"

    # Simplified Bangalore zone mapping
    if lat > 13.05:
        if lng < 77.55:
            return "West Zone"
        else:
            return "East Zone"
    else:
        if lng < 77.55:
            return "South-West Zone"
        else:
            return "South-East Zone"


# ----- Auth Endpoints -----

@app.route("/api/login", methods=["POST"])
def login():
    """Login endpoint for regular users (email + password)."""
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


@app.route("/api/signup", methods=["POST"])
def signup():
    """Signup endpoint for new users."""
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")
        phone = data.get("phone", "")

        if not email or not password:
            return jsonify({"message": "Email and password are required!"}), 400

        db = get_db()

        # Check if user already exists
        existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            return jsonify({"message": "An account with this email already exists!"}), 409

        hashed = hash_password(password)
        db.execute("""
            INSERT INTO users (email, phone, password, points, daily_points, last_activity_date)
            VALUES (?, ?, ?, 0, 0, ?)
        """, (email, phone, hashed, str(datetime.today().date())))
        db.commit()

        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        return jsonify({
            "message": "Signup successful!",
            "user_id": user["id"],
            "email": user["email"]
        }), 201

    except Exception as e:
        logger.error(f"Error during signup: {str(e)}")
        return jsonify({"message": "An error occurred during signup."}), 500


@app.route("/api/admin-login", methods=["POST"])
def admin_login():
    """Login endpoint for BBMP dashboard admins (username + password)."""
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"message": "Username and password are required!"}), 400

        db = get_db()
        admin = db.execute("SELECT * FROM admins WHERE username = ?", (username,)).fetchone()

        if admin and verify_password(admin["password"], password):
            return jsonify({
                "message": "Login successful!",
                "admin_id": admin["id"],
                "username": admin["username"]
            })
        else:
            return jsonify({"message": "Invalid username or password!"}), 401

    except Exception as e:
        logger.error(f"Error during admin login: {str(e)}")
        return jsonify({"message": "An error occurred during login."}), 500


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    """Forgot password endpoint — simulates sending a reset link."""
    try:
        data = request.json
        email = data.get("email")

        if not email:
            return jsonify({"message": "Email is required!"}), 400

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if user:
            return jsonify({"message": "Password reset link sent to your email."})
        else:
            return jsonify({"message": "Email not found!"}), 404

    except Exception as e:
        logger.error(f"Error during forgot password: {str(e)}")
        return jsonify({"message": "An error occurred during forgot password."}), 500


# ----- Issue Endpoints -----

@app.route("/api/report-issue", methods=["POST"])
def report_issue():
    """Report a road issue (pothole, crack, etc.)."""
    try:
        data = request.json
        logger.debug(f"Received report-issue data: {data}")

        # Validate required fields
        required_fields = ["type", "location", "user_id", "timestamp"]
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return jsonify({"message": f"Missing required field: {field}"}), 400

        issue_type = data.get("type")
        location = data.get("location")
        user_id = data.get("user_id")
        timestamp = data.get("timestamp")
        image_data = data.get("image_data", "")
        zone = extract_zone_from_location(location)

        db = get_db()

        # Check if the user exists
        user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({"message": "User not found!"}), 404

        today = str(datetime.today().date())

        # Reset daily points if it's a new day
        last_activity = user["last_activity_date"] or ""
        if last_activity != today:
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

        # Check if the issue already exists at this location
        existing_issue = db.execute("""
            SELECT * FROM issues
            WHERE type = ? AND location = ?
        """, (issue_type, location)).fetchone()

        if existing_issue:
            points = 2  # Duplicate report: award 2 points
        else:
            points = 10  # New issue: award 10 points
            db.execute("""
                INSERT INTO issues (type, location, zone, user_id, timestamp, image_data)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (issue_type, location, zone, user_id, timestamp, image_data))

        # Update user points
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


@app.route("/api/get-issues", methods=["GET"])
def get_issues():
    """Get all reported issues."""
    try:
        db = get_db()
        issues = db.execute("SELECT * FROM issues ORDER BY timestamp DESC").fetchall()
        return jsonify([dict(issue) for issue in issues])
    except Exception as e:
        logger.error(f"Error fetching issues: {str(e)}")
        return jsonify({"message": "An error occurred while fetching issues."}), 500


@app.route("/api/get-issue", methods=["GET"])
def get_issue():
    """Get a single issue by ID."""
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


@app.route("/api/update-issue-status", methods=["POST"])
def update_issue_status():
    """Update the status of an issue (reported → in-progress → resolved)."""
    try:
        data = request.json
        issue_id = data.get("issue_id")
        new_status = data.get("status")

        if not issue_id or not new_status:
            return jsonify({"message": "Issue ID and status are required!"}), 400

        valid_statuses = ["reported", "verified", "in-progress", "resolved"]
        if new_status not in valid_statuses:
            return jsonify({"message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

        db = get_db()
        db.execute("UPDATE issues SET status = ? WHERE id = ?", (new_status, issue_id))
        db.commit()

        return jsonify({"message": "Issue status updated successfully!"})
    except Exception as e:
        logger.error(f"Error updating issue status: {str(e)}")
        return jsonify({"message": "An error occurred while updating issue status."}), 500


# ----- User Profile Endpoints -----

@app.route("/api/user-profile", methods=["GET"])
def get_user_profile():
    """Get user profile and stats."""
    try:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"message": "User ID is required!"}), 400

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({"message": "User not found!"}), 404

        total_faults = db.execute(
            "SELECT COUNT(*) FROM issues WHERE user_id = ?", (user_id,)
        ).fetchone()[0]
        verified_faults = db.execute(
            "SELECT COUNT(*) FROM issues WHERE user_id = ? AND status = 'verified'", (user_id,)
        ).fetchone()[0]

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


@app.route("/api/update-profile", methods=["POST"])
def update_profile():
    """Update user profile details."""
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


# ----- Analytics Endpoints -----

@app.route("/api/zone-reports", methods=["GET"])
def get_zone_reports():
    """Get issue counts grouped by zone."""
    try:
        db = get_db()
        reports = db.execute("""
            SELECT zone, COUNT(*) as issues_reported
            FROM issues
            GROUP BY zone
            ORDER BY issues_reported DESC
        """).fetchall()
        return jsonify([dict(report) for report in reports])
    except Exception as e:
        logger.error(f"Error fetching zone reports: {str(e)}")
        return jsonify({"message": "An error occurred while fetching zone reports."}), 500


@app.route("/api/dashboard-stats", methods=["GET"])
def get_dashboard_stats():
    """Get aggregate stats for the BBMP dashboard."""
    try:
        db = get_db()
        total = db.execute("SELECT COUNT(*) FROM issues").fetchone()[0]
        reported = db.execute("SELECT COUNT(*) FROM issues WHERE status = 'reported'").fetchone()[0]
        in_progress = db.execute("SELECT COUNT(*) FROM issues WHERE status = 'in-progress'").fetchone()[0]
        resolved = db.execute("SELECT COUNT(*) FROM issues WHERE status = 'resolved'").fetchone()[0]

        return jsonify({
            "total_issues": total,
            "reported": reported,
            "in_progress": in_progress,
            "resolved": resolved
        })
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({"message": "An error occurred while fetching stats."}), 500


# ----- Health Check -----

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "Road Health API is running."})


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)