import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// State management

let currentAssignment = null;
let unsubscribeAssignments = null;
// At the top of class.js with other state variables
let currentClass = null;
let currentUser = null;
let isTeacher = false;
let unsubscribeClass = null;
let unsubscribeAnnouncements = null;
let submissionListeners = new Map(); // Add this line





function initializeEventListeners() {
  // Add other event listeners here
  document.addEventListener('click', function(e) {
      if (e.target.classList.contains('grade-btn')) {
          const gradeInput = e.target.previousElementSibling;
          handleGradeSubmission(
              e.target.dataset.assignmentId,
              e.target.dataset.submissionId,
              gradeInput.value
          );
      }
  });
}
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  // ... other initialization code
});

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

      unsubscribeClass = onSnapshot(classRef, async (doc) => {
          if (doc.exists()) {
              currentClass = { id: doc.id, ...doc.data() };
              updateUIWithClassData();
              setupAnnouncementsListener();
              setupAssignmentsListener(); // Add this line
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

async function handleCreateAssignment(e) {
  e.preventDefault();
  if (!isTeacher) {
      showToast("Only teachers can create assignments");
      return;
  }

  const title = document.getElementById('assignmentTitle').value;
  const description = document.getElementById('assignmentDescription').value;
  const dueDate = document.getElementById('assignmentDueDate').value;
  const points = document.getElementById('assignmentPoints').value;

  try {
      showLoading(true);
      await addDoc(collection(db, "classes", currentClass.id, "assignments"), {
          title,
          description,
          dueDate: new Date(dueDate),
          points: Number(points),
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid
      });

      showToast("Assignment created successfully");
      closeAssignmentModal();
      await loadAssignments();
  } catch (error) {
      console.error("Error creating assignment:", error);
      showToast("Error creating assignment");
  } finally {
      showLoading(false);
  }
}


function setupAssignmentsListener() {
  if (unsubscribeAssignments) {
      unsubscribeAssignments();
  }

  const assignmentsRef = collection(db, "classes", currentClass.id, "assignments");
  const q = query(assignmentsRef, orderBy("createdAt", "desc"));

  unsubscribeAssignments = onSnapshot(q, (snapshot) => {
      const assignmentsList = document.getElementById('assignmentsList');
      if (!assignmentsList) return;

      assignmentsList.innerHTML = '';

      if (snapshot.empty) {
          assignmentsList.innerHTML = `
              <div class="no-assignments">
                  <p>No assignments yet</p>
              </div>
          `;
          return;
      }

      snapshot.forEach((doc) => {
          const assignment = { id: doc.id, ...doc.data() };
          assignmentsList.appendChild(createAssignmentElement(assignment));
      });
  });
}
async function handleGradeSubmission(assignmentId, submissionId, grade, maxPoints) {
  if (!isTeacher) {
      showToast("Only teachers can grade submissions");
      return;
  }

  const numericGrade = Number(grade);
  if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > maxPoints) {
      showToast(`Please enter a valid grade between 0 and ${maxPoints}`);
      return;
  }

  try {
      showLoading(true);
      const submissionRef = doc(
          db, 
          "classes", 
          currentClass.id, 
          "assignments", 
          assignmentId, 
          "submissions", 
          submissionId
      );

      await updateDoc(submissionRef, {
          grade: numericGrade,
          maxPoints: maxPoints,
          gradedBy: currentUser.uid,
          gradedAt: serverTimestamp(),
          status: 'graded'
      });

      showToast("Grade saved successfully");
  } catch (error) {
      console.error("Error saving grade:", error);
      showToast("Error saving grade");
  } finally {
      showLoading(false);
  }
}

async function handleDeleteAssignment(assignmentId) {
  if (!confirm('Are you sure you want to delete this assignment?')) return;

  try {
      showLoading(true);
      await deleteDoc(doc(db, "classes", currentClass.id, "assignments", assignmentId));
      showToast("Assignment deleted successfully");
      await loadAssignments();
  } catch (error) {
      console.error("Error deleting assignment:", error);
      showToast("Error deleting assignment");
  } finally {
      showLoading(false);
  }
}


function closeAssignmentModal() {
  const modal = document.getElementById('assignmentModal');
  const form = document.getElementById('assignmentForm');
  if (modal) modal.style.display = 'none';
  if (form) form.reset();
}

async function loadAssignments() {
  if (!currentClass) return;

  const assignmentsList = document.getElementById('assignmentsList');
  if (!assignmentsList) return;

  try {
      showLoading(true);
      const assignmentsRef = collection(db, "classes", currentClass.id, "assignments");
      const q = query(assignmentsRef, orderBy("createdAt", "desc"));
      
      // Get assignments
      const querySnapshot = await getDocs(q);
      
      // Clear existing assignments
      assignmentsList.innerHTML = '';

      if (querySnapshot.empty) {
          assignmentsList.innerHTML = `
              <div class="no-assignments">
                  <p>No assignments yet</p>
              </div>
          `;
          return;
      }

      // Create assignment elements
      querySnapshot.forEach((doc) => {
          const assignment = { id: doc.id, ...doc.data() };
          assignmentsList.appendChild(createAssignmentElement(assignment));
      });

  } catch (error) {
      console.error("Error loading assignments:", error);
      showToast("Error loading assignments");
  } finally {
      showLoading(false);
  }
}



function createAssignmentElement(assignment) {
  const element = document.createElement('div');
  element.className = 'assignment-card';
  
  const dueDate = assignment.dueDate?.toDate();
  const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date';

  element.innerHTML = `
      <div class="assignment-header">
          <span class="material-icons assignment-icon">assignment</span>
          <div class="assignment-title-section">
              <h3>${assignment.title}</h3>
              <div class="assignment-details">
                  <span class="material-icons">event</span>
                  <span>Due ${formattedDate}</span>
                  <span>•</span>
                  <span>${assignment.points} points</span>
              </div>
          </div>
          ${isTeacher ? `
              <div class="assignment-actions">
                  <button class="delete-btn">
                      <span class="material-icons">delete</span>
                  </button>
              </div>
          ` : ''}
      </div>
      <div class="assignment-description">
          ${assignment.description}
      </div>
      ${!isTeacher ? `
          <div class="submission-section" id="submission-section-${assignment.id}">
              <div class="submission-form">
                  <textarea 
                      class="submission-input" 
                      style="width: 735px;"
                      id="submission-input-${assignment.id}" 
                      placeholder="Type your answer here..."
                  ></textarea>
                  <div class="submission-actions">
                      <button class="submit-btn" data-assignment-id="${assignment.id}">
                          Submit Assignment
                      </button>
                  </div>
              </div>
              <div class="submission-status" id="submission-status-${assignment.id}"></div>
          </div>
      ` : `
          <div class="submissions-list" id="submissions-list-${assignment.id}">
              <h4>Submissions</h4>
              <div class="submissions-container"></div>
          </div>
      `}
  `;

  // Add event listeners
  if (!isTeacher) {
      const submitBtn = element.querySelector('.submit-btn');
      if (submitBtn) {
          submitBtn.addEventListener('click', () => {
              handleSubmitAssignment(assignment.id);
          });
      }
  } else {
      const deleteBtn = element.querySelector('.delete-btn');
      if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
              handleDeleteAssignment(assignment.id);
          });
      }
  }

  // Load existing submission or submissions list
  if (isTeacher) {
      setTimeout(() => loadSubmissions(assignment.id), 0);
  } else {
      setTimeout(() => loadExistingSubmission(assignment.id), 0);
  }

  return element;
}



