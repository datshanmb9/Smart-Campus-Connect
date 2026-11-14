require('dotenv').config();
const connectDB = require('../src/config/db');
const mongoose = require('mongoose');

async function runMigration() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  const usersColl = mongoose.connection.db.collection('users');
  const locColl = mongoose.connection.db.collection('locations');

  // 1. Update existing users with approvalStatus 'Approved' if not set
  const userResult = await usersColl.updateMany(
    { approvalStatus: { $exists: false } },
    { $set: { approvalStatus: 'Approved' } }
  );
  console.log(`Updated existing users to Approved: ${userResult.modifiedCount}`);

  // 2. Ensure locations have approvalAuthority
  const locResult = await locColl.updateMany(
    { approvalAuthority: { $exists: false } },
    { $set: { approvalAuthority: 'admin', assignedFaculty: null } }
  );
  console.log(`Updated locations with default approvalAuthority: ${locResult.modifiedCount}`);

  // Set one location (e.g. Seminar Hall or Computer Lab) to faculty approval authority
  const facultyUser = await usersColl.findOne({ role: 'faculty' });
  if (facultyUser) {
    const semHall = await locColl.findOneAndUpdate(
      { roomType: 'Seminar Hall' },
      { $set: { approvalAuthority: 'faculty', assignedFaculty: facultyUser._id } },
      { returnDocument: 'after' }
    );
    if (semHall) {
      console.log(`Set Seminar Hall (${semHall.roomNumber || semHall.buildingName}) approval authority to faculty: ${facultyUser.fullName}`);
    }
  }

  const allUsers = await usersColl.find({}, { projection: { fullName: 1, email: 1, role: 1, approvalStatus: 1 } }).toArray();
  console.log('Current users and approval statuses:');
  console.table(allUsers.map(u => ({ id: u._id.toString(), name: u.fullName, email: u.email, role: u.role, status: u.approvalStatus })));

  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});

