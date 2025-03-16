// Fetch issue details from the backend
async function fetchIssueDetails() {
    try {
        const issueId = new URLSearchParams(window.location.search).get("id");
        const response = await fetch(`http://127.0.0.1:5000/api/get-issue?id=${issueId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const issue = await response.json();

        // Display issue details
        const issueContent = document.getElementById("issue-content");
        issueContent.innerHTML = `
            <p><strong>Type:</strong> ${issue.type}</p>
            <p><strong>Location:</strong> ${issue.location}</p>
            <p><strong>Status:</strong> ${issue.status}</p>
            <p><strong>Timestamp:</strong> ${issue.timestamp}</p>
            <img src="${issue.image_data}" alt="Issue Image" style="max-width: 100%;">
        `;
    } catch (error) {
        console.error("Error fetching issue details:", error);
    }
}

// Load issue details when the page loads
window.onload = fetchIssueDetails;