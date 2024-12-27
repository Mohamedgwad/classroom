// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Store user data in localStorage
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // Update UI elements if they exist
        updateUIForAuth(user);
    } else {
        // Clear user data from localStorage
        localStorage.removeItem('user');
        updateUIForAuth(null);
    }
});

// UI Update Function
function updateUIForAuth(user) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const profileImage = document.getElementById('profileImage');
    const dropdownProfileImg = document.getElementById('dropdownProfileImg');
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const googleSignInBtn = document.getElementById('googleSignInBtn');

    if (user) {
        if (userName) userName.textContent = user.displayName || user.email;
        if (userEmail) userEmail.textContent = user.email;
        
        // Update profile images if available
        if (user.photoURL) {
            if (profileImage) profileImage.src = user.photoURL;
            if (dropdownProfileImg) dropdownProfileImg.src = user.photoURL;
        }

        if (signInBtn) signInBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'block';
        if (googleSignInBtn) googleSignInBtn.style.display = 'none';
    } else {
        if (userName) userName.textContent = 'Not signed in';
        if (userEmail) userEmail.textContent = '';
        
        // Reset profile images
        if (profileImage) profileImage.src = '/image/unnamed.png';
        if (dropdownProfileImg) dropdownProfileImg.src = '/image/unnamed.png';

        if (signInBtn) signInBtn.style.display = 'block';
        if (signOutBtn) signOutBtn.style.display = 'none';
        if (googleSignInBtn) googleSignInBtn.style.display = 'block';
    }
}

// Auth Functions
async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Google sign in error:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

async function signInWithEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Email sign in error:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

async function signUpWithEmail(email, password, displayName) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with display name
        await updateProfile(result.user, { displayName });
        
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

async function signOutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

// Database Functions
async function createClass(classData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User must be signed in to create a class');

        const newClass = {
            ...classData,
            createdBy: user.uid,
            creatorEmail: user.email,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp(),
            members: {
                [user.uid]: {
                    role: 'teacher',
                    name: user.displayName || user.email,
                    email: user.email,
                    joined: serverTimestamp()
                }
            }
        };

        const docRef = await addDoc(collection(db, 'classes'), newClass);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Create class error:', error);
        return { success: false, error: error.message };
    }
}

async function joinClass(classCode) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User must be signed in to join a class');

        const q = query(collection(db, 'classes'), where('classCode', '==', classCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error('Invalid class code');
        }

        const classDoc = querySnapshot.docs[0];
        const classData = classDoc.data();

        if (classData.members?.[user.uid]) {
            throw new Error('You are already a member of this class');
        }

        await updateDoc(doc(db, 'classes', classDoc.id), {
            [`members.${user.uid}`]: {
                role: 'student',
                name: user.displayName || user.email,
                email: user.email,
                joined: serverTimestamp()
            },
            lastModified: serverTimestamp()
        });

        return { success: true, classId: classDoc.id };
    } catch (error) {
        console.error('Join class error:', error);
        return { success: false, error: error.message };
    }
}

// Utility Functions
function getAuthErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Operation not allowed',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/popup-closed-by-user': 'Sign-in popup was closed',
        'auth/cancelled-popup-request': 'Sign-in operation cancelled',
        'auth/popup-blocked': 'Sign-in popup was blocked by the browser'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again';
}

// firebase-config.js

// ... (previous imports and config)

// Function to update profile images
function updateProfileImages(user) {
  const profileImage = document.getElementById('profileImage');
  const dropdownProfileImg = document.getElementById('dropdownProfileImg');
  
  if (user && user.photoURL) {
      // For Google profile photo, add size parameter
      const photoURL = user.photoURL.includes('googleusercontent.com') 
          ? `${user.photoURL.split('=')[0]}=s96-c` // Get high quality Google photo
          : user.photoURL;

      if (profileImage) {
          profileImage.src = photoURL;
          profileImage.onerror = () => {
              profileImage.src = '/image/unnamed.png';
          };
      }
      
      if (dropdownProfileImg) {
          dropdownProfileImg.src = photoURL;
          dropdownProfileImg.onerror = () => {
              dropdownProfileImg.src = '/image/unnamed.png';
          };
      }
  } else {
      // Set default image if no photo URL
      if (profileImage) profileImage.src = '/image/unnamed.png';
      if (dropdownProfileImg) dropdownProfileImg.src = '/image/unnamed.png';
  }
}

// Updated Auth State Observer
auth.onAuthStateChanged((user) => {
  if (user) {
      // Store user data in localStorage
      const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          photoURL: user.photoURL
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // Update UI and profile images
      updateUIForAuth(user);
      updateProfileImages(user);

      // For Google Sign In specifically
      if (user.providerData[0].providerId === 'google.com') {
          // Force refresh to get latest photo
          user.reload().then(() => {
              updateProfileImages(user);
          });
      }
  } else {
      localStorage.removeItem('user');
      updateUIForAuth(null);
      updateProfileImages(null);
  }
});

// Updated Google Sign In Function
async function signInWithGoogle() {
  try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Immediately update profile images after Google sign in
      updateProfileImages(user);
      
      return { success: true, user };
  } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

// ... (rest of your code)

export {
  // ... (previous exports)
  updateProfileImages
};

// Helper Functions
function generateClassCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

// Export everything needed
export {
    auth,
    db,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    createClass,
    joinClass,
    generateClassCode,
    getAuthErrorMessage
};

// Initialize auth state listener
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('User is signed in:', user.email);
    } else {
        console.log('User is signed out');
    }
});
