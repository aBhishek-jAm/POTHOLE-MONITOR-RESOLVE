document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://127.0.0.1:5000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.message === "Login successful!") {
            window.location.href = "dashboard.html";
        } else {
            alert("Invalid username or password!");
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("Failed to login. Please try again.");
    }
});