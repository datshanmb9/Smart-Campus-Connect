const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const app = require('./src/app');
const User = require('./src/models/User');

const testAuthWorkflow = async () => {
  console.log('\n=============================================================');
  console.log(' STARTING COMPREHENSIVE AUTH & RBAC VERIFICATION');
  console.log(' Event: MERNOVA X 2026 - Presidency University');
  console.log('=============================================================');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[TEST BLOCKED] MONGODB_URI not configured.');
    process.exit(1);
  }

  try {
    console.log('[Test 1/12] Connecting to MongoDB Atlas (SmartCampusConnect)...');
    await mongoose.connect(uri);
    console.log('   Connected to cluster host:', mongoose.connection.host);

    const testPort = 5097;
    const server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    const request = async (path, options = {}) => {
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      const data = await res.json();
      return { status: res.status, data };
    };

    // Test 2: Student Registration & Approval Status
    console.log('\n[Test 2/12] Testing Student Registration & Pending Status (POST /api/auth/register)...');
    const testStudentEmail = `test.student.${Date.now()}@presidencyuniversity.in`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Test Automation Student',
        email: testStudentEmail,
        password: 'Password@123',
        role: 'student',
        registrationNumber: `REG${Date.now().toString().slice(-6)}`,
        department: 'Master of Computer Applications',
        phone: '+91 9998887776',
      }),
    });

    if (regRes.status !== 201 || regRes.data.data?.token || !regRes.data.data?.requiresApproval) {
      throw new Error(`Student registration failed to enforce pending approval: ${JSON.stringify(regRes.data)}`);
    }
    const newStudentId = regRes.data.data.user.id;
    console.log('   Student registered successfully! Enforced approvalStatus="Pending" and NO initial JWT.');

    // Verify Pending Student is blocked from logging in
    const blockedLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testStudentEmail,
        password: 'Password@123',
      }),
    });
    if (blockedLogin.status !== 403) {
      throw new Error(`Expected 403 Forbidden for pending student, got ${blockedLogin.status}`);
    }
    console.log('   Security PASS: Pending student blocked from logging in (403 Forbidden).');

    // Admin approves the student
    const preAdminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@presidencyuniversity.in',
        password: 'Admin@123',
      }),
    });
    const preAdminToken = preAdminLogin.data.data.token;
    const approveRes = await request(`/users/${newStudentId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${preAdminToken}` },
    });
    if (approveRes.status !== 200 || approveRes.data.data.user.approvalStatus !== 'Approved') {
      throw new Error(`Admin approval failed: ${JSON.stringify(approveRes.data)}`);
    }
    console.log('   Admin Approval PASS: Student approved successfully.');

    // Newly approved student can now log in
    const approvedLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testStudentEmail,
        password: 'Password@123',
      }),
    });
    if (approvedLogin.status !== 200 || !approvedLogin.data.data?.token) {
      throw new Error(`Approved student login failed: ${JSON.stringify(approvedLogin.data)}`);
    }
    console.log('   Approved Student Login PASS: JWT token acquired successfully.');

    // Test 3: Password Hashing Verification
    console.log('\n[Test 3/12] Verifying Password Hashing in MongoDB Atlas...');
    const dbUser = await User.findOne({ email: testStudentEmail }).select('+password');
    if (!dbUser || dbUser.password === 'Password@123' || !dbUser.password.startsWith('$2')) {
      throw new Error('Security Violation: Password was not hashed with bcrypt in MongoDB!');
    }
    console.log('   Password hashing verified: Bcrypt salt & hash verified in Atlas.');

    // Test 4: Student Login
    console.log('\n[Test 4/12] Testing Student Login (POST /api/auth/login)...');
    const studentLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'rahul.sharma@presidencyuniversity.in',
        password: 'Student@123',
      }),
    });
    if (studentLogin.status !== 200 || !studentLogin.data.data?.token) {
      throw new Error(`Student login failed: ${JSON.stringify(studentLogin.data)}`);
    }
    const studentToken = studentLogin.data.data.token;
    console.log('   Student login successful! Role: student');

    // Test 5: Faculty Login
    console.log('\n[Test 5/12] Testing Faculty Login (POST /api/auth/login)...');
    const facultyLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'faculty.cs@presidencyuniversity.in',
        password: 'Faculty@123',
      }),
    });
    if (facultyLogin.status !== 200 || !facultyLogin.data.data?.token) {
      throw new Error(`Faculty login failed: ${JSON.stringify(facultyLogin.data)}`);
    }
    const facultyToken = facultyLogin.data.data.token;
    console.log('   Faculty login successful! Role: faculty');

    // Test 6: Admin Login
    console.log('\n[Test 6/12] Testing Administrator Login (POST /api/auth/login)...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@presidencyuniversity.in',
        password: 'Admin@123',
      }),
    });
    if (adminLogin.status !== 200 || !adminLogin.data.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    }
    const adminToken = adminLogin.data.data.token;
    console.log('   Admin login successful! Role: admin');

    // Test 7: JWT Validation & Protected Route
    console.log('\n[Test 7/12] Testing JWT Token Validation & Current User (GET /api/auth/me)...');
    const meRes = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (meRes.status !== 200 || meRes.data.data.user.email !== 'rahul.sharma@presidencyuniversity.in') {
      throw new Error(`Failed to validate token on /api/auth/me: ${JSON.stringify(meRes.data)}`);
    }
    console.log('   Token verified. Decoded user:', meRes.data.data.user.fullName);

    // Test 8: Rejection of Missing & Invalid Tokens
    console.log('\n[Test 8/12] Testing Protected Route Without Token...');
    const noTokenRes = await request('/auth/me', { method: 'GET' });
    if (noTokenRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for missing token, got ${noTokenRes.status}`);
    }
    const badTokenRes = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.bogus.token' },
    });
    if (badTokenRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for invalid token, got ${badTokenRes.status}`);
    }
    console.log('   Security PASS: Requests without valid tokens rejected with 401.');

    // Test 9: Incorrect Credentials Rejection
    console.log('\n[Test 9/12] Testing Login with Invalid Password...');
    const badLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@presidencyuniversity.in',
        password: 'WrongPassword!',
      }),
    });
    if (badLogin.status !== 401) {
      throw new Error(`Expected 401 for wrong password, got ${badLogin.status}`);
    }
    console.log('   Security PASS: Invalid login attempts correctly rejected.');

    // Test 10: Role-Based Access Control (RBAC) Denial
    console.log('\n[Test 10/12] Testing RBAC Security: Student Access to Admin Endpoint...');
    const forbiddenRes = await request('/users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (forbiddenRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for student accessing /api/users, got ${forbiddenRes.status}`);
    }
    console.log('   RBAC PASS: Student access to admin endpoint correctly blocked (403 Forbidden).');

    // Test 11: Admin Access to User Management
    console.log('\n[Test 11/12] Testing Admin Access to User Directory (GET /api/users)...');
    const adminUsersRes = await request('/users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminUsersRes.status !== 200 || !adminUsersRes.data.data.users) {
      throw new Error(`Admin failed to fetch users: ${JSON.stringify(adminUsersRes.data)}`);
    }
    console.log(`   Admin Access PASS: Retrieved ${adminUsersRes.data.data.total} registered campus users.`);

    // Test 12: Profile Update
    console.log('\n[Test 12/12] Testing Profile Update (PUT /api/auth/update-profile)...');
    const updateRes = await request('/auth/update-profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ phone: '+91 9123456780' }),
    });
    if (updateRes.status !== 200 || updateRes.data.data.user.phone !== '+91 9123456780') {
      throw new Error(`Profile update failed: ${JSON.stringify(updateRes.data)}`);
    }
    console.log('   Profile update successful! Updated phone number saved.');

    // Clean up temporary test student
    await User.deleteOne({ email: testStudentEmail });

    console.log('\n=============================================================');
    console.log(' ALL 12 AUTHENTICATION & SECURITY TESTS PASSED!');
    console.log(' Target Cluster: SmartCampusConnect (MongoDB Atlas)');
    console.log('=============================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n[AUTH TEST FAILED]:', error.message);
    process.exit(1);
  }
};

testAuthWorkflow();
