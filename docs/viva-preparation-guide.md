# Smart Campus Connect – Comprehensive Viva Preparation Guide
## Frequently Asked Questions & Authoritative Answers • MERNOVA X 2026 • Presidency University

This document contains 18 high-yield technical and architectural viva questions likely to be asked by university examiners, project guides, and external evaluators during the MCA project defense.

---

## CATEGORY 1: System Architecture & Design Decisions

### Q1: Why did you select a hybrid stack of Node.js + Express + React.js + Flutter instead of building everything in React (Web) or Flutter (Mobile + Web)?
**Answer:**
We adopted a **purpose-built, multi-client architecture**:
- **Students** are mobile-first users moving around campus. They need hardware access to the smartphone camera for instant optical QR scanning and on-the-go photo evidence capture. Flutter provides compiled native ARM code, 60fps Impeller rendering, and direct native Android hardware integration.
- **Administrators and Faculty** operate from desktop workstations in offices. They require wide desktop viewports for multi-column data tables, KPI dashboards, SLA monitoring, and document exports. React.js with Vite provides ultra-fast DOM rendering, modular component reusability, and native browser accessibility.
- Both clients communicate with a **single, unified Node.js + Express REST API** and a single MongoDB Atlas database. This eliminates business logic duplication, ensures unified data consistency, and enforces centralized security.

---

### Q2: Why did you mandate MongoDB Atlas (Cloud) instead of running a local MongoDB Community instance?
**Answer:**
1. **Cloud Multi-Device Accessibility:** A local MongoDB instance (`localhost:27017`) is isolated to a single laptop. When testing mobile applications across physical smartphones or cloud-hosted web previews, local databases create severe networking hurdles. MongoDB Atlas provides globally accessible, secure TLS-encrypted connection strings (`mongodb+srv://`).
2. **High Availability & Fault Tolerance:** Atlas runs on automated 3-node replica sets with automatic failover, daily snapshots, and zero-downtime scalability.
3. **Institutional Realism:** In a real university deployment, a centralized cloud database allows facility management teams, security desks, and academic coordinators across multiple campus blocks to access the same real-time operational data.

---

### Q3: How do React and Flutter communicate with the same backend? Explain the API contract.
**Answer:**
The Express backend acts as an agnostic **RESTful API service** exposing JSON endpoints. It does not render HTML (no SSR like EJS or Pug). Both the React web application (via `axios`) and the Flutter mobile application (via `http.Client`) send standard HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) with `Content-Type: application/json` and parse the same standardized JSON response structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

---

## CATEGORY 2: Security, Authentication & Access Control

### Q4: How is user authentication implemented? Explain the JWT lifecycle.
**Answer:**
1. When a user submits their email and password, the backend verifies credentials and signs a **JSON Web Token (JWT)** using a secret key stored in environment variables (`JWT_SECRET`).
2. The payload contains minimal non-sensitive identity claims: `id` (MongoDB ObjectID) and `role` (`student`, `faculty`, or `admin`).
3. The token has an expiration window (`7d`).
4. On subsequent requests, the client attaches the token in the HTTP Authorization header: `Authorization: Bearer <token>`.
5. The backend authentication middleware (`auth.js`) intercepts the request, verifies the cryptographic signature with `jwt.verify()`, checks if the user account is still active in MongoDB, and attaches the user document to `req.user`.

---

### Q5: How are user passwords secured in the database?
**Answer:**
Passwords are never stored in plain text. We use **bcrypt.js** with an adaptive work factor of **10 salt rounds**:
1. During user registration or password updates, a Mongoose pre-save middleware hook intercepts the document.
2. If `user.isModified('password')` is true, bcrypt generates a cryptographic salt and hashes the password before saving it to MongoDB Atlas.
3. During login, `user.matchPassword(enteredPassword)` executes `bcrypt.compare()`, which is resistant to timing attacks and rainbow table precomputation.

---

### Q6: Can a student manipulate client-side code in Flutter or browser DevTools to access administrative functions?
**Answer:**
**No.** Client-side UI guards only improve user experience; real security is enforced on the server.
All administrative and faculty endpoints are protected by the `authorize('admin')` or `authorize('admin', 'faculty')` middleware:
```javascript
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};
```
Even if a student crafts a raw curl request or alters Flutter code, the backend verifies the decrypted JWT role claim and rejects the request with **HTTP 403 Forbidden**.

