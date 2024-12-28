// script.js
// At the top of script.js
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteField,
  getDoc,
  setDoc,
  writeBatch, // Add this import
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// DOM Elements
const addButton = document.getElementById("addSquare");
const modal = document.getElementById("squareModal");
const closeButtons = document.querySelectorAll(".close");
const form = document.getElementById("squareForm");
const container = document.getElementById("container");
const cancelButtons = document.querySelectorAll(".cancel-btn");
const contextMenu = document.getElementById("contextMenu");
const deleteDialog = document.getElementById("deleteDialog");
const loadingOverlay = document.getElementById("loadingOverlay");
const toast = document.getElementById("toast");
const nav = document.querySelector(".nav");
const sidebar = document.querySelector(".sidebar");
const profileSection = document.getElementById("profileSection");
const profileDropdown = document.getElementById("profileDropdown");
const signOutBtn = document.getElementById("signOutBtn");
const signInBtn = document.getElementById("signInBtn");
const themeSwitch = document.getElementById("checkbox");
const mainActionBtn = document.getElementById("mainActionBtn");
const createClassBtn = document.getElementById("createClassBtn");
const joinClassBtn = document.getElementById("joinClassBtn");
const fabMenu = document.getElementById("fabMenu");
const joinClassModal = document.getElementById("joinClassModal");
const joinClassForm = document.getElementById("joinClassForm");
const safeHandleLeaveClass = withErrorHandler(handleLeaveClass);

// Class Colors Array
const classColors = [
  "#1E88E5",
  "#43A047",
  "#E53935",
  "#8E24AA",
  "#FB8C00",
  "#00ACC1",
  "#3949AB",
  "#D81B60",
  "#6D4C41",
  "#757575",
];

// State Management
let currentCardElement = null;
let classes = [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
});

// Initialize App
function initializeApp() {
  loadSavedTheme();
  setupSidebar();
  checkAuthState();
}

// Auth State Check
function checkAuthState() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      updateUIForAuth(user);
      loadClasses();
    } else {
      window.location.href = "../auth/login.html";
    }
  });
}

// Event Listeners Setup
function setupEventListeners() {
  // Profile and Theme
  profileSection?.addEventListener("click", toggleProfileDropdown);
  document.addEventListener("click", handleOutsideClick);
  themeSwitch?.addEventListener("change", handleThemeSwitch);

  // Auth Buttons
  signOutBtn?.addEventListener("click", handleSignOut);
  signInBtn?.addEventListener("click", () => {
    window.location.href = "../auth/login.html";
  });

  // FAB Menu
  mainActionBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    fabMenu.classList.toggle("show");
  });

  createClassBtn?.addEventListener("click", () => {
    modal.style.display = "block";
    fabMenu.classList.remove("show");
  });

  joinClassBtn?.addEventListener("click", () => {
    joinClassModal.style.display = "block";
    fabMenu.classList.remove("show");
  });

  // Forms
  form?.addEventListener("submit", handleFormSubmit);
  joinClassForm?.addEventListener("submit", handleJoinClass);

  // Close Buttons
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modalToClose = button.closest(".modal");
      if (modalToClose) {
        modalToClose.style.display = "none";
        if (modalToClose === modal) form.reset();
        if (modalToClose === joinClassModal) joinClassForm.reset();
      }
    });
  });

  // Cancel Buttons
  cancelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modalToClose = button.closest(".modal");
      if (modalToClose) {
        modalToClose.style.display = "none";
        if (modalToClose === modal) form.reset();
        if (modalToClose === joinClassModal) joinClassForm.reset();
      }
    });
  });

  // Window Click
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
    if (!mainActionBtn?.contains(e.target)) {
      fabMenu?.classList.remove("show");
    }
  });

  // Escape Key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });
}

// Authentication Handlers
async function handleSignOut() {
  try {
    showLoading(true);
    await signOut(auth);
    showToast("Signed out successfully");
    window.location.href = "../auth/login.html";
  } catch (error) {
    console.error("Sign out error:", error);
    showToast("Error signing out. Please try again.");
  } finally {
    showLoading(false);
  }
}

