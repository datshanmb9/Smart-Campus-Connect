# SMART CAMPUS CONNECT
### One Campus. One Platform. Connected Services.
**Final Year MCA Capstone Project – MERNOVA X 2026**  
*Department of Computer Applications • Presidency University, Bengaluru*

---

## 📌 Executive Summary

**Smart Campus Connect** is an integrated full-stack university management platform designed to bridge communication gaps among **Students, Faculty, and University Administrators**.

Operating on a unified **Node.js + Express.js backend** and a cloud-hosted **MongoDB Atlas cluster**, the platform delivers:
1. A **React.js Web Portal** for University Administrators and Faculty to triage complaints, approve facility bookings, schedule campus events, and analyze performance metrics.
2. A **Flutter Android Mobile Application** for Students to report classroom faults via **Smart QR Codes**, track ticket resolution histories in real-time, register for campus workshops, reserve seminar halls, and report lost items.

---

## 🏛️ Technology Stack

| Layer | Technology | Key Libraries / Frameworks |
|---|---|---|
| **Cloud Database** | **MongoDB Atlas** | Hosted Replica Set, Mongoose ODM v8, Compound Indexes |
| **Backend REST API** | **Node.js & Express.js** | JWT (jsonwebtoken), bcryptjs, Multer (multipart), Morgan, CORS |
| **Web Dashboard** | **React.js 18 + Vite** | React Router v6, Axios, Lucide Icons, Custom CSS System |
| **Mobile App (Android)** | **Flutter 3.47 + Dart 3.13** | Provider (State Management), Mobile Scanner (Camera QR), Image Picker, Http |
| **Version Control & Dev** | **Git & Antigravity** | Monorepo structure, Automated Test Suites |

---

## 🌟 Key Functional Modules

### 1. 📷 Smart QR Classroom Issue Reporting (Flagship Feature)
- Each lecture hall, computer lab, seminar hall, and auditorium is tagged with a unique campus QR plate (e.g., `PU-ENGG-LH204`).
- A student opens the **Flutter Mobile App** and scans the QR plate with the smartphone camera.
- The app immediately resolves the exact room, building, block, and floor from the backend via `GET /api/locations/qr/:code`.
- The student selects a category (Projector, Electrical, Computer/Lab, Wi-Fi/Network, Furniture, Plumbing, etc.), attaches a photo, and submits.
- The system generates an official sequential ticket number (`CMP-2026-XXXX`).
- Fallback manual location selection is provided if the camera or physical QR plate is unavailable.

### 2. 📋 End-to-End Complaint Lifecycle & Audit History
- Live complaints appear instantly on the **React Web Admin Dashboard**.
- Administrators assign tickets to maintenance technicians with contact details and dispatch notes.
- Status flows through a strict audit trail: `Pending` $\to$ `Assigned` $\to$ `In Progress` $\to$ `Resolved` (or `Rejected`).
- Every transition logs the timestamp, actor, and remarks in `ComplaintHistory`.
- Students receive automated in-app notifications and can view the visual timeline directly on their mobile device.

### 3. 📅 Campus Events & Workshop Registration
- Administrators create academic workshops, technical hackathons, cultural fests, and guest lectures.
- Real-time seat capacity tracker prevents overbooking.
- Students register via Flutter and receive a unique digital pass code (`EVT-REG-XXXXXX`).
- Duplicate registration prevention enforces the one-ticket-per-student rule.

### 4. 🏢 Facility & Room Reservation (Conflict-Detection Engine)
- Students and faculty submit reservation requests for seminar halls, conference rooms, and computer labs.
- Backend conflict-detection algorithm inspects existing approved and pending slots for the same room on the requested date to prevent double-booking (`409 Conflict`).
- Administrators review, approve, or reject booking requests with administrative remarks.

### 5. 🔍 Lost & Found Management
- Students report lost or found belongings with photographs, location, and date.
- Claim privacy protection: contact information is masked until ownership claims are filed and reviewed.

### 6. 📢 University Announcements & In-App Alerts
- Scoped circular distribution for All Campus, Students, or Faculty.
- Urgent priority badges highlight emergency announcements.
- Centralized notification center with unread count badges and 1-tap "Mark All Read".

### 7. 📊 Real-Time Analytics & SLA Reports
- Interactive metrics dashboard displaying resolution rates, department breakdown, ticket status distribution, and SLA performance.

---

## 📁 Repository Structure

