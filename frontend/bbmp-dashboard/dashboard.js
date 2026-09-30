// ----- API Base URL -----
const API_BASE = window.location.origin;

// Check admin login
const admin = JSON.parse(localStorage.getItem("admin"));
if (!admin) {
    window.location.href = "index.html";
}

// Handle logout
document.getElementById("logout-btn").addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.removeItem("admin");
    window.location.href = "index.html";
});

// Initialize the map
const map = L.map('map').setView([12.9716, 77.5946], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Fetch dashboard stats
async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE}/api/dashboard-stats`);
        if (!response.ok) return;
        const stats = await response.json();

        document.getElementById("stat-total").textContent = stats.total_issues || 0;
        document.getElementById("stat-reported").textContent = stats.reported || 0;
        document.getElementById("stat-progress").textContent = stats.in_progress || 0;
        document.getElementById("stat-resolved").textContent = stats.resolved || 0;
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

// Fetch and display issues
async function fetchIssues() {
    try {
        const response = await fetch(`${API_BASE}/api/get-issues`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const issues = await response.json();

        // Add markers to the map
        issues.forEach(issue => {
            try {
                const [lat, lng] = issue.location.split(",").map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                    const color = issue.status === 'resolved' ? 'green' :
                                  issue.status === 'in-progress' ? 'orange' : 'red';

                    const icon = L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`,
                        iconSize: [12, 12]
                    });

                    L.marker([lat, lng], { icon }).addTo(map)
                        .bindPopup(`<b>${issue.type}</b><br>Zone: ${issue.zone || 'Unknown'}<br>Status: ${issue.status}`);
                }
            } catch (e) {
                console.warn("Invalid location for issue:", issue.id);
            }
        });

        // Populate the issues table
        const tableBody = document.querySelector("#issues-table tbody");
        tableBody.innerHTML = "";

        if (issues.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;">No issues reported yet.</td></tr>';
            return;
        }

        issues.forEach(issue => {
            const statusClass = `status-${issue.status.replace(' ', '-')}`;
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${issue.id}</td>
                <td>${issue.type}</td>
                <td>${issue.zone || 'Unknown'}</td>
                <td>${issue.location}</td>
                <td><span class="status-badge ${statusClass}">${issue.status}</span></td>
                <td>${issue.timestamp}</td>
                <td>
                    ${issue.status !== 'resolved' ? `
                        <button class="action-btn" onclick="updateStatus(${issue.id}, 'verified')">Verify</button>
                        <button class="action-btn" onclick="updateStatus(${issue.id}, 'in-progress')">In Progress</button>
                        <button class="action-btn resolve" onclick="updateStatus(${issue.id}, 'resolved')">Resolve</button>
                    ` : '<span style="color:#198754;font-weight:bold;">✓ Done</span>'}
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching issues:", error);
    }
}

// Update issue status
async function updateStatus(issueId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/api/update-issue-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ issue_id: issueId, status: newStatus }),
        });

        const result = await response.json();
        if (response.ok) {
            // Reload data
            fetchStats();
            fetchIssues();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status.");
    }
}

// Load everything
window.onload = function () {
    fetchStats();
    fetchIssues();
};