async function handleDeleteClass(classId) {
  if (
    !confirm(
      "Are you sure you want to delete this class? This cannot be undone."
    )
  ) {
    return;
  }

  showLoading(true);
  try {
    // Get class reference and data
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      throw new Error("Class not found");
    }

    const classData = classSnap.data();

    // Verify ownership
    if (classData.createdBy !== auth.currentUser.uid) {
      throw new Error("You do not have permission to delete this class");
    }

    // Delete the class
    await deleteDoc(classRef);

    // Update local state
    classes = classes.filter((c) => c.id !== classId);
    renderClasses();

    showToast("Class deleted successfully");
  } catch (error) {
    console.error("Delete error:", error);
    showToast(error.message || "Error deleting class");
  } finally {
    showLoading(false);
  }
}
// script.js
function updateUIForAuth(user) {
  // Get all required elements
  const profileSection = document.getElementById('profileSection');
  const userNameElement = document.getElementById('userName');
  const userEmailElement = document.getElementById('userEmail');
  const signOutBtn = document.getElementById('signOutBtn');
  const profileImage = document.getElementById('profileImage');
  const dropdownProfileImg = document.getElementById('dropdownProfileImg');

  // Check if elements exist before updating
  if (user) {
      // Update profile section if it exists
      if (profileSection) {
          profileSection.style.display = 'flex';
      }

      // Update user name if element exists
      if (userNameElement) {
          userNameElement.textContent = user.displayName || user.email;
      }

      // Update user email if element exists
      if (userEmailElement) {
          userEmailElement.textContent = user.email;
      }

      // Update profile images if they exist
      if (profileImage || dropdownProfileImg) {
          const photoURL = user.photoURL || '../images/unnamed.png';
          if (profileImage) profileImage.src = photoURL;
          if (dropdownProfileImg) dropdownProfileImg.src = photoURL;
      }

  } else {
      // Handle logged out state
      if (profileSection) {
          profileSection.style.display = 'none';
      }
  }
}


// Class Management
function generateClassCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!auth.currentUser) {
    showToast("Please sign in to create a class");
    return;
  }

  showLoading(true);

  try {
    const className = document.getElementById("className").value.trim();
    const section = document.getElementById("section").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const teacherName = document.getElementById("teacherName").value.trim();

    if (!className || !teacherName) {
      throw new Error("Please fill in all required fields");
    }

    const classCode = generateClassCode();
    const memberData = {
      role: "teacher",
      name: auth.currentUser.displayName || auth.currentUser.email,
      email: auth.currentUser.email,
      photoURL: auth.currentUser.photoURL || null,
      joined: serverTimestamp(),
    };

    const newClass = {
      name: className,
      section: section || "No Section",
      subject: subject || "No Subject",
      teacher: teacherName,
      classCode: classCode,
      color: classColors[Math.floor(Math.random() * classColors.length)],
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      lastModified: serverTimestamp(),
      members: {
        [auth.currentUser.uid]: memberData,
      },
    };

    const docRef = await addDoc(collection(db, "classes"), newClass);
    newClass.id = docRef.id;
    classes.unshift(newClass);
    renderClasses();

    modal.style.display = "none";
    form.reset();
    showToast(`Class created successfully! Class code: ${classCode}`);
  } catch (error) {
    console.error("Error creating class:", error);
    showToast(error.message || "Error creating class. Please try again.");
  } finally {
    showLoading(false);
  }
}

