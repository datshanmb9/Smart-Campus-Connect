const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

const runClientIntegrationTests = async () => {
  console.log('\n=============================================================');
  console.log(' STARTING REACT CLIENT -> EXPRESS BACKEND INTEGRATION TESTS');
  console.log(' Target: Live MongoDB Atlas Cluster (SmartCampusConnect)');
  console.log('=============================================================\n');

  try {
    // 1. Health check
    console.log('[Step 1/13] Checking Express Backend Availability...');
    const health = await axios.get('http://localhost:5000/api/health');
    console.log('   Express Backend is ONLINE. Uptime:', health.data.uptime);

    // 2. Admin Authentication
    console.log('\n[Step 2/13] Testing React Login Service (Administrator)...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@presidencyuniversity.in',
      password: 'Admin@123',
    });
    if (adminLogin.status !== 200 || !adminLogin.data.data?.token) {
      throw new Error('Admin login failed');
    }
    const adminToken = adminLogin.data.data.token;
    console.log('   Admin JWT issued successfully. Role verified:', adminLogin.data.data.user.role);

    // 3. Faculty Authentication
    console.log('\n[Step 3/13] Testing React Login Service (Faculty)...');
    const facultyLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'faculty.cs@presidencyuniversity.in',
      password: 'Faculty@123',
    });
    if (facultyLogin.status !== 200 || !facultyLogin.data.data?.token) {
      throw new Error('Faculty login failed');
    }
    const facultyToken = facultyLogin.data.data.token;
    console.log('   Faculty JWT issued successfully. Role verified:', facultyLogin.data.data.user.role);

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const facultyHeaders = { Authorization: `Bearer ${facultyToken}` };

    // 4. Admin Dashboard Analytics
    console.log('\n[Step 4/13] Testing Admin Dashboard Stats (GET /api/analytics/admin-stats)...');
    const stats = await axios.get(`${API_BASE}/analytics/admin-stats`, { headers: adminHeaders });
    if (stats.status !== 200 || stats.data.data.complaints.total === undefined) {
      throw new Error('Failed to retrieve admin stats');
    }
    console.log('   Admin stats fetched live from MongoDB Atlas:');
    console.log(`     Total Students: ${stats.data.data.users.totalStudents}`);
    console.log(`     Total Complaints: ${stats.data.data.complaints.total}`);
    console.log(`     Resolution Rate: ${stats.data.data.complaints.resolutionRate}`);
    console.log(`     Upcoming Events: ${stats.data.data.events.upcoming}`);

    // 5. Locations & QR Code API
    console.log('\n[Step 5/13] Testing Campus Locations & QR Lookup...');
    const locations = await axios.get(`${API_BASE}/locations`, { headers: adminHeaders });
    const qrLookup = await axios.get(`${API_BASE}/locations/qr/PU-ENGG-LH204`, { headers: adminHeaders });
    if (locations.status !== 200 || qrLookup.status !== 200) {
      throw new Error('Location service failed');
    }
    console.log(`   Found ${locations.data.data.total} registered venues. QR PU-ENGG-LH204 mapped to: ${qrLookup.data.data.location.roomNumber}`);

    // 6. Complaints Triage API
    console.log('\n[Step 6/13] Testing Complaints Triage Service...');
    const complaints = await axios.get(`${API_BASE}/complaints`, { headers: adminHeaders });
    if (complaints.status !== 200) throw new Error('Complaints service failed');
    console.log(`   Retrieved ${complaints.data.data.total} complaints for triage table.`);

    // 7. Events Service
    console.log('\n[Step 7/13] Testing Events Catalog Service...');
    const events = await axios.get(`${API_BASE}/events`, { headers: adminHeaders });
    if (events.status !== 200) throw new Error('Events service failed');
    console.log(`   Retrieved ${events.data.data.total} campus events.`);

    // 8. Resource Bookings Service
    console.log('\n[Step 8/13] Testing Resource Bookings Service...');
    const bookings = await axios.get(`${API_BASE}/bookings`, { headers: adminHeaders });
    if (bookings.status !== 200) throw new Error('Bookings service failed');
    console.log(`   Retrieved ${bookings.data.data.total} venue reservations.`);

    // 9. Lost & Found Service
    console.log('\n[Step 9/13] Testing Lost & Found Service...');
    const lostFound = await axios.get(`${API_BASE}/lost-found`, { headers: adminHeaders });
    if (lostFound.status !== 200) throw new Error('Lost & Found service failed');
    console.log(`   Retrieved ${lostFound.data.data.total} items.`);

    // 10. Announcements Service
    console.log('\n[Step 10/13] Testing Announcements Service...');
    const announcements = await axios.get(`${API_BASE}/announcements`, { headers: adminHeaders });
    if (announcements.status !== 200) throw new Error('Announcements service failed');
    console.log(`   Retrieved ${announcements.data.data.total} circulars.`);

    // 11. User Management Service
    console.log('\n[Step 11/13] Testing User Management Service...');
    const users = await axios.get(`${API_BASE}/users`, { headers: adminHeaders });
    if (users.status !== 200) throw new Error('Users service failed');
    console.log(`   Retrieved ${users.data.data.total} users from directory.`);

    // 12. Faculty Portal Service
    console.log('\n[Step 12/13] Testing Faculty Portal Summary (GET /api/analytics/faculty-summary)...');
    const facultySum = await axios.get(`${API_BASE}/analytics/faculty-summary`, { headers: facultyHeaders });
    if (facultySum.status !== 200) throw new Error('Faculty summary failed');
    console.log('   Faculty summary retrieved:');
    console.log(`     My Events: ${facultySum.data.data.myEvents}`);
    console.log(`     Campus Circulars: ${facultySum.data.data.totalAnnouncements}`);

    // 13. Role-Based Security: Faculty blocked from admin endpoints
    console.log('\n[Step 13/13] Verifying Security: Faculty Blocked from Admin Directory...');
    try {
      await axios.get(`${API_BASE}/users`, { headers: facultyHeaders });
      throw new Error('Security Breach: Faculty was able to query /api/users!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('   RBAC PASS: Faculty correctly blocked (403 Forbidden) from accessing Admin user management.');
      } else {
        throw err;
      }
    }

    console.log('\n=============================================================');
    console.log(' ALL 13 REACT CLIENT INTEGRATION TESTS PASSED 100%!');
    console.log(' React Application is fully operational & integrated!');
    console.log('=============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n[CLIENT TEST FAILED]:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', err.response.data);
    }
    process.exit(1);
  }
};

runClientIntegrationTests();
