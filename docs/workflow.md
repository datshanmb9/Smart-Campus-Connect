# SMART CAMPUS CONNECT – MASTER WORKFLOW & DATA JOURNEY SPECIFICATION
**Target Evaluation:** MERNOVA X 2026 – Presidency University  
**Focus:** Full Lifecycle Traceability, Synchronization & Data Journey

---

## 1. Flagship Feature: Smart QR Issue Reporting Workflow

```mermaid
sequenceDiagram
    autonumber
    actor S as Student (Flutter App)
    participant C as Phone Camera
    participant API as Express.js Backend
    participant DB as MongoDB Atlas
    actor A as Admin (React Portal)
    actor T as Technician / Staff

    Note over S,C: 1. Physical QR Scan in Classroom
    S->>C: Opens Camera Scanner
    C-->>S: Decodes QR: "PU-ENGG-LH204"
    S->>API: GET /api/locations/qr/PU-ENGG-LH204
    API->>DB: Query Location by qrCode
    DB-->>API: Return { building: "Block A", room: "204", facilities: [...] }
    API-->>S: Displays Room & Pre-populates Location

    Note over S,API: 2. Complaint Submission
    S->>S: Selects "Projector Problem", Enters Details, Snaps Photo
    S->>API: POST /api/complaints (multipart/form-data)
    API->>DB: Insert Complaint (Status: "Pending") + ComplaintHistory
    API-->>S: Return Ticket #CMP-2026-0042 (201 Created)

    Note over A,DB: 3. Admin Triage & Assignment
    A->>API: GET /api/complaints?status=Pending
    API->>DB: Fetch pending complaints
    DB-->>A: Renders Ticket #CMP-2026-0042 in React Dashboard
    A->>API: PUT /api/complaints/:id/assign (Assign to Technician "Ramesh")
    API->>DB: Update status: "Assigned", Append ComplaintHistory, Create Notification
    
    Note over S,API: 4. Real-time Student Visibility
    S->>API: GET /api/complaints/my (Pull-to-refresh)
    API->>DB: Fetch student complaints
    DB-->>S: Displays Ticket Status: "Assigned to Ramesh"
    
    Note over A,S: 5. Resolution & Closure
    T-->>A: Fixes projector bulb & reports back
    A->>API: PUT /api/complaints/:id/status (Status: "Resolved", notes: "Bulb replaced")
    API->>DB: Update status: "Resolved", Append History
    S->>S: Receives In-App Notification: "Your complaint CMP-2026-0042 is Resolved"
```

---

## 2. Resource Booking Clash Prevention Algorithm

To guarantee campus seminar halls or computer labs are never double-booked, the backend enforces atomic interval checks:

```mermaid
flowchart TD
    Start([Student / Faculty submits Room Booking Request]) --> FetchInputs[Extract locationId, bookingDate, startTime, endTime]
    FetchInputs --> ValidateTime{Is startTime < endTime?}
    ValidateTime -- No --> Err1[Reject: Invalid Time Range]
    ValidateTime -- Yes --> QueryDB[(Query MongoDB Bookings Collection)]
    
    QueryDB --> ClashCheck{"Existing Approved Booking on same Date & Location where:<br/>(existingStart &lt; newEnd) AND (existingEnd &gt; newStart)?"}
    ClashCheck -- Yes --> RejectClash[Reject 409 Conflict: Room already reserved for requested interval]
    ClashCheck -- No --> SavePending[Save Booking document with status: 'Pending']
    SavePending --> NotifyAdmin[Send Notification to Admin Dashboard for Approval]
    NotifyAdmin --> Done([End])
```

---

## 3. Cross-Platform Data Synchronization Architecture

Both React and Flutter act as thin, reactive presentation clients connected to the same centralized Node.js REST API and MongoDB Atlas cloud database.

```mermaid
flowchart LR
    subgraph Clients
        R["React.js Web App<br/>(Admin / Faculty)"]
        F["Flutter Android App<br/>(Student)"]
    end

    subgraph Server_Cluster ["Centralized Express Backend"]
        E["Express REST API Layer"]
        AUTH["JWT / RBAC Guard"]
        SVC["Service & Validation Logic"]
    end

    subgraph Cloud_Data ["Single Source of Truth"]
        M[("MongoDB Atlas Cloud")]
    end

    R <-->|"HTTPS JSON Requests<br/>(Bearer Token)"| E
    F <-->|"HTTPS JSON Requests<br/>(Bearer Token)"| E
    E <--> AUTH <--> SVC <-->|"Mongoose Connection Pool"| M
```


---

## 4. Web Application Workflow Specifications

### 4.1 Campus Administrator Incident Triage Workflow
1. **Access:** Administrator navigates to `http://localhost:5173/login`, signs in with `admin@presidencyuniversity.in`, and lands on `/admin`.
2. **Review:** The Executive Dashboard queries `GET /api/analytics/admin-stats` and displays real-time statistics (pending complaints, total students, resolution SLA).
3. **Investigation:** Navigating to `/admin/complaints`, the administrator filters by status (`Pending`) or category (`Projector`). Clicking "Details" opens `/admin/complaints/:id`.
4. **Assignment:** In the complaint details screen, the administrator clicks "Assign Technician", enters the technician's name (*Ramesh Kumar*), phone, and department. Express updates the ticket to `Assigned`, records an entry in `ComplaintHistory`, and automatically creates an in-app notification for the student.
5. **Resolution:** Once work is confirmed, the administrator selects "Update Ticket Status", enters resolution notes, and transitions status to `Resolved`. The student's mobile app immediately displays the resolution upon refresh.

### 4.2 Printable QR Code Generation Workflow
1. **Venue Registration:** Administrator opens `/admin/locations` and clicks "New Campus Venue & QR".
2. **Metadata Entry:** Inputs unique identifier `PU-ENGG-LH204`, building name, block, floor, room number, and installed facilities (*Epson Projector, Central AC*).
3. **Sticker Generation:** Clicking "View QR" triggers the client-side QR renderer, producing a high-resolution 320px QR code embedded in an official Presidency University classroom placard.
4. **Physical Placement:** Administrator clicks "Download Sticker PNG" to obtain a print-ready asset for classroom wall mounting.
