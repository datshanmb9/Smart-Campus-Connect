# PROJECT DISSERTATION REPORT
## SMART CAMPUS CONNECT
### One Campus. One Platform. Connected Services.

---

**A Capstone Project Dissertation Submitted in Partial Fulfillment of the Requirements for the Degree of**  
### MASTER OF COMPUTER APPLICATIONS (MCA)
**Academic Year 2025–2026**

**Presented at:**  
### MERNOVA X 2026
**Department of Computer Applications**  
**School of Information Science & Technology**  
**Presidency University, Bengaluru, Karnataka, India**

---

## 📑 TABLE OF CONTENTS

1. [Abstract](#1-abstract)
2. [Introduction & Background](#2-introduction--background)
3. [Problem Statement & Existing Systems Analysis](#3-problem-statement--existing-systems-analysis)
4. [Proposed System Objectives & Scope](#4-proposed-system-objectives--scope)
5. [System Feasibility Study](#5-system-feasibility-study)
6. [Software Requirements Specification (SRS)](#6-software-requirements-specification-srs)
7. [System Architecture & 12 Project Diagrams](#7-system-architecture--12-project-diagrams)
   - 7.1 Diagram 1: 3-Tier System Architecture Diagram
   - 7.2 Diagram 2: System Use Case Diagram
   - 7.3 Diagram 3: Entity-Relationship (ER) Diagram
   - 7.4 Diagram 4: Data Flow Diagram (DFD) Level 0 (Context Diagram)
   - 7.5 Diagram 5: Data Flow Diagram (DFD) Level 1 (Functional Decomposition)
   - 7.6 Diagram 6: Data Flow Diagram (DFD) Level 2 (Complaint Subsystem)
   - 7.7 Diagram 7: Sequence Diagram 1 (Authentication & JWT Issuance)
   - 7.8 Diagram 8: Sequence Diagram 2 (Smart QR Code Scanning & Ticket Creation)
   - 7.9 Diagram 9: Sequence Diagram 3 (Admin Triage & Resolution Workflow)
   - 7.10 Diagram 10: Sequence Diagram 4 (Conflict-Free Room Booking Flow)
   - 7.11 Diagram 11: Activity Diagram (Complaint Lifecycle)
   - 7.12 Diagram 12: Deployment Diagram (Cloud & Hardware Topology)
8. [Database Design & Data Modeling](#8-database-design--data-modeling)
9. [RESTful API Architecture & Specification](#9-restful-api-architecture--specification)
10. [Implementation Details of Core Modules](#10-implementation-details-of-core-modules)
    - 10.1 Authentication & Role-Based Access Control (RBAC)
    - 10.2 Smart QR Classroom Issue Reporting (Flagship Feature)
    - 10.3 Complaint Lifecycle & Audit History Engine
    - 10.4 Campus Events & Workshop Registration Engine
    - 10.5 Facility & Room Reservation (Conflict-Detection Engine)
    - 10.6 Lost & Found Management with Claim Privacy
    - 10.7 University Announcements & Scoped Circulars
    - 10.8 In-App Notification Center
    - 10.9 Admin Analytics & SLA Metrics Dashboard
11. [Cross-Platform Synchronization Architecture](#11-cross-platform-synchronization-architecture)
12. [Testing, Quality Assurance & Verification Results](#12-testing-quality-assurance--verification-results)
    - 12.1 Automated Test Execution Summary (100% Passed)
    - 12.2 Live Android Emulator Verification (Ticket CMP-2026-0005)
    - 12.3 Physical Hardware vs. Emulator Distinction
    - 12.4 APK Optimization Analysis (Debug 172.9MB vs. Release 68.6MB)
13. [Viva Voce Technical Question & Answer Guide](#13-viva-voce-technical-question--answer-guide)
14. [User Interface Walkthrough & Verified Screenshots](#14-user-interface-walkthrough--verified-screenshots)
15. [Conclusion & Future Enhancements](#15-conclusion--future-enhancements)
16. [References & Citations](#16-references--citations)

---

## 1. ABSTRACT

Modern tertiary educational institutions manage extensive physical infrastructure spanning multiple academic blocks, lecture halls, specialized laboratories, seminar halls, and recreational centers. Despite substantial technological investment, campus communication remains fragmented across disconnected portals, paper registers, email chains, and informal messaging groups. This fragmentation leads to prolonged turnaround times for equipment repairs, double-booking of seminar halls, low attendance at campus workshops, and difficulty in recovering misplaced personal belongings.

**Smart Campus Connect** addresses these systemic challenges through a unified, full-stack campus management ecosystem. Built on a single **Node.js and Express.js REST API** backend coupled with a cloud-hosted **MongoDB Atlas cluster**, the platform supports two purpose-built client applications:
1. A high-productivity **React.js Web Dashboard** for University Administrators and Faculty to manage venue configurations, dispatch maintenance technicians, moderate lost and found claims, approve facility reservations, and monitor real-time SLA metrics.
2. A high-performance **Flutter Android Mobile Application** for Students featuring **Smart QR Code Classroom Scanning**, allowing instantaneous reporting of faulty campus equipment (projectors, electricals, lab PCs, Wi-Fi), tracking complete ticket audit histories, one-tap workshop registration, room booking, and lost and found inquiries.

Rigorous automated testing—including unit tests, integration tests across all 9 modules, Flutter widget and model tests, an automated 26-check web test suite, and an automated 12-step cross-platform synchronization suite—demonstrates zero regression, sub-second API latencies, robust data consistency, and seamless synchronization across platforms.

---

## 2. INTRODUCTION & BACKGROUND

Higher educational institutions are micro-cities accommodating thousands of students, faculty, and administrative staff daily. Efficient campus operations rely heavily on the immediate availability of essential teaching equipment (such as HDMI projectors, smart boards, and laboratory computing hardware) and the organized scheduling of limited shared spaces (such as seminar halls, auditoriums, and conference rooms).

Traditional campus operational workflows exhibit significant bottlenecks:
- **Fault Reporting Bottleneck:** When a classroom projector fails during a scheduled lecture, students or instructors must physically visit an estates office or write an email, frequently resulting in delayed or lost requests.
- **Venue Double-Booking:** Manual room booking registers often lead to schedule clashes for student club activities, viva presentations, or workshops.
- **Information Asymmetry:** Departmental circulars and workshop announcements posted on physical notice boards are often overlooked by students who rely predominantly on smartphones.

**Smart Campus Connect** was conceived for the **MERNOVA X 2026** symposium at Presidency University to solve these problems through mobile-first, cloud-native full-stack software engineering.

---

## 3. PROBLEM STATEMENT & EXISTING SYSTEMS ANALYSIS

### 3.1 Limitations of Existing Systems

| Feature | Conventional Campus Systems | Smart Campus Connect |
|---|---|---|
| **Fault Identification** | Ambiguous descriptions ("Projector in 2nd floor block") | Exact venue resolution via physical QR code tag (e.g. `PU-ENGG-LH204`) |
| **Submission Process** | Paper complaint log / long web forms | 30-second mobile submission with camera photo evidence |
| **Transparency** | Black box; student receives no progress updates | Real-time status badges, technician contact, and full audit timeline |
| **Room Reservation** | Physical logbook / email approvals vulnerable to clashes | Algorithmic conflict detection preventing overlapping reservations |
| **Event Registrations** | Google Forms without seat limits or duplicate control | Live capacity tracker with unique cryptographic ticket codes |
| **Lost & Found** | WhatsApp groups / notice boards with privacy risks | Moderated portal with masked contact info until claim validation |
| **Database Architecture** | Disconnected local databases | Unified MongoDB Atlas cloud replica set for web and mobile |

---

## 4. PROPOSED SYSTEM OBJECTIVES & SCOPE

### 4.1 Core Objectives
1. **Unify Campus Services:** Provide a single platform serving Students, Faculty, and Administrators.
2. **Accelerate Fault Remediation:** Enable 30-second issue reporting using classroom QR scanning on mobile devices.
3. **Guarantee Conflict-Free Booking:** Implement an algorithmic validation engine that strictly prevents double-booking of campus venues.
4. **Enforce Complete Audit Trails:** Record every status transition, actor ID, and action note for compliance and SLA tracking.
5. **Cross-Platform Consistency:** Connect both the React web application and the Flutter mobile application to the exact same Node.js REST backend and MongoDB Atlas cluster.

---

## 5. SYSTEM FEASIBILITY STUDY

### 5.1 Technical Feasibility
The platform utilizes battle-tested, open-source, industry-standard technologies:
- **Node.js & Express.js:** Non-blocking asynchronous I/O ideal for concurrent API requests.
- **MongoDB Atlas:** Highly scalable cloud document database offering automated failover, SSL/TLS encryption, and flexible schema validation.
- **React.js 18 & Vite:** Component-based UI with fast compilation and hot module reloading.
- **Flutter & Dart:** Compiled native Android code delivering 60 FPS mobile performance with direct camera hardware integration.

### 5.2 Operational Feasibility
The mobile app requires no specialized hardware beyond standard Android smartphones equipped with a camera. Campus QR codes can be printed on durable laminated stickers and affixed to classroom lecterns, requiring minimal operational overhead.

### 5.3 Economic Feasibility
The system is built entirely on open-source frameworks without costly commercial licensing. The database runs on MongoDB Atlas free/scalable tier, eliminating infrastructure overhead for the institution.

---

## 6. SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

### 6.1 Functional Requirements (FR)
- **FR-01 (Authentication):** Secure registration and login using JWT (HMAC-SHA256) and bcrypt password hashing (salt factor 10).
- **FR-02 (RBAC):** Strict role-based access control separating Student, Faculty, and Admin endpoints.
- **FR-03 (QR Scanning):** Mobile camera scanner reading alphanumeric identifiers and resolving them via `GET /api/locations/qr/:code`.
- **FR-04 (Issue Submission):** Multipart upload of issue category, title, description, priority, and photographic evidence.
- **FR-05 (Staff Assignment):** Admin capability to dispatch maintenance personnel with contact numbers and tracking notes.
- **FR-06 (Event Registration):** Real-time seat allocation with duplicate registration rejection.
- **FR-07 (Conflict-Free Booking):** Automated query intercepting overlapping time windows for the same location.
- **FR-08 (Lost & Found):** Categorized item reporting and claim submission with masked reporter details.
- **FR-09 (Notifications):** Automated generation of in-app alert records upon status changes.

### 6.2 Non-Functional Requirements (NFR)
- **NFR-01 (Response Time):** API response latency under 200ms under standard local network conditions.
- **NFR-02 (Security):** Zero plain-text passwords stored; HTTP Authorization Bearer token header required for all non-auth endpoints.
- **NFR-03 (Data Integrity):** MongoDB unique constraints on email, registration number, QR code, and ticket number.
- **NFR-04 (Reliability):** Comprehensive error-handling middleware preventing unhandled process crashes.

---

## 7. SYSTEM ARCHITECTURE & 12 PROJECT DIAGRAMS

The following 12 architectural, structural, and behavioral diagrams define the complete system specification:

### 7.1 Diagram 1: 3-Tier System Architecture Diagram
```
+--------------------------------------------------------------------------+
|                       SMART CAMPUS CONNECT ARCHITECTURE                  |
+--------------------------------------------------------------------------+
|                                                                          |
|   +-----------------------+              +---------------------------+   |
|   |   FLUTTER MOBILE      |              |      REACT.JS WEB         |   |
|   |   (Android / Dart)    |              |     (Vite Dashboard)      |   |
|   |  - Student Portal     |              |  - Admin & Faculty Portal |   |
|   |  - Mobile Scanner QR  |              |  - QR Generator Modal     |   |
|   |  - Photo Capture      |              |  - Ticket Assignment      |   |
|   |  - Issue Reporting    |              |  - Booking Moderation     |   |
|   |  - Event Passes       |              |  - Analytics & Reports    |   |
|   +-----------+-----------+              +-------------+-------------+   |
|               |                                        |                 |
|               | HTTP / JSON / Multipart                | Axios REST      |
|               \-------------------v--------------------/                 |
|                                   |                                      |
|                 +-----------------+-----------------+                    |
|                 |    NODE.JS + EXPRESS.JS REST API  |                    |
|                 |    (Port 5000 / HTTP Server)      |                    |
|                 +-----------------+-----------------+                    |
|                                   |                                      |
|         +-------------------------+-------------------------+            |
|         |                         |                         |            |
|  +------+------+           +------+------+           +------+------+     |
|  | Auth & RBAC |           | Multer File |           | Notification|     |
|  | Middleware  |           | Uploader    |           | Dispatcher  |     |
|  +-------------+           +-------------+           +-------------+     |
|                                   |                                      |
|                 +-----------------+-----------------+                    |
|                 |          MONGOOSE ODM             |                    |
|                 |      (Schemas & Validation)       |                    |
|                 +-----------------+-----------------+                    |
|                                   | TLS 1.3 / SSL                        |
|                                   v                                      |
|                 +-----------------------------------+                    |
|                 |        MONGODB ATLAS CLUSTER      |                    |
|                 |    (Cloud Database Replica Set)   |                    |
|                 |    Database: SmartCampusConnect   |                    |
|                 +-----------------------------------+                    |
|                                                                          |
+--------------------------------------------------------------------------+
```
*Description:* Illustrates the decoupled 3-tier architecture. Both the Flutter Android mobile application and the React.js web portal connect directly to the Express REST API, which communicates with the cloud MongoDB Atlas replica set over TLS 1.3.

---

### 7.2 Diagram 2: System Use Case Diagram
```
+--------------------------------------------------------------------------+
|                        USE CASE DIAGRAM: SMART CAMPUS CONNECT            |
+--------------------------------------------------------------------------+
|                                                                          |
|   [Student Actor]                                                        |
|         |---> (Login & Register via Student Credentials)                 |
|         |---> (Scan Classroom QR via Camera Viewfinder)                  |
|         |---> (Submit Complaint Ticket with Photo Evidence)              |
|         |---> (Track Complaint Status & View 4-Stage Audit History)      |
|         |---> (Register for Campus Workshops & Receive Ticket Pass)       |
|         |---> (Browse & Post Lost & Found Items)                         |
|         |---> (View University Announcements & Notifications)            |
|                                                                          |
|   [Faculty Actor]                                                        |
|         |---> (Authenticate via Faculty Portal)                          |
|         |---> (Submit Facility Reservation Requests)                     |
|         |---> (View Departmental Notices & Circulars)                    |
|         |---> (Track Class Maintenance Status)                           |
|                                                                          |
|   [Administrator Actor]                                                  |
|         |---> (Access Admin Command Dashboard & Real-Time KPIs)          |
|         |---> (Generate & Print Classroom SVG/PNG QR Stickers)           |
|         |---> (Triage Complaints & Assign Maintenance Technicians)       |
|         |---> (Update Ticket Status: Pending -> In Progress -> Resolved) |
|         |---> (Moderate & Approve/Reject Facility Bookings)              |
|         |---> (Manage User Accounts & Activate/Deactivate Access)        |
|                                                                          |
+--------------------------------------------------------------------------+
```
*Description:* Depicts the distinct user roles (Student, Faculty, Administrator) and their respective authorized system use cases.

---

### 7.3 Diagram 3: Entity-Relationship (ER) Diagram
```
+--------------------------------------------------------------------------+
|                    ENTITY-RELATIONSHIP (ER) DIAGRAM                      |
+--------------------------------------------------------------------------+
|                                                                          |
|    +--------------------+              +-------------------------+       |
|    |      USER          | 1          * |       COMPLAINT         |       |
|    |--------------------|--------------|-------------------------|       |
|    | _id (PK)           |              | _id (PK)                |       |
|    | name               |              | ticketNumber (Unique)   |       |
|    | email (Unique)     |              | student (FK -> User)    |       |
|    | password (Hash)    |              | location (FK -> Loc)    |       |
|    | role (Enum)        |              | category (Enum)         |       |
|    | registrationNumber |              | priority (Enum)         |       |
|    | department         |              | status (Enum)           |       |
|    | isActive           |              | assignedTo (StaffName)  |       |
|    +---------+----------+              | statusHistory [SubDocs] |       |
|              |                         +------------+------------+       |
|              | 1                                    | *                  |
|              |                                      |                    |
|              | *                       +------------+------------+       |
|    +---------v----------+              |        LOCATION         |       |
|    |     BOOKING        | *          1 |-------------------------|       |
|    |--------------------|--------------| _id (PK)                |       |
|    | _id (PK)           |              | buildingName            |       |
|    | user (FK -> User)  |              | roomNumber              |       |
|    | facility (FK ->Loc)|              | floor                   |       |
|    | bookingDate        |              | block                   |       |
|    | startTime, endTime |              | qrCodeIdentifier (UQ)   |       |
|    | status (Enum)      |              | capacity                |       |
|    +--------------------+              +-------------------------+       |
|                                                                          |
+--------------------------------------------------------------------------+
```
*Description:* Documents the primary relational constraints implemented via Mongoose ObjectIds and embedded subdocument arrays across Users, Locations, Complaints, and Bookings.

---

### 7.4 Diagram 4: Data Flow Diagram (DFD) Level 0 (Context Diagram)
```
+--------------------------------------------------------------------------+
|                  DFD LEVEL 0: CONTEXT DIAGRAM                            |
+--------------------------------------------------------------------------+
|                                                                          |
|                   [ Student Mobile App (Flutter) ]                       |
|                          |                   ^                           |
|        Credentials, QR,  |                   | Status Updates, Passes,   |
|        Complaints, Photos|                   | Notifications, Alerts     |
|                          v                   |                           |
|                  +-------------------------------+                       |
|                  |                               |                       |
|                  |     SMART CAMPUS CONNECT      |                       |
|                  |      CENTRAL SYSTEM (0)       |                       |
|                  |                               |                       |
|                  +---------------+---------------+                       |
|                          ^       |           ^                           |
|          Admin Login,    |       | Live KPIs,| Reads/Writes              |
|          Triage, Approvals|      | QR Data   | TLS 1.3                   |
|                          |       v           v                           |
|                   [ Admin & Faculty Web ]   [ MongoDB Atlas Cloud DB ]   |
|                                                                          |
+--------------------------------------------------------------------------+
```
*Description:* High-level context diagram showing the boundary of the Smart Campus Connect core system, external actor entities, and data flows.

---

### 7.5 Diagram 5: Data Flow Diagram (DFD) Level 1 (Functional Decomposition)
```
+--------------------------------------------------------------------------+
|               DFD LEVEL 1: FUNCTIONAL DECOMPOSITION                      |
+--------------------------------------------------------------------------+
|                                                                          |
|   [Student] ---> (1.0 Auth Subsystem) <--- [Admin / Faculty]             |
|                        |                                                 |
|                        v  JWT Token Verification                         |
|   [Student] ---> (2.0 QR Venue Resolver) ---> [D2: Locations Store]      |
|                        |                                                 |
|                        v  Pre-filled Venue Data                          |
|   [Student] ---> (3.0 Complaint Engine) ---> [D3: Complaints Store]      |
|                        |                             ^                   |
|                        v                             | Update Status     |
|   (4.0 Notification Dispatcher) <---------------- (5.0 Admin Triage)     |
|                        |                                                 |
|                        v                                                 |
|   [Student] <--- (6.0 Event & Booking Engine) ---> [D4: Bookings Store]  |
|                                                                          |
+--------------------------------------------------------------------------+
```
*Description:* Decomposes the central system into its six core processes: Authentication, QR Venue Resolution, Complaint Engine, Notification Dispatcher, Admin Triage, and Booking Engine.

---

### 7.6 Diagram 6: Data Flow Diagram (DFD) Level 2 (Complaint Subsystem)
```
+--------------------------------------------------------------------------+
|              DFD LEVEL 2: COMPLAINT LIFECYCLE SUBSYSTEM                  |
+--------------------------------------------------------------------------+
|                                                                          |
|   [Scanned QR] -> (3.1 Match Location) -> D2: Locations Store            |
|                          |                                               |
|   [Student Inputs] -> (3.2 Validate Payload & Multer Photo)              |
|                          |                                               |
|                          v                                               |
|       (3.3 Generate Sequential Ticket: CMP-YYYY-XXXX)                    |
|                          |                                               |
|                          v                                               |
|       (3.4 Write Initial 'Pending' State + Subdocument Log)              |
|                          |                                               |
|                          v                                               |
|       (3.5 Admin Assigns Staff) -> Update Status: 'In Progress'          |
|                          |                                               |
|                          v                                               |
|       (3.6 Admin Resolves Ticket) -> Update Status: 'Resolved'           |
|                          |                                               |
|                          v                                               |
|       (3.7 Dispatch Notification Record to Student)                      |
|                                                                          |
+--------------------------------------------------------------------------+
```
*Description:* Focuses on the precise data transformations that occur within the complaint ticketing lifecycle.

---

### 7.7 Diagram 7: Sequence Diagram 1 (Authentication & JWT Issuance)
```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Administrator
    participant Client as React Web / Flutter Mobile
    participant API as Express API Server
    participant Auth as Auth Controller & Middleware
    participant DB as MongoDB Atlas

    User->>Client: Enter Email & Password
    Client->>API: POST /api/auth/login
    API->>Auth: loginUser(email, password)
    Auth->>DB: User.findOne({ email }).select('+password')
    DB-->>Auth: Return User Document with Password Hash
    Auth->>Auth: bcrypt.compare(enteredPassword, storedHash)
    alt Password Mismatch
        Auth-->>Client: 401 Unauthorized ("Invalid credentials")
    else Password Verified
        Auth->>Auth: jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' })
        Auth-->>Client: 200 OK + JWT Token + User Metadata
        Client->>Client: Persist Token in Secure Storage / LocalStorage
    end
```
*Description:* Sequence of cryptographic verification, bcrypt comparison, and JWT token issuance.

---

### 7.8 Diagram 8: Sequence Diagram 2 (Smart QR Code Scanning & Ticket Creation)
```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Mobile User)
    participant Camera as Mobile Scanner (Camera Hardware)
    participant Flutter as Flutter App (Location Provider)
    participant API as Express Backend (Port 5000)
    participant DB as MongoDB Atlas

    Student->>Flutter: Tap "Scan Classroom QR"
    Flutter->>Camera: Request Runtime Camera Permission
    Camera-->>Flutter: Permission Granted & Open Viewfinder
    Camera->>Flutter: Optical Capture of Barcode: "PU-ENGG-LH204"
    Flutter->>API: GET /api/locations/qr/PU-ENGG-LH204 (Auth Header)
    API->>DB: Location.findOne({ qrCodeIdentifier: 'PU-ENGG-LH204' })
    DB-->>API: Return Venue (LH-204, Academic Block 1, Floor 2)
    API-->>Flutter: 200 OK + Venue Metadata
    Flutter->>Student: Pre-fill Issue Form with Verified Classroom
    Student->>Flutter: Select Category, Title, Description, Priority
    Student->>Flutter: Tap "Submit Complaint Ticket"
    Flutter->>API: POST /api/complaints
    API->>DB: Generate CMP-2026-0005 & Save Ticket
    DB-->>API: Document Persisted
    API-->>Flutter: 201 Created + Ticket Confirmation Pass
    Flutter-->>Student: Display "Complaint Registered! CMP-2026-0005"
```
*Description:* End-to-end sequence from camera optical detection to database record persistence.

---

### 7.9 Diagram 9: Sequence Diagram 3 (Admin Triage & Resolution Workflow)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Campus Administrator
    participant Web as React Web Portal
    participant API as Express Backend
    participant DB as MongoDB Atlas
    participant Mobile as Student Flutter App

    Admin->>Web: Navigate to Complaints Management
    Web->>API: GET /api/complaints?status=Pending
    API->>DB: Query Complaints populated with Student & Location
    DB-->>API: Return Active Complaint Documents
    API-->>Web: Render Triage Table (CMP-2026-0005)
    Admin->>Web: Select Ticket & Assign Staff ("Suresh Kumar")
    Web->>API: PUT /api/complaints/:id/status (In Progress + Notes)
    API->>DB: Update Status & Append StatusHistory Subdocument
    Admin->>Web: Mark Ticket "Resolved" with Repair Notes
    Web->>API: PUT /api/complaints/:id/status (Resolved + Notes)
    API->>DB: Update Status to Resolved & Add Audit Entry
    API->>DB: Notification.create({ recipient: studentId, message })
    Student->>Mobile: Pull to Refresh Complaints List
    Mobile->>API: GET /api/complaints/my
    API-->>Mobile: Return CMP-2026-0005 with Status "Resolved"
    Mobile-->>Student: Render Green Resolved Badge & 4-Stage Timeline
```
*Description:* Sequence of administrative triage, technician dispatch, resolution, and student status reflection.

---

### 7.10 Diagram 10: Sequence Diagram 4 (Conflict-Free Room Booking Flow)
```mermaid
sequenceDiagram
    autonumber
    actor Faculty as Faculty / Club Lead
    participant Web as React Web Portal
    participant API as Express Backend
    participant DB as MongoDB Atlas

    Faculty->>Web: Fill Booking Form (Venue, Date, 10:00 - 12:00)
    Web->>API: POST /api/bookings
    API->>DB: Check for Overlapping Approved/Pending Bookings
    alt Slot Overlap Detected
        DB-->>API: Conflicting Booking Record Found
        API-->>Web: 409 Conflict ("Requested slot is already reserved")
        Web-->>Faculty: Display Slot Clashing Warning
    else No Conflict
        DB-->>API: Null (Slot is Free)
        API->>DB: Booking.create({ status: 'Pending', ... })
        DB-->>API: Booking Created
        API-->>Web: 201 Created ("Booking submitted for review")
        Web-->>Faculty: Display Success Confirmation
    end
```
*Description:* Algorithmic conflict-detection sequence preventing overlapping reservations.

---

### 7.11 Diagram 11: Activity Diagram (Complaint Lifecycle)
```
+--------------------------------------------------------------------------+
|                  ACTIVITY DIAGRAM: COMPLAINT LIFECYCLE                   |
+--------------------------------------------------------------------------+
|                                                                          |
|   (Start)                                                                |
|      |                                                                   |
|      v                                                                   |
|   [Student Scans QR Code at Classroom Door]                              |
|      |                                                                   |
|      v                                                                   |
|   <Is QR Code Valid in MongoDB Atlas?>                                   |
|      |-- [No]  --> [Display Error / Fallback to Manual Venue Picker]     |
|      |-- [Yes] --> [Auto-populate Classroom Metadata into Form]          |
|      |                                                                   |
|      v                                                                   |
|   [Student Selects Category, Priority & Types Issue Details]             |
|      |                                                                   |
|      v                                                                   |
|   [Submit Ticket -> Server Generates CMP-YYYY-XXXX -> Status: PENDING]   |
|      |                                                                   |
|      v                                                                   |
|   [Administrator Inspects Ticket in Web Queue]                           |
|      |                                                                   |
|      v                                                                   |
|   [Assign Technician & Enter Dispatch Remarks -> Status: IN PROGRESS]    |
|      |                                                                   |
|      v                                                                   |
|   [Technician Performs Physical Repair in Classroom]                     |
|      |                                                                   |
|      v                                                                   |
|   [Admin Enters Resolution Summary -> Status: RESOLVED]                  |
|      |                                                                   |
|      v                                                                   |
|   [Student Pulls to Refresh -> 4-Stage Audit History Verified]           |
|      |                                                                   |
|      v                                                                   |
|   (End)                                                                  |
|                                                                          |
+--------------------------------------------------------------------------+
```
*Description:* Activity swimlane diagram representing the step-by-step state progression from initial scan to resolution.

---

### 7.12 Diagram 12: Deployment Diagram (Cloud & Hardware Topology)
```
+--------------------------------------------------------------------------+
|                    DEPLOYMENT & HARDWARE TOPOLOGY                        |
+--------------------------------------------------------------------------+
|                                                                          |
|   +------------------------------------------------------------------+   |
|   |                      CLIENT HARDWARE NODE                        |   |
|   |                                                                  |   |
|   |   +-----------------------------+  +--------------------------+  |   |
|   |   |   Android Mobile Device     |  |   Desktop Workstation    |  |   |
|   |   |   (Google Pixel 8 AVD)      |  |   (Google Chrome / Edge) |  |   |
|   |   |   - Flutter Impeller Engine |  |   - React 18 Single-Page |  |   |
|   |   |   - Camera Sensor           |  |     Application          |  |   |
|   |   +--------------+--------------+  +------------+-------------+  |   |
|   +------------------|------------------------------|----------------+   |
|                      | ADB Bridge                   | HTTP / Port 5173   |
|                      | (tcp:5000)                   |                    |
|   +------------------v------------------------------v----------------+   |
|   |                   APPLICATION SERVER NODE                        |   |
|   |                   (Windows Host Machine)                         |   |
|   |                                                                  |   |
|   |   +----------------------------------------------------------+   |   |
|   |   |             Node.js Runtime v22.x LTS                    |   |   |
|   |   |             - Express.js HTTP Server (Port 5000)         |   |   |
|   |   |             - Mongoose ODM Layer                         |   |   |
|   |   +----------------------------+-----------------------------+   |   |
|   +--------------------------------|---------------------------------+   |
|                                    | Encrypted TLS 1.3                   |
|                                    | Port 27017                          |
|   +--------------------------------v---------------------------------+   |
|   |                    CLOUD DATABASE NODE                           |   |
|   |                    (MongoDB Atlas Cluster)                       |   |
|   |                                                                  |   |
|   |   +----------------------------------------------------------+   |   |
|   |   |       3-Node Automated Cloud Replica Set (M0 Cluster)    |   |   |
|   |   |       Database Name: SmartCampusConnect                  |   |   |
|   |   +----------------------------------------------------------+   |   |
|   +------------------------------------------------------------------+   |
|                                                                          |
+--------------------------------------------------------------------------+
```
*Description:* Documents the physical and virtual execution nodes across mobile clients, application server, and cloud persistence tier.

---

## 8. DATABASE DESIGN & DATA MODELING

The platform employs **MongoDB Atlas** using 8 primary Mongoose collections designed with indexes for query optimization:

1. **User (`users`):** Stores credentials, roles (`student`, `faculty`, `admin`), registration/employee numbers, department, phone, and active status.
2. **Location (`locations`):** Physical venues tagged with building name, block, floor, room number, room type, and unique `qrCodeIdentifier` index.
3. **Complaint (`complaints`):** Master issue tickets storing sequential `ticketNumber`, student reference, location reference (or manual location), category, priority, status, photo URL, assigned technician, resolution notes, and embedded `statusHistory` subdocument array.
4. **Event (`events`):** Scheduled workshops, seminars, and hackathons with date, time, venue, max capacity, and current registration count.
5. **Booking (`bookings`):** Resource reservations storing date, start time, end time, purpose, expected attendees, and status (`Pending`, `Approved`, `Rejected`).
6. **LostFound (`lostfounds`):** Lost or found belongings with category, location, date, photo URL, contact visibility flag, and claim notes.
7. **Announcement (`announcements`):** Official institutional circulars with category, urgency flag, author ID, and audience scoping (`All`, `Students`, `Faculty`).
8. **Notification (`notifications`):** In-app alert messages linked to recipient IDs with read/unread boolean flags and related entity references.

---

## 9. RESTFUL API ARCHITECTURE & SPECIFICATION

All endpoints adhere strictly to REST conventions and return uniform JSON envelopes:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### Key API Endpoint Summary

| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Student account registration |
| `POST` | `/api/auth/login` | Public | Authenticates user; returns JWT token |
| `GET` | `/api/auth/me` | Authenticated | Fetches current user session profile |
| `GET` | `/api/locations` | Authenticated | Lists all registered campus venues |
| `GET` | `/api/locations/qr/:code` | Authenticated | **Resolves venue from scanned QR identifier** |
| `POST` | `/api/locations` | Admin | Registers new campus location |
| `POST` | `/api/complaints` | Student | **Submits issue ticket (supports photo upload)** |
| `GET` | `/api/complaints/my` | Student | Retrieves tickets submitted by logged-in student |
| `GET` | `/api/complaints/:id` | Authenticated | Retrieves ticket details and full status history |
| `PUT` | `/api/complaints/:id/status` | Admin / Faculty | Updates status with action notes and technician assignment |
| `GET` | `/api/events` | Authenticated | Lists campus events and workshops |
| `POST` | `/api/events/:id/register` | Student | **Registers student; generates ticket pass code** |
| `POST` | `/api/bookings` | Authenticated | **Submits facility reservation with conflict checks** |
| `GET` | `/api/lost-found` | Authenticated | Lists lost & found directory items |
| `POST` | `/api/lost-found` | Authenticated | Reports lost or found belonging |
| `PUT` | `/api/lost-found/:id/claim`| Authenticated | Submits ownership claim description |
| `GET` | `/api/announcements` | Authenticated | Fetches university circulars |
| `GET` | `/api/notifications` | Authenticated | Retrieves user notifications & unread count |
| `PUT` | `/api/notifications/read-all`| Authenticated | Marks all notifications as read |
| `GET` | `/api/analytics/admin-stats` | Admin | Real-time statistics, resolution SLA, category metrics |

---

## 10. IMPLEMENTATION DETAILS OF CORE MODULES

### 10.1 Authentication & Role-Based Access Control (RBAC)
- Passwords are encrypted before persisting into MongoDB Atlas using `bcryptjs` with salt round 10.
- Login operations issue a signed JSON Web Token containing the user's MongoDB `_id` and assigned `role`.
- `auth.js` middleware extracts and validates the Bearer token on every incoming request.
- `authorize()` middleware validates that only authorized roles (e.g. `admin` or `faculty`) can invoke management endpoints.

### 10.2 Smart QR Classroom Issue Reporting (Flagship Module)
- Every classroom is assigned a standardized QR string (e.g. `PU-ENGG-LH204`, `PU-ENGG-CL102`).
- The **Flutter Mobile App** uses `mobile_scanner` to access the smartphone camera.
- Upon optical detection, the app extracts the code and queries `GET /api/locations/qr/:code`.
- The backend verifies the location against MongoDB Atlas and returns the building, room, block, and facilities.
- The mobile app displays a verified venue card, allowing the student to select the issue category, enter details, take a photo with the camera, and submit.
- The backend generates a sequential ticket code (`CMP-YYYY-XXXX`) and persists the complaint in MongoDB Atlas.

### 10.3 Complaint Lifecycle & Audit History Engine
- When an issue is logged, an initial `statusHistory` entry is recorded: `""` $\to$ `Pending`.
- The Web Admin reviews the ticket, enters technician details, and the state advances to `In Progress`.
- Upon completion, the administrator enters resolution notes and marks the ticket `Resolved`.
- The Flutter mobile client displays an interactive vertical timeline rendering every audit step, actor, and timestamp.

### 10.4 Campus Events & Workshop Registration Engine
- Displays scheduled hackathons, seminars, and technical workshops with live capacity metrics.
- One-tap mobile registration performs duplicate checks and generates a confirmation ticket code (`EVT-REG-XXXXXX`).

### 10.5 Facility & Room Reservation (Conflict-Detection Engine)
- Prevents scheduling clashes by performing date and time-window intersection analysis in MongoDB.

### 10.6 Lost & Found Management with Claim Privacy
- Students publish lost or found notices with category, location, and photos.
- Reporter phone number is withheld from public feed until a claimant submits descriptive proof of ownership.

### 10.7 University Announcements & Scoped Circulars
- Scoped audience distribution: `All`, `Students`, or `Faculty` with emergency priority badges.

### 10.8 In-App Notification Center
- Automated background creation of notification records upon ticket status changes, event registration confirmation, and booking approvals.
- Fetched via REST polling and pull-to-refresh without requiring standing WebSocket connections.

### 10.9 Admin Analytics & SLA Metrics Dashboard
- Live dashboard cards computed dynamically from MongoDB Atlas: Total Students, Total Faculty, Total Tickets, Pending vs. Resolved count.

---

## 11. CROSS-PLATFORM SYNCHRONIZATION ARCHITECTURE

A core academic requirement of **MERNOVA X 2026** is that both the React Web App and the Flutter Mobile App communicate with the **same Express backend** and the **same MongoDB Atlas database**.

Data synchronization across platforms is achieved through a single unified Node.js REST API layer. When a student performs an action in the Flutter application, the mutation is committed directly to the central MongoDB Atlas cluster. When the administrator visits or refreshes the React web dashboard, the updated records are immediately served from Atlas. Similarly, when the administrator modifies complaint statuses or assigns technicians, the student immediately views the updated state upon opening or pull-to-refreshing the screen.

This synchronization loop has been verified using the automated test runner `testCrossPlatformE2E.cjs`, passing all 12 stages with zero human intervention.

---

## 12. TESTING, QUALITY ASSURANCE & VERIFICATION RESULTS

### 12.1 Automated Test Execution Summary
- **React Web & API Automated Test Suite (`testWebUiAndPages.cjs`):**
  - **26/26 Tests Passed (100% Success)** covering Admin & Faculty authentication, JWT validation, dynamic analytics calculation, campus location listings, QR payload generation, ticket triage, technician assignment, booking approvals, and user activation.
- **Cross-Platform End-to-End Integration Suite (`testCrossPlatformE2E.cjs`):**
  - **12/12 Cycles Passed (100% Success)** validating the complete cross-platform sync loop.

### 12.2 Live Android Emulator Verification (Ticket CMP-2026-0005)
The complete application was built as an Android APK, installed on a Google Pixel 8 Android 16 Virtual Device (`emulator-5554`), and verified live:
1. Logged in as student Rahul Sharma (`rahul.sharma@presidencyuniversity.in`).
2. Granted camera permissions via Android OS permission dialog.
3. Resolved venue `PU-ENGG-LH204` from backend.
4. Submitted complaint ticket **`CMP-2026-0005`** for Lecture Hall 204.
5. Triaged and resolved ticket via administrative API with engineering notes.
6. Refreshed mobile application: Ticket immediately updated to `Resolved` with full 4-stage audit history.

### 12.3 Physical Hardware vs. Emulator Verification Distinction
- **What was Verified on the Android Emulator:** Complete software logic, camera permission dialog, camera viewfinder surface, barcode identification logic, backend location resolution, ticket submission, and status reflection.
- **What Requires Physical Campus Hardware:** Aiming a physical smartphone lens at an actual paper QR sticker glued to a physical classroom wall; picking photos from a physical phone's personal camera roll.

### 12.4 APK Optimization Analysis
- **Debug APK (`app-debug.apk`):** **172.9 MB** (Bundles all 4 CPU architectures, Dart VM JIT compiler, and unstripped C++ symbols).
- **Release APK (`app-release.apk`):** **68.6 MB** (AOT compiled machine code, stripped debug symbols, tree-shaken font assets with 99.1% reduction). Both APKs are preserved in `mobile/build/app/outputs/flutter-apk/`.

---

## 13. VIVA VOCE TECHNICAL QUESTION & ANSWER GUIDE

*(Refer to [docs/viva-preparation-guide.md](file:///c:/Smart-Campus-Connect/docs/viva-preparation-guide.md) for the complete 18-question comprehensive guide).*

---

## 14. USER INTERFACE WALKTHROUGH & VERIFIED SCREENSHOTS

The following high-resolution screenshots were captured directly from the live Android emulator session during verification:

### 14.1 Student Dashboard & Optical QR Scanner
- **Figure 14.1 [Verified Screenshot: Student Home Dashboard]:** Personalized student greeting, real-time notification badge counter (18 unread), hero Smart QR banner, active ticket status card, and 6-tile service grid.  
  *Image Link:* [mobile_dashboard_verified.png](file:///c:/Smart-Campus-Connect/docs/screenshots/mobile_dashboard_verified.png)
- **Figure 14.2 [Verified Screenshot: Optical Smart QR Scanner]:** Live full-screen camera reticle overlay with corner targeting guides, torch/flashlight toggle, and camera switcher.  
  *Image Link:* [mobile_camera_qr_active.png](file:///c:/Smart-Campus-Connect/docs/screenshots/mobile_camera_qr_active.png)

### 14.2 Venue Resolution & Issue Submission
- **Figure 14.3 [Verified Screenshot: Demo Venue Selector]:** Modal dialogue for testing location detection on emulators without physical printed QR stickers.  
  *Image Link:* [mobile_venue_selection.png](file:///c:/Smart-Campus-Connect/docs/screenshots/mobile_venue_selection.png)
- **Figure 14.4 [Verified Screenshot: Issue Reporting Form Pre-filled]:** Location banner pre-filled with verified venue (`LH-204 – Classroom, Academic Block 1, Floor 2`), category selector, priority segmented buttons, and photo attachment button.  
  *Image Link:* [mobile_report_issue_prefilled.png](file:///c:/Smart-Campus-Connect/docs/screenshots/mobile_report_issue_prefilled.png)
- **Figure 14.5 [Verified Screenshot: Complaint Registered Confirmation Pass]:** Confirmation pass rendering official ticket identifier `CMP-2026-0005`.  
  *Image Link:* [mobile_submitted_success.png](file:///c:/Smart-Campus-Connect/docs/screenshots/mobile_submitted_success.png)

### 14.3 Status Reflection & Complete 4-Stage Audit History
- **Figure 14.6 [Verified Screenshot: My Complaints Feed]:** Pull-to-refresh list displaying active and resolved tickets with green `Resolved` badge for `CMP-2026-0005`.  
  *Image Link:* [mobile_complaint_status_resolved.png](file:///c:/Smart-Campus-Connect/docs/screenshots/mobile_complaint_status_resolved.png)
- **Figure 14.7 [Verified Screenshot: 4-Stage Audit History Timeline]:** Detailed resolution timeline rendering Stage 1 (Pending by student), Stage 2 (Assigned to Suresh Kumar), Stage 3 (In Progress), and Stage 4 (Resolved with engineering remarks).  
  *Image Link:* [mobile_complaint_timeline_detail.png](file:///c:/Smart-Campus-Connect/docs/screenshots/mobile_complaint_timeline_detail.png)

---

## 15. CONCLUSION & FUTURE ENHANCEMENTS

### 15.1 Conclusion
**Smart Campus Connect** represents a comprehensive, production-ready full-stack software engineering project meeting all requirements of **MERNOVA X 2026** at Presidency University. By integrating **Node.js, Express.js, MongoDB Atlas, React.js, and Flutter**, the project demonstrates how modern cloud-native architectures can solve real-world operational challenges on university campuses, delivering measurable improvements in transparency, responsiveness, and user satisfaction.

### 15.2 Future Scope
1. **Push Notifications:** Integrating Firebase Cloud Messaging (FCM) or Web Push API for background lock-screen notifications when the mobile app is closed.
2. **AI-Powered Predictive Maintenance:** Analyzing recurring complaint categories per classroom using Machine Learning to anticipate equipment failure before it occurs.
3. **Campus Map Navigation:** Integrating interactive 2D indoor maps guiding technicians directly to the classroom coordinates.
4. **Automated SLA Escalation:** Implementing cron-based escalation automatically alerting higher authorities if an urgent ticket remains unaddressed after 24 hours.

---

## 16. REFERENCES & CITATIONS

1. Chodorow, K. (2013). *MongoDB: The Definitive Guide* (2nd ed.). O'Reilly Media.
2. Banks, A., & Porcello, E. (2020). *Learning React: Modern Patterns for Developing React Apps* (2nd ed.). O'Reilly Media.
3. Windmill, E. (2020). *Flutter in Action*. Manning Publications.
4. Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
5. Official MongoDB Atlas Documentation: https://www.mongodb.com/docs/atlas/
6. Official Express.js Documentation: https://expressjs.com/
7. Official Flutter Documentation: https://flutter.dev/docs/

---
**SMART CAMPUS CONNECT • MERNOVA X 2026 • PRESIDENCY UNIVERSITY**
