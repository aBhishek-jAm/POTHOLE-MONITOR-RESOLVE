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

// Fetch zone-wise reports from the backend
async function fetchZoneReports() {
    try {
        const response = await fetch(`${API_BASE}/api/zone-reports`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const reports = await response.json();

        if (reports.length === 0) {
            document.querySelector(".chart-wrapper").innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No zone data available yet. Issues will appear here once reported.</p>';
            return;
        }

        const ctx = document.getElementById('zoneChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: reports.map(report => report.zone || 'Unknown'),
                datasets: [{
                    label: 'Issues Reported',
                    data: reports.map(report => report.issues_reported),
                    backgroundColor: [
                        'rgba(13, 110, 253, 0.7)',
                        'rgba(25, 135, 84, 0.7)',
                        'rgba(255, 193, 7, 0.7)',
                        'rgba(220, 53, 69, 0.7)',
                        'rgba(108, 117, 125, 0.7)',
                    ],
                    borderColor: [
                        'rgba(13, 110, 253, 1)',
                        'rgba(25, 135, 84, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(220, 53, 69, 1)',
                        'rgba(108, 117, 125, 1)',
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Issues by Zone',
                        font: { size: 16 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error fetching zone reports:", error);
    }
}

// Load zone reports when the page loads
window.onload = fetchZoneReports;