async function handleJoinClass(e) {
  e.preventDefault();
  const classCode = document
    .getElementById("classCode")
    .value.trim()
    .toUpperCase();
  const joinClassError = document.getElementById("joinClassError");

  try {
    showLoading(true);
    joinClassError.textContent = "";

    if (!auth.currentUser) {
      throw new Error("Please sign in to join a class");
    }

    // Query for the class
    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("classCode", "==", classCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Invalid class code. Please check and try again.");
    }

    const classDoc = querySnapshot.docs[0];
    const classId = classDoc.id;
    const classData = classDoc.data();

    // Check if already a member
    if (classData.members && classData.members[auth.currentUser.uid]) {
      throw new Error("You are already a member of this class");
    }

    // Create member data
    const memberData = {
      role: "student",
      name: auth.currentUser.displayName || auth.currentUser.email,
      email: auth.currentUser.email,
      photoURL: auth.currentUser.photoURL || null,
      joined: serverTimestamp(),
    };

    // Update the class document
    const classRef = doc(db, "classes", classId);

    const updates = {};
    updates[`members.${auth.currentUser.uid}`] = memberData;
    updates.lastModified = serverTimestamp();

    await updateDoc(classRef, updates);

    // Success
    joinClassModal.style.display = "none";
    joinClassForm.reset();
    showToast("Successfully joined the class!");

    // Reload classes
    await loadClasses();
  } catch (error) {
    console.error("Error joining class:", error);
    joinClassError.textContent =
      error.message || "Failed to join class. Please try again.";
  } finally {
    showLoading(false);
  }
}

async function loadClasses() {
  if (!auth.currentUser) return;

  try {
    showLoading(true);

    // Get both created and joined classes
    const [createdClassesSnapshot, joinedClassesSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, "classes"),
          where("createdBy", "==", auth.currentUser.uid)
        )
      ),
      getDocs(
        query(
          collection(db, "classes"),
          where(`members.${auth.currentUser.uid}.role`, "in", [
            "student",
            "teacher",
          ])
        )
      ),
    ]);

    // Combine classes and remove duplicates
    const allClasses = new Map();

    createdClassesSnapshot.docs.forEach((doc) => {
      allClasses.set(doc.id, {
        id: doc.id,
        ...doc.data(),
        role: "teacher",
      });
    });

    joinedClassesSnapshot.docs.forEach((doc) => {
      if (!allClasses.has(doc.id)) {
        const data = doc.data();
        allClasses.set(doc.id, {
          id: doc.id,
          ...data,
          role: data.members[auth.currentUser.uid]?.role || "student",
        });
      }
    });

    classes = Array.from(allClasses.values()).sort((a, b) => {
      const dateB =
        b.lastModified?.toDate() || b.createdAt?.toDate() || new Date();
      const dateA =
        a.lastModified?.toDate() || a.createdAt?.toDate() || new Date();
      return dateB - dateA;
    });

    renderClasses();
  } catch (error) {
    console.error("Error loading classes:", error);
    showToast("Error loading classes. Please try again.");
  } finally {
    showLoading(false);
  }
}

function renderClasses() {
  container.innerHTML = "";

  if (classes.length === 0) {
    container.innerHTML = `
            <div class="no-classes">
                <span class="material-icons">school</span>
                <p>No classes yet</p>
                <p>Click the + button to create or join a class</p>
            </div>
        `;
    return;
  }

  classes.forEach((classItem) => {
    const card = createClassCard(classItem);
    container.appendChild(card);
  });
}