---

## CATEGORY 3: Database Design & Modeling

### Q7: Explain the relationship between Users, Locations, and Complaints in your database.
**Answer:**
- **User $\leftrightarrow$ Complaint (1-to-Many):** A student (`User._id`) can submit multiple complaints. The `Complaint` document stores `student: { type: ObjectId, ref: 'User' }`.
- **Location $\leftrightarrow$ Complaint (1-to-Many):** A campus classroom or lab (`Location._id`) can have multiple complaints filed against its infrastructure. The `Complaint` document references `location: { type: ObjectId, ref: 'Location' }`.
- Mongoose `.populate('student', 'name email registrationNumber')` and `.populate('location')` allow Express to perform efficient server-side joins when returning complaint feeds.

---

### Q8: How did you model the 4-Stage Status History and Audit Trail? Why not a separate collection?
**Answer:**
The audit history is modeled as an **embedded subdocument array** directly inside the `Complaint` document:
```javascript
statusHistory: [
  {
    status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'] },
    updatedBy: { type: ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    remarks: String
  }
]
```
**Why Embedded?**
In MongoDB, operations within a single document are atomic. Since the status history is always retrieved together with the complaint ticket (when rendering the timeline in React or Flutter), embedding avoids costly multi-collection queries or aggregation lookups. The 16MB BSON document limit is never exceeded because a complaint rarely exceeds 5 to 10 status transitions.

---

### Q9: How does the system prevent double-booking or conflicting room reservations?
**Answer:**
In `bookingController.js`, before creating or approving a reservation, the system queries MongoDB for overlapping approved bookings for the same `facility`:
```javascript
const existingBooking = await Booking.findOne({
  facility: facilityId,
  status: 'Approved',
  bookingDate: requestedDate,
  $or: [
    { startTime: { $lt: requestedEndTime }, endTime: { $gt: requestedStartTime } }
  ]
});
```
If an overlap is detected, the transaction is rejected with a clear conflict message and HTTP 400 Bad Request.

---

## CATEGORY 4: Smart QR Code Engine

### Q10: What data is stored in the classroom QR code? Does it contain sensitive database IDs?
**Answer:**
**No sensitive IDs are stored in the QR code.** The QR code encodes a clean, human-readable institutional identifier string, such as **`PU-ENGG-LH204`** (Presidency University, Engineering Wing, Lecture Hall 204).
When scanned, the mobile app dispatches `GET /api/locations/qr/PU-ENGG-LH204`. The server looks up the indexed `qrCodeIdentifier` field and returns the full location metadata (building, floor, room capacity, equipment inventory). This design allows the university to physically print QR stickers without exposing internal database primary keys.

---

### Q11: What happens if a classroom QR code is damaged, dirty, or poorly lit?
**Answer:**
We built a **tri-layer redundancy architecture**:
1. **Torch / Flashlight Control:** The mobile scanner UI includes a one-click flashlight toggle button to illuminate dim classroom plates.
2. **Manual QR Code Entry:** Students can manually type the printed text ID (e.g. `PU-ENGG-LH204`) located beneath the QR barcode.
3. **Manual Venue Selector Fallback:** If the QR plate is completely missing, the student taps *"Skip QR and select location manually"*, allowing them to choose the building, floor, and room number from categorized dropdowns.

---

## CATEGORY 5: Mobile Development & Android Specifics

### Q12: Why was the debug APK size 172.9 MB, and how does that compare to a production release APK?
**Answer:**
- **Why Debug APK is Large (172.9 MB):**
  1. **Fat Multi-Architecture Binary:** The debug APK bundles native binaries for all 4 CPU architectures simultaneously (`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`) so developers can run on any emulator or physical phone without rebuilding.
  2. **Dart VM JIT Engine:** Bundles the Just-In-Time (JIT) compiler, debugger, profiler, and hot-reload hooks.
  3. **Unstripped Debug Symbols:** Native C++ Flutter engine libraries retain complete symbol tables for stack tracing.
