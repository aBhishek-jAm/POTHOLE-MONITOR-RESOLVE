# 🛣️ Road Health App & BBMP Dashboard

A comprehensive system for crowdsourced road issue detection (like potholes) using ML/Computer Vision, and a dashboard for authorities (BBMP) to manage and resolve them.

## 📁 Project Structure

```
road-health/
├── backend/               # Flask API backend
│   └── app.py             # Main server handling Auth, Issues, and DB operations
├── database/              # SQLite Database storage
│   └── db.sqlite3         # Auto-generated database file
├── frontend/              # Web interfaces
│   ├── user-app/          # Crowdsourcing Web App (Mobile-friendly)
│   │   ├── index.html     # Login/Signup page
│   │   ├── home.html      # Camera feed & pothole detection interface
│   │   └── profile.html   # User stats & profile details
│   └── bbmp-dashboard/    # Admin Dashboard
│       ├── index.html     # Admin login portal
│       ├── dashboard.html # Main dashboard with Map & Stats
│       └── zone-reports.html # Analytics charts
├── final_project/         # Standalone ML training scripts and local GUI tools
│   ├── pothole_detect.py  # Local Tkinter detection GUI
│   └── models/            # (Ignored) YOLO weights
├── .gitignore             # Ignores large ML models and DB files
└── requirements.txt       # Python dependencies
```

## 🛠️ How to Run the Project

### 1. Setup Backend & Database
1. Open a terminal in the root `road-health` directory.
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask backend server:
   ```bash
   python backend/app.py
   ```
   *The server will start on `http://127.0.0.1:5000` and automatically create the database at `database/db.sqlite3` if it doesn't exist.*

### 2. Run the User App (Citizen App)
1. Open `frontend/user-app/index.html` in your web browser.
2. **Sign up** for a new account.
3. Login and navigate to the **Home** page.
4. Allow camera permissions and click **Start Recording** to detect potholes. (Note: Detection logic uses Roboflow API).

### 3. Run the BBMP Dashboard (Admin)
1. Open `frontend/bbmp-dashboard/index.html` in your web browser.
2. Login using the default admin credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. View reported issues on the map, check zone analytics, and update issue statuses (Verify / In-Progress / Resolve).

## 🚀 Key Fixes Made
* **Backend:** Completely refactored `app.py`. Fixed missing endpoints (`signup`, `admin-login`), fixed date comparison bugs causing crashes, added coordinate-to-zone auto-mapping, and secured database paths.
* **Database:** Recreated with proper schema including `zone` columns and seeded with admin accounts.
* **Dashboard:** Fixed critical login bug (was sending `username` to email endpoint), added complete navigation system, added working stats cards, and fixed CSS styling issues.
* **User App:** Fixed hardcoded user sessions (now properly tracks logged-in user via localStorage), added a real signup form, added navigation bars across pages, fixed camera API usage, and secured the flow.
* **Git:** Added `.gitignore` to prevent pushing 250MB+ model files and videos to GitHub.