function createClassCard(classItem) {
  const card = document.createElement("div");
  card.className = "classroom-card";
  card.dataset.id = classItem.id;

  const isCreator = classItem.createdBy === auth.currentUser.uid;
  const memberCount = Object.keys(classItem.members || {}).length;

  card.innerHTML = `
        <div class="card-header" style="background-color: ${classItem.color}">
            <div class="card-title-section">
                <h2 class="card-title">${classItem.name}</h2>
                <p class="card-section">${classItem.section}</p>
                <p class="card-teacher">${classItem.teacher}</p>
                ${isCreator ? '<span class="teacher-badge">Teacher</span>' : ""}
            </div>
            <button class="card-menu material-icons">more_vert</button>
            <div class="teacher-circle">
                <img src="../images/unnamed.png" alt="Teacher" class="teacher-image">
            </div>
        </div>
        <div class="card-body">
            ${
              isCreator
                ? `
                <div class="class-code">
                    <span>Class Code: ${classItem.classCode}</span>
                    <button class="copy-code" data-code="${classItem.classCode}" title="Copy class code">
                        <span class="material-icons">content_copy</span>
                    </button>
                </div>
            `
                : ""
            }
            <div class="class-info">
                <div class="class-subject">${
                  classItem.subject || "No Subject"
                }</div>
                <div class="class-stats">
                    <span class="member-count">
                        <span class="material-icons">people</span>
                        ${memberCount} ${
    memberCount === 1 ? "member" : "members"
  }
                    </span>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <div class="card-actions">
                <button class="action-button" title="People">
                    <span class="material-icons">person</span>
                </button>
                <button class="action-button" title="Assignments">
                    <span class="material-icons">assignment</span>
                </button>
                <button class="action-button" title="Files">
                    <span class="material-icons">folder</span>
                </button>
            </div>
        </div>
    `;

  // Add hover effect
  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-4px)";
    card.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0)";
    card.style.boxShadow = "";
  });

  // Card Click Handler
  card.addEventListener("click", (e) => {
    if (
      !e.target.closest(".card-menu") &&
      !e.target.closest(".action-button") &&
      !e.target.closest(".copy-code")
    ) {
      window.location.href = `class.html?id=${classItem.id}`;
    }
  });

  // Copy Class Code Button
  const copyBtn = card.querySelector(".copy-code");
  if (copyBtn) {
    copyBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(classItem.classCode);
        showToast("Class code copied to clipboard!");
      } catch (error) {
        showToast("Failed to copy class code");
      }
    });
  }

  // Menu Button Handler
  const menuButton = card.querySelector(".card-menu");
  if (menuButton) {
    menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      showContextMenu(e, classItem);
    });
  }

  // Action Buttons Handlers
  const actionButtons = card.querySelectorAll(".action-button");
  actionButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = button.getAttribute("title").toLowerCase();
      handleActionButtonClick(action, classItem.id);
    });
  });

  return card;
}

// Helper function for action button clicks
function handleActionButtonClick(action, classId) {
  switch (action) {
    case "people":
      showToast("People view coming soon!");
      break;
    case "assignments":
      showToast("Assignments view coming soon!");
      break;
    case "files":
      showToast("Files view coming soon!");
      break;
  }
}

// Context Menu Functions
// Show context menu
function showContextMenu(e, classItem) {
  e.preventDefault();
  currentCardElement = e.target.closest(".classroom-card");
  const isCreator = classItem.createdBy === auth.currentUser.uid;
  const userRole = classItem.members?.[auth.currentUser.uid]?.role;

  contextMenu.innerHTML = isCreator
    ? `
        <div class="menu-item" data-action="edit">
            <span class="material-icons">edit</span>
            <span>Edit</span>
        </div>
        <div class="menu-item" data-action="copy">
            <span class="material-icons">content_copy</span>
            <span>Copy link</span>
        </div>
        <div class="menu-item delete" data-action="delete">
            <span class="material-icons">delete</span>
            <span>Delete</span>
        </div>
    `
    : userRole === "student"
    ? `
        <div class="menu-item" data-action="copy">
            <span class="material-icons">content_copy</span>
            <span>Copy link</span>
        </div>
        <div class="menu-item leave" data-action="leave">
            <span class="material-icons">exit_to_app</span>
            <span>Leave class</span>
        </div>
    `
    : `
        <div class="menu-item" data-action="copy">
            <span class="material-icons">content_copy</span>
            <span>Copy link</span>
        </div>
    `;

  // Position the context menu
  const rect = e.target.getBoundingClientRect();
  contextMenu.style.display = "block";
  contextMenu.style.top = `${rect.bottom + window.scrollY}px`;
  contextMenu.style.left = `${rect.left + window.scrollX}px`;

  adjustContextMenuPosition(contextMenu);
}

// Utility Functions
function toggleProfileDropdown(e) {
  e.stopPropagation();
  profileDropdown.classList.toggle("show");
}

function handleOutsideClick(e) {
  if (!profileSection?.contains(e.target)) {
    profileDropdown?.classList.remove("show");
  }
}

// Continue from previous script.js...

