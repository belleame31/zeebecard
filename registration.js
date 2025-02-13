import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBjzwFpYLd5iqKqUOXne1zSibwN2XN1pqc",
    authDomain: "jebecard-9e48d.firebaseapp.com",
    projectId: "jebecard-9e48d",
    storageBucket: "jebecard-9e48d.firebasestorage.app",
    messagingSenderId: "986658878850",
    appId: "1:986658878850:web:a3d577d260068a00f74b9b",
    measurementId: "G-7RNPSLGCK0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Get references to the form and the status message div
const signUpForm = document.getElementById("sign-up-form");
const statusMessageDiv = document.getElementById("status-message");

// Handle sign-up form submission
signUpForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent page reload on form submission

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Clear any previous messages
    statusMessageDiv.textContent = "";

    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Account created successfully!", userCredential);

        // Display success message
        statusMessageDiv.style.color = "green"; // Change the text color to green
        statusMessageDiv.textContent = "Account created successfully! You can now log in.";

        // Redirect to the login page after a short delay (e.g., 2 seconds)
        setTimeout(() => {
            window.location.href = "login.html"; // Redirect to login page
        }, 2000); // 2-second delay

    } catch (error) {
        // Handle errors during registration
        const errorCode = error.code;
        const errorMessage = error.message;

        console.error("Error Code:", errorCode);
        console.error("Error Message:", errorMessage);

        // Display error message
        statusMessageDiv.style.color = "red"; // Change text color to red
        statusMessageDiv.textContent = `Error: ${errorMessage}`;
    }
});
