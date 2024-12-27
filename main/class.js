// class.js
import { 
    doc, 
    getDoc, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from '../auth/firebase-config.js';

class ClassView {
    constructor() {
        this.classId = new URLSearchParams(window.location.search).get('id');
        if (!this.classId) {
            window.location.href = 'main.html';
            return;
        }

        this.currentUser = null;
        this.classData = null;
        this.currentTab = 'stream';
        this.announcements = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupAuthStateObserver();
    }

    initializeElements() {
        // Header Elements
        this.className = document.getElementById('className');
        this.classSection = document.getElementById('classSection');
        this.classTeacher = document.getElementById('classTeacher');
        this.classHeader = document.getElementById('classHeader');

        // Tab Elements
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.contentTabs = document.querySelectorAll('.content-tab');

        // Stream Elements
        this.announcementInput = document.getElementById('announcementInput');
        this.announcementForm = document.getElementById('announcementForm');
        this.announcementsList = document.getElementById('announcementsList');

        // People Elements
        this.teachersList = document.getElementById('teachersList');
        this.studentsList = document.getElementById('studentsList');

        // UI Elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.toast = document.getElementById('toast');
    }

    setupEventListeners() {
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Announcement form
        if (this.announcementForm) {
            this.announcementForm.addEventListener('submit', (e) => this.createAnnouncement(e));
        }

        // Profile and theme elements from main page
        const profileSection = document.getElementById('profileSection');
        const profileDropdown = document.getElementById('profileDropdown');
        const themeSwitch = document.getElementById('checkbox');

        if (profileSection && profileDropdown) {
            profileSection.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!profileSection.contains(e.target)) {
                    profileDropdown.classList.remove('show');
                }
            });
        }

        if (themeSwitch) {
            themeSwitch.addEventListener('change', () => {
                document.body.classList.toggle('dark-theme');
                localStorage.setItem('theme', 
                    document.body.classList.contains('dark-theme') ? 'dark-theme' : '');
            });
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.add(savedTheme);
            if (themeSwitch) themeSwitch.checked = savedTheme === 'dark-theme';
        }
    }

    setupAuthStateObserver() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.updateUIForAuth(user);
                await this.loadClassData();
                this.setupRealtimeListeners();
            } else {
                window.location.href = '../auth/login.html';
            }
        });
    }
    

    async loadClassData() {
        try {
            this.showLoading(true);
            const classDoc = await getDoc(doc(db, 'classes', this.classId));
            
            if (!classDoc.exists()) {
                window.location.href = 'main.html';
                return;
            }

            this.classData = { id: classDoc.id, ...classDoc.data() };
            
            // Check if user is a member
            if (!this.classData.members?.[this.currentUser.uid]) {
                window.location.href = 'main.html';
                return;
            }

            this.updateClassUI();
            await this.loadTabContent(this.currentTab);
        } catch (error) {
            console.error('Error loading class:', error);
            this.showToast('Error loading class data');
        } finally {
            this.showLoading(false);
        }
    }

    updateClassUI() {
        this.className.textContent = this.classData.name;
        this.classSection.textContent = `Section: ${this.classData.section}`;
        this.classTeacher.textContent = `Teacher: ${this.classData.teacher}`;
        this.classHeader.style.backgroundColor = this.classData.color;

        // Show/hide teacher-only elements
        const isTeacher = this.classData.members[this.currentUser.uid].role === 'teacher';
        document.querySelectorAll('.teacher-only').forEach(el => {
            el.style.display = isTeacher ? 'block' : 'none';
        });
    }

    async loadTabContent(tab) {
        switch (tab) {
            case 'stream':
                await this.loadAnnouncements();
                break;
            case 'classwork':
                await this.loadClasswork();
                break;
            case 'people':
                await this.loadPeople();
                break;
        }
    }

    setupRealtimeListeners() {
        // Listen for announcements
        const announcementsQuery = query(
            collection(db, 'classes', this.classId, 'announcements'),
            orderBy('timestamp', 'desc')
        );

        onSnapshot(announcementsQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    this.renderAnnouncement(change.doc.id, change.doc.data());
                }
                // Handle updates and removals if needed
            });
        });
    }

    async createAnnouncement(e) {
        e.preventDefault();
        const content = this.announcementInput.value.trim();
        if (!content) return;

        try {
            this.showLoading(true);
            await addDoc(collection(db, 'classes', this.classId, 'announcements'), {
                content,
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || this.currentUser.email,
                authorEmail: this.currentUser.email,
                timestamp: serverTimestamp()
            });

            this.announcementInput.value = '';
            this.showToast('Announcement posted successfully');
        } catch (error) {
            console.error('Error posting announcement:', error);
            this.showToast('Error posting announcement');
        } finally {
            this.showLoading(false);
        }
    }

    renderAnnouncement(id, data) {
        const announcement = document.createElement('div');
        announcement.className = 'announcement';
        announcement.innerHTML = `
            <div class="announcement-header">
                <img src="${data.authorPhotoURL || '../images/unnamed.png'}" alt="${data.authorName}" class="user-avatar small">
                <div class="announcement-meta">
                    <div class="author-name">${data.authorName}</div>
                    <div class="timestamp">${this.formatTimestamp(data.timestamp)}</div>
                </div>
                ${data.authorId === this.currentUser.uid ? `
                    <button class="menu-button material-icons">more_vert</button>
                    <div class="announcement-menu">
                        <button class="menu-item" data-action="edit">
                            <span class="material-icons">edit</span>
                            Edit
                        </button>
                        <button class="menu-item" data-action="delete">
                            <span class="material-icons">delete</span>
                            Delete
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="announcement-content">${data.content}</div>
            <div class="announcement-actions">
                <button class="action-button comment-button">
                    <span class="material-icons">comment</span>
                    Comment
                </button>
            </div>
            <div class="comments-section" id="comments-${id}"></div>
        `;

        // Add event listeners
        this.setupAnnouncementListeners(announcement, id, data);

        if (this.announcementsList) {
            this.announcementsList.insertBefore(announcement, this.announcementsList.firstChild);
        }
    }

    async loadPeople() {
        const members = Object.entries(this.classData.members || {});
        
        const teachers = members.filter(([_, member]) => member.role === 'teacher');
        const students = members.filter(([_, member]) => member.role === 'student');

        this.teachersList.innerHTML = teachers.map(([uid, member]) => `
            <div class="person-item">
                <img src="../images/unnamed.png" alt="${member.name}" class="user-avatar small">
                <div class="person-info">
                    <div class="person-name">${member.name}</div>
                    <div class="person-email">${member.email}</div>
                </div>
            </div>
        `).join('');

        this.studentsList.innerHTML = students.map(([uid, member]) => `
            <div class="person-item">
                <img src="../images/unnamed.png" alt="${member.name}" class="user-avatar small">
                <div class="person-info">
                    <div class="person-name">${member.name}</div>
                    <div class="person-email">${member.email}</div>
                </div>
            </div>
        `).join('');
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        this.contentTabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabName}Tab`);
        });

        this.loadTabContent(tabName);
    }

    // Utility Functions
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showToast(message, duration = 3000) {
        const toastMessage = this.toast.querySelector('.toast-message');
        if (toastMessage) {
            toastMessage.textContent = message;
            this.toast.style.display = 'block';
            setTimeout(() => {
                this.toast.style.display = 'none';
            }, duration);
        }
    }

    updateUIForAuth(user) {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        if (userName && userEmail) {
            userName.textContent = user.displayName || user.email;
            userEmail.textContent = user.email;
        }
    }
}

// Initialize the class view
document.addEventListener('DOMContentLoaded', () => {
    new ClassView();
});