// Utility Functions (continued)
function handleThemeSwitch() {
  document.body.classList.toggle("dark-theme");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark-theme") ? "dark-theme" : ""
  );
}

function loadSavedTheme() {
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme) {
    document.body.classList.add(currentTheme);
    themeSwitch.checked = currentTheme === "dark-theme";
  }
}

function setupSidebar() {
  nav?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!nav?.contains(e.target) && !sidebar?.contains(e.target)) {
      sidebar?.classList.remove("open");
    }
  });
}

// Delete Functions
function showDeleteDialog(classId) {
  if (
    confirm(
      "Are you sure you want to delete this class? This action cannot be undone."
    )
  ) {
    deleteClass(classId);
  }
}

async function deleteClass(classId) {
  try {
    showLoading(true);

    if (!auth.currentUser) {
      throw new Error("Must be signed in to delete class");
    }

    // Delete from Firestore
    await deleteDoc(doc(db, "classes", classId));

    // Remove from local array
    classes = classes.filter((c) => c.id !== classId);

    // Update UI
    renderClasses();

    showToast("Class deleted successfully!");
  } catch (error) {
    console.error("Error deleting class:", error);
    showToast("Error deleting class. Please try again.");
  } finally {
    showLoading(false);
  }
}

let isProcessing = false;

contextMenu.addEventListener("click", async (e) => {
  if (isProcessing) return;
  isProcessing = true;

  const menuItem = e.target.closest(".menu-item");
  if (!menuItem) return;

  const action = menuItem.dataset.action;
  const classId = currentCardElement.dataset.id;

  contextMenu.style.display = "none";

  try {
    switch (action) {
      case "edit":
        showToast("Editing this class is not yet supported.");
        break;

      case "copy":
        await copyClassLink(classId);
        showToast("Class link copied to clipboard!");
        break;

      case "delete":
        if (confirm("Are you sure you want to delete this class?")) {
          await handleDeleteClass(classId);
          showToast("Class deleted successfully.");
        }
        break;

      case "leave":
        await handleLeaveClass(classId); // Confirmation inside
        break;

      default:
        showToast("Unknown action.");
    }
  } catch (error) {
    console.error("Action error:", error);
    showToast(error.message || "An error occurred. Please try again.");
  } finally {
    isProcessing = false;
  }
});

async function handleLeaveClass(classId) {
  showLoading(true);
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("You must be signed in to leave a class.");
    }

    const classRef = doc(db, "classes", classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error("The class does not exist.");
    }

    const classData = classDoc.data();

    if (!classData.members?.[userId]) {
      throw new Error("You are not a member of this class.");
    }

    if (classData.createdBy === userId) {
      throw new Error("Class creators cannot leave their own class.");
    }

    // Remove user from class members
    const updates = {
      [`members.${userId}`]: deleteField(),
      lastModified: serverTimestamp(),
    };

    await updateDoc(classRef, updates);

    // Update local state
    if (classes.some((c) => c.id === classId)) {
      classes = classes.filter((c) => c.id !== classId);
      renderClasses();
    } else {
      console.warn("Class not found in local state.");
    }

    showToast("Successfully left the class.");
  } catch (error) {
    handleError(error, "Error leaving class.");
  } finally {
    showLoading(false);
  }
}

function handleError(error, defaultMessage) {
  console.error(error);
  showToast(error.message || defaultMessage);
}

async function copyClassLink(classId) {
  try {
    const classData = classes.find((c) => c.id === classId);
    if (classData?.classCode) {
      await navigator.clipboard.writeText(classData.classCode);
      showToast("Class code copied to clipboard!");
    }
  } catch (error) {
    showToast("Failed to copy class code");
  }
}

function closeAllModals() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.style.display = "none";
  });
  contextMenu.style.display = "none";
  profileDropdown?.classList.remove("show");
  fabMenu?.classList.remove("show");
}

function showToast(message, duration = 3000) {
  const toastMessage = toast.querySelector(".toast-message");
  if (toastMessage) {
    toastMessage.textContent = message;
    toast.style.display = "block";

    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }

    toast.timeoutId = setTimeout(() => {
      toast.style.display = "none";
    }, duration);
  }
}

