const video = document.getElementById("video");
const startRecord = document.getElementById("start-record");
const stopRecord = document.getElementById("stop-record");
const detectionResults = document.getElementById("detection-results");

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let pointsEarned = 0; // Track points earned

// Roboflow API configuration
const roboflowConfig = {
    apiUrl: "https://detect.roboflow.com",
    apiKey: "qZzpZz6ybap4lO7ZmEw4", // Replace with your API key
    modelId: "water-pothole-detection/1", // Use only one model
};

// Function to run inference using Roboflow API
async function runInference(imageData) {
    const apiUrl = `${roboflowConfig.apiUrl}/${roboflowConfig.modelId}?api_key=${roboflowConfig.apiKey}`;

    try {
        // Convert base64 image data to a Blob
        const blob = await fetch(`data:image/jpeg;base64,${imageData}`).then(res => res.blob());

        // Create a FormData object and append the image
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error running inference:", error);
        return { predictions: [] }; // Return empty predictions if inference fails
    }
}

// Access the camera and start video stream
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: "video/mp4" });
            const url = URL.createObjectURL(blob);
            detectionResults.innerHTML = `<p>Video recorded! <a href="${url}" download="road-issue.mp4">Download</a></p>`;
            recordedChunks = [];
        };
    })
    .catch(error => {
        console.error("Error accessing camera:", error);
        alert("Failed to access camera. Please allow camera permissions.");
    });

// Start recording
startRecord.addEventListener("click", () => {
    mediaRecorder.start();
    startRecord.disabled = true;
    stopRecord.disabled = false;
    isRecording = true;
    processFrames();
});

// Stop recording
stopRecord.addEventListener("click", () => {
    if (pointsEarned >= 50) {
        mediaRecorder.stop();
        startRecord.disabled = false;
        stopRecord.disabled = true;
        isRecording = false;
    } else {
        alert("You need to earn 50 points before stopping the recording.");
    }
});

// Function to draw bounding boxes on the video stream
function drawBoundingBoxes(canvas, predictions) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

    predictions.forEach(prediction => {
        const { x, y, width, height } = prediction;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Add label
        ctx.fillStyle = "red";
        ctx.font = "14px Arial";
        ctx.fillText("Pothole", x, y - 5);
    });
}

// Function to process frames in real-time
async function processFrames() {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    while (isRecording && pointsEarned < 50) {
        try {
            // Capture frame from video
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = generateRandomHash(); // Use random hash instead of actual image data

            // Fixed geolocation
            const location = { latitude: 13.073706, longitude: 77.499817 };
            const timestamp = new Date().toLocaleString();

            // Run inference on the model
            const inferenceResult = await runInference(imageData);

            // Draw bounding boxes on the canvas
            if (inferenceResult.predictions.length > 0) {
                drawBoundingBoxes(canvas, inferenceResult.predictions);
            }

            // Check for detected faults
            if (inferenceResult.predictions.length > 0) {
                // Determine the issue type (only pothole in this case)
                const issueType = "pothole";

                // Send data to BBMP dashboard
                const result = await sendToBBMPDashboard({
                    type: issueType,
                    location: `${location.latitude},${location.longitude}`,
                    user_id: 1, // Replace with the actual user ID
                    timestamp: timestamp,
                    image_data: imageData,
                });

                // Update points earned
                pointsEarned += result.points;
                console.log(`Points earned: ${pointsEarned}`);
            }
        } catch (error) {
            console.error("Error processing frame:", error);
        }

        // Wait for the next frame
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Process every 1 second
    }

    if (pointsEarned >= 50) {
        alert("Congratulations! You have earned 50 points.");
        mediaRecorder.stop();
        startRecord.disabled = false;
        stopRecord.disabled = true;
        isRecording = false;
    }
}

// Function to send data to BBMP dashboard
async function sendToBBMPDashboard(data) {
    try {
        const response = await fetch("http://127.0.0.1:5000/api/report-issue", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        console.log("Data sent to BBMP dashboard:", result);
        return result;
    } catch (error) {
        console.error("Error sending data to BBMP dashboard:", error);
        throw error;
    }
}

// Function to generate a random hash
function generateRandomHash() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Function to get the user's location (not used in this version)
function getLocation() {
    return new Promise((resolve, reject) => {
        resolve({ latitude: 13.073706, longitude: 77.499817 });
    });
}