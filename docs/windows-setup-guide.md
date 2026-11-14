# Smart Campus Connect – Windows Setup & Deployment Guide
## MERNOVA X 2026 • Presidency University • MCA Capstone Project

This guide provides complete, step-by-step instructions for installing, configuring, running, and testing the entire **Smart Campus Connect** system on a Windows 10/11 operating system.

---

## 1. System Requirements & Prerequisites

### 1.1 Hardware Requirements
- **Operating System:** Windows 10 (64-bit) or Windows 11
- **Processor:** Intel Core i5 / AMD Ryzen 5 or higher (Hardware Virtualization enabled in BIOS for Android Emulator)
- **RAM:** Minimum 8 GB (16 GB strongly recommended for running Android Emulator + React + Node.js simultaneously)
- **Free Disk Space:** Minimum 15 GB free space (for Android SDK, Flutter SDK, Node modules, and build caches)

### 1.2 Required Software
| Software Tool | Recommended Version | Purpose | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | v18.x to v22.x LTS | Express.js backend & React Vite runtime | `node --version` |
| **npm** | v9.x to v11.x | Package manager for Node and React | `npm --version` |
| **Git for Windows** | v2.40+ | Version control & bash utilities | `git --version` |
| **Flutter SDK** | v3.24.x to v3.38.x | Android mobile application development | `flutter --version` |
| **Android Studio** | Hedgehog / Iguana / Koala / Ladybug | Android SDK, platform tools & AVD Emulator | Check Android Studio GUI |
| **Java JDK** | OpenJDK 17 or 21 | Android Gradle build engine | `java -version` |
| **VS Code** | Latest Stable | Recommended IDE for React, Flutter, and Backend | `code --version` |

---

## 2. Environment Variables Configuration (Windows)

Ensure the following paths are added to your **User** or **System `PATH`** environment variable:

1. **Flutter SDK:**
   ```text
   C:\path\to\flutter\bin
   ```
2. **Android SDK Platform Tools (for `adb` command):**
   ```text
   C:\Users\<YourUsername>\AppData\Local\Android\Sdk\platform-tools
   ```
3. **Android SDK Emulator:**
   ```text
   C:\Users\<YourUsername>\AppData\Local\Android\Sdk\emulator
   ```
4. **Java JDK (`JAVA_HOME`):**
   ```text
   JAVA_HOME = C:\Program Files\Android\Android Studio\jbr  (or your installed JDK path)
   ```

To verify your environment, open PowerShell and run:
```powershell
flutter doctor
```
*Ensure Android toolchain and connected devices/emulators display checkmarks.*

---

## 3. Project Directory Structure

```text
C:\Smart-Campus-Connect\
├── server\               # Node.js + Express.js REST API Backend
│   ├── .env.example      # Sample environment variables
│   ├── .env              # Private MongoDB Atlas connection (NOT committed)
│   ├── package.json
│   ├── server.js         # Entry point (port 5000)
│   └── src\              # Models, Controllers, Routes, Middleware
├── client\               # React.js + Vite Web Application
│   ├── package.json
│   ├── vite.config.js
│   └── src\              # Dashboards, Components, Services
├── mobile\               # Flutter Android Mobile Application
│   ├── pubspec.yaml
│   ├── android\          # Native Android Gradle configuration
│   └── lib\              # Screens, Providers, Models, Services
├── docs\                 # Technical documentation, diagrams, reports
└── README.md             # Project overview
```

---

## 4. Backend Setup & Configuration (Node.js + MongoDB Atlas)

### Step 4.1: Install Dependencies
Open PowerShell as Administrator or regular user:
```powershell
cd C:\Smart-Campus-Connect\server
npm install
```

### Step 4.2: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Open `server\.env` in your text editor and configure:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@smartcampusconnect.xxxx.mongodb.net/SmartCampusConnect?retryWrites=true&w=majority
JWT_SECRET=supersecret_smartcampus_jwt_key_2026_mernova
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```
> [!IMPORTANT]
> Never share or commit your actual MongoDB Atlas password. The `.env` file is excluded from Git via `.gitignore`.

### Step 4.3: Seed Initial Campus Data
Populate the initial administrator, faculty, student accounts, and classroom QR locations:
```powershell
node src/utils/seedData.js
```
*Expected Output:*
```text
[Success] Database Connected: SmartCampusConnect
[Success] Created 4 sample user accounts.
[Success] Created 7 campus classroom/lab locations with QR identifiers.
```

### Step 4.4: Start the Backend Server
```powershell
node server.js
```
*Expected Output:*
```text
=============================================================
 SMART CAMPUS CONNECT SERVER RUNNING
 Event: MERNOVA X 2026 - Presidency University
 Environment: development
 Port: 5000
 Local URL: http://localhost:5000
 Health Check: http://localhost:5000/api/health
