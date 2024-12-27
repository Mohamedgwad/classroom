// Import Firebase SDK
import { 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9PG9lUZfTMZp5ILp6PJ9fsWS5IjmLzJ4",
    authDomain: "calss-85357.firebaseapp.com",
    projectId: "calss-85357",
    storageBucket: "calss-85357.firebasestorage.app",
    messagingSenderId: "155474296679",
    appId: "1:155474296679:web:bb96af4d171395affff9c2",
    measurementId: "G-F1HQQXRF9G"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const googleSignInBtn = document.getElementById('googleSignIn');
    const forgotPasswordBtn = document.getElementById('forgotPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('loginEmail').value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById('loginEmail').value.trim();
        const password = passwordInput.value;

        if (!validateInputs(email, password)) return;

        try {
            showLoading(true);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            if (rememberMeCheckbox.checked) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            localStorage.setItem('user', JSON.stringify({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName,
                photoURL: userCredential.user.photoURL
            }));

            showToast('Login successful! Redirecting...');
            
            setTimeout(() => {
                window.location.href = '../main/main.html';
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            handleAuthError(error);
        } finally {
            showLoading(false);
        }
    });

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            try {
                showLoading(true);

                const provider = new GoogleAuthProvider();
                provider.addScope('https://www.googleapis.com/auth/userinfo.email');
                provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

                const result = await signInWithPopup(auth, provider);

                const credential = GoogleAuthProvider.credentialFromResult(result);
                const user = result.user;

                localStorage.setItem('user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    accessToken: credential.accessToken
                }));

                showToast('Google sign-in successful! Redirecting...');
                
                setTimeout(() => {
                    window.location.href = '../main/main.html';
                }, 1000);

            } catch (error) {
                console.error('Google sign-in error:', error);
                handleAuthError(error);
            } finally {
                showLoading(false);
            }
        });
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();

            if (!email) {
                showError('Please enter your email address to reset password');
                return;
            }

            if (!isValidEmail(email)) {
                showError('Please enter a valid email address');
                return;
            }

            try {
                showLoading(true);
                await sendPasswordResetEmail(auth, email);
                showToast('Password reset email sent. Please check your inbox.');
            } catch (error) {
                console.error('Password reset error:', error);
                handleAuthError(error);
            } finally {
                showLoading(false);
            }
        });
    }

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePasswordBtn.querySelector('.material-icons').textContent = 
                type === 'password' ? 'visibility_off' : 'visibility';
        });
    }
});

function validateInputs(email, password) {
    if (!email) {
        showError('Please enter your email');
        return false;
    }

    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return false;
    }

    if (!password) {
        showError('Please enter your password');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function handleAuthError(error) {
    console.error('Auth error:', error);
    const errorMessage = getAuthErrorMessage(error.code);
    showError(errorMessage);
}

function getAuthErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
        'auth/cancelled-popup-request': 'Another sign-in request is pending.',
        'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
        'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.',
        'auth/network-request-failed': 'A network error occurred. Please check your connection and try again.',
        'auth/timeout': 'The operation has timed out. Please try again.',
        'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.',
        'auth/email-already-in-use': 'This email is already registered. Please sign in or reset your password.'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again';
}

function showError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.style.display = 'block';
    }
}

function clearErrors() {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = '';
        loginError.style.display = 'none';
    }
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

auth.onAuthStateChanged((user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        }));

        if (!window.location.href.includes('main.html')) {
            window.location.href = '../main/main.html';
        }
    }
});
