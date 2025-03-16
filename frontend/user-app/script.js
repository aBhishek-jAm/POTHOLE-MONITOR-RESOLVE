document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://127.0.0.1:5000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.message === "Login successful!") {
            // Store user data in localStorage
            localStorage.setItem("user", JSON.stringify(result));
            window.location.href = "home.html";
        } else {
            alert("Invalid email or password!");
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("Failed to login. Please try again.");
    }
});

document.getElementById("signup-link").addEventListener("click", function (e) {
    e.preventDefault();
    alert("Redirect to signup page (not implemented yet)");
});

// Forgot Password Logic
const forgotPasswordModal = document.getElementById("forgot-password-modal");
const forgotPasswordLink = document.getElementById("forgot-password-link");
const closeModal = document.querySelector(".close");

forgotPasswordLink.addEventListener("click", function (e) {
    e.preventDefault();
    forgotPasswordModal.style.display = "block";
});

closeModal.addEventListener("click", function () {
    forgotPasswordModal.style.display = "none";
});

window.addEventListener("click", function (event) {
    if (event.target === forgotPasswordModal) {
        forgotPasswordModal.style.display = "none";
    }
});

document.getElementById("forgot-password-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("forgot-email").value;

    try {
        const response = await fetch("http://127.0.0.1:5000/api/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        alert(result.message);
        forgotPasswordModal.style.display = "none";
    } catch (error) {
        console.error("Error during forgot password:", error);
        alert("Failed to reset password. Please try again.");
    }
});