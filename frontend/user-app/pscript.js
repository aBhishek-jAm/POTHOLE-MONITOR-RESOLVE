// Check login
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
    window.location.href = "index.html";
}

// Fetch user data from the backend
async function fetchUserData() {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/user-profile?user_id=${user.user_id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch profile");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Failed to load profile. Please check that the backend is running.");
        return null;
    }
}

// Update profile details on the page
async function loadProfile() {
    const userData = await fetchUserData();
    if (!userData) return;

    document.getElementById("user-email").textContent = userData.email || "N/A";
    document.getElementById("user-phone").textContent = userData.phone || "N/A";
    document.getElementById("user-dob").value = userData.dob || "";
    document.getElementById("user-bio").value = userData.bio || "";

    if (userData.profile_image && userData.profile_image !== "null") {
        document.getElementById("profile-image").src = userData.profile_image;
    }

    document.getElementById("total-faults").textContent = userData.total_faults || 0;
    document.getElementById("verified-faults").textContent = userData.verified_faults || 0;
    document.getElementById("total-points").textContent = userData.total_points || 0;
    document.getElementById("todays-earnings").textContent = userData.todays_earnings || 0;
}

// Update profile in the backend
async function updateProfile() {
    const dob = document.getElementById("user-dob").value;
    const bio = document.getElementById("user-bio").value;
    const profileImage = document.getElementById("profile-image").src;

    try {
        const response = await fetch("http://127.0.0.1:5000/api/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: user.user_id,
                dob,
                bio,
                profile_image: profileImage
            }),
        });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
    }
}

// Handle profile photo upload
document.getElementById("upload-photo").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById("profile-image").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle profile update button
document.getElementById("update-profile").addEventListener("click", updateProfile);

// Handle logout
document.getElementById("logout-btn").addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.removeItem("user");
    window.location.href = "index.html";
});

// Load profile data when the page loads
window.onload = loadProfile;