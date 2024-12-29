# Classroom Web Application 

The Classroom Project is a web-based application designed to facilitate interaction between students and instructors. This platform allows for class creation, management, and login features such as Email and Google authentication.

[Visit the Project](https://classroomsm.freewebhostmost.com/)

## Features

1.  **Dark Mode**: Provides a user-friendly interface in low-light environments.  
2.  **Login and Register with Email**: Allows users to log in securely using their email and password.  
3.  **Login and Register with Google**: Enables quick login using Google authentication.  
4.  **Seamless Account Integration**: Whether you log in using Google or email, you access the same account.  
5.  **Forgot Password**: Allows users to reset their password via email if they forget it.  
6.  **Create Class**: Teachers or administrators can create virtual classes for easy collaboration.  
7.  **Join Class**: Students can join classes using a unique class code.  
8.  **Make Assignments**: Teachers can create assignments and other classwork activities for students.  
9.  **Submit Assignment**: Students can submit their assignments directly through the platform.  
10. **Add Grades**: Teachers can evaluate submissions and assign grades to students.  
11. **Announcements**: Teachers can post announcements to notify class participants about important updates.  
12. **Real-time Announcements**: Announcements are updated in real time, ensuring no participant misses important updates.  
13. **Delete Announcements**: Teachers can delete announcements when no longer needed.  
14. **Upgrade to Teacher**: Users can be granted teacher privileges to create classes, assign classwork, and manage class activities.  
15. **View Members Count**: Class creators and members can view the total number of participants (students and teachers) in each class.  
16. **Hosting**: Classes, assignments, and activities are hosted [here](https://classroomsm.freewebhostmost.com/).  


## Languages Used

- **HTML**
- **CSS**
- **JavaScript**

## Installation

To set up the project on your local machine, follow these instructions:

### Prerequisites

Make sure you have the following tools installed on your system:

- **Git** for version control.
- **Node.js** or **Python**, depending on your preferred environment.

### Steps

### 1. **Clone the Repository**

To clone the repository to your local machine, use the following command:

```bash
git clone https://github.com/Mohamedgwad/classroom.git
```

Then navigate into the project directory:

```bash
cd classroom
```

---

### 2. **Navigate to the Project Directory**

   After cloning, open the project directory in your terminal or command prompt.

### 3. **Install Dependencies**

   Depending on your project setup, install the necessary dependencies:

   - For **Node.js** projects, run `npm install` in the project directory.

     ```bash
     npm install
     ```

### 4. **Start the Project**

   To run the project, you can serve the static files using one of the following methods:

   ### Option 1: Using `http-server` (Node.js)

   If you are using **Node.js**, you can install and use `http-server` to serve the files.

   - Install `http-server` globally:
     ```bash
     npm install -g http-server
     ```

   - Start the server:
     ```bash
     http-server
     ```

   The project will be accessible at [http://127.0.0.1:8080](http://127.0.0.1:8080).

   ### Option 2: Using Python's Built-in HTTP Server

   If you prefer **Python**, you can use Python’s built-in HTTP server to serve static files.

   - Navigate to the project directory and run:
     ```bash
     python -m http.server
     ```

   This will serve the project at [http://localhost:8000](http://localhost:8000).

### Firebase Authentication Setup

To enable Firebase Authentication for login functionality (via Email or Google), follow these steps:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project or use an existing one.
3. Set up Firebase Authentication by enabling Email/Password and Google sign-in methods.

### Directory Structure

Here’s the directory structure for your reference:

```
classroom/
├── auth/
│   ├── auth.js               # Handles user authentication logic
│   ├── firebase-config.js    # Firebase authentication configuration
│   ├── login.html            # Login page interface
│   ├── login.js              # Login page functionality
│   ├── register.html         # Registration page interface
│   └── register.js           # Registration page functionality
├── images/                   # Folder containing image assets
│   ├── 86dd2927-11ea-4f1b-a8b2-cdf2388....png 
│   ├── al-icon.png          
│   ├── arrow-point-to-right.png 
│   ├── google-icon.png      
│   ├── interface_12383011.png 
│   ├── toppng.com-menu-icon-png-3-line....png 
│   └── unnamed.png                            
├── main/
│   ├── class.html            # Classroom page for managing classes
│   ├── main.html             # Main page of the application
├── src/
│   ├── class.js              # JavaScript for classroom management functionality
│   ├── index.js              # Core JavaScript for application initialization
│   ├── script.js             # Additional scripts for main functionality
├── styles/
│   ├── class.css             # CSS styling for the classroom page
│   ├── style.css             # General CSS styling for the application
├── index.html                # Main entry point of the application
└── README.md                 # Documentation for the project
```
## Usage
Once the project is running, you can access and use the following features:
- **Login**: Users can log in using their Email or Google account.
- **Create Class**: Teachers or admins can create new classes.
- **Join Class**: Students can join classes using a unique class code.
## Contributing
We welcome contributions! To contribute to this project, please follow these steps:
1. **Fork the Repository:**
   - Click the "Fork" button at the top-right of the repository page to create a personal copy of the repository.
2. **Clone Your Fork:**
   - Clone your fork to your local machine:
     ```bash
     git clone https://github.com/Mohamedgwad/classroom.git
     ```
3. **Create a New Branch:**
   - Create a new branch for your changes:
     ```bash
     git checkout -b your-feature-branch
     ```
4. **Make Changes:**
   - Make your changes and commit them:
     ```bash
     git add .
     git commit -m "Your descriptive commit message"
     ```
5. **Push Your Changes:**
   - Push your changes to your fork:
     ```bash
     git push origin your-feature-branch
     ```
6. **Submit a Pull Request:**
   - Go to the original repository and open a pull request to merge your changes.
---
                  
<p align="center">
  <strong>By Ahmad Shaker and Mohamed Gwad</strong><br>
  <strong>S&M Group</strong>
</p>
