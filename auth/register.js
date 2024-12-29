// register.js
import { 
    createUserWithEmailAndPassword,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    getFirestore,
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerButton = document.getElementById('registerButton');
    const db = getFirestore(); // Initialize Firestore

    if (registerForm && registerButton) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            try {
                registerButton.disabled = true;
                registerButton.textContent = 'Creating Account...';

                if (!validateForm(firstName, lastName, email, password, confirmPassword)) {
                    registerButton.disabled = false;
                    registerButton.textContent = 'Create Account';
                    return;
                }

                showLoading(true);

                // Create user in Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Update user profile
                await updateProfile(user, {
                    displayName: `${firstName} ${lastName}`
                });

                // Store additional user data in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    createdAt: new Date().toISOString(),
                    role: 'student' // or whatever default role you want
                });

                showToast('Account created successfully!');

                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);

            } catch (error) {
                console.error('Registration error:', error);
                handleAuthError(error);
                registerButton.disabled = false;
                registerButton.textContent = 'Create Account';
            } finally {
                showLoading(false);
            }
        });
    }
});

document.getElementById('registerPassword')?.addEventListener('input', (e) => {
    const password = e.target.value;
    const requirements = validatePassword(password);
    updatePasswordRequirements(requirements);
});

// Add these setup calls for password toggles
document.addEventListener('DOMContentLoaded', () => {
    // Existing code...

    // Setup password toggles
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordButton = document.getElementById('togglePassword');
    const toggleConfirmPasswordButton = document.getElementById('toggleConfirmPassword');

    if (togglePasswordButton && passwordInput) {
        setupPasswordToggle(togglePasswordButton, passwordInput);
    }
    if (toggleConfirmPasswordButton && confirmPasswordInput) {
        setupPasswordToggle(toggleConfirmPasswordButton, confirmPasswordInput);
    }
});

// Password validation function
function validatePassword(password) {
    return {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*]/.test(password)
    };
}

// Update password requirement indicators
function updatePasswordRequirements(requirements) {
    const elements = {
        length: document.getElementById('lengthReq'),
        upper: document.getElementById('upperReq'),
        lower: document.getElementById('lowerReq'),
        number: document.getElementById('numberReq'),
        special: document.getElementById('specialReq')
    };

    for (const [requirement, met] of Object.entries(requirements)) {
        if (elements[requirement]) {
            elements[requirement].classList.toggle('met', met);
        }
    }

    return Object.values(requirements).every(Boolean);
}

// Form validation
function validateForm(firstName, lastName, email, password, confirmPassword) {
    let isValid = true;

    if (!firstName) {
        showError('firstName', 'First name is required');
        isValid = false;
    }

    if (!lastName) {
        showError('lastName', 'Last name is required');
        isValid = false;
    }

    if (!email) {
        showError('email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }

    const passwordRequirements = validatePassword(password);
    if (!Object.values(passwordRequirements).every(Boolean)) {
        showError('password', 'Password does not meet all requirements');
        isValid = false;
    }

    if (password !== confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

// Password toggle functionality
function setupPasswordToggle(toggleButton, inputField) {
    toggleButton.addEventListener('click', () => {
        const type = inputField.type === 'password' ? 'text' : 'password';
        inputField.type = type;
        toggleButton.querySelector('.material-icons').textContent = 
            type === 'password' ? 'visibility_off' : 'visibility';
    });
}

// Error handling
function handleAuthError(error) {
    console.error('Auth error:', error);
    const errorMessage = getAuthErrorMessage(error.code);
    showError('registerError', errorMessage);
}

function getAuthErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled',
        'auth/weak-password': 'Password is too weak',
        'auth/network-request-failed': 'Network error. Please check your connection'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again';
}

// Utility functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(field, message) {
    const errorElement = document.querySelector(`[data-error="${field}"]`) ||
                        document.getElementById('registerError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(error => {
        error.textContent = '';
        error.style.display = 'none';
    });
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    toastMessage.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', duration);
}

// Initialize toast close button
document.querySelector('.toast-close')?.addEventListener('click', () => {
    document.getElementById('toast').style.display = 'none';
});
