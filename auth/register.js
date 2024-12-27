// register.js
import { 
    createUserWithEmailAndPassword,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const registerForm = document.getElementById('registerForm');
    const registerError = document.getElementById('registerError');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Password Visibility Toggles
    setupPasswordToggle(togglePassword, passwordInput);
    setupPasswordToggle(toggleConfirmPassword, confirmPasswordInput);

    // Password Validation on Input
    passwordInput.addEventListener('input', () => {
        validatePassword(passwordInput.value);
    });

    // Registration Form Submit
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        // Get form values
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validate inputs
        if (!validateForm(firstName, lastName, email, password, confirmPassword)) {
            return;
        }

        try {
            showLoading(true);
            
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile with user's name
            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`
            });

            // Store user data
            localStorage.setItem('user', JSON.stringify({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: `${firstName} ${lastName}`
            }));

            showToast('Account created successfully!');
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '../main/main.html';
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            handleAuthError(error);
        } finally {
            showLoading(false);
        }
    });
});

// Password Toggle Setup
function setupPasswordToggle(toggleButton, inputField) {
    toggleButton.addEventListener('click', () => {
        const type = inputField.type === 'password' ? 'text' : 'password';
        inputField.type = type;
        toggleButton.querySelector('.material-icons').textContent = 
            type === 'password' ? 'visibility_off' : 'visibility';
    });
}

// Password Validation
function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*]/.test(password)
    };

    // Update requirement list UI
    document.getElementById('lengthReq').classList.toggle('met', requirements.length);
    document.getElementById('upperReq').classList.toggle('met', requirements.upper);
    document.getElementById('lowerReq').classList.toggle('met', requirements.lower);
    document.getElementById('numberReq').classList.toggle('met', requirements.number);
    document.getElementById('specialReq').classList.toggle('met', requirements.special);

    return Object.values(requirements).every(Boolean);
}

// Form Validation
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

    if (!validatePassword(password)) {
        showError('password', 'Password does not meet requirements');
        isValid = false;
    }

    if (password !== confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

// Error Handling
function handleAuthError(error) {
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

// Utility Functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(field, message) {
    const errorDiv = document.querySelector(`[data-error="${field}"]`) ||
                    document.getElementById('registerError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
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

    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

// Initialize toast close button
document.querySelector('.toast-close')?.addEventListener('click', () => {
    document.getElementById('toast').style.display = 'none';
});
