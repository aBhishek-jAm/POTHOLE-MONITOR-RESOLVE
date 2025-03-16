// Fetch zone-wise reports from the backend
async function fetchZoneReports() {
    try {
        const response = await fetch("http://127.0.0.1:5000/api/zone-reports");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const reports = await response.json();

        // Render the chart
        const ctx = document.getElementById('zoneChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: reports.map(report => report.zone),
                datasets: [{
                    label: 'Issues Reported',
                    data: reports.map(report => report.issues_reported),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
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