```
Smart-Campus-Connect/
├── server/                     # Node.js + Express.js REST API Backend
│   ├── src/
│   │   ├── config/             # MongoDB Atlas connection (db.js)
│   │   ├── controllers/        # 10 business logic controllers
│   │   ├── middleware/         # Auth, RBAC, Multer upload, Error handler
│   │   ├── models/             # 10 Mongoose Schemas
│   │   ├── routes/             # Express API routes
│   │   ├── seeds/              # Safe database seed script (seedData.js)
│   │   ├── tests/              # Backend test scripts (testAuth.js, testAllModules.js)
│   │   ├── utils/              # API response helpers, Notification dispatcher
│   │   ├── app.js              # Express app configuration
│   │   └── server.js           # Server entry point (Port 5000)
│   ├── uploads/                # Static photo evidence storage
│   ├── package.json
│   └── .env.example
│
├── client/                     # React.js + Vite Web Application
│   ├── src/
│   │   ├── components/         # Sidebar, Navbar, ProtectedRoute, DashboardLayout
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── pages/              # Admin Dashboard, Complaints, Locations, Events, Bookings, Users, Analytics
│   │   ├── services/           # Axios API client (api.js)
│   │   ├── App.jsx             # React Router routing
│   │   └── index.css           # University design system styles
│   ├── testClientIntegration.cjs # 13 automated frontend API service tests
│   └── package.json
│
├── mobile/                     # Flutter Android Application
│   ├── android/                # Android native project & manifest permissions
│   ├── lib/
│   │   ├── core/               # Theme (AppTheme) & Constants (ApiConstants)
│   │   ├── models/             # 8 Dart data models
│   │   ├── providers/          # 7 ChangeNotifier state providers
│   │   ├── screens/            # Splash, Login, Register, Dashboard, QR Scanner,
│   │   │                       # Report Issue, Complaints, Events, Bookings, Lost & Found, Profile
│   │   ├── services/           # Centralized HTTP & Multipart client (ApiService)
│   │   └── main.dart           # App entry point & MultiProvider initialization
│   ├── test/                   # Automated Flutter widget & model unit tests
│   └── pubspec.yaml            # Flutter dependencies (http, provider, mobile_scanner, etc.)
│
├── docs/                       # Project Documentation & Architecture
│   ├── diagrams/               # Mermaid architectural & sequence diagrams
│   ├── architecture.md         # System architecture specification
│   ├── database-design.md      # MongoDB schemas, indexes, and ERD
│   ├── api-documentation.md    # REST API endpoints reference
│   ├── workflow.md             # QR reporting & Cross-platform workflow
│   ├── testing-report.md       # Comprehensive testing report
│   └── project-report.md       # Full 44-chapter MCA Project Dissertation Report
│
├── testCrossPlatformE2E.cjs    # 12-Step End-to-End Cross-Platform Verification Suite
└── README.md                   # Master Project Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**
- **Flutter SDK** (v3.27+ / v3.47+ recommended) & **Dart SDK**
- **Android Studio** with Android SDK and an active Android Virtual Device (AVD) or physical device
- Active Internet connection for MongoDB Atlas access

---

### Step 1: Backend Setup (Server)

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `server/.env`:
   ```ini
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@smartcampusconnect.h4dd25a.mongodb.net/SmartCampusConnect?retryWrites=true&w=majority
   JWT_SECRET=supersecret_mernova_x_2026_jwt_token_key_pu_mca_987654321
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:5173
   ```
4. Seed the database with sample locations, users, and events:
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   # Or: node server.js
   ```
   *The server starts on `http://localhost:5000` and connects to MongoDB Atlas.*

---

### Step 2: Web Application Setup (React + Vite)

1. Open a new terminal and navigate to `client/`:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the web dashboard at: `http://localhost:5173`

---

### Step 3: Mobile Application Setup (Flutter Android)

1. Open a new terminal and navigate to `mobile/`:
   ```bash
   cd mobile
   ```
2. Fetch Flutter packages:
   ```bash
   flutter pub get
   ```
3. Verify zero issues:
   ```bash
   flutter analyze
   ```
4. Run automated test suite:
   ```bash
   flutter test
   ```
5. Launch on Android Emulator or Physical Device:
   ```bash
   flutter run
   ```

> **Network Configuration Note for Mobile:**
> - When running on the **Android Emulator**, the app automatically connects to `http://10.0.2.2:5000/api`.
> - When running on a **Physical Device**, tap the **Settings icon** on the login screen or profile screen and enter your PC's Wi-Fi IP address (e.g., `http://192.168.1.15:5000/api`).

---

## 🔑 Pre-Seeded Demonstration Accounts

| Role | Email | Password | Primary Interface | Description |
|---|---|---|---|---|
| **Administrator** | `admin@presidencyuniversity.in` | `Admin@123` | **React Web Dashboard** | Full campus facility management, staff assignment, analytics |
| **Faculty Member**| `faculty.cs@presidencyuniversity.in`| `Faculty@123` | **React Web Dashboard** | Resource booking, departmental announcements |
| **Student 1** | `rahul.sharma@presidencyuniversity.in` | `Student@123` | **Flutter Android App** | 2024MCA001 • QR issue reporting, event passes, bookings |
| **Student 2** | `priya.patel@presidencyuniversity.in` | `Student@123` | **Flutter Android App** | 2024MCA002 • Lost & found claims, campus activities |

---

## 🧪 Automated Verification & Testing

Smart Campus Connect includes comprehensive automated test coverage:

```bash
# 1. Run Backend Authentication & RBAC Tests (12/12 PASSED)
cd server
npm run test:auth

# 2. Run All Backend Modules Integration Tests (PASSED)
cd server
npm run test:all

# 3. Run React Client API Service Integration Tests (13/13 PASSED)
cd client
npm run test:client

# 4. Run Flutter Mobile Unit & Widget Tests (10/10 PASSED)
cd mobile
flutter test

# 5. Run 12-Step Cross-Platform Sync Verification (12/12 PASSED)
# (Tests: Mobile QR Report -> MongoDB Atlas -> React Admin Resolve -> Mobile History Sync)
node testCrossPlatformE2E.cjs
```

---

## 👥 Project Credits & Acknowledgements

- **Event:** MERNOVA X 2026 – Presidency University
- **Academic Course:** Master of Computer Applications (MCA) Final Year Capstone Project
- **Institution:** Presidency University, Bengaluru, Karnataka, India
- **Core Architecture:** Single Unified Node.js + Express Backend • MongoDB Atlas Cloud Database • React 18 Web Dashboard • Flutter Android Application

---
*Smart Campus Connect – One Campus. One Platform. Connected Services.*