function handleFileSelection(event, assignmentId) {
  const fileList = document.getElementById(`file-list-${assignmentId}`);
  fileList.innerHTML = '';
  
  Array.from(event.target.files).forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
          <span class="material-icons">description</span>
          <span class="file-name">${file.name}</span>
          <span class="file-size">(${formatFileSize(file.size)})</span>
      `;
      fileList.appendChild(fileItem);
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


async function loadExistingSubmission(assignmentId) {
  try {
      const submissionRef = doc(
          db, 
          "classes", 
          currentClass.id, 
          "assignments", 
          assignmentId, 
          "submissions", 
          currentUser.uid
      );
      
      const submissionDoc = await getDoc(submissionRef);
      const statusContainer = document.getElementById(`submission-status-${assignmentId}`);
      
      if (submissionDoc.exists()) {
          const submission = submissionDoc.data();
          const submittedDate = submission.submittedAt?.toDate();
          
          statusContainer.innerHTML = `
              <div class="status-card ${submission.status}">
                  <div class="status-header">
                      <span class="material-icons">
                          ${submission.status === 'graded' ? 'grade' : 'check_circle'}
                      </span>
                      <span class="status-text">
                          ${submission.status === 'graded' ? 'Graded' : 'Submitted'}
                      </span>
                  </div>
                  <div class="status-details">
                      ${submittedDate ? `Submitted on ${submittedDate.toLocaleDateString()}` : ''}
                      ${submission.grade ? `<br>Grade: ${submission.grade}/${submission.maxPoints}` : ''}
                  </div>
              </div>
          `;

          // Disable submission after submitted
          const submissionInput = document.getElementById(`submission-input-${assignmentId}`);
          const submitButton = statusContainer.parentElement.querySelector('.submit-btn');
          if (submissionInput && submitButton) {
              submissionInput.value = submission.content;
              submissionInput.disabled = true;
              submitButton.disabled = true;
          }
      }
  } catch (error) {
      console.error("Error loading submission:", error);
  }
}




async function handleSubmitAssignment(assignmentId) {
  console.log("Submitting assignment:", assignmentId);

  const submissionInput = document.getElementById(`submission-input-${assignmentId}`);
  if (!submissionInput) {
      console.error("Submission input not found");
      return;
  }

  const content = submissionInput.value.trim();
  if (!content) {
      showToast("Please enter your answer before submitting");
      return;
  }

  try {
      showLoading(true);

      // Create the submission document reference
      const submissionRef = doc(
          db, 
          "classes", 
          currentClass.id, 
          "assignments", 
          assignmentId, 
          "submissions", 
          currentUser.uid
      );

      // Prepare submission data
      const submissionData = {
          content: content,
          submittedAt: serverTimestamp(),
          submittedBy: currentUser.uid,
          studentName: currentUser.displayName || currentUser.email,
          studentEmail: currentUser.email,
          status: 'submitted',
          grade: null
      };

      // Submit the assignment using setDoc
      await setDoc(submissionRef, submissionData);

      // Clear the input and show success message
      submissionInput.value = '';
      showToast("Assignment submitted successfully");

      // Disable the input and submit button
      submissionInput.disabled = true;
      const submitBtn = document.querySelector(`[data-assignment-id="${assignmentId}"]`);
      if (submitBtn) {
          submitBtn.disabled = true;
      }

      // Update the submission status
      const statusContainer = document.getElementById(`submission-status-${assignmentId}`);
      if (statusContainer) {
          statusContainer.innerHTML = `
              <div class="status-card submitted">
                  <div class="status-header">
                      <span class="material-icons">check_circle</span>
                      <span>Submitted successfully</span>
                  </div>
                  <div class="status-details">
                      Submitted just now
                  </div>
              </div>
          `;
      }

  } catch (error) {
      console.error("Error submitting assignment:", error);
      showToast("Error submitting assignment");
  } finally {
      showLoading(false);
  }
}





async function loadSubmissions(assignmentId) {
  try {
      const submissionsContainer = document.querySelector(`#submissions-list-${assignmentId} .submissions-container`);
      if (!submissionsContainer) {
          console.error('Submissions container not found');
          return;
      }

      const submissionsRef = collection(
          db, 
          "classes", 
          currentClass.id, 
          "assignments", 
          assignmentId, 
          "submissions"
      );
      
      const q = query(submissionsRef, orderBy("submittedAt", "desc"));
      
      // Cleanup previous listener if exists
      if (submissionListeners.has(assignmentId)) {
          submissionListeners.get(assignmentId)();
          submissionListeners.delete(assignmentId);
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
          submissionsContainer.innerHTML = '';

          if (snapshot.empty) {
              submissionsContainer.innerHTML = `
                  <div class="no-submissions">
                      <p>No submissions yet</p>
                  </div>
              `;
              return;
          }

          snapshot.forEach((doc) => {
              const submission = doc.data();
              const submissionElement = createSubmissionElement(assignmentId, doc.id, submission);
              submissionsContainer.appendChild(submissionElement);
          });
      });

      submissionListeners.set(assignmentId, unsubscribe);
  } catch (error) {
      console.error("Error loading submissions:", error);
      showToast("Error loading submissions");
  }
}

