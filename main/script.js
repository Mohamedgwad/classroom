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

// Class Colors Array - Google Classroom-like colors
const classColors = [
  "#F94C44", // Red
  "#1BB76E", // Green
  "#2E69FF", // Blue
  "#9C27B0", // Purple
  "#FF7043", // Deep Orange
  "#673AB7", // Deep Purple
  "#009688", // Teal
  "#FFA000", // Orange
  "#5C6BC0", // Indigo
  "#FF5252", // Red Accent
];

// State Management
let currentCardElement = null;
let classes = [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  try {
    const savedClasses = localStorage.getItem("classes");
    classes = savedClasses ? JSON.parse(savedClasses) : [];
  } catch (error) {
    console.error("Error loading classes:", error);
    classes = [];
  }
  renderClasses();
  setupSidebar();
});
// Theme Switcher
const themeSwitch = document.getElementById("checkbox");
const body = document.body;

// Check for saved theme preference
const currentTheme = localStorage.getItem("theme");
if (currentTheme) {
  body.classList.add(currentTheme);
  if (currentTheme === "dark-theme") {
    themeSwitch.checked = true;
  }
}

// Theme switch handler
themeSwitch.addEventListener("change", function () {
  if (this.checked) {
    body.classList.add("dark-theme");
    localStorage.setItem("theme", "dark-theme");
  } else {
    body.classList.remove("dark-theme");
    localStorage.setItem("theme", "");
  }
});

// Sidebar Toggle
function setupSidebar() {
  nav.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && !sidebar.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  });
}

// Event Listeners
addButton.addEventListener("click", () => {
  modal.style.display = "block";
  form.reset();
});

// Close buttons event listeners
closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modalToClose = button.closest(".modal");
    if (modalToClose) {
      modalToClose.style.display = "none";
      if (modalToClose === modal) {
        form.reset();
      }
    }
  });
});

// Cancel buttons event listeners
cancelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modalToClose = button.closest(".modal");
    if (modalToClose) {
      modalToClose.style.display = "none";
      if (modalToClose === modal) {
        form.reset();
      }
    }
  });
});

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.style.display = "none";
    if (e.target === modal) {
      form.reset();
    }
  }
  if (!contextMenu.contains(e.target) && !e.target.closest(".card-menu")) {
    contextMenu.style.display = "none";
  }
});

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(e) {
  e.preventDefault();
  showLoading(true);

  try {
    const className = document.getElementById("className").value.trim();
    const section = document.getElementById("section").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const teacherName = document.getElementById("teacherName").value.trim();

    if (!className || !teacherName) {
      throw new Error("Please fill in all required fields");
    }

    const newClass = {
      id: Date.now(),
      name: className,
      section: section || "All",
      subject: subject || "No Subject",
      teacher: teacherName,
      color: classColors[Math.floor(Math.random() * classColors.length)],
      dateCreated: new Date().toISOString(),
      students: [],
      assignments: [],
      lastModified: new Date().toISOString(),
    };

    classes.push(newClass);
    saveClasses();
    renderClasses();

    modal.style.display = "none";
    form.reset();
    showToast("Class created successfully!");
  } catch (error) {
    console.error("Error creating class:", error);
    showToast(error.message || "Error creating class. Please try again.");
  } finally {
    showLoading(false);
  }
}

// Create Class Card
function createClassCard(classItem) {
  const card = document.createElement("div");
  card.className = "classroom-card";
  card.dataset.id = classItem.id;

  card.innerHTML = `
        <div class="card-header" style="background-color: ${classItem.color}">
            <div class="card-title-section">
                <h2 class="card-title">${classItem.name}</h2>
                <p class="card-section">${classItem.section}</p>
                <p class="card-teacher">${classItem.teacher}</p>
            </div>
            <button class="card-menu material-icons" aria-label="More options">
                more_vert
            </button>
            <div class="teacher-circle">
                <img src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQP5QQKcY4t1-_XAOvt_5Ii9LGJqTDX0B7u5sOZJFeU8QCGJ2jReifGEDftXkScCw-lMm8nmFUYF2QXwMR2KrzTsw" 
                     alt="Teacher" 
                     class="teacher-image">
            </div>
        </div>
        <div class="card-body">
        </div>
        <div class="card-footer">
            <div class="card-actions">
                <button class="action-button">
                    <span class="material-icons">person</span>
                </button>
                <button class="action-button">
                    <span class="material-icons">folder</span>
                </button>
            </div>
        </div>
    `;

  // Event Listeners
  card.addEventListener("click", (e) => {
    if (
      !e.target.closest(".card-menu") &&
      !e.target.closest(".action-button")
    ) {
      openClassDetails(classItem);
    }
  });

  const menuButton = card.querySelector(".card-menu");
  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showContextMenu(e, classItem.id);
  });

  return card;
}

