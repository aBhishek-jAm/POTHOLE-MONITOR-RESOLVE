// ----- API Base URL -----
const API_BASE = window.location.origin;

const video = document.getElementById("video");
const startRecord = document.getElementById("start-record");
const stopRecord = document.getElementById("stop-record");
const detectionResults = document.getElementById("detection-results");

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let pointsEarned = 0;

// Check if user is logged in
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
    alert("Please login first.");
    window.location.href = "index.html";
}

// Handle logout
document.getElementById("logout-btn").addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.removeItem("user");
    window.location.href = "index.html";
});

// Roboflow API configuration
// NOTE: In production, move the API key to a backend proxy to avoid exposing it
const roboflowConfig = {
    apiUrl: "https://detect.roboflow.com",
    apiKey: "YOUR_API_KEY_HERE", // Replace with your Roboflow API key
    modelId: "water-pothole-detection/1",
};

// Run inference using Roboflow API
async function runInference(imageData) {
    const apiUrl = `${roboflowConfig.apiUrl}/${roboflowConfig.modelId}?api_key=${roboflowConfig.apiKey}`;

    try {
        const blob = await fetch(`data:image/jpeg;base64,${imageData}`).then(res => res.blob());
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error running inference:", error);
        return { predictions: [] };
    }
}

// Access the camera and start video stream
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
        video.srcObject = stream;
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            detectionResults.innerHTML += `<p>Video recorded! <a href="${url}" download="road-issue.webm">Download</a></p>`;
            recordedChunks = [];
        };
    })
    .catch(error => {
        console.error("Error accessing camera:", error);
        detectionResults.innerHTML = `<p class="error">Failed to access camera. Please allow camera permissions and refresh the page.</p>`;
    });

// Start recording
startRecord.addEventListener("click", () => {
    if (!mediaRecorder) {
        alert("Camera not ready. Please allow camera permissions and refresh.");
        return;
    }
    mediaRecorder.start();
    startRecord.disabled = true;
    stopRecord.disabled = false;
    isRecording = true;
    pointsEarned = 0;
    detectionResults.innerHTML = "<p>Recording... detecting road issues...</p>";
    processFrames();
});

// Stop recording
stopRecord.addEventListener("click", () => {
    mediaRecorder.stop();
    startRecord.disabled = false;
    stopRecord.disabled = true;
    isRecording = false;
    detectionResults.innerHTML += `<p>Recording stopped. Total points earned this session: ${pointsEarned}</p>`;
});

// Draw bounding boxes on canvas overlay
function drawBoundingBoxes(canvas, predictions) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(prediction => {
        const { x, y, width, height } = prediction;
        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - width / 2, y - height / 2, width, height);

        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 14px Arial";
        ctx.fillText(`${prediction.class} (${(prediction.confidence * 100).toFixed(0)}%)`, x - width / 2, y - height / 2 - 8);
    });
}

// Get user's current geolocation
function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }),
                () => resolve({ latitude: 12.9716, longitude: 77.5946 }) // Fallback to Bangalore center
            );
        } else {
            resolve({ latitude: 12.9716, longitude: 77.5946 });
        }
    });
}

// Process video frames for detection
async function processFrames() {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");

    while (isRecording) {
        try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/jpeg", 0.7).split(",")[1]; // Base64 encoded

            const location = await getLocation();
            const timestamp = new Date().toISOString();

            const inferenceResult = await runInference(imageData);

            if (inferenceResult.predictions && inferenceResult.predictions.length > 0) {
                drawBoundingBoxes(canvas, inferenceResult.predictions);

                const issueType = inferenceResult.predictions[0].class || "pothole";

                const result = await sendToBBMPDashboard({
                    type: issueType,
                    location: `${location.latitude},${location.longitude}`,
                    user_id: user.user_id,
                    timestamp: timestamp,
                    image_data: imageData.substring(0, 200), // Truncated for storage
                });

                if (result.points) {
                    pointsEarned += result.points;
                    detectionResults.innerHTML = `
                        <p>🔍 Detected: <strong>${issueType}</strong></p>
                        <p>📍 Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</p>
                        <p>⭐ Points this session: ${pointsEarned}</p>
                    `;
                }
            }
        } catch (error) {
            console.error("Error processing frame:", error);
        }

        // Process every 2 seconds to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}

// Send detected issue to backend
async function sendToBBMPDashboard(data) {
    try {
        const response = await fetch(`${API_BASE}/api/report-issue`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        console.log("Issue reported:", result);
        return result;
    } catch (error) {
        console.error("Error sending data to backend:", error);
        return { points: 0 };
    }
}