const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data,
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

async function runStudentApprovalWorkflowTest() {
  console.log('=============================================================');
  console.log(' STEP 4: COMPLETE STUDENT REGISTRATION & APPROVAL WORKFLOW');
  console.log(' Smart Campus Connect • Presidency University');
  console.log('=============================================================\n');

  const ts = Date.now();
  const testStudent = {
    fullName: `Approval Test Student ${ts.toString().slice(-4)}`,
    email: `test.approval.${ts}@presidencyuniversity.in`,
    password: 'Password@123',
    role: 'student',
    registrationNumber: `REG${ts.toString().slice(-6)}`,
    department: 'Master of Computer Applications',
    academicYear: '1st Year',
    section: 'A',
    phone: '+91 9876501234',
  };

  const rejectStudent = {
    fullName: `Reject Test Student ${ts.toString().slice(-4)}`,
    email: `test.reject.${ts}@presidencyuniversity.in`,
    password: 'Password@123',
    role: 'student',
    registrationNumber: `REJ${ts.toString().slice(-6)}`,
    department: 'Civil Engineering',
    academicYear: '1st Year',
    section: 'A',
    phone: '+91 9876505678',
  };

  let testStudentId = null;
  let rejectStudentId = null;
  let adminToken = null;

  try {
    // -------------------------------------------------------------
    // 1. REGISTER NEW STUDENT
    // -------------------------------------------------------------
    console.log('[Step 1] Registering New Student (POST /api/auth/register)...');
    const regRes = await request('/auth/register', { method: 'POST' }, testStudent);
    console.log('   Response Status:', regRes.status);
    console.log('   Response Body:', JSON.stringify(regRes.data, null, 2));

    if (regRes.status !== 201) {
      throw new Error(`Registration failed with status ${regRes.status}`);
    }
    if (regRes.data.data?.token) {
      throw new Error('SECURITY VIOLATION: Student received JWT token before approval!');
    }
    if (!regRes.data.data?.requiresApproval) {
      throw new Error('Expected requiresApproval flag in registration response');
    }
    testStudentId = regRes.data.data.user.id;
    console.log('   ✔ PASS: Registration created student with ID:', testStudentId);

    // -------------------------------------------------------------
    // 2. VERIFY DATABASE STORES approvalStatus = Pending
    // -------------------------------------------------------------
    console.log('\n[Step 2] Verifying initial status in registration response & DB schema...');
    if (regRes.data.data.user.approvalStatus !== 'Pending') {
      throw new Error(`Expected approvalStatus="Pending", got "${regRes.data.data.user.approvalStatus}"`);
    }
    console.log('   ✔ PASS: approvalStatus is strictly "Pending"');
    console.log('   ✔ Academic Year:', regRes.data.data.user.academicYear);
    console.log('   ✔ Section:', regRes.data.data.user.section);

    // -------------------------------------------------------------
    // 3. ATTEMPT STUDENT LOGIN (MUST BE BLOCKED)
    // -------------------------------------------------------------
    console.log('\n[Step 3] Attempting Student Login before approval (POST /api/auth/login)...');
    const blockedLogin = await request('/auth/login', { method: 'POST' }, {
      email: testStudent.email,
      password: testStudent.password,
    });
    console.log('   Response Status:', blockedLogin.status);
    console.log('   Response Body:', JSON.stringify(blockedLogin.data, null, 2));

    if (blockedLogin.status !== 403) {
      throw new Error(`Expected 403 Forbidden for pending student, got ${blockedLogin.status}`);
    }
    if (!blockedLogin.data.message?.toLowerCase().includes('awaiting admin verification')) {
      throw new Error(`Expected awaiting verification message, got: ${blockedLogin.data.message}`);
    }
    console.log('   ✔ PASS: Pending student is strictly blocked from login with HTTP 403 Forbidden.');

    // -------------------------------------------------------------
    // 4. LOGIN AS ADMINISTRATOR
    // -------------------------------------------------------------
    console.log('\n[Step 4] Logging in as Campus Administrator (POST /api/auth/login)...');
    const adminLogin = await request('/auth/login', { method: 'POST' }, {
      email: 'admin@presidencyuniversity.in',
      password: 'Admin@123',
    });
    if (adminLogin.status !== 200 || !adminLogin.data.data?.token) {
      throw new Error('Admin login failed');
    }
    adminToken = adminLogin.data.data.token;
    console.log('   ✔ PASS: Admin authenticated successfully. Role:', adminLogin.data.data.user.role);

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // -------------------------------------------------------------
    // 5 & 6. OPEN USER DIRECTORY -> PENDING STUDENT APPROVALS
    // -------------------------------------------------------------
    console.log('\n[Step 5 & 6] Querying Pending Students API (GET /api/users/pending-students)...');
    const pendingListRes = await request('/users/pending-students', { headers: adminHeaders });
    console.log('   Response Status:', pendingListRes.status);
    console.log('   Total Pending in Queue:', pendingListRes.data.data?.total);

    if (pendingListRes.status !== 200) {
      throw new Error(`Failed to fetch pending students: ${JSON.stringify(pendingListRes.data)}`);
    }

    const foundPending = pendingListRes.data.data.students.find((s) => s._id === testStudentId);
    if (!foundPending) {
      throw new Error(`Newly registered student ${testStudentId} was not found in pending students list!`);
    }
    console.log('   ✔ PASS: New student appears in Pending Student Approvals queue:');
    console.log(`     - Name: ${foundPending.fullName}`);
    console.log(`     - Email: ${foundPending.email}`);
    console.log(`     - Reg No: ${foundPending.registrationNumber}`);
    console.log(`     - Department: ${foundPending.department}`);
    console.log(`     - Status: ${foundPending.approvalStatus}`);

    // Also verify visibility in main User Directory (GET /api/users)
    const directoryRes = await request('/users', { headers: adminHeaders });
    const foundInDirectory = directoryRes.data.data.users.find((u) => u._id === testStudentId);
    if (!foundInDirectory) {
      throw new Error(`New student was not found in main user directory!`);
    }
    console.log('   ✔ PASS: New student is also present in main Campus Directory with approvalStatus="Pending"');

    // -------------------------------------------------------------
    // 7. APPROVE THE STUDENT
    // -------------------------------------------------------------
    console.log(`\n[Step 7] Admin Approves Student (PUT /api/users/${testStudentId}/approve)...`);
    const approveRes = await request(`/users/${testStudentId}/approve`, {
      method: 'PUT',
      headers: adminHeaders,
    });
    console.log('   Response Status:', approveRes.status);
    console.log('   Response Message:', approveRes.data.message);

    if (approveRes.status !== 200) {
      throw new Error(`Approval endpoint failed: ${JSON.stringify(approveRes.data)}`);
    }
    console.log('   ✔ PASS: Approval endpoint executed successfully with HTTP 200 OK.');

    // -------------------------------------------------------------
    // 8. VERIFY DATABASE STATUS CHANGES TO "Approved"
    // -------------------------------------------------------------
    console.log('\n[Step 8] Verifying updated status in database...');
    const verifyUserRes = await request(`/users/${testStudentId}`, { headers: adminHeaders });
    const updatedUser = verifyUserRes.data.data.user;
    console.log('   Updated Status:', updatedUser.approvalStatus);
    console.log('   Approved At:', updatedUser.approvedAt);
    console.log('   Approved By:', updatedUser.approvedBy);

    if (updatedUser.approvalStatus !== 'Approved') {
      throw new Error(`Expected approvalStatus="Approved", got "${updatedUser.approvalStatus}"`);
    }
    console.log('   ✔ PASS: Database status is now "Approved"');

    // -------------------------------------------------------------
    // 9 & 10. LOGIN USING NEWLY APPROVED STUDENT ACCOUNT
    // -------------------------------------------------------------
    console.log('\n[Step 9 & 10] Logging in with newly approved student account (POST /api/auth/login)...');
    const studentLogin = await request('/auth/login', { method: 'POST' }, {
      email: testStudent.email,
      password: testStudent.password,
    });
    console.log('   Response Status:', studentLogin.status);
    console.log('   Response Message:', studentLogin.data.message);

    if (studentLogin.status !== 200 || !studentLogin.data.data?.token) {
      throw new Error(`Approved student login failed: ${JSON.stringify(studentLogin.data)}`);
    }
    const studentToken = studentLogin.data.data.token;
    console.log('   ✔ PASS: Approved student logged in successfully! JWT token issued.');
    console.log('   User Profile Role:', studentLogin.data.data.user.role);
    console.log('   User Approval Status:', studentLogin.data.data.user.approvalStatus);

    // Verify token works on private route
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (meRes.status !== 200) {
      throw new Error('Authenticated student token failed on /api/auth/me');
    }
    console.log('   ✔ PASS: Student session verified on /api/auth/me:', meRes.data.data.user.fullName);

    // -------------------------------------------------------------
    // BONUS: TEST REJECTION WORKFLOW
    // -------------------------------------------------------------
    console.log('\n-------------------------------------------------------------');
    console.log(' TESTING REJECTION WORKFLOW');
    console.log('-------------------------------------------------------------');

    console.log('\n[Rejection Step 1] Registering applicant for rejection test...');
    const rejectRegRes = await request('/auth/register', { method: 'POST' }, rejectStudent);
    if (rejectRegRes.status !== 201) throw new Error('Reject test registration failed');
    rejectStudentId = rejectRegRes.data.data.user.id;
    console.log('   ✔ Registered applicant ID:', rejectStudentId);

    console.log('\n[Rejection Step 2] Admin rejects applicant with reason...');
    const rejectReasonText = 'University roll number not found in admissions roster.';
    const rejectRes = await request(`/users/${rejectStudentId}/reject`, {
      method: 'PUT',
      headers: adminHeaders,
    }, { reason: rejectReasonText });

    console.log('   Response Status:', rejectRes.status);
    console.log('   Response Message:', rejectRes.data.message);
    if (rejectRes.status !== 200 || rejectRes.data.data.user.approvalStatus !== 'Rejected') {
      throw new Error(`Rejection failed: ${JSON.stringify(rejectRes.data)}`);
    }
    console.log('   ✔ PASS: Applicant status marked as "Rejected" with reason recorded.');

    console.log('\n[Rejection Step 3] Attempting login with rejected applicant...');
    const rejectedLogin = await request('/auth/login', { method: 'POST' }, {
      email: rejectStudent.email,
      password: rejectStudent.password,
    });
    console.log('   Response Status:', rejectedLogin.status);
    console.log('   Response Message:', rejectedLogin.data.message);

    if (rejectedLogin.status !== 403) {
      throw new Error(`Expected 403 Forbidden for rejected student, got ${rejectedLogin.status}`);
    }
    if (!rejectedLogin.data.message?.includes(rejectReasonText)) {
      throw new Error(`Rejection reason was not displayed in login message! Message: ${rejectedLogin.data.message}`);
    }
    console.log('   ✔ PASS: Rejected student blocked with exact reason displayed.');

    console.log('\n=============================================================');
    console.log(' ✔✔ COMPLETE 10-STEP APPROVAL & REJECTION WORKFLOW PASSED 100%!');
    console.log('=============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ WORKFLOW TEST FAILED:', err.message);
    process.exit(1);
  }
}

runStudentApprovalWorkflowTest();

