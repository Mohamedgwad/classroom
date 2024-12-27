// auth/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from './config/firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

class AuthService {
    constructor() {
        this.auth = auth;
        this.currentUser = null;

        // Set up auth state listener
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });
    }

    // Sign up with email and password
    async signUp(email, password, firstName, lastName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                this.auth,
                email,
                password
            );

            // Update profile with user's name
            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`
            });

            return {
                success: true,
                user: userCredential.user
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(
                this.auth,
                email,
                password
            );
            return {
                success: true,
                user: userCredential.user
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, googleProvider);
            return {
                success: true,
                user: result.user
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Sign out
    async signOut() {
        try {
            await signOut(this.auth);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Handle auth state changes
    handleAuthStateChange(user) {
        // Dispatch custom event
        const event = new CustomEvent('authStateChanged', {
            detail: { user }
        });
        document.dispatchEvent(event);

        // Update UI based on auth state
        this.updateUI(user);
    }

    // Update UI based on auth state
    updateUI(user) {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');

        if (userName && userEmail && signInBtn && signOutBtn) {
            if (user) {
                userName.textContent = user.displayName || 'User';
                userEmail.textContent = user.email;
                signInBtn.style.display = 'none';
                signOutBtn.style.display = 'block';
            } else {
                userName.textContent = 'Not signed in';
                userEmail.textContent = '';
                signInBtn.style.display = 'block';
                signOutBtn.style.display = 'none';
            }
        }
    }

    // Error message handler
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'An account with this email already exists',
            'auth/invalid-email': 'Invalid email address',
            'auth/operation-not-allowed': 'Email/password accounts are not enabled',
            'auth/weak-password': 'Password is too weak',
            'auth/user-disabled': 'This account has been disabled',
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/invalid-credential': 'Invalid credentials',
            'auth/too-many-requests': 'Too many attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your connection'
        };
        return errorMessages[errorCode] || 'An error occurred. Please try again';
    }

    // Validate email format
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };

        return {
            isValid: Object.values(requirements).every(Boolean),
            requirements
        };
    }
}

// Create and export instance
const authService = new AuthService();
export default authService;
