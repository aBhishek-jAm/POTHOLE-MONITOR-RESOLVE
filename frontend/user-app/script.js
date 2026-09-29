// ----- Login -----
document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://127.0.0.1:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok && result.message === "Login successful!") {
            localStorage.setItem("user", JSON.stringify(result));
            window.location.href = "home.html";
        } else {
            alert(result.message || "Invalid email or password!");
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("Failed to login. Please check that the backend server is running.");
    }
});

// ----- Signup -----
document.getElementById("signup-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const phone = document.getElementById("signup-phone").value;
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm").value;

    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    if (password.length < 4) {
        alert("Password must be at least 4 characters.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, phone, password }),
        });

        const result = await response.json();

        if (response.ok) {
            alert("Signup successful! Please login.");
            toggleToLogin();
        } else {
            alert(result.message || "Signup failed!");
        }
    } catch (error) {
        console.error("Error during signup:", error);
        alert("Failed to sign up. Please check that the backend server is running.");
    }
});

// ----- Toggle Login / Signup -----
function toggleToSignup() {
    document.getElementById("login-form").style.display = "none";
    document.querySelector("#login-form + p").style.display = "none"; // "Don't have..."
    document.querySelector("#login-form + p + p").style.display = "none"; // "Forgot..."
    document.getElementById("signup-form").style.display = "block";
    document.getElementById("login-link-wrapper").style.display = "block";
}

function toggleToLogin() {
    document.getElementById("login-form").style.display = "block";
    document.querySelector("#login-form + p").style.display = "block";
    document.querySelector("#login-form + p + p").style.display = "block";
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("login-link-wrapper").style.display = "none";
}

document.getElementById("signup-link").addEventListener("click", function (e) {
    e.preventDefault();
    toggleToSignup();
});

document.getElementById("login-link").addEventListener("click", function (e) {
    e.preventDefault();
    toggleToLogin();
});

// ----- Forgot Password -----
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const result = await response.json();
        alert(result.message);
        forgotPasswordModal.style.display = "none";
    } catch (error) {
        console.error("Error during forgot password:", error);
        alert("Failed to reset password. Please try again.");
    }
});