import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// State management
let currentClass = null;
let currentUser = null;
let isTeacher = false;
let unsubscribeClass = null;
let unsubscribeAnnouncements = null;

// Initialize UI Elements
function initializeUI() {
  const announcementForm = document.getElementById("announcementInput");
  if (announcementForm) {
    announcementForm.addEventListener("focus", () => {
      document.querySelector(".form-actions").classList.remove("hidden");
    });
  }

  // Set up announcement posting
  document
    .getElementById("postAnnouncement")
    ?.addEventListener("click", handleCreateAnnouncement);

  // Set up tab switching
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Set up people management
  setupPeopleManagement();

  // Set up invite and copy functionality
  setupEventListeners();
}

// Load and Display Class Data
async function loadClassData() {
  const classId = new URLSearchParams(window.location.search).get("id");
  if (!classId) {
    window.location.href = "main.html";
    return;
  }

  try {
    showLoading(true);
    const classRef = doc(db, "classes", classId);

    // Set up real-time listener for class data
    unsubscribeClass = onSnapshot(classRef, (doc) => {
      if (doc.exists()) {
        currentClass = { id: doc.id, ...doc.data() };
        updateUIWithClassData();
        setupAnnouncementsListener();
        updatePeopleList();
        checkTeacherStatus();
      } else {
        showToast("Class not found");
        window.location.href = "main.html";
      }
    });
  } catch (error) {
    console.error("Error loading class:", error);
    showToast("Error loading class data");
  } finally {
    showLoading(false);
  }
}

// Update Class UI
function updateUIWithClassData() {
  if (!currentClass) return;

  document.getElementById("className").textContent =
    currentClass.name || "Untitled Class";
  document.getElementById("classSection").textContent = `Section: ${
    currentClass.section || "No Section"
  }`;
  document.getElementById("classSubject").textContent =
    currentClass.subject || "No Subject";
  document.getElementById("classTeacher").textContent = `Teacher: ${
    currentClass.teacher || "Unknown"
  }`;

  const classCodeElement = document.getElementById("classCode");
  const displayClassCode = document.getElementById("displayClassCode");
  if (isTeacher && currentClass.classCode) {
    if (classCodeElement) classCodeElement.textContent = currentClass.classCode;
    if (displayClassCode) displayClassCode.textContent = currentClass.classCode;
  }

  const header = document.getElementById("classHeader");
  if (header) {
    header.style.backgroundColor = currentClass.color || "#1a73e8";
  }

  updateTeacherElements();
}

// Announcements Management
async function handleCreateAnnouncement() {
  const content = document.getElementById("announcementInput").value.trim();
  if (!content) return;

  try {
    showLoading(true);
    await addDoc(collection(db, "classes", currentClass.id, "announcements"), {
      content,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || currentUser.email,
      authorPhoto: currentUser.photoURL,
      createdAt: serverTimestamp(),
    });

    document.getElementById("announcementInput").value = "";
    document.querySelector(".form-actions").classList.add("hidden");
    showToast("Announcement posted successfully");
  } catch (error) {
    console.error("Error posting announcement:", error);
    showToast("Error posting announcement");
  } finally {
    showLoading(false);
  }
}

function setupAnnouncementsListener() {
  if (unsubscribeAnnouncements) {
    unsubscribeAnnouncements();
  }

  const announcementsRef = collection(
    db,
    "classes",
    currentClass.id,
    "announcements"
  );
  const announcementsQuery = query(
    announcementsRef,
    orderBy("createdAt", "desc")
  );

  unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
    const announcementsList = document.getElementById("announcementsList");
    announcementsList.innerHTML = "";

    snapshot.forEach((doc) => {
      const announcement = doc.data();
      announcementsList.appendChild(
        createAnnouncementElement(doc.id, announcement)
      );
    });
  });
}

