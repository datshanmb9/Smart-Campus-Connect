const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const app = require('./src/app');
const User = require('./src/models/User');
const Location = require('./src/models/Location');
const Complaint = require('./src/models/Complaint');
const ComplaintHistory = require('./src/models/ComplaintHistory');
const Event = require('./src/models/Event');
const EventRegistration = require('./src/models/EventRegistration');
const Booking = require('./src/models/Booking');
const LostFoundItem = require('./src/models/LostFoundItem');
const Announcement = require('./src/models/Announcement');
const Notification = require('./src/models/Notification');

const runFullSystemTests = async () => {
  console.log('\n=============================================================');
  console.log(' STARTING FULL END-TO-END SMART CAMPUS CONNECT VERIFICATION');
  console.log(' Event: MERNOVA X 2026 - Presidency University');
  console.log(' Cluster: SmartCampusConnect (MongoDB Atlas)');
  console.log('=============================================================\n');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[FATAL] MONGODB_URI not configured in server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('[System Check] Connected to Atlas Host:', mongoose.connection.host);

    const testPort = 5096;
    const server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    const req = async (path, method = 'GET', body = null, token = null) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const opts = { method, headers };
      if (body) opts.body = JSON.stringify(body);

      const res = await fetch(`${baseUrl}${path}`, opts);
      const data = await res.json();
      return { status: res.status, data };
    };

    // =========================================================================
    // 1. AUTHENTICATION & TOKEN ACQUISITION
    // =========================================================================
    console.log('\n--- 1. AUTHENTICATION & ROLE TOKENS ---');
    const studentLogin = await req('/auth/login', 'POST', {
      email: 'rahul.sharma@presidencyuniversity.in',
      password: 'Student@123',
    });
    if (studentLogin.status !== 200) throw new Error('Student login failed');
    const studentToken = studentLogin.data.data.token;
    const studentId = studentLogin.data.data.user.id;
    console.log(' [PASS] Student token acquired (Rahul Sharma)');

    const facultyLogin = await req('/auth/login', 'POST', {
      email: 'faculty.cs@presidencyuniversity.in',
      password: 'Faculty@123',
    });
    if (facultyLogin.status !== 200) throw new Error('Faculty login failed');
    const facultyToken = facultyLogin.data.data.token;
    console.log(' [PASS] Faculty token acquired (Dr. Aris Thorne)');

    const adminLogin = await req('/auth/login', 'POST', {
      email: 'admin@presidencyuniversity.in',
      password: 'Admin@123',
    });
    if (adminLogin.status !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;
    console.log(' [PASS] Admin token acquired (Campus Administrator)');

    // =========================================================================
    // 2. CAMPUS LOCATIONS & SMART QR IDENTIFICATION
    // =========================================================================
    console.log('\n--- 2. CAMPUS LOCATIONS & QR CODE MANAGEMENT ---');
    const qrLookup = await req('/locations/qr/PU-ENGG-LH204', 'GET', null, studentToken);
    if (qrLookup.status !== 200 || qrLookup.data.data.location.roomNumber !== 'LH-204') {
      throw new Error('QR code lookup failed');
    }
    const sampleLocationId = qrLookup.data.data.location._id;
    console.log(` [PASS] Scanned QR PU-ENGG-LH204 -> Resolved: ${qrLookup.data.data.location.buildingName} (${qrLookup.data.data.location.roomNumber})`);

    // Student attempting to create location (RBAC check)
    const unauthorizedLoc = await req('/locations', 'POST', { qrCode: 'PU-HACK', buildingName: 'X', block: 'Y', floor: '1', roomNumber: '1' }, studentToken);
    if (unauthorizedLoc.status !== 403) throw new Error('Student was able to create location!');
    console.log(' [PASS] RBAC: Student blocked (403 Forbidden) from creating campus locations');

    // Admin creates valid location
    const newLocQr = `PU-TEST-${Date.now().toString().slice(-4)}`;
    const createLoc = await req('/locations', 'POST', {
      qrCode: newLocQr,
      buildingName: 'Academic Block 3',
      block: 'Robotics Wing',
      floor: '3rd Floor',
      roomNumber: 'ROBO-301',
      roomType: 'Computer Lab',
      description: 'Robotics & Embedded Systems Lab',
      facilities: ['3D Printers', 'Oscilloscopes', 'Soldering Stations'],
    }, adminToken);
    if (createLoc.status !== 201) throw new Error('Admin location creation failed');
    console.log(` [PASS] Admin created campus location: ${newLocQr} (ROBO-301)`);

    // =========================================================================
    // 3. SMART QR ISSUE REPORTING & COMPLAINT LIFECYCLE
    // =========================================================================
    console.log('\n--- 3. SMART QR ISSUE REPORTING & LIFECYCLE ---');
    // Student submits complaint using scanned QR location ID
    const complaintRes = await req('/complaints', 'POST', {
      locationId: sampleLocationId,
      category: 'Projector',
      title: 'Projector Lamp Failure in LH-204',
      description: 'The overhead Epson projector lamp is flickering violently and displaying error E-04.',
      priority: 'High',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    }, studentToken);

    if (complaintRes.status !== 201) throw new Error(`Complaint submission failed: ${JSON.stringify(complaintRes.data)}`);
    const complaint = complaintRes.data.data.complaint;
    const complaintId = complaint._id;
    const ticketNumber = complaint.ticketNumber;
    console.log(` [PASS] Student submitted issue -> Generated Ticket #${ticketNumber} (Status: Pending)`);

    // Verify initial history
    const historyCheck = await ComplaintHistory.find({ complaintId });
    if (historyCheck.length !== 1 || historyCheck[0].newStatus !== 'Pending') {
      throw new Error('Initial complaint history was not logged');
    }
    console.log(' [PASS] Initial audit history logged in MongoDB Atlas');

    // Admin assigns complaint to technician
    const assignRes = await req(`/complaints/${complaintId}/assign`, 'PUT', {
      staffName: 'Ramesh Kumar',
      staffPhone: '+91 9845012345',
      department: 'Electrical & AV Support',
    }, adminToken);
    if (assignRes.status !== 200 || assignRes.data.data.complaint.status !== 'Assigned') {
      throw new Error('Complaint assignment failed');
    }
    console.log(` [PASS] Admin assigned Ticket #${ticketNumber} to Ramesh Kumar (Status -> Assigned)`);

    // Admin updates status to Resolved
    const resolveRes = await req(`/complaints/${complaintId}/status`, 'PUT', {
      status: 'Resolved',
      actionNotes: 'Replaced projector bulb and calibrated HDMI connection',
      resolutionNotes: 'Hardware tested working. Lumens restored to 3600 ANSI.',
    }, adminToken);
    if (resolveRes.status !== 200 || resolveRes.data.data.complaint.status !== 'Resolved') {
      throw new Error('Complaint resolution failed');
    }
    console.log(` [PASS] Admin marked Ticket #${ticketNumber} as Resolved with resolution notes`);

    // Verify full audit history
    const fullHistory = await req(`/complaints/${complaintId}`, 'GET', null, studentToken);
    if (fullHistory.data.data.history.length < 3) {
      throw new Error('Complete audit trail was not recorded in history');
    }
    console.log(` [PASS] Complete audit trail verified (${fullHistory.data.data.history.length} state transitions)`);

    // Student fetches "My Complaints"
    const myComplaints = await req('/complaints/my', 'GET', null, studentToken);
    if (myComplaints.status !== 200 || myComplaints.data.data.total === 0) {
      throw new Error('Failed to retrieve student complaints');
    }
    console.log(` [PASS] Student retrieved their complaints list (${myComplaints.data.data.total} total)`);

    // =========================================================================
    // 4. CAMPUS EVENTS & DUPLICATE REGISTRATION PREVENTION
    // =========================================================================
    console.log('\n--- 4. CAMPUS EVENTS & REGISTRATION ENGINE ---');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 10);

    const eventRes = await req('/events', 'POST', {
      title: 'MERNOVA AI & Full-Stack Hackathon 2026',
      description: 'Annual 24-hour inter-collegiate coding and innovation marathon.',
      category: 'Technical',
      venue: 'Sir MV Auditorium',
      eventDate: futureDate.toISOString(),
      startTime: '09:00',
      endTime: '18:00',
      registrationDeadline: deadlineDate.toISOString(),
      maxParticipants: 150,
    }, facultyToken);

    if (eventRes.status !== 201) throw new Error(`Event creation failed: ${JSON.stringify(eventRes.data)}`);
    const eventId = eventRes.data.data.event._id;
    console.log(` [PASS] Faculty created event: "${eventRes.data.data.event.title}"`);

    // Student registers for event
    const regRes = await req(`/events/${eventId}/register`, 'POST', null, studentToken);
    if (regRes.status !== 201 || !regRes.data.data.ticketCode) {
      throw new Error('Event registration failed');
    }
    console.log(` [PASS] Student registered -> Ticket Code: ${regRes.data.data.ticketCode}`);

    // Student attempts DUPLICATE registration (Must be rejected!)
    const dupRegRes = await req(`/events/${eventId}/register`, 'POST', null, studentToken);
    if (dupRegRes.status !== 400) {
      throw new Error(`Security Violation: Duplicate event registration was NOT blocked! Status: ${dupRegRes.status}`);
    }
    console.log(' [PASS] Duplicate Registration Guard: Second attempt was correctly blocked (400)');

    // Verify attendee list
    const attendeesRes = await req(`/events/${eventId}/attendees`, 'GET', null, facultyToken);
    if (attendeesRes.status !== 200 || attendeesRes.data.data.total !== 1) {
      throw new Error('Attendees query failed');
    }
    console.log(` [PASS] Faculty retrieved event attendee roster (${attendeesRes.data.data.total} student)`);

    // =========================================================================
    // 5. RESOURCE BOOKING & TEMPORAL CONFLICT PREVENTION
    // =========================================================================
    console.log('\n--- 5. RESOURCE BOOKING & CONFLICT PREVENTION ---');
    // Generate a unique future date for idempotent test execution (within 30-day booking policy)
    const randomFutureDays = 2 + Math.floor(Math.random() * 20);
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + randomFutureDays);

    // Clean up any stale test bookings for this test section from previous test runs
    const secStudents = await User.find({ role: 'student', academicYear: '1st Year', section: 'A' }).select('_id');
    await Booking.deleteMany({ requestedBy: { $in: secStudents.map(s => s._id) }, status: { $in: ['Pending', 'Approved'] } });

    // 1. Initial Booking: 10:00 to 12:00
    const booking1 = await req('/bookings', 'POST', {
      locationId: sampleLocationId,
      purpose: 'MCA Capstone Project Viva Presentation',
      bookingDate: bookingDate.toISOString(),
      startTime: '10:00',
      endTime: '12:00',
      attendeesEstimate: 35,
    }, studentToken);
    if (booking1.status !== 201) throw new Error('Initial booking failed: ' + JSON.stringify(booking1.data));
    const booking1Id = booking1.data.data.booking._id;
    console.log(' [PASS] Booking #1 requested for 10:00 - 12:00 (Status: Pending)');

    // Admin approves Booking #1
    const approve1 = await req(`/bookings/${booking1Id}/status`, 'PUT', { status: 'Approved' }, adminToken);
    if (approve1.status !== 200) throw new Error('Booking approval failed');
    console.log(' [PASS] Admin approved Booking #1 for 10:00 - 12:00');

    // 2. Conflicting Booking: 11:00 to 13:00 on the same date and same room (Overlaps 10:00-12:00!)
    const conflictingBooking = await req('/bookings', 'POST', {
      locationId: sampleLocationId,
      purpose: 'Conflicting Seminar Request',
      bookingDate: bookingDate.toISOString(),
      startTime: '11:00',
      endTime: '13:00',
      attendeesEstimate: 20,
    }, facultyToken);

    if (conflictingBooking.status !== 409) {
      throw new Error(`Conflict Prevention Failure: Overlapping booking was NOT rejected! Status: ${conflictingBooking.status}`);
    }
    console.log(' [PASS] Conflict Prevention Engine: Overlapping reservation (11:00 - 13:00) rejected (409 Conflict)');

    // 3. Non-conflicting Booking: 14:00 to 16:00 on the same date and same room (Should succeed!)
    const nonConflictingBooking = await req('/bookings', 'POST', {
      locationId: sampleLocationId,
      purpose: 'Evening Guest Lecture on Cloud Computing',
      bookingDate: bookingDate.toISOString(),
      startTime: '14:00',
      endTime: '16:00',
      attendeesEstimate: 40,
    }, facultyToken);

    if (nonConflictingBooking.status !== 201) {
      throw new Error('Non-overlapping booking was wrongly rejected');
    }
    console.log(' [PASS] Non-conflicting reservation (14:00 - 16:00) accepted (201 Created)');

    // =========================================================================
    // 6. LOST AND FOUND NETWORK
    // =========================================================================
    console.log('\n--- 6. LOST & FOUND ITEM RECOVERY ---');
    const itemDate = new Date();
    const lostItemRes = await req('/lost-found', 'POST', {
      type: 'Found',
      title: 'Scientific Calculator Casio fx-991EX',
      category: 'Electronics',
      description: 'Found on desk 14 in LH-204 after morning lecture. Has sticker on backside.',
      location: 'Academic Block 1 - LH-204',
      itemDate: itemDate.toISOString(),
      isContactVisible: false,
    }, studentToken);

    if (lostItemRes.status !== 201) throw new Error('Lost & Found item creation failed');
    const itemId = lostItemRes.data.data.item._id;
    console.log(` [PASS] Student reported found item: "${lostItemRes.data.data.item.title}"`);

    // Student 2 logs in and claims the item
    const student2Login = await req('/auth/login', 'POST', {
      email: 'priya.patel@presidencyuniversity.in',
      password: 'Student@123',
    });
    const student2Token = student2Login.data.data.token;

    const claimRes = await req(`/lost-found/${itemId}/claim`, 'PUT', {
      claimNotes: 'It is mine. The back sticker has my name "Priya" written in silver ink.',
    }, student2Token);

    if (claimRes.status !== 200 || claimRes.data.data.item.status !== 'Claim Pending') {
      throw new Error('Lost & Found claim submission failed');
    }
    console.log(' [PASS] Second student submitted item claim (Status -> Claim Pending)');

    // Item poster marks as Returned
    const returnRes = await req(`/lost-found/${itemId}/status`, 'PUT', {
      status: 'Resolved/Returned',
    }, studentToken);
    if (returnRes.status !== 200) throw new Error('Status update to Returned failed');
    console.log(' [PASS] Item marked as Resolved/Returned');

    // =========================================================================
    // 7. ANNOUNCEMENTS & ROLE SCOPING
    // =========================================================================
    console.log('\n--- 7. ANNOUNCEMENTS & AUDIENCE FILTERING ---');
    const announcementRes = await req('/announcements', 'POST', {
      title: 'End-Semester MCA Project Defense Schedule',
      content: 'Final year capstone evaluations for MERNOVA X will commence on the 20th.',
      category: 'Academic',
      isImportant: true,
      targetAudience: 'Students',
    }, adminToken);

    if (announcementRes.status !== 201) throw new Error('Announcement publication failed');
    console.log(` [PASS] Admin published announcement: "${announcementRes.data.data.announcement.title}"`);

    const studentAnnouncements = await req('/announcements', 'GET', null, studentToken);
    if (studentAnnouncements.status !== 200 || studentAnnouncements.data.data.total === 0) {
      throw new Error('Student announcement query failed');
    }
    console.log(` [PASS] Student retrieved announcements (${studentAnnouncements.data.data.total} visible)`);

    // =========================================================================
    // 8. IN-APP NOTIFICATIONS
    // =========================================================================
    console.log('\n--- 8. IN-APP NOTIFICATIONS ---');
    const notifs = await req('/notifications', 'GET', null, studentToken);
    if (notifs.status !== 200 || notifs.data.data.notifications.length === 0) {
      throw new Error('Student has no notifications logged');
    }
    console.log(` [PASS] Student retrieved in-app notifications (${notifs.data.data.total} logged, unread: ${notifs.data.data.unreadCount})`);

    const firstNotifId = notifs.data.data.notifications[0]._id;
    const markReadRes = await req(`/notifications/${firstNotifId}/read`, 'PUT', null, studentToken);
    if (markReadRes.status !== 200 || !markReadRes.data.data.notification.isRead) {
      throw new Error('Mark notification as read failed');
    }
    console.log(' [PASS] Successfully marked notification as read');

    // =========================================================================
    // 9. ADMIN ANALYTICS & REPORTS
    // =========================================================================
    console.log('\n--- 9. ADMIN ANALYTICS & METRICS ---');
    const statsRes = await req('/analytics/admin-stats', 'GET', null, adminToken);
    if (statsRes.status !== 200 || !statsRes.data.data.complaints) {
      throw new Error('Admin stats retrieval failed');
    }
    console.log(' [PASS] Admin statistics generated from live MongoDB Atlas records:');
    console.log(`        Total Users: ${statsRes.data.data.users.totalUsers}`);
    console.log(`        Total Complaints: ${statsRes.data.data.complaints.total} (Resolution Rate: ${statsRes.data.data.complaints.resolutionRate})`);
    console.log(`        Upcoming Events: ${statsRes.data.data.events.upcoming}`);
    console.log(`        Approved Bookings: ${statsRes.data.data.bookings.approved}`);

    const metricsRes = await req('/analytics/complaint-metrics', 'GET', null, adminToken);
    if (metricsRes.status !== 200 || !Array.isArray(metricsRes.data.data.byCategory)) {
      throw new Error('Complaint metrics aggregation failed');
    }
    console.log(' [PASS] Complaint category aggregation metrics verified');

    // Student access to admin analytics must be 403 Forbidden
    const studentStats = await req('/analytics/admin-stats', 'GET', null, studentToken);
    if (studentStats.status !== 403) throw new Error('Student was able to read admin analytics!');
    console.log(' [PASS] RBAC: Student blocked (403 Forbidden) from accessing admin analytics');

    console.log('\n=============================================================');
    console.log(' ALL SYSTEM MODULES & ADVANCED WORKFLOWS PASSED 100%!');
    console.log(' Live Database: MongoDB Atlas (SmartCampusConnect)');
    console.log('=============================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n[SYSTEM TEST FAILURE]:', err.message);
    process.exit(1);
  }
};

runFullSystemTests();
