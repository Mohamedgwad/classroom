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