function createAnnouncementElement(id, announcement) {
  const element = document.createElement("div");
  element.className = "announcement";
  element.innerHTML = `
        <div class="announcement-header">
            <img src="${
              announcement.authorPhoto || "../images/unnamed.png"
            }" alt="Profile" class="user-avatar">
            <div class="announcement-info">
                <span class="author-name">${announcement.authorName}</span>
                <span class="post-date">${formatDate(
                  announcement.createdAt?.toDate()
                )}</span>
            </div>
            ${
              isTeacher || announcement.authorId === currentUser.uid
                ? `
                <div class="announcement-actions">
                    <button class="delete-btn" data-id="${id}">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `
                : ""
            }
        </div>
        <div class="announcement-content">${announcement.content}</div>
    `;

  const deleteBtn = element.querySelector(".delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => handleDeleteAnnouncement(id));
  }

  return element;
}

async function handleDeleteAnnouncement(announcementId) {
  if (!confirm("Are you sure you want to delete this announcement?")) return;

  try {
    showLoading(true);
    await deleteDoc(
      doc(db, "classes", currentClass.id, "announcements", announcementId)
    );
    showToast("Announcement deleted successfully");
  } catch (error) {
    console.error("Error deleting announcement:", error);
    showToast("Error deleting announcement");
  } finally {
    showLoading(false);
  }
}

// People Management
function setupPeopleManagement() {
  document
    .getElementById("peopleTab")
    ?.addEventListener("click", updatePeopleList);
}

function updatePeopleList() {
  if (!currentClass?.members) return;

  const teachersList = document.getElementById("teachersList");
  const studentsList = document.getElementById("studentsList");

  teachersList.innerHTML = "";
  studentsList.innerHTML = "";

  Object.entries(currentClass.members).forEach(([uid, member]) => {
    const memberElement = createMemberElement(uid, member);
    if (member.role === "teacher") {
      teachersList.appendChild(memberElement);
    } else {
      studentsList.appendChild(memberElement);
    }
  });
}

function createMemberElement(uid, member) {
  const element = document.createElement("div");
  element.className = "member-item";
  element.innerHTML = `
        <img src="${
          member.photoURL || "../images/unnamed.png"
        }" alt="Profile" class="member-avatar">
        <div class="member-info">
            <span class="member-name">${member.name}</span>
            <span class="member-email">${member.email}</span>
        </div>
        ${
          isTeacher && uid !== currentUser.uid
            ? `
            <div class="member-actions">
                ${
                  member.role === "student"
                    ? `
                    <button class="promote-btn" data-uid="${uid}">
                        <span class="material-icons">arrow_upward</span>
                        Make teacher
                    </button>
                `
                    : `
                    <button class="demote-btn" data-uid="${uid}">
                        <span class="material-icons">arrow_downward</span>
                        Remove as teacher
                    </button>
                `
                }
            </div>
        `
            : ""
        }
    `;

  const promoteBtn = element.querySelector(".promote-btn");
  const demoteBtn = element.querySelector(".demote-btn");

  if (promoteBtn) {
    promoteBtn.addEventListener("click", () =>
      handleRoleChange(uid, "teacher")
    );
  }
  if (demoteBtn) {
    demoteBtn.addEventListener("click", () => handleRoleChange(uid, "student"));
  }

  return element;
}

async function handleRoleChange(uid, newRole) {
  if (!isTeacher) return;

  try {
    showLoading(true);
    const updates = {
      [`members.${uid}.role`]: newRole,
      lastModified: serverTimestamp(),
    };

    await updateDoc(doc(db, "classes", currentClass.id), updates);
    showToast(
      `User ${
        newRole === "teacher" ? "promoted to teacher" : "changed to student"
      }`
    );
  } catch (error) {
    console.error("Error changing role:", error);
    showToast("Error changing user role");
  } finally {
    showLoading(false);
  }
}

// Utility Functions
function showLoading(show) {
  document.getElementById("loadingOverlay").style.display = show
    ? "flex"
    : "none";
}

