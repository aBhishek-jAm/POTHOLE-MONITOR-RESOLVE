// ----- API Base URL -----
const API_BASE = window.location.origin;

document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_BASE}/api/admin-login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const err = await response.json();
            alert(err.message || "Login failed!");
            return;
        }

        const result = await response.json();
        if (result.message === "Login successful!") {
            localStorage.setItem("admin", JSON.stringify(result));
            window.location.href = "dashboard.html";
        } else {
            alert("Invalid username or password!");
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("Failed to login. Please check that the backend server is running.");
    }
});