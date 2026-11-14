# SMART CAMPUS CONNECT – REST API SPECIFICATION
**Architecture:** RESTful API with JSON Payload  
**Base URL:** `http://localhost:5000/api` (Local) / Network IP for Mobile Testing  
**Authentication Standard:** Bearer JWT in `Authorization` header (`Bearer <token>`)

---

## 1. Authentication & Profile Endpoints (`/api/auth`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | None | Register new student or faculty account |
| `POST` | `/api/auth/login` | Public | None | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Bearer JWT | Any | Fetch current logged-in user profile & role |
| `PUT` | `/api/auth/update-profile` | Bearer JWT | Any | Update profile details (phone, department, avatar) |
| `PUT` | `/api/auth/change-password`| Bearer JWT | Any | Change password with current password verification |

---

## 2. Campus Locations & QR Codes (`/api/locations`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/locations` | Bearer JWT | Any | List all active campus locations |
| `GET` | `/api/locations/:id` | Bearer JWT | Any | Get location details by database ID |
| `GET` | `/api/locations/qr/:code`| Bearer JWT | Any | Scan/resolve location by QR identifier (e.g. `PU-ENGG-LH204`) |
| `POST` | `/api/locations` | Bearer JWT | Admin | Create a new campus location & generate QR identifier |
| `PUT` | `/api/locations/:id` | Bearer JWT | Admin | Update location details or facilities |
| `DELETE`| `/api/locations/:id` | Bearer JWT | Admin | Soft-delete / deactivate a location |

---

## 3. Smart Issue Reporting & Complaints (`/api/complaints`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/complaints` | Bearer JWT | Student | Submit complaint (with QR location or manual fallback + image) |
| `GET` | `/api/complaints` | Bearer JWT | Admin, Faculty | List all complaints (with filters: status, category, location) |
| `GET` | `/api/complaints/my` | Bearer JWT | Student | Retrieve complaints filed by the currently authenticated student |
| `GET` | `/api/complaints/:id` | Bearer JWT | Any (Scoped)| View single complaint details with audit history |
| `PUT` | `/api/complaints/:id/status`| Bearer JWT| Admin | Update status (`Pending` -> `Assigned` -> `In Progress` -> `Resolved`/`Rejected`) |
| `PUT` | `/api/complaints/:id/assign`| Bearer JWT| Admin | Assign maintenance technician or staff member |

---

## 4. Campus Events & Workshops (`/api/events`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/events` | Bearer JWT | Any | List upcoming & ongoing campus events |
| `GET` | `/api/events/:id` | Bearer JWT | Any | Get detailed event information |
| `POST` | `/api/events` | Bearer JWT | Admin, Faculty | Create a new campus event / workshop |
| `PUT` | `/api/events/:id` | Bearer JWT | Admin, Faculty | Edit event details |
| `DELETE`| `/api/events/:id` | Bearer JWT | Admin | Cancel / remove an event |
| `POST` | `/api/events/:id/register` | Bearer JWT | Student | Register student for event (prevents duplicates) |
| `DELETE`| `/api/events/:id/register` | Bearer JWT | Student | Cancel student event registration |
| `GET` | `/api/events/my-registrations`| Bearer JWT| Student | List events registered by current student |
| `GET` | `/api/events/:id/attendees`| Bearer JWT | Admin, Faculty | Export/view registered students for an event |

---

## 5. Lost & Found Management (`/api/lost-found`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/lost-found` | Bearer JWT | Any | Search & filter lost or found items |
| `GET` | `/api/lost-found/my` | Bearer JWT | Student, Any | Retrieve items posted by current user |
| `GET` | `/api/lost-found/:id`| Bearer JWT | Any | View specific item details & claim interface |
| `POST` | `/api/lost-found` | Bearer JWT | Student, Any | Report a lost or found item with photograph |
| `PUT` | `/api/lost-found/:id/claim` | Bearer JWT | Student | Submit claim request for a found item |
| `PUT` | `/api/lost-found/:id/status`| Bearer JWT | Admin, Owner | Mark as resolved/returned or close listing |
| `DELETE`| `/api/lost-found/:id` | Bearer JWT | Admin, Owner | Remove lost and found post |

---

