// Initialize the map
const map = L.map('map').setView([12.9716, 77.5946], 12); // Set initial view to Bangalore

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Fetch issues from the backend
async function fetchIssues() {
    try {
        const response = await fetch("http://127.0.0.1:5000/api/get-issues");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const issues = await response.json();

        // Add markers to the map
        issues.forEach(issue => {
            const [lat, lng] = issue.location.split(",").map(Number);
            L.marker([lat, lng]).addTo(map)
                .bindPopup(`<b>${issue.type}</b><br>${issue.status}`);
        });

        // Populate the issues table
        const tableBody = document.querySelector("#issues-table tbody");
        tableBody.innerHTML = ""; // Clear existing rows
        issues.forEach(issue => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${issue.type}</td>
                <td>${issue.location}</td>
                <td>${issue.status}</td>
                <td>${issue.timestamp}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching issues:", error);
    }
}

// Load issues when the page loads
window.onload = fetchIssues;