function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  const toastMessage = toast.querySelector(".toast-message");
  toastMessage.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), duration);
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
  });

  document.querySelectorAll(".content-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.id === `${tabName}Tab`);
  });
}

function checkTeacherStatus() {
  isTeacher =
    currentClass.createdBy === currentUser?.uid ||
    currentClass.members?.[currentUser?.uid]?.role === "teacher";

  document.querySelectorAll(".teacher-only").forEach((element) => {
    element.style.display = isTeacher ? "block" : "none";
  });
}

function updateTeacherElements() {
  document.querySelectorAll(".teacher-only").forEach((element) => {
    element.style.display = isTeacher ? "block" : "none";
  });
}

// Event Listeners for Invite and Modal
function setupEventListeners() {
  const inviteBtn = document.getElementById("inviteBtn");
  if (inviteBtn) {
    inviteBtn.addEventListener("click", handleInvite);
  }

  const copyCodeBtns = document.querySelectorAll('[id^="copyCode"]');
  copyCodeBtns.forEach((btn) => {
    btn.addEventListener("click", copyClassCode);
  });

  const closeButtons = document.querySelectorAll(".modal .close");
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      if (modal) modal.style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.style.display = "none";
      });
    }
  });
}

// Invite and Copy
async function handleInvite() {
  const inviteModal = document.getElementById("inviteModal");
  const displayClassCode = document.getElementById("displayClassCode");

  if (currentClass && currentClass.classCode) {
    displayClassCode.textContent = currentClass.classCode;
    inviteModal.style.display = "block";
  }
}

async function copyClassCode() {
  try {
    const classCode = currentClass?.classCode;
    if (!classCode) {
      showToast("Class code not available");
      return;
    }

    await navigator.clipboard.writeText(classCode);
    showToast("Class code copied to clipboard");
  } catch (error) {
    console.error("Error copying class code:", error);
    showToast("Failed to copy class code");
  }
}

// Profile Image Update
function updateProfileImages(user) {
  const profileImage = document.getElementById("profileImage");
  const dropdownProfileImg = document.getElementById("dropdownProfileImg");

  if (user && user.photoURL) {
    let photoURL = user.photoURL;
    if (photoURL.includes("googleusercontent.com")) {
      photoURL = photoURL.split("=")[0] + "=s96-c";
    }

    if (profileImage) {
      profileImage.classList.add("loading");
      const img = new Image();
      img.onload = () => {
        profileImage.src = photoURL;
        profileImage.classList.remove("loading");
      };
      img.onerror = () => {
        profileImage.src = "../images/unnamed.png";
        profileImage.classList.remove("loading");
      };
      img.src = photoURL;
    }

    if (dropdownProfileImg) {
      dropdownProfileImg.classList.add("loading");
      const dropImg = new Image();
      dropImg.onload = () => {
        dropdownProfileImg.src = photoURL;
        dropdownProfileImg.classList.remove("loading");
      };
      dropImg.onerror = () => {
        dropdownProfileImg.src = "../images/unnamed.png";
        dropdownProfileImg.classList.remove("loading");
      };
      dropImg.src = photoURL;
    }
  } else {
    if (profileImage) {
      profileImage.src = "../images/unnamed.png";
      profileImage.classList.remove("loading");
    }
    if (dropdownProfileImg) {
      dropdownProfileImg.src = "../images/unnamed.png";
      dropdownProfileImg.classList.remove("loading");
    }
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      updateProfileImages(user);
      initializeUI();
      loadClassData();

      document.getElementById("userName").textContent =
        user.displayName || user.email;
      document.getElementById("userEmail").textContent = user.email;
    } else {
      window.location.href = "../auth/login.html";
    }
  });
});

// Cleanup
window.addEventListener("beforeunload", () => {
  if (unsubscribeClass) unsubscribeClass();
  if (unsubscribeAnnouncements) unsubscribeAnnouncements();
});
