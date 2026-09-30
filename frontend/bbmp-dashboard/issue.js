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

// Fetch issue details from the backend
async function fetchIssueDetails() {
    try {
        const issueId = new URLSearchParams(window.location.search).get("id");
        if (!issueId) {
            document.getElementById("issue-content").innerHTML = '<p style="color:red;">No issue ID provided.</p>';
            return;
        }

        const response = await fetch(`${API_BASE}/api/get-issue?id=${issueId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const issue = await response.json();

        const issueContent = document.getElementById("issue-content");
        issueContent.innerHTML = `
            <p><strong>ID:</strong> ${issue.id}</p>
            <p><strong>Type:</strong> ${issue.type}</p>
            <p><strong>Zone:</strong> ${issue.zone || 'Unknown'}</p>
            <p><strong>Location:</strong> ${issue.location}</p>
            <p><strong>Status:</strong> ${issue.status}</p>
            <p><strong>Timestamp:</strong> ${issue.timestamp}</p>
            <p><strong>Reported by User ID:</strong> ${issue.user_id}</p>
            ${issue.image_data ? `<p><strong>Image Data:</strong> (captured)</p>` : ''}
            <hr style="margin: 16px 0;">
            <p><strong>Update Status:</strong></p>
            <button onclick="updateStatus(${issue.id}, 'verified')">Verify</button>
            <button onclick="updateStatus(${issue.id}, 'in-progress')">In Progress</button>
            <button onclick="updateStatus(${issue.id}, 'resolved')" style="background:#198754;">Resolve</button>
        `;
    } catch (error) {
        console.error("Error fetching issue details:", error);
        document.getElementById("issue-content").innerHTML = '<p style="color:red;">Failed to load issue details.</p>';
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
            alert(result.message);
            fetchIssueDetails(); // Reload
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status.");
    }
}

// Load issue details when the page loads
window.onload = fetchIssueDetails;