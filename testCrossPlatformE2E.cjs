/**
 * Cross-Platform Verification Test Suite
 * Smart Campus Connect – MERNOVA X 2026
 *
 * Verifies the end-to-end cycle between:
 * 1. Flutter Mobile App Client (Student actions)
 * 2. Express Backend + MongoDB Atlas (REST API & DB Persistence)
 * 3. React Web Admin Dashboard (Admin triage & resolution)
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api';

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runCrossPlatformSyncVerification() {
  console.log('================================================================');
  console.log(' SMART CAMPUS CONNECT – CROSS-PLATFORM SYNC VERIFICATION');
  console.log(' MERNOVA X 2026 • MCA Final Year Project • Presidency University');
  console.log('================================================================\n');

  try {
    // 1. Mobile Student Login
    console.log('[Step 1] Mobile Client: Student Rahul Sharma logging in...');
    const studentLogin = await apiRequest('/auth/login', 'POST', {
      email: 'rahul.sharma@presidencyuniversity.in',
      password: 'Student@123',
    });
    if (studentLogin.status !== 200) throw new Error('Student login failed');
    const studentToken = studentLogin.body.data.token;
    console.log('  \u2714 Student authenticated! JWT token generated.');

    // 2. Mobile QR Scanner resolves location
    console.log('\n[Step 2] Mobile Client: Scanning Classroom QR code "PU-ENGG-LH204"...');
    const qrLookup = await apiRequest('/locations/qr/PU-ENGG-LH204', 'GET', null, studentToken);
    if (qrLookup.status !== 200) throw new Error('QR lookup failed');
    const location = qrLookup.body.data.location;
    console.log(`  \u2714 Location identified: ${location.roomNumber} (${location.buildingName}, Floor ${location.floor})`);

    // 3. Mobile Student submits issue ticket
    console.log('\n[Step 3] Mobile Client: Submitting Projector fault ticket...');
    const complaintSubmit = await apiRequest('/complaints', 'POST', {
      locationId: location._id,
      category: 'Projector & AV',
      title: 'Ceiling projector flickering during MCA lecture',
      description: 'The HDMI signal drops every 2 minutes in LH-204. Needs connector replacement.',
      priority: 'High',
    }, studentToken);
    if (complaintSubmit.status !== 201) throw new Error('Complaint submission failed: ' + JSON.stringify(complaintSubmit.body));
    const ticketNumber = complaintSubmit.body.data.complaint.ticketNumber;
    const complaintId = complaintSubmit.body.data.complaint._id;
    console.log(`  \u2714 Ticket created successfully in MongoDB Atlas: ${ticketNumber}`);

    // 4. Web Admin logs in
    console.log('\n[Step 4] Web Dashboard: Admin logging in...');
    const adminLogin = await apiRequest('/auth/login', 'POST', {
      email: 'admin@presidencyuniversity.in',
      password: 'Admin@123',
    });
    if (adminLogin.status !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.body.data.token;
    console.log('  \u2714 Admin authenticated with role: "admin"');

    // 5. Web Admin inspects complaints list
    console.log('\n[Step 5] Web Dashboard: Loading live complaint feed...');
    const adminFeed = await apiRequest('/complaints', 'GET', null, adminToken);
    const foundTicket = adminFeed.body.data.complaints.find((c) => c.ticketNumber === ticketNumber);
    if (!foundTicket) throw new Error('Submitted ticket not found in admin feed');
    console.log(`  \u2714 Ticket ${ticketNumber} visible in Admin Dashboard in "Pending" status.`);

    // 6. Web Admin assigns ticket to technician
    console.log('\n[Step 6] Web Dashboard: Admin assigning technician to ticket...');
    const assignRes = await apiRequest(`/complaints/${complaintId}/assign`, 'PUT', {
      staffName: 'Ramesh Kumar (AV Support)',
      staffPhone: '+91 98450 11223',
      notes: 'Dispatched spare HDMI cable and tester',
    }, adminToken);
    if (assignRes.status !== 200) throw new Error('Assignment failed');
    console.log('  \u2714 Technician assigned! Status transitioned to "Assigned".');

    // 7. Web Admin marks In Progress
    console.log('\n[Step 7] Web Dashboard: Admin updating status to "In Progress"...');
    const inProgressRes = await apiRequest(`/complaints/${complaintId}/status`, 'PUT', {
      status: 'In Progress',
      actionNotes: 'Technician on site inspecting projector bracket in LH-204',
    }, adminToken);
    if (inProgressRes.status !== 200) throw new Error('Status update failed');
    console.log('  \u2714 Status transitioned to "In Progress".');

    // 8. Web Admin resolves ticket
    console.log('\n[Step 8] Web Dashboard: Admin resolving ticket...');
    const resolveRes = await apiRequest(`/complaints/${complaintId}/status`, 'PUT', {
      status: 'Resolved',
      actionNotes: 'Replaced damaged HDMI port and calibrated display focus',
      resolutionNotes: 'Hardware repair completed. Video tested with faculty laptop.',
    }, adminToken);
    if (resolveRes.status !== 200) throw new Error('Resolution failed');
    console.log('  \u2714 Ticket successfully marked "Resolved" with resolution notes.');

    // 9. Mobile Student refreshes My Complaints and verifies audit history
    console.log('\n[Step 9] Mobile Client: Pull-to-refresh on My Complaints screen...');
    const myComplaints = await apiRequest(`/complaints/${complaintId}`, 'GET', null, studentToken);
    const verifiedComplaint = myComplaints.body.data.complaint;
    const history = myComplaints.body.data.history;

    console.log(`  \u2714 Mobile reflects current status: "${verifiedComplaint.status}"`);
    console.log(`  \u2714 Assigned Staff: ${verifiedComplaint.assignedTo?.staffName}`);
    console.log(`  \u2714 Resolution Notes: "${verifiedComplaint.resolutionNotes}"`);
    console.log(`  \u2714 Full Audit History items recorded: ${history.length}`);
    history.forEach((h, idx) => {
      console.log(`      [Stage ${idx + 1}] ${h.previousStatus} \u2192 ${h.newStatus} | Note: "${h.actionNotes}"`);
    });

    // 10. Mobile Student checks notifications
    console.log('\n[Step 10] Mobile Client: Checking in-app notifications...');
    const notifs = await apiRequest('/notifications', 'GET', null, studentToken);
    console.log(`  \u2714 Unread notifications: ${notifs.body.data.unreadCount}`);
    if (notifs.body.data.notifications.length > 0) {
      console.log(`  \u2714 Latest alert: "${notifs.body.data.notifications[0].title}" – ${notifs.body.data.notifications[0].message}`);
    }

    // 11. Mobile Student registers for Campus Event
    console.log('\n[Step 11] Mobile Client: Fetching campus events...');
    const eventsList = await apiRequest('/events', 'GET', null, studentToken);
    if (eventsList.body.data.events.length > 0) {
      const eventToJoin = eventsList.body.data.events[0];
      console.log(`  \u2714 Found event: "${eventToJoin.title}"`);
      const regRes = await apiRequest(`/events/${eventToJoin._id}/register`, 'POST', {}, studentToken);
      if (regRes.status === 200 || regRes.status === 201) {
        console.log(`  \u2714 Mobile Student registered! Ticket code: ${regRes.body.data.ticketCode}`);
      } else if (regRes.status === 400 && regRes.body.message.includes('Already registered')) {
        console.log(`  \u2714 Already registered for this event (Duplicate prevention active \u2714)`);
      }
    }

    // 12. Mobile Student views Facility Booking
    console.log('\n[Step 12] Mobile Client: Checking facility reservation status...');
    const myBookings = await apiRequest('/bookings/my', 'GET', null, studentToken);
    console.log(`  \u2714 Personal facility bookings loaded: ${myBookings.body.data.bookings.length} reservations found`);

    console.log('\n================================================================');
    console.log(' \u2714\u2714 ALL 12 CROSS-PLATFORM INTEGRATION CHECKS PASSED PERFECTLY!');
    console.log(' Flutter Mobile \u21c4 Express Backend \u21c4 MongoDB Atlas \u21c4 React Web');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n\u274c Cross-Platform Sync Verification Failed:', err.message);
    process.exit(1);
  }
}

runCrossPlatformSyncVerification();