## 6. Campus Resource & Room Booking (`/api/bookings`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/bookings` | Bearer JWT | Admin, Faculty | View all booking requests across campus facilities |
| `GET` | `/api/bookings/my` | Bearer JWT | Student, Faculty | View user's own booking history and status |
| `GET` | `/api/bookings/availability`| Bearer JWT| Any | Check if a room is available for a date & time window |
| `POST` | `/api/bookings` | Bearer JWT | Student, Faculty | Submit reservation request (conflict check applied) |
| `PUT` | `/api/bookings/:id/status`| Bearer JWT | Admin | Approve or reject booking with optional remark |
| `DELETE`| `/api/bookings/:id` | Bearer JWT | Admin, Requester| Cancel a pending booking request |

---

## 7. Announcements & Circulars (`/api/announcements`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/announcements` | Bearer JWT | Any | Get active campus announcements (audience-filtered) |
| `GET` | `/api/announcements/:id`| Bearer JWT | Any | View single announcement details |
| `POST` | `/api/announcements` | Bearer JWT | Admin, Faculty | Publish a new official announcement |
| `PUT` | `/api/announcements/:id` | Bearer JWT | Admin | Update announcement text/attachments |
| `DELETE`| `/api/announcements/:id` | Bearer JWT | Admin | Delete campus announcement |

---

## 8. In-App Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/notifications` | Bearer JWT | Any | List user's notifications (sorted newest first) |
| `PUT` | `/api/notifications/:id/read` | Bearer JWT | Any | Mark a single notification as read |
| `PUT` | `/api/notifications/read-all`| Bearer JWT | Any | Mark all unread notifications as read |
| `DELETE`| `/api/notifications/:id` | Bearer JWT | Any | Delete a notification record |

---

## 9. Dashboard Analytics & Reports (`/api/analytics`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/analytics/admin-stats` | Bearer JWT | Admin | Real-time counts: users, complaints breakdown, bookings, events |
| `GET` | `/api/analytics/complaint-metrics` | Bearer JWT | Admin | Category distribution, resolution rate, average turnaround time |
| `GET` | `/api/analytics/faculty-summary` | Bearer JWT | Faculty | Faculty-relevant stats (events organized, departmental notices) |


---

## 10. Verified Request & Response Payload Examples

### 10.1 QR Location Identification (`GET /api/locations/qr/PU-ENGG-LH204`)
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Location identified successfully from QR scan",
  "data": {
    "location": {
      "_id": "6af716cfd1afd85efb5e4cb6",
      "qrCode": "PU-ENGG-LH204",
      "buildingName": "Academic Block 1",
      "block": "Engineering Wing",
      "floor": "2nd Floor",
      "roomNumber": "LH-204",
      "roomType": "Classroom",
      "description": "Smart Lecture Hall equipped with ceiling projector, audio PA, and central AC",
      "facilities": ["Epson Overhead Projector", "Central Air Conditioning", "PA Mic System", "Smart Podium"],
      "isActive": true
    }
  }
}
```

### 10.2 Complaint Submission (`POST /api/complaints`)
**Request Body:**
```json
{
  "locationId": "6af716cfd1afd85efb5e4cb6",
  "category": "Projector",
  "title": "Projector Lamp Failure in LH-204",
  "description": "The overhead projector lamp is flickering violently and displaying error E-04.",
  "priority": "High",
  "imageUrl": "/uploads/complaint-1731502400.jpg"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Complaint submitted successfully. Your ticket has been logged.",
  "data": {
    "complaint": {
      "_id": "6af7180cef106dc5e06ecfed",
      "ticketNumber": "CMP-2026-0001",
      "studentId": {
        "_id": "6af716cfd1afd85efb5e4cb2",
        "fullName": "Rahul Sharma",
        "email": "rahul.sharma@presidencyuniversity.in",
        "registrationNumber": "2024MCA001",
        "department": "Master of Computer Applications"
      },
      "locationId": "6af716cfd1afd85efb5e4cb6",
      "category": "Projector",
      "title": "Projector Lamp Failure in LH-204",
      "description": "The overhead projector lamp is flickering violently and displaying error E-04.",
      "priority": "High",
      "status": "Pending",
      "imageUrl": "/uploads/complaint-1731502400.jpg",
      "createdAt": "2026-11-13T14:00:46.000Z"
    }
  }
}
```

### 10.3 Room Booking Conflict Interception (`POST /api/bookings`)
**Request Body:**
```json
{
  "locationId": "6af716cfd1afd85efb5e4cb6",
  "purpose": "Conflicting Seminar Request",
  "bookingDate": "2026-11-18",
  "startTime": "11:00",
  "endTime": "13:00"
}
```
**Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Booking Conflict: LH-204 is already reserved during 11:00 - 13:00 on this date"
}
```
