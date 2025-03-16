// Fetch user data from the backend
async function fetchUserData() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const response = await fetch(`http://127.0.0.1:5000/api/user-profile?user_id=${user.user_id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const data = await response.json();
    return data;
}

// Update profile details on the page
async function loadProfile() {
    const userData = await fetchUserData();

    // Display user details
    document.getElementById("user-email").textContent = userData.email;
    document.getElementById("user-phone").textContent = userData.phone;
    document.getElementById("user-dob").value = userData.dob;
    document.getElementById("user-bio").value = userData.bio;
    document.getElementById("profile-image").src = userData.profile_image || "default-profile.png";

    // Display stats
    document.getElementById("total-faults").textContent = userData.total_faults;
    document.getElementById("verified-faults").textContent = userData.verified_faults;
    document.getElementById("total-points").textContent = userData.total_points;
    document.getElementById("todays-earnings").textContent = userData.todays_earnings;
}

// Update profile in the backend
async function updateProfile() {
    const dob = document.getElementById("user-dob").value;
    const bio = document.getElementById("user-bio").value;
    const profileImage = document.getElementById("profile-image").src;

    const user = JSON.parse(localStorage.getItem("user"));

    const response = await fetch("http://127.0.0.1:5000/api/update-profile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.user_id, dob, bio, profile_image: profileImage }),
    });
    const result = await response.json();
    alert(result.message);
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

// Handle profile update
document.getElementById("update-profile").addEventListener("click", updateProfile);

// Load profile data when the page loads
window.onload = loadProfile;