- **Release APK Optimization:**
  In release mode (`flutter build apk --release`), Flutter uses **Ahead-of-Time (AOT)** compilation to generate native machine code, strips all debugging symbols, and performs **compiler tree-shaking** (e.g. font asset tree-shaking reduced `MaterialIcons` by 99.1% from 1.6MB to 15KB). When split per ABI (`--split-per-abi`), a production APK drops to **15 – 30 MB**.

---

### Q13: What is `adb reverse` and why is it needed during Windows emulator development?
**Answer:**
The Android emulator runs inside a virtualized network environment (QEMU/Hyper-V). Its loopback address `127.0.0.1` refers to the Android virtual device itself, not the host Windows PC.
Running `adb reverse tcp:5000 tcp:5000` creates a reverse socket proxy bridge over the ADB daemon: any network request from the Android app to `http://127.0.0.1:5000` is forwarded across the ADB USB/bridge channel directly into port 5000 of the Windows host machine where Express is listening.

---

### Q14: How is state managed in the Flutter application? Why did you choose Provider?
**Answer:**
We implemented the **Provider pattern** with `ChangeNotifier` (`AuthProvider`, `ComplaintProvider`, `LocationProvider`):
1. **Separation of Concerns:** UI widgets remain purely declarative. Business logic and API communication reside inside Providers.
2. **Predictable Reactivity:** Calling `notifyListeners()` automatically triggers targeted re-renders only for widgets wrapped in `Consumer` or `Provider.of(context)`.
3. **Official Flutter Best Practice:** Provider is officially recommended by Google Flutter for small-to-medium enterprise applications because it avoids the boilerplate of BLoC while providing far greater testability than `setState()`.

---

## CATEGORY 6: Testing, Quality & Real-Time Claims

### Q15: Did you implement real-time WebSockets? Why or why not?
**Answer:**
**We deliberately chose an HTTP/REST polling and pull-to-refresh model** over persistent WebSockets:
1. **Mobile Battery & Data Efficiency:** Campus complaints and room bookings are transactional events occurring minutes or hours apart, not millisecond financial tickers or live multiplayer games. Keeping persistent WebSocket TCP connections open across hundreds of mobile devices drains smartphone battery and overwhelms mobile data connections over spotty campus Wi-Fi.
2. **Stateless Scalability:** RESTful HTTP requests are stateless, allowing the Express backend to scale horizontally behind a load balancer without sticky sessions or Redis pub/sub brokers.
3. **Pull-to-Refresh User Experience:** In Flutter, the native `RefreshIndicator` allows students to pull down on the complaint feed to instantly fetch updated statuses on demand.

---

### Q16: What automated testing did you perform to verify the project before submission?
**Answer:**
We executed two comprehensive automated test suites:
1. **React Web & API Test Suite (`testWebUiAndPages.cjs`):** Executed **26 automated checks** covering Admin and Faculty login, JWT validation, dynamic analytics calculation, campus location listings, QR payload generation, ticket triage, technician assignment, booking approvals, and user activation. **Result: 26/26 Passed (100%).**
2. **Cross-Platform End-to-End Test Suite (`testCrossPlatformE2E.cjs`):** Executed **12 end-to-end integration cycles** simulating the exact cross-platform workflow from student login, QR resolution, ticket submission, admin status transition (`In Progress` $\to$ `Resolved`), and student refresh verification. **Result: 12/12 Passed (100%).**
3. **Android Emulator UI Verification:** We compiled the APK, installed it on an Android 16 Google Pixel 8 emulator, granted runtime camera permissions, submitted live ticket **`CMP-2026-0005`**, resolved it via admin API, and verified the updated status on the live phone screen.

---

### Q17: What was NOT tested with physical hardware?
**Answer:**
In adherence to academic integrity:
- We verified the entire software scanning logic, camera permission dialog, and viewfinder rendering on the Android emulator with a simulated venue picker.
- We did **not** test aiming a physical phone camera lens at a physical printed QR sticker affixed to an actual wall inside Presidency University. That requires physical on-campus deployment.
- We verified multipart photo evidence uploading via automated API integration tests, but picking a photo from a physical phone's personal gallery requires physical hardware.

---
**SMART CAMPUS CONNECT • MERNOVA X 2026 • PRESIDENCY UNIVERSITY**