=============================================================
[Success] MongoDB Atlas Connected: SmartCampusConnect
```
Verify by visiting `http://localhost:5000/api/health` in your browser. It should return:
```json
{ "status": "ok", "timestamp": "...", "database": "connected" }
```

---

## 5. React Web Application Setup (Administrator & Faculty Portal)

Open a **new PowerShell window**:

### Step 5.1: Install Dependencies
```powershell
cd C:\Smart-Campus-Connect\client
npm install
```

### Step 5.2: Start the Development Server
```powershell
npm run dev
```
*Or for a production-optimized preview build:*
```powershell
npm run build
npm run preview -- --port 5173
```
- Open your browser and navigate to: **`http://localhost:5173`**
- You will see the Presidency University Smart Campus Connect login portal.

---

## 6. Android Mobile Application Setup (Flutter Student App)

### Step 6.1: Start the Android Emulator
1. Open **Android Studio** $\to$ **Virtual Device Manager** (or run via CLI):
   ```powershell
   emulator -avd Pixel_8
   ```
2. Wait for the Android home screen to finish booting.
3. Verify the device is recognized:
   ```powershell
   adb devices
   ```
   *Expected Output:*
   ```text
   List of devices attached
   emulator-5554    device
   ```

### Step 6.2: Configure Network Bridge (`adb reverse`)
Because the Android emulator runs in a separate network namespace from the host Windows OS, configure `adb reverse` so that the emulator can access the backend server at `http://127.0.0.1:5000`:
```powershell
adb reverse tcp:5000 tcp:5000
```
> [!TIP]
> Run `adb reverse --list` to confirm that `host-15 tcp:5000 tcp:5000` is active.

### Step 6.3: Install and Run the Flutter Mobile App
Open a **third PowerShell window**:
```powershell
cd C:\Smart-Campus-Connect\mobile
flutter pub get
flutter run
```
*Alternatively, install the pre-compiled APK directly:*
```powershell
adb install -r build\app\outputs\flutter-apk\app-debug.apk
# or the release APK:
adb install -r build\app\outputs\flutter-apk\app-release.apk
```

---

## 7. Pre-Configured Test Credentials

| Role | Username / Email | Password | Primary Interface | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Campus Admin** | `admin@presidencyuniversity.in` | `Admin@123` | React Web Portal | Full system overview, KPI analytics, venue QR generation, technician dispatch, complaint resolution |
| **Faculty Member** | `faculty.cs@presidencyuniversity.in` | `Faculty@123` | React Web Portal | Facility reservations, workshop scheduling, notice broadcasting |
| **Student (Demo 1)** | `rahul.sharma@presidencyuniversity.in` | `Student@123` | Flutter Mobile App | Smart QR issue reporting, ticket tracking, event registration, room booking |
| **Student (Demo 2)** | `priya.patel@presidencyuniversity.in` | `Student@123` | Flutter Mobile App | Secondary student account for multi-user testing |

---

## 8. Common Windows Troubleshooting & Solutions

### Issue 1: PowerShell Script Execution Policy Error
**Symptom:** `flutter : File C:\...\flutter.ps1 cannot be loaded because running scripts is disabled on this system.`  
**Fix:** Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 2: Port 5000 Already in Use
**Symptom:** `Error: listen EADDRINUSE: address already in use 0.0.0.0:5000`  
**Fix:** Find and terminate the process holding port 5000:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### Issue 3: Cross-Drive Kotlin Compilation Error in Flutter
**Symptom:** `IllegalArgumentException: this and base files have different roots` when `PUB_CACHE` is on `D:\` and project is on `C:\`.  
**Fix:** Add the following lines to `mobile\android\gradle.properties`:
```properties
kotlin.incremental=false
kotlin.incremental.useClasspathSnapshot=false
```

### Issue 4: Android App Shows "Connection Failed / Network Unreachable"
**Symptom:** Flutter logcat reports `OS Error: Network is unreachable, errno = 101` when attempting to reach `10.0.2.2:5000`.  
**Fix:** Run `adb reverse tcp:5000 tcp:5000` and tap the gear icon (*Server Settings*) on the app login screen to ensure the server URL is `http://127.0.0.1:5000/api`.

### Issue 5: Testing on a Physical Android Smartphone
**Symptom:** You want to demonstrate the app on a real physical Android smartphone over campus Wi-Fi.  
**Fix:**
1. Connect your PC and phone to the same Wi-Fi network.
2. Find your PC's local Wi-Fi IP using `ipconfig` (e.g. `192.168.1.15`).
3. In the mobile app, tap the gear icon (*Server Settings*) on the top right of the login screen.
4. Change the server URL to `http://192.168.1.15:5000/api` and click **Save**.
5. Enable port 5000 in Windows Defender Firewall if prompted.

---
**SMART CAMPUS CONNECT • MERNOVA X 2026 • PRESIDENCY UNIVERSITY**

