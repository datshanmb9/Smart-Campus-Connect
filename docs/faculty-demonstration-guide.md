# Smart Campus Connect – Faculty Demonstration Guide
## Step-by-Step Live Evaluation Script • MERNOVA X 2026 • Presidency University

This guide is an end-to-end, script-style walkthrough designed for the student developer during the final MCA capstone evaluation and viva examination before the university evaluation panel.

---

## 1. Pre-Demonstration Checklist (T-minus 5 Minutes)

Before calling the evaluators over, verify that all three tiers are running smoothly:

- [ ] **Backend Service:** Running in PowerShell (`cd server; node server.js`). Confirm `http://localhost:5000/api/health` returns `status: ok` and `database: connected`.
- [ ] **React Web Portal:** Running in browser at `http://localhost:5173`. Pre-load the login page.
- [ ] **Android Device / Emulator:** `Pixel_8` running via ADB (`adb devices`).
- [ ] **Port Reverse Bridge:** Executed `adb reverse tcp:5000 tcp:5000` so mobile network calls hit the local backend.
- [ ] **Mobile App Ready:** Smart Campus Connect installed and open on the login screen.

---

## 2. Demonstration Flow & Presenter Script

### Act 1: The Executive Hook (1 – 2 Minutes)
**Presenter Script:**
> *"Good morning respected evaluators and faculty members. Today I present **Smart Campus Connect: One Campus, One Platform, Connected Services**, developed for MERNOVA X 2026 at Presidency University.*
>
> *In large university campuses like ours, when a projector fails in Lecture Hall 204 or an AC breaks down in a computer lab, students currently face fragmented communication: paper registers, word-of-mouth reports to security, or delayed emails. There is no traceability, no accountability, and no feedback when an issue is resolved.*
>
> *Smart Campus Connect solves this with a modern, cloud-native architecture connecting three key tiers:*
> 1. *A **Flutter Android application** for students featuring camera-based Smart QR scanning.*
> 2. *A **React.js web portal** for university administrators and faculty members.*
> 3. *A secure **Node.js Express REST API** integrated directly with cloud-hosted **MongoDB Atlas**.*
>
> *Let us now walk through the live student workflow on the mobile device."*

---

### Act 2: Flutter Student Mobile Application (3 Minutes)

#### Step 1: Authentication & Secure Session
1. Show the phone / emulator screen. Point out the Presidency University branding and clean University Blue color palette.
2. Tap the **"Auto-Fill Demo Student (Rahul Sharma)"** button to showcase quick login.
3. Tap **Sign In**.
4. **Talking Point:** *"The app sends a secure POST request with bcrypt password verification, returning an encrypted JWT token stored securely on the device. Session state is managed through Provider."*

#### Step 2: Student Dashboard Tour
1. Point to the personalized greeting: *"Hello, Rahul 👋 | Master of Computer Applications • 2024MCA001"*.
2. Highlight the **Notification Badge** on the top right showing unread campus updates.
3. Point out the **Active Ticket Status Card** showing current progress of pending issues.
4. Point out the **Quick Services Grid**: *Report Issue, Book Resource, Lost & Found, Workshops, and Notices*.

---

### Act 3: The Core USP – Smart QR Classroom Issue Reporting (4 Minutes)

#### Step 1: Camera Viewfinder & Runtime Permission
1. Tap the large hero button: **"Scan Classroom QR"** (or the center QR floating button).
2. Point out the Android OS camera permission request dialog and explain:
   > *"The app strictly complies with Android 14/15/16 security policies by requesting camera permissions at runtime. The viewfinder features targeting guides, torch/flashlight toggle, and camera switcher."*

#### Step 2: Instant Classroom Location Resolution
1. Tap **"Type QR Code / Select Demo Venue"** and select **`PU-ENGG-LH204` (Lecture Hall 204)**.
2. Tap **"Verify & Report Issue"**.
3. Point out what happens automatically:
   > *"Notice that the student did not have to manually type the building name, block, floor, or room number. The app queried the backend endpoint `GET /api/locations/qr/:code`, which matched the classroom plate in MongoDB Atlas and pre-populated verified location details: LH-204, Academic Block 1, Engineering Wing, 2nd Floor."*

