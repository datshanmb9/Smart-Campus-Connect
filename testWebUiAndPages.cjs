
/**
 * React Web Application Comprehensive Verification
 * Smart Campus Connect – MERNOVA X 2026
 *
 * Verifies that the React Web Frontend at http://localhost:5173
 * and its integrated API controllers work across all management screens.
 */

const http = require('http');

const WEB_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

function fetchUrl(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json: () => {
            try {
              return JSON.parse(data);
            } catch (_) {
              return null;
            }
          },
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function verifyReactWebApplication() {
  console.log('================================================================');
  console.log(' REACT WEB APPLICATION & DASHBOARD FUNCTIONAL VERIFICATION');
  console.log(' MERNOVA X 2026 • Presidency University • Smart Campus Connect');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  \u2714 [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  \u274c [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Verify Vite Web Server is running and serves React SPA
  console.log('[1] Checking React Vite Web Client at ' + WEB_URL + '...');
  const webRes = await fetchUrl(WEB_URL);
  assert(webRes.statusCode === 200, 'Web server returns HTTP 200 OK');
  assert(webRes.data.includes('<div id="root">') || webRes.data.includes('Smart Campus'), 'React root container rendered in HTML template');

  // 2. Verify Admin Authentication
  console.log('\n[2] Verifying Administrator Login...');
  const adminLogin = await fetchUrl(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'admin@presidencyuniversity.in',
    password: 'Admin@123',
  });
  const adminJson = adminLogin.json();
  assert(adminLogin.statusCode === 200, 'Admin login returns HTTP 200 OK');
  assert(adminJson && adminJson.data && adminJson.data.user.role === 'admin', 'Admin authenticated with role="admin"');
  const adminToken = adminJson.data.token;

  // 3. Verify Faculty Authentication
  console.log('\n[3] Verifying Faculty Member Login...');
  const facultyLogin = await fetchUrl(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'faculty.cs@presidencyuniversity.in',
    password: 'Faculty@123',
  });
  const facultyJson = facultyLogin.json();
  assert(facultyLogin.statusCode === 200, 'Faculty login returns HTTP 200 OK');
  assert(facultyJson && facultyJson.data && facultyJson.data.user.role === 'faculty', 'Faculty authenticated with role="faculty"');

  // 4. Verify Admin Dashboard Statistics
  console.log('\n[4] Verifying Admin Dashboard Analytics Feed...');
  const analyticsRes = await fetchUrl(`${API_URL}/analytics/admin-stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const analytics = analyticsRes.json();
  assert(analyticsRes.statusCode === 200, 'Analytics endpoint returns HTTP 200 OK');
  assert(analytics.data.users.totalStudents >= 2, `Total students count dynamic: ${analytics.data.users.totalStudents}`);
  assert(analytics.data.users.totalFaculty >= 1, `Total faculty count dynamic: ${analytics.data.users.totalFaculty}`);
  assert(analytics.data.complaints.total >= 1, `Total complaints count dynamic: ${analytics.data.complaints.total}`);
  assert(analytics.data.complaints.resolutionRate != null, `Resolution rate dynamic: ${analytics.data.complaints.resolutionRate}`);

  // 5. Verify Campus Locations & QR Code Generation Module
  console.log('\n[5] Verifying Campus Locations & QR Code Directory...');
  const locationsRes = await fetchUrl(`${API_URL}/locations`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const locations = locationsRes.json();
  assert(locationsRes.statusCode === 200, 'Locations endpoint returns HTTP 200 OK');
  assert(locations.data.locations.length >= 4, `Active campus venues found: ${locations.data.locations.length}`);
  const sampleLoc = locations.data.locations.find((l) => l.qrCode === 'PU-ENGG-LH204');
  assert(sampleLoc != null, 'Found target QR venue: PU-ENGG-LH204 (LH-204, Engineering Block)');

  // 6. Verify Complaints Management Screen
  console.log('\n[6] Verifying Complaints Management & Audit Screen...');
  const complaintsRes = await fetchUrl(`${API_URL}/complaints`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const complaints = complaintsRes.json();
  assert(complaintsRes.statusCode === 200, 'Complaints feed returns HTTP 200 OK');
  assert(complaints.data.complaints.length >= 1, `Campus complaints retrieved: ${complaints.data.complaints.length}`);
  const firstComplaint = complaints.data.complaints[0];
  const complaintDetail = await fetchUrl(`${API_URL}/complaints/${firstComplaint._id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const cDetailJson = complaintDetail.json();
  assert(complaintDetail.statusCode === 200, 'Complaint details returned HTTP 200 OK');
  assert(Array.isArray(cDetailJson.data.history), `Audit history timeline contains ${cDetailJson.data.history.length} stages`);

  // 7. Verify Events Management Screen
  console.log('\n[7] Verifying Campus Events Management Screen...');
  const eventsRes = await fetchUrl(`${API_URL}/events`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const events = eventsRes.json();
  assert(eventsRes.statusCode === 200, 'Events feed returns HTTP 200 OK');
  assert(events.data.events.length >= 1, `Active university events found: ${events.data.events.length}`);

  // 8. Verify Facility Bookings Moderation Screen
  console.log('\n[8] Verifying Facility Bookings Moderation Screen...');
  const bookingsRes = await fetchUrl(`${API_URL}/bookings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const bookings = bookingsRes.json();
  assert(bookingsRes.statusCode === 200, 'Bookings feed returns HTTP 200 OK');
  assert(Array.isArray(bookings.data.bookings), `Campus facility reservations listed: ${bookings.data.bookings.length}`);

  // 9. Verify Lost & Found Moderation Screen
  console.log('\n[9] Verifying Lost & Found Moderation Screen...');
  const lfRes = await fetchUrl(`${API_URL}/lost-found`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const lf = lfRes.json();
  assert(lfRes.statusCode === 200, 'Lost & Found feed returns HTTP 200 OK');
  assert(Array.isArray(lf.data.items), `Items in directory: ${lf.data.items.length}`);

  // 10. Verify User Management Screen
  console.log('\n[10] Verifying User & Stakeholder Management Screen...');
  const usersRes = await fetchUrl(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const users = usersRes.json();
  assert(usersRes.statusCode === 200, 'User management directory returns HTTP 200 OK');
  assert(users.data.users.length >= 4, `Registered users listed: ${users.data.users.length}`);

  console.log('\n================================================================');
  console.log(` \u2714\u2714 ALL ${passed}/${total} REACT WEB APPLICATION FUNCTIONAL CHECKS PASSED!`);
  console.log(' Web Dashboard is fully operational on http://localhost:5173');
  console.log('================================================================\n');
}

verifyReactWebApplication().catch((err) => {
  console.error('\n\u274c React Web Verification Failed:', err);
  process.exit(1);
});
