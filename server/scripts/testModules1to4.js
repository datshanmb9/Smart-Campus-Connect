const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let facultyToken = '';
let existingStudentToken = '';

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const config = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
};

const log = (step, title, passed, details = '') => {
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} [${step}] ${title}`);
  if (details) console.log(`   ${details}`);
};

async function runTests() {
  console.log('==========================================================');
  console.log(' RUNNING SMART CAMPUS CONNECT - MODULES 1 to 4 TEST SUITE');
  console.log('==========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const test = async (name, fn) => {
    totalTests++;
    try {
      await fn();
      passedTests++;
      log(totalTests, name, true);
    } catch (err) {
      log(totalTests, name, false, err.message);
    }
  };

  // 1. Existing user logins
  await test('Existing Admin login (admin@presidencyuniversity.in)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@presidencyuniversity.in',
        password: 'Admin@123',
      },
    });
    if (!res.ok || !res.data.data?.token || res.data.data?.user?.role !== 'admin') {
      throw new Error(`Failed to login admin: ${res.data.message}`);
    }
    adminToken = res.data.data.token;
  });

  await test('Existing Faculty login (faculty.cs@presidencyuniversity.in)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'faculty.cs@presidencyuniversity.in',
        password: 'Faculty@123',
      },
    });
    if (!res.ok || !res.data.data?.token || res.data.data?.user?.role !== 'faculty') {
      throw new Error(`Failed to login faculty: ${res.data.message}`);
    }
    facultyToken = res.data.data.token;
  });

  await test('Existing Student login (rahul.sharma@presidencyuniversity.in)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'rahul.sharma@presidencyuniversity.in',
        password: 'Student@123',
      },
    });
    if (!res.ok || !res.data.data?.token || res.data.data?.user?.role !== 'student') {
      throw new Error(`Failed to login student: ${res.data.message}`);
    }
    existingStudentToken = res.data.data.token;
  });

  // 2. Module 1: Student Registration (Pending Status & No JWT)
  const rand = Date.now().toString().slice(-6);
  const testStudentEmail = `test.student.${rand}@presidencyuniversity.in`;
  const testStudentReg = `2026TEST${rand}`;
  let pendingStudentId = '';

  await test('New Student Registration creates Pending account without JWT', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        fullName: `Test Student ${rand}`,
        email: testStudentEmail,
        password: 'Password@123',
        registrationNumber: testStudentReg,
        department: 'School of Computer Science & Engineering',
        academicYear: '4th Year',
        section: `Z${rand.slice(-2)}`,
        phone: '9876543210',
      },
    });

    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${res.data.message}`);
    if (res.data.data?.token) throw new Error('JWT token must NOT be issued to pending student');
    if (res.data.data?.user?.approvalStatus !== 'Pending') throw new Error('Expected status Pending');
    pendingStudentId = res.data.data.user.id;
  });

  // 3. Login restriction for Pending account
  await test('Pending student login is blocked with exact message (403)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testStudentEmail,
        password: 'Password@123',
      },
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    if (!res.data.message?.includes('awaiting admin verification')) {
      throw new Error(`Expected "awaiting admin verification", got "${res.data.message}"`);
    }
  });

  // 4. Role authorization: Student cannot access admin endpoints
  await test('Student role is forbidden from viewing pending students (RBAC check)', async () => {
    const res = await request('/users/pending-students', {
      headers: { Authorization: `Bearer ${existingStudentToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // 5. Admin views pending students list
  await test('Admin retrieves pending student registrations list', async () => {
    const res = await request('/users/pending-students', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch pending students: ${res.data.message}`);
    const found = res.data.data.students.some((s) => s.email === testStudentEmail);
    if (!found) throw new Error('Newly registered student not found in pending list');
  });

  // 6. Admin approves student
  await test('Admin approves pending student and triggers in-app notification', async () => {
    const res = await request(`/users/${pendingStudentId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Approval failed: ${res.data.message}`);
    if (res.data.data?.user?.approvalStatus !== 'Approved') throw new Error('Expected status to be Approved');
  });

  // 7. Student can now log in and gets JWT token
  let approvedStudentToken = '';
  await test('Approved student logs in successfully and receives JWT', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testStudentEmail,
        password: 'Password@123',
      },
    });
    if (!res.ok || !res.data.data?.token) throw new Error(`Expected JWT token: ${res.data.message}`);
    approvedStudentToken = res.data.data.token;
  });

  // 8. Rejection test with reason
  const rand2 = (Date.now() + 1).toString().slice(-6);
  const rejectStudentEmail = `reject.student.${rand2}@presidencyuniversity.in`;
  let rejectedStudentId = '';

  await test('Register 2nd student for rejection testing', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        fullName: `Fake Applicant ${rand2}`,
        email: rejectStudentEmail,
        password: 'Password@123',
        registrationNumber: `2026REJ${rand2}`,
        department: 'Civil Engineering',
      },
    });
    if (res.status !== 201) throw new Error(`Registration failed: ${res.data.message}`);
    rejectedStudentId = res.data.data.user.id;
  });

  await test('Admin rejects student registration with required reason', async () => {
    const res = await request(`/users/${rejectedStudentId}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { reason: 'Roll number not found in university admissions registry' },
    });
    if (!res.ok) throw new Error(`Rejection failed: ${res.data.message}`);
    if (res.data.data?.user?.approvalStatus !== 'Rejected') throw new Error('Expected status Rejected');
  });

  await test('Rejected student login is blocked with rejection reason (403)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: rejectStudentEmail,
        password: 'Password@123',
      },
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    if (!res.data.message?.includes('Roll number not found')) {
      throw new Error(`Expected rejection reason in response, got "${res.data.message}"`);
    }
  });

  // 9. MODULE 2: Controlled Facility Booking Validations
  const locRes = await request('/locations', {
    headers: { Authorization: `Bearer ${approvedStudentToken}` },
  });
  const locations = locRes.data.data.locations;
  const adminLocation = locations.find((l) => l.approvalAuthority === 'admin') || locations[0];
  const facultyLocation = locations.find((l) => l.approvalAuthority === 'faculty') || locations[locations.length - 1];

  // Choose a dynamic day offset (between 4 and 25) so tests are idempotent across multiple runs
  const dayOffset = 4 + (Math.floor(Date.now() / 1000) % 22);
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + dayOffset);
  const bookingDateStr = bookingDate.toISOString().split('T')[0];

  // Test 9a: End time <= start time
  await test('Validation: End time earlier than or equal to start time is rejected (400)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'Invalid time test',
        bookingDate: bookingDateStr,
        startTime: '14:00',
        endTime: '13:00',
      },
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 9b: Booking > 30 days
  await test('Validation: Booking date beyond 30 days is rejected (400)', async () => {
    const farDate = new Date();
    farDate.setDate(farDate.getDate() + 45);
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'Far future test',
        bookingDate: farDate.toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
      },
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 9c: Past date
  await test('Validation: Booking on past date is rejected (400)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'Past date test',
        bookingDate: '2020-01-01',
        startTime: '10:00',
        endTime: '11:00',
      },
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 9d: Create valid Pending booking 1
  let booking1Id = '';
  await test('Student submits valid facility booking request 1 (Pending)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'MCA Study Group Session 1',
        bookingDate: bookingDateStr,
        startTime: '10:00',
        endTime: '11:30',
        attendeesEstimate: 15,
      },
    });
    if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}: ${res.data.message}`);
    booking1Id = res.data.data.booking._id;
  });

  // Test 9e: Prevent duplicate booking request
  await test('Validation: Duplicate booking request by same student is rejected (400)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'Duplicate MCA Session',
        bookingDate: bookingDateStr,
        startTime: '10:00',
        endTime: '11:30',
      },
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 9f: Create valid Pending booking 2
  let booking2Id = '';
  await test('Student submits valid facility booking request 2 (Pending)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'MCA Study Group Session 2',
        bookingDate: bookingDateStr,
        startTime: '12:00',
        endTime: '13:00',
        attendeesEstimate: 10,
      },
    });
    if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}`);
    booking2Id = res.data.data.booking._id;
  });

  // Test 9g: Max 2 active pending requests limit
  await test('Validation: 3rd active pending request is rejected by 2-limit rule (400)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'Excess 3rd booking request',
        bookingDate: bookingDateStr,
        startTime: '14:00',
        endTime: '15:00',
      },
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (!res.data.message?.includes('at most 2')) {
      throw new Error(`Expected limit message, got "${res.data.message}"`);
    }
  });

  // Test 9h: Student cancels their own pending booking
  await test('Student cancels their own pending booking request 2', async () => {
    const res = await request(`/bookings/${booking2Id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
  });

  // Test 9i: Student cannot cancel another student booking
  await test('Student cannot cancel another student booking (403)', async () => {
    const res = await request(`/bookings/${booking1Id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${existingStudentToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // Test 9j: Admin approves booking 1
  await test('Admin approves booking 1 (generates notification)', async () => {
    const res = await request(`/bookings/${booking1Id}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Approved' },
    });
    if (!res.ok || res.data.data?.booking?.status !== 'Approved') {
      throw new Error(`Approval failed: ${res.data.message}`);
    }
  });

  // Test 9k: Hard conflict check: Overlapping approved bookings are rejected with 409
  await test('Conflict check: New booking overlapping with Approved booking 1 is rejected (409)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'Conflicting session during 10:30-11:00',
        bookingDate: bookingDateStr,
        startTime: '10:30',
        endTime: '11:00',
      },
    });
    if (res.status !== 409) throw new Error(`Expected 409 Conflict, got ${res.status}: ${res.data.message}`);
  });

  // Test 9l: Faculty authority check: Faculty cannot approve Admin-only facility
  await test('Authority check: Faculty cannot approve an admin-governed facility booking (403)', async () => {
    const pendRes = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'Faculty authority test booking',
        bookingDate: bookingDateStr,
        startTime: '16:00',
        endTime: '17:00',
      },
    });
    if (!pendRes.ok || !pendRes.data.data?.booking) {
      throw new Error(`Failed to create pending booking for test 9l: ${pendRes.data.message}`);
    }
    const pendId = pendRes.data.data.booking._id;

    const res = await request(`/bookings/${pendId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: { status: 'Approved' },
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);

    // Clean up by cancelling
    await request(`/bookings/${pendId}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
    });
  });

  // Test 9m: Faculty CAN approve faculty-designated facility
  await test('Authority check: Faculty approves a booking for faculty-designated facility', async () => {
    const pendRes = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: facultyLocation._id,
        purpose: 'AI Seminar in Seminar Hall',
        bookingDate: bookingDateStr,
        startTime: '14:00',
        endTime: '15:30',
      },
    });
    if (!pendRes.ok || !pendRes.data.data?.booking) {
      throw new Error(`Failed to create pending booking for test 9m: ${pendRes.data.message}`);
    }
    const pendId = pendRes.data.data.booking._id;

    const res = await request(`/bookings/${pendId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: { status: 'Approved' },
    });
    if (!res.ok || res.data.data?.booking?.status !== 'Approved') {
      throw new Error(`Faculty approval failed: ${res.data.message}`);
    }

    // Cancel this booking so the section quota has capacity for test 9n
    await request(`/bookings/${pendId}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
    });
  });

  // Test 9n: Rejection requires a reason
  await test('Validation: Rejecting booking without reason is rejected (400)', async () => {
    const pendRes = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${approvedStudentToken}` },
      body: {
        locationId: adminLocation._id,
        purpose: 'Test for rejection reason',
        bookingDate: bookingDateStr,
        startTime: '18:00',
        endTime: '19:00',
      },
    });
    if (!pendRes.ok || !pendRes.data.data?.booking) {
      throw new Error(`Failed to create pending booking for test 9n: ${pendRes.data.message}`);
    }
    const pendId = pendRes.data.data.booking._id;

    const res = await request(`/bookings/${pendId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Rejected', rejectionReason: '' },
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 9o: Check booking statistics endpoint response
  await test('Dashboard statistics check: getAllBookings returns stats counters', async () => {
    const res = await request('/bookings', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const stats = res.data.data.stats;
    if (stats?.pending === undefined || stats?.approved === undefined || stats?.total === undefined) {
      throw new Error('Stats object missing required counters');
    }
  });

  console.log('\n==========================================================');
  console.log(` TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('==========================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
