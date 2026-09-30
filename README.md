# 🛣️ Road Health App & BBMP Dashboard

A comprehensive system for crowdsourced road issue detection (like potholes) using ML/Computer Vision, and a dashboard for authorities (BBMP) to manage and resolve them.

## 📁 Project Structure

```
road-health/
├── backend/               # Flask API backend
│   └── app.py             # Main server — serves API + both frontends
├── database/              # SQLite Database storage
│   └── db.sqlite3         # Auto-generated on first run (gitignored)
├── frontend/              # Web interfaces
│   ├── user-app/          # Crowdsourcing Web App (Mobile-friendly)
│   │   ├── index.html     # Login/Signup page
│   │   ├── home.html      # Camera feed & pothole detection interface
│   │   └── profile.html   # User stats & profile details
│   └── bbmp-dashboard/    # Admin Dashboard
│       ├── index.html     # Admin login portal
│       ├── dashboard.html # Main dashboard with Map & Stats
│       ├── issues-detail.html # Single issue detail view
│       └── zone-reports.html  # Analytics charts
├── final_project/         # Standalone ML training scripts and local GUI tools
│   ├── pothole_detect.py  # Local Tkinter detection GUI
│   └── *.pt              # YOLO weights (gitignored — too large)
├── .gitignore             # Ignores large ML models, videos, and DB files
└── requirements.txt       # Python dependencies
```

## 🚀 Quick Start (One Command)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/road-health.git
cd road-health

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start the server (serves both API + frontend)
python backend/app.py
```

That's it! The server will:
- Auto-create the SQLite database at `database/db.sqlite3`
- Seed a default user and admin account
- Start serving on `http://127.0.0.1:5000`

## 🌐 Accessing the App

Once the server is running, open your browser:

| App | URL | Credentials |
|---|---|---|
| **User App** (Citizen) | [http://127.0.0.1:5000](http://127.0.0.1:5000) | Sign up or use `user@roadhealth.com` / `user123` |
| **BBMP Dashboard** (Admin) | [http://127.0.0.1:5000/admin](http://127.0.0.1:5000/admin) | `admin` / `admin123` |
| **API Health Check** | [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health) | — |

> **Note:** The app also listens on `0.0.0.0`, so you can access it from other devices on your local network using your machine's IP address.

## 📱 User App Flow

1. Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.
2. **Sign up** for a new account (or login with the default user).
3. Navigate to the **Home** page.
4. Allow camera permissions and click **Start Recording** to detect potholes.
   > **Note:** Detection uses the [Roboflow API](https://roboflow.com/). You'll need to replace `YOUR_API_KEY_HERE` in `frontend/user-app/scripts.js` with your own Roboflow API key for live detection.
5. Visit **Profile** to see your stats and reward points.

## 🏛️ Admin Dashboard Flow

1. Open [http://127.0.0.1:5000/admin](http://127.0.0.1:5000/admin) in your browser.
2. Login with `admin` / `admin123`.
3. View reported issues on the interactive map.
4. Update issue statuses: **Verify → In Progress → Resolve**.
5. Check zone-wise analytics under **Zone Reports**.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | User login (email + password) |
| `POST` | `/api/signup` | User registration |
| `POST` | `/api/admin-login` | Admin login (username + password) |
| `POST` | `/api/forgot-password` | Simulate password reset email |
| `POST` | `/api/report-issue` | Report a road issue |
| `GET` | `/api/get-issues` | List all reported issues |
| `GET` | `/api/get-issue?id=N` | Get single issue by ID |
| `POST` | `/api/update-issue-status` | Update issue status |
| `GET` | `/api/user-profile?user_id=N` | Get user profile + stats |
| `POST` | `/api/update-profile` | Update user profile |
| `GET` | `/api/zone-reports` | Zone-wise issue counts |
| `GET` | `/api/dashboard-stats` | Aggregate dashboard statistics |
| `GET` | `/api/health` | Health check |

## 🧠 ML / Local Detection (Optional)

The `final_project/` directory contains a standalone Tkinter-based detection GUI that runs YOLO models locally on video files. This requires:

1. YOLO model weights (`.pt` files) — not included in the repo due to size (~250MB+). Train your own or download from your model provider.
2. Sample videos (`.mp4`) — also excluded from the repo.

```bash
# Run the local detection GUI (requires model weights)
python final_project/pothole_detect.py
```

## 🛠️ Tech Stack

- **Backend:** Python, Flask, SQLite
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Maps:** Leaflet.js + OpenStreetMap
- **Charts:** Chart.js
- **Detection:** Roboflow API (cloud) / YOLO (local)

## 📝 Notes

- All frontend API calls use relative URLs (`window.location.origin`), so the app works on any host/port — no hardcoded localhost.
- The SQLite database is auto-created and auto-seeded on first run. No manual setup needed.
- Model weights (`.pt`) and sample videos (`.mp4`) are gitignored. See the ML section above if you need them.