function createSubmissionElement(assignmentId, submissionId, submission) {
  const element = document.createElement('div');
  element.className = 'submission-item';
  
  const submissionDate = submission.submittedAt?.toDate();
  const formattedDate = submissionDate ? new Date(submissionDate).toLocaleDateString() : 'Unknown date';
  const maxPoints = submission.maxPoints || 100; // Default to 100 if not specified

  element.innerHTML = `
      <div class="submission-header">
          <div class="submitter-info">
              <span class="submitter-name">${submission.studentName || 'Unknown Student'}</span>
              <div class="submission-details">
                  <span class="submission-date">
                      <span class="material-icons">schedule</span>
                      Submitted on ${formattedDate}
                  </span>
                  ${submission.status === 'graded' ? `
                      <span class="grade-badge">
                          <span class="material-icons">grade</span>
                          Grade: ${submission.grade}/${maxPoints}
                      </span>
                  ` : ''}
              </div>
          </div>
          ${isTeacher ? `
              <div class="grade-section">
                  <input 
                      type="number" 
                      class="grade-input" 
                      value="${submission.grade || ''}"
                      placeholder="Grade"
                      min="0"
                      max="${maxPoints}"
                  />
                  <button 
                      class="grade-btn"
                      data-assignment-id="${assignmentId}"
                      data-submission-id="${submissionId}"
                      data-max-points="${maxPoints}"
                  >
                      ${submission.grade ? 'Update Grade' : 'Save Grade'}
                  </button>
              </div>
          ` : ''}
      </div>
      <div class="submission-content">
          ${submission.content}
      </div>
      ${submission.grade ? `
          <div class="grade-info">
              <div class="grade-details">
                  <span class="grade-label">Grade:</span>
                  <span class="grade-value">${submission.grade}/${maxPoints}</span>
                  ${submission.gradedAt ? `
                      <span class="grade-date">
                          Graded on ${new Date(submission.gradedAt.toDate()).toLocaleDateString()}
                      </span>
                  ` : ''}
              </div>
              ${submission.feedback ? `
                  <div class="feedback">
                      <span class="feedback-label">Feedback:</span>
                      <p class="feedback-content">${submission.feedback}</p>
                  </div>
              ` : ''}
          </div>
      ` : ''}
  `;

  // Add event listener for grade button
  if (isTeacher) {
      const gradeBtn = element.querySelector('.grade-btn');
      const gradeInput = element.querySelector('.grade-input');

      if (gradeBtn && gradeInput) {
          gradeBtn.addEventListener('click', () => {
              handleGradeSubmission(
                  assignmentId,
                  submissionId,
                  gradeInput.value,
                  maxPoints
              );
          });
      }
  }

  return element;
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

async function switchTab(tabName) {
  // Remove active class from all tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
  });

  // Hide all content tabs
  document.querySelectorAll(".content-tab").forEach((tab) => {
      tab.style.display = "none";
  });

  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}Tab`);
  if (selectedTab) {
      selectedTab.style.display = "block";
  }

  // Load content based on tab
  if (tabName === 'classwork') {
      await loadAssignments();
  }
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
  setupAssignmentHandlers();
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
  if (unsubscribeAssignments) unsubscribeAssignments();
  if (unsubscribeClass) unsubscribeClass();
  if (unsubscribeAnnouncements) unsubscribeAnnouncements();
  if (unsubscribeClass) unsubscribeClass();
  if (unsubscribeAnnouncements) unsubscribeAnnouncements();
  if (unsubscribeAssignments) unsubscribeAssignments();
  submissionListeners.forEach(unsubscribe => unsubscribe());
  submissionListeners.clear();
});



function setupAssignmentHandlers() {
  // Create Assignment Button
  const createBtn = document.getElementById('createAssignmentBtn');
  if (createBtn) {
      createBtn.addEventListener('click', () => {
          const modal = document.getElementById('assignmentModal');
          if (modal) {
              modal.style.display = 'flex'; // Using flex for centering
          }
      });
  }

  // Assignment Form
  const assignmentForm = document.getElementById('assignmentForm');
  if (assignmentForm) {
      assignmentForm.addEventListener('submit', handleCreateAssignment);
  }

  // Modal Close Button
  const closeBtn = document.querySelector('#assignmentModal .close');
  if (closeBtn) {
      closeBtn.addEventListener('click', closeAssignmentModal);
  }

  // Modal Cancel Button
  const cancelBtn = document.querySelector('#assignmentModal .cancel-btn');
  if (cancelBtn) {
      cancelBtn.addEventListener('click', closeAssignmentModal);
  }

  // Click outside modal to close
  const modal = document.getElementById('assignmentModal');
  if (modal) {
      modal.addEventListener('click', (e) => {
          if (e.target === modal) {
              closeAssignmentModal();
          }
      });
  }
}




// Add at the bottom of class.js
window.handleSubmitAssignment = handleSubmitAssignment;
window.handleDeleteAssignment = handleDeleteAssignment;

// Add at the bottom of class.js
window.handleDeleteAssignment = handleDeleteAssignment;
window.handleFileSelection = handleFileSelection;
window.handleGradeSubmission = handleGradeSubmission;
window.handleSubmitAssignment = handleSubmitAssignment;