// Render Classes
function renderClasses() {
  container.innerHTML = "";
  const sortedClasses = classes.sort(
    (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
  );

  if (sortedClasses.length === 0) {
    container.innerHTML = `
            <div class="no-classes">
                <span class="material-icons">school</span>
                <p>No classes yet</p>
                <p>Click the + button to create a class</p>
            </div>
        `;
    return;
  }

  sortedClasses.forEach((classItem) => {
    const card = createClassCard(classItem);
    container.appendChild(card);
  });
}

// Context Menu
function showContextMenu(e, classId) {
  e.preventDefault();
  currentCardElement = e.target.closest(".classroom-card");

  const rect = e.target.getBoundingClientRect();
  contextMenu.style.display = "block";
  contextMenu.style.top = `${rect.bottom + window.scrollY}px`;
  contextMenu.style.left = `${rect.left + window.scrollX}px`;

  // Ensure menu stays in viewport
  const menuRect = contextMenu.getBoundingClientRect();
  if (menuRect.right > window.innerWidth) {
    contextMenu.style.left = `${window.innerWidth - menuRect.width - 5}px`;
  }
  if (menuRect.bottom > window.innerHeight) {
    contextMenu.style.top = `${rect.top - menuRect.height + window.scrollY}px`;
  }
}

// Context Menu Actions
contextMenu.addEventListener("click", (e) => {
  const menuItem = e.target.closest(".menu-item");
  if (!menuItem) return;

  const action = menuItem.dataset.action;
  const classId = parseInt(currentCardElement.dataset.id);

  switch (action) {
    case "edit":
      showToast("Edit functionality coming soon!");
      break;
    case "copy":
      navigator.clipboard
        .writeText(`https://classroom.example.com/c/${classId}`)
        .then(() => showToast("Link copied to clipboard!"))
        .catch(() => showToast("Failed to copy link"));
      break;
    case "archive":
      showToast("Archive functionality coming soon!");
      break;
    case "delete":
      showDeleteDialog(classId);
      break;
  }
  contextMenu.style.display = "none";
});

// Delete Dialog
function showDeleteDialog(classId) {
  deleteDialog.style.display = "block";

  const deleteButton = deleteDialog.querySelector(".delete-btn");
  const cancelButton = deleteDialog.querySelector(".cancel-btn");

  const handleDelete = () => {
    deleteClass(classId);
    cleanup();
  };

  const handleCancel = () => {
    cleanup();
  };

  const cleanup = () => {
    deleteButton.removeEventListener("click", handleDelete);
    cancelButton.removeEventListener("click", handleCancel);
    deleteDialog.style.display = "none";
  };

  deleteButton.addEventListener("click", handleDelete);
  cancelButton.addEventListener("click", handleCancel);
}

// Delete Class
function deleteClass(classId) {
  showLoading(true);

  try {
    const card = document.querySelector(
      `.classroom-card[data-id="${classId}"]`
    );
    if (card) {
      card.style.animation = "fadeOut 0.5s ease-out";

      setTimeout(() => {
        classes = classes.filter((c) => c.id !== classId);
        saveClasses();
        renderClasses();
        showToast("Class deleted successfully!");
      }, 500);
    }
  } catch (error) {
    console.error("Error deleting class:", error);
    showToast("Error deleting class. Please try again.");
  } finally {
    showLoading(false);
  }
}

// Class Details
function openClassDetails(classItem) {
  showToast("Class details coming soon!");
}

// Utility Functions
function saveClasses() {
  try {
    localStorage.setItem("classes", JSON.stringify(classes));
  } catch (error) {
    console.error("Error saving classes:", error);
    showToast("Error saving changes. Please try again.");
  }
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

// Keyboard Navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.style.display = "none";
    });
    if (modal.style.display === "none") {
      form.reset();
    }
    contextMenu.style.display = "none";
  }
});

// Prevent default right-click on cards
container.addEventListener("contextmenu", (e) => {
  if (e.target.closest(".classroom-card")) {
    e.preventDefault();
  }
});

// Close toast message when clicking the close button
document.querySelector(".toast-close")?.addEventListener("click", () => {
  toast.style.display = "none";
});