function showLoading(show) {
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? "flex" : "none";
  }
}

// Initialize toast close button
document.querySelector(".toast-close")?.addEventListener("click", () => {
  toast.style.display = "none";
});

// Add error handling for page load
window.addEventListener("error", function (e) {
  console.error("Global error:", e.error);
  showToast("An error occurred. Please refresh the page.");
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", function (e) {
  console.error("Unhandled promise rejection:", e.reason);
  showToast("An error occurred. Please try again.");
});

// Export necessary functions for use in other modules if needed
export { showToast, showLoading, handleThemeSwitch, loadSavedTheme };

// In script.js
function updateProfilePhoto(user) {
  const profileImage = document.getElementById("profileImage");
  const dropdownProfileImg = document.getElementById("dropdownProfileImg");

  if (user && user.photoURL) {
    // Get high quality photo from Google
    let photoURL = user.photoURL;
    if (photoURL.includes("googleusercontent.com")) {
      // Remove size parameter and request a larger image
      photoURL = photoURL.split("=")[0] + "=s96-c";
    }

    // Update main profile image
    if (profileImage) {
      profileImage.classList.add("loading");
      const img = new Image();
      img.onload = () => {
        profileImage.src = photoURL;
        profileImage.classList.remove("loading");
      };
      img.onerror = () => {
        profileImage.src = "/image/unnamed.png";
        profileImage.classList.remove("loading");
      };
      img.src = photoURL;
    }

    // Update dropdown profile image
    if (dropdownProfileImg) {
      dropdownProfileImg.classList.add("loading");
      const dropImg = new Image();
      dropImg.onload = () => {
        dropdownProfileImg.src = photoURL;
        dropdownProfileImg.classList.remove("loading");
      };
      dropImg.onerror = () => {
        dropdownProfileImg.src = "/image/unnamed.png";
        dropdownProfileImg.classList.remove("loading");
      };
      dropImg.src = photoURL;
    }
  } else {
    // Set default image
    if (profileImage) {
      profileImage.src = "/image/unnamed.png";
      profileImage.classList.remove("loading");
    }
    if (dropdownProfileImg) {
      dropdownProfileImg.src = "/image/unnamed.png";
      dropdownProfileImg.classList.remove("loading");
    }
  }
}
function withErrorHandler(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      console.error("Operation error:", error);
      showToast(error.message || "An error occurred");
    }
  };
}

// Update your auth state observer
auth.onAuthStateChanged((user) => {
  if (user) {
    // Update UI
    document.getElementById("userName").textContent =
      user.displayName || user.email;
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("signInBtn").style.display = "none";
    document.getElementById("signOutBtn").style.display = "block";

    // Update profile photo
    updateProfilePhoto(user);

    // Load classes
    loadClasses();
  } else {
    // Reset UI
    document.getElementById("userName").textContent = "Not signed in";
    document.getElementById("userEmail").textContent = "";
    document.getElementById("signInBtn").style.display = "block";
    document.getElementById("signOutBtn").style.display = "none";

    // Reset profile photo
    updateProfilePhoto(null);

    // Redirect to login
    window.location.href = "../auth/login.html";
  }
});

async function verifyFirestoreConnection() {
  try {
    const testRef = doc(db, "test", "test");
    await getDoc(testRef);
    console.log("Firestore connection successful");
    return true;
  } catch (error) {
    console.error("Firestore connection error:", error);
    return false;
  }
}

// Call this function when initializing your app
document.addEventListener("DOMContentLoaded", async () => {
  const isConnected = await verifyFirestoreConnection();
  if (!isConnected) {
    showToast("Error connecting to database");
  }
});

// Add this to handle Google Sign In
document
  .getElementById("googleSignInBtn")
  ?.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      updateProfilePhoto(result.user);
      document.getElementById("profileDropdown").classList.remove("show");
    } catch (error) {
      console.error("Google sign in error:", error);
    }
  });
