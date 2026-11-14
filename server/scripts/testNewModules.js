const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...(options.headers || {}),
  };
  if (!options.isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const config = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    config.body = options.isMultipart ? options.body : JSON.stringify(options.body);
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
  console.log('================================================================');
  console.log(' TESTING NEW MODULES: SECTION BOOKING LIMIT & PHOTO MANAGEMENT');
  console.log('================================================================\n');

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

  // 1. Admin login
  await test('Admin login (admin@presidencyuniversity.in)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@presidencyuniversity.in', password: 'Admin@123' },
    });
    if (!res.ok) throw new Error(res.data.message);
    adminToken = res.data.data.token;
  });

  // 2. Setup 2 students in dynamic isolated test section
  const suffix = Date.now().toString().slice(-4);
  const testYear = '4th Year';
  const testSecA = 'A' + suffix.slice(-2);
  const testSecB = 'B' + suffix.slice(-2);

  const emailA1 = `student.secA1.${suffix}@presidencyuniversity.in`;
  const emailA2 = `student.secA2.${suffix}@presidencyuniversity.in`;
  const emailB1 = `student.secB1.${suffix}@presidencyuniversity.in`;

  let tokenA1 = '';
  let tokenA2 = '';
  let tokenB1 = '';

  await test(`Register and approve Student A1 (${testYear}, Section ${testSecA})`, async () => {
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        fullName: `Section A1 Student ${suffix}`,
        email: emailA1,
        password: 'Password@123',
        registrationNumber: `A1${suffix}`,
        department: 'Master of Computer Applications',
        academicYear: testYear,
        section: testSecA,
      },
    });
    const id = regRes.data.data.user.id;
    await request(`/users/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: emailA1, password: 'Password@123' },
    });
    if (!loginRes.ok) throw new Error('Login failed');
    tokenA1 = loginRes.data.data.token;
    if (loginRes.data.data.user.section !== testSecA || loginRes.data.data.user.academicYear !== testYear) {
      throw new Error(`Profile missing academicYear or section: ${JSON.stringify(loginRes.data.data.user)}`);
    }
  });

  await test(`Register and approve Student A2 (${testYear}, Section ${testSecA})`, async () => {
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        fullName: `Section A2 Student ${suffix}`,
        email: emailA2,
        password: 'Password@123',
        registrationNumber: `A2${suffix}`,
        department: 'Master of Computer Applications',
        academicYear: testYear,
        section: testSecA,
      },
    });
    const id = regRes.data.data.user.id;
    await request(`/users/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: emailA2, password: 'Password@123' },
    });
    tokenA2 = loginRes.data.data.token;
  });

  await test(`Register and approve Student B1 (${testYear}, Section ${testSecB})`, async () => {
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        fullName: `Section B1 Student ${suffix}`,
        email: emailB1,
        password: 'Password@123',
        registrationNumber: `B1${suffix}`,
        department: 'Master of Computer Applications',
        academicYear: testYear,
        section: testSecB,
      },
    });
    const id = regRes.data.data.user.id;
    await request(`/users/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: emailB1, password: 'Password@123' },
    });
    tokenB1 = loginRes.data.data.token;
  });

  // Get locations
  const locRes = await request('/locations', {
    headers: { Authorization: `Bearer ${tokenA1}` },
  });
  const loc1 = locRes.data.data.locations[0];
  const loc2 = locRes.data.data.locations[1] || locRes.data.data.locations[0];

  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 18);
  const dateStr = bookingDate.toISOString().split('T')[0];

  let bookingA1Id = '';

  // 3. Section A: Submit Booking 1
  await test('Section A: Student A1 submits active booking 1 (Succeeds)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA1}` },
      body: {
        locationId: loc1._id,
        purpose: 'MCA 2nd Year Section A Session 1',
        bookingDate: dateStr,
        startTime: '09:00',
        endTime: '10:00',
      },
    });
    if (!res.ok) throw new Error(res.data.message);
    bookingA1Id = res.data.data.booking._id;
  });

  // 4. Section A: Submit Booking 2
  await test('Section A: Student A2 submits active booking 2 (Succeeds)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA2}` },
      body: {
        locationId: loc2._id,
        purpose: 'MCA 2nd Year Section A Session 2',
        bookingDate: dateStr,
        startTime: '11:00',
        endTime: '12:00',
      },
    });
    if (!res.ok) throw new Error(res.data.message);
  });

  // 5. Section A: Attempt Booking 3 (Must fail with exact message)
  await test('Section A: 3rd active booking request is blocked by Section Limit (400)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA1}` },
      body: {
        locationId: loc1._id,
        purpose: 'MCA 2nd Year Section A Session 3 (Exceeds limit)',
        bookingDate: dateStr,
        startTime: '14:00',
        endTime: '15:00',
      },
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const expectedMsg = 'Your section has reached its maximum of 2 active room booking requests. Please try again later.';
    if (res.data.message !== expectedMsg) {
      throw new Error(`Expected "${expectedMsg}", got "${res.data.message}"`);
    }
  });

  // 6. Section B: Can submit booking independently (Proves section isolation)
  await test('Section B: Student B1 can submit a booking (Section isolation verified)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB1}` },
      body: {
        locationId: loc1._id,
        purpose: 'MCA 2nd Year Section B Session 1',
        bookingDate: dateStr,
        startTime: '15:00',
        endTime: '16:00',
      },
    });
    if (!res.ok) throw new Error(`Section B booking was blocked: ${res.data.message}`);
  });

  // 7. Student A1 cancels Booking 1 -> Frees up slot in Section A
  await test('Section A: Student A1 cancels booking 1 -> frees up section quota', async () => {
    const res = await request(`/bookings/${bookingA1Id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA1}` },
    });
    if (!res.ok) throw new Error(res.data.message);
  });

  // 8. Now Section A can submit a booking again!
  await test('Section A: A new booking can now be submitted after cancellation (Slot freed)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA1}` },
      body: {
        locationId: loc1._id,
        purpose: 'MCA 2nd Year Section A Replaced Booking',
        bookingDate: dateStr,
        startTime: '16:00',
        endTime: '17:00',
      },
    });
    if (!res.ok) throw new Error(`Booking should have succeeded after cancellation: ${res.data.message}`);
  });

  // 9. Admin views section booking summary
  await test('Admin retrieves booking counts grouped by academic year and section', async () => {
    const res = await request('/bookings/section-summary', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(res.data.message);
    const sections = res.data.data.sections;
    if (!Array.isArray(sections) || sections.length === 0) {
      throw new Error('Sections summary empty');
    }
    const secA = sections.find((s) => s.academicYear === testYear && s.section === testSecA);
    if (!secA) throw new Error(`Section ${testYear} - Section ${testSecA} not found in summary`);
    if (secA.activeCount !== 2) throw new Error(`Expected activeCount 2, got ${secA.activeCount}`);
    if (!secA.isAtLimit) throw new Error('Expected isAtLimit to be true for Section A');
  });

  // 10. Profile photo upload via FormData
  await test('Profile Photo: Upload new avatar via multipart API', async () => {
    const fs = require('fs');
    const path = require('path');
    // Create a dummy test image buffer
    const testImgPath = path.join(__dirname, 'test_avatar.png');
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImgPath, pngBuffer);

    const formData = new FormData();
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('avatar', blob, 'test_avatar.png');

    const res = await request('/auth/upload-avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA1}` },
      body: formData,
      isMultipart: true,
    });

    if (fs.existsSync(testImgPath)) fs.unlinkSync(testImgPath);

    if (!res.ok) throw new Error(res.data.message);
    if (!res.data.data?.avatarUrl || !res.data.data.avatarUrl.includes('/uploads/')) {
      throw new Error(`Unexpected avatarUrl: ${res.data.data?.avatarUrl}`);
    }
  });

  // 11. Profile photo remove
  await test('Profile Photo: Remove avatar and revert to default', async () => {
    const res = await request('/auth/remove-avatar', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA1}` },
    });
    if (!res.ok) throw new Error(res.data.message);
    if (res.data.data?.user?.avatarUrl !== '') {
      throw new Error(`Expected empty avatarUrl, got ${res.data.data?.user?.avatarUrl}`);
    }
  });

  // 12. Clean Student Profile Interface: verify GET /auth/me returns required fields
  await test('Clean Profile: GET /auth/me returns clean profile with year, section & status', async () => {
    const res = await request('/auth/me', {
      headers: { Authorization: `Bearer ${tokenA1}` },
    });
    if (!res.ok) throw new Error(res.data.message);
    const u = res.data.data.user;
    if (!u.fullName || !u.email || !u.registrationNumber || !u.department || !u.academicYear || !u.section || !u.approvalStatus) {
      throw new Error(`Missing required clean profile fields: ${JSON.stringify(u)}`);
    }
  });

  console.log('\n================================================================');
  console.log(` TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

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