#### Step 3: Ticket Creation
1. Select Category: **"Projector & AV"** (or Projector).
2. Issue Title: Type *"Ceiling Projector Lamp Flickering"*.
3. Description: Type *"Projector turns off intermittently every 5 minutes during MCA class"*.
4. Select Priority: Tap **"High"**.
5. Tap **"Submit Complaint Ticket"**.
6. The app displays the **Complaint Registered** confirmation pass with official ticket number (e.g. **`CMP-2026-0005`**).
7. Tap **"Back to Home"** or **"View Tickets"**.

---

### Act 4: React Web Administration Portal (4 Minutes)

Now pivot to your laptop/browser screen running the **React Web Portal** at `http://localhost:5173`.

#### Step 1: Administrator Authentication
1. Click **"Auto-Fill Administrator"** (`admin@presidencyuniversity.in` / `Admin@123`).
2. Click **Sign In**.
3. **Talking Point:** *"The web portal enforces strict Role-Based Access Control (RBAC). Students cannot access administrative URLs, and unauthorized requests return HTTP 401/403."*

#### Step 2: Real-Time Analytics Dashboard
1. Point to the KPI cards: Total Students, Total Faculty, Total Complaints, Pending vs. Resolved Complaints, and Resource Bookings.
2. **Talking Point:** *"These numbers are calculated dynamically from MongoDB Atlas documents using aggregate queries. Nothing is hardcoded."*

#### Step 3: Triage & Technician Assignment
1. In the sidebar, click **Complaints Management**.
2. Locate the ticket submitted just moments ago (**`CMP-2026-0005`**).
3. Click **View Details / Action**.
4. In the status modal:
   - Select Status: **In Progress**.
   - Assign Technician: **Suresh Kumar (AV Engineer)**.
   - Admin Remarks: Type *"Technician dispatched to LH-204 with replacement lamp assembly."*
   - Click **Update Status**.
5. Change status again to **Resolved**:
   - Status: **Resolved**.
   - Remarks: Type *"Replaced faulty bulb and tested HDMI signal for 20 minutes. Video projection fully restored."*
   - Click **Save Resolution**.

---

### Act 5: Cross-Platform Real-Time Synchronization (2 Minutes)

Pivot immediately back to the student mobile app!

1. Open the **"Complaints"** tab (Tab 2) on the mobile application.
2. Pull down to refresh (or tap refresh).
3. Point out the live update:
   - The ticket badge has shifted from orange (*Pending*) to green (**`Resolved`**).
4. Tap the complaint card to open the **Detail View**.
5. Walk the evaluators through the **4-Stage Status Timeline & Audit History**:
   - **Stage 1 (Pending):** Logged by student Rahul Sharma.
   - **Stage 2 (Assigned):** Assigned to Suresh Kumar.
   - **Stage 3 (In Progress):** Dispatch remarks visible.
   - **Stage 4 (Resolved):** Resolution notes displayed.
6. **Talking Point:** *"This creates complete institutional transparency. The student knows exactly who worked on their classroom issue, when it was fixed, and what repairs were performed."*

---

### Act 6: Additional Features (2 Minutes)

If time permits, briefly show:
1. **Campus Venue QR Generator (Web Portal):**
   - Click **Locations & QR Codes** in the admin sidebar.
   - Click **Generate QR Code** on any classroom (e.g. Computer Lab 102).
   - Show the 320px SVG QR render modal and the single-click **Download PNG** button.
   - Explain: *"Campus administrators can generate and print these QR stickers to affix on every classroom and lab door."*
2. **Facility Booking & Conflict Prevention:**
   - Show how faculty book seminar halls and how the backend prevents overlapping time slots.
3. **Campus Events & Workshop Registration:**
   - Show event listing on mobile with live seat capacity tracking and instant registration pass.

---

### Act 7: Summary & Transition to Viva Questions (1 Minute)

**Presenter Closing:**
> *"To summarize, Smart Campus Connect demonstrates a complete, production-grade MCA capstone implementation:
> - Zero dummy data – full MongoDB Atlas persistence.
> - Full cross-platform data synchronization between Flutter mobile and React web.
> - Practical, tangible campus utility eliminating physical paperwork and delay.
>
> Thank you, and I am now ready to answer any technical questions regarding the architecture, database schema, or implementation."*

---
**SMART CAMPUS CONNECT • MERNOVA X 2026 • PRESIDENCY UNIVERSITY**

