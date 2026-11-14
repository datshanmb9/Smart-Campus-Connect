require('dotenv').config();
const connectDB = require('../src/config/db');
const mongoose = require('mongoose');

async function migrate() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB Atlas');
    process.exit(1);
  }

  const users = mongoose.connection.db.collection('users');

  // Rahul Sharma -> 1st Year, Section A
  await users.updateOne(
    { email: 'rahul.sharma@presidencyuniversity.in' },
    { $set: { academicYear: '1st Year', section: 'A' } }
  );

  // Priya Patel -> 1st Year, Section B
  await users.updateOne(
    { email: 'priya.patel@presidencyuniversity.in' },
    { $set: { academicYear: '1st Year', section: 'B' } }
  );

  // Set default for any students missing academicYear or section
  const updateOthers = await users.updateMany(
    { role: 'student', $or: [{ academicYear: { $exists: false } }, { section: { $exists: false } }] },
    { $set: { academicYear: '1st Year', section: 'A' } }
  );
  console.log('Updated students missing section/year:', updateOthers.modifiedCount);

  const studentList = await users.find({ role: 'student' }, { projection: { fullName: 1, email: 1, academicYear: 1, section: 1 } }).toArray();
  console.log('Current Students:');
  console.table(studentList.map(s => ({ name: s.fullName, email: s.email, year: s.academicYear, section: s.section })));

  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});

