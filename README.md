# Classroom Web Application

The Classroom Project is a web-based application designed to facilitate interaction between students and instructors. This platform allows for class creation, management, and login features such as Email and Google authentication.

## Features

- Dark Mode
- Login with Email
- Login with Google
- Create Class
- Join Class

## Languages Used

- **CSS**
- **JavaScript**
- **HTML**

## Installation

To set up the project on your local machine, follow these instructions:

### Prerequisites

Make sure you have the following tools installed on your system:

- **Git** for version control.
- **Node.js** or **Python**, depending on your preferred environment.

### Steps

Sure! Here's the updated version with the two separate steps for cloning the repository:

---

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

2. **Navigate to the Project Directory**

   After cloning, open the project directory in your terminal or command prompt.

3. **Install Dependencies**

   Depending on your project setup, install the necessary dependencies:

   - For **Node.js** projects, run `npm install` in the project directory.
   
     ```bash
     npm install
     ```

4. **Start the Project**

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
│   ├── firebase-config.js   # Firebase authentication configuration
│   ├── login.html           # Login page
│   ├── login.js             # Login page functionality
│   ├── register.html        # Registration page
│   └── register.js          # Registration page functionality
├── main/
│   ├── main.html            # Main page of the application
│   └── script.js            # JavaScript for main functionality
└── styles/
│    └── style.css            # CSS styling for the application
└── index.html               # Main entry point of the application
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