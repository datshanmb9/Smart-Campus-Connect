const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const User = require('../models/User');
const Location = require('../models/Location');

const users = [
  {
    fullName: 'Campus Super Administrator',
    email: 'admin@presidencyuniversity.in',
    password: 'Admin@123',
    role: 'admin',
    employeeId: 'PU-ADM-001',
    department: 'Campus Administration & IT Infrastructure',
    phone: '+91 9876543210',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    fullName: 'Dr. Aris Thorne',
    email: 'faculty.cs@presidencyuniversity.in',
    password: 'Faculty@123',
    role: 'faculty',
    employeeId: 'PU-FAC-104',
    department: 'School of Computer Science & Engineering',
    phone: '+91 9876543211',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@presidencyuniversity.in',
    password: 'Student@123',
    role: 'student',
    registrationNumber: '2024MCA001',
    department: 'Master of Computer Applications',
    phone: '+91 9876543212',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    fullName: 'Priya Patel',
    email: 'priya.patel@presidencyuniversity.in',
    password: 'Student@123',
    role: 'student',
    registrationNumber: '2024MCA002',
    department: 'Master of Computer Applications',
    phone: '+91 9876543213',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
  },
];

const locations = [
  {
    qrCode: 'PU-ENGG-LH204',
    buildingName: 'Academic Block 1',
    block: 'Engineering Wing',
    floor: '2nd Floor',
    roomNumber: 'LH-204',
    roomType: 'Classroom',
    description: 'Smart Lecture Hall equipped with ceiling projector, audio PA, and central AC',
    facilities: ['Epson Overhead Projector', 'Central Air Conditioning', 'PA Mic System', 'Smart Podium'],
  },
  {
    qrCode: 'PU-CS-LAB01',
    buildingName: 'Academic Block 2',
    block: 'Computer Science Wing',
    floor: '1st Floor',
    roomNumber: 'LAB-102',
    roomType: 'Computer Lab',
    description: 'Advanced Cloud Computing & AI Lab with 60 Dell OptiPlex workstations',
    facilities: ['60x Dell Workstations', 'High-Speed LAN / Wi-Fi', 'Interactive Display', 'UPS Backup'],
  },
  {
    qrCode: 'PU-SEMINAR-HALL1',
    buildingName: 'Management Block',
    block: 'Central Wing',
    floor: 'Ground Floor',
    roomNumber: 'SH-01',
    roomType: 'Seminar Hall',
    description: '150-seater multimedia seminar hall for guest lectures and symposiums',
    facilities: ['Motorized Screen', 'Dual Projectors', 'Surround Sound', 'Video Conferencing Suite'],
  },
  {
    qrCode: 'PU-LIB-REF01',
    buildingName: 'Central Library',
    block: 'West Wing',
    floor: '2nd Floor',
    roomNumber: 'LIB-REF-2',
    roomType: 'Library',
    description: 'Quiet Study and Digital Research Reference Zone',
    facilities: ['Wi-Fi Access Points', 'Silent Zone', '10x OPAC Terminals', 'Power Sockets'],
  },
];

const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<YOUR_ATLAS_USERNAME>') || uri.includes('<username>')) {
    console.error('\n[Database Error] Please set your actual MONGODB_URI in server/.env before seeding.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB Atlas: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

const importData = async () => {
  try {
    await connectDatabase();

    // Clean existing seed users and locations
    console.log('Clearing existing users and sample locations...');
    await User.deleteMany({
      email: {
        $in: [
          'admin@presidencyuniversity.in',
          'faculty.cs@presidencyuniversity.in',
          'rahul.sharma@presidencyuniversity.in',
          'priya.patel@presidencyuniversity.in',
        ],
      },
    });

    await Location.deleteMany({
      qrCode: {
        $in: ['PU-ENGG-LH204', 'PU-CS-LAB01', 'PU-SEMINAR-HALL1', 'PU-LIB-REF01'],
      },
    });

    // Create users individually to trigger bcrypt pre-save password hashing hook
    console.log('Seeding demo users (Admin, Faculty, Students)...');
    for (const user of users) {
      await User.create(user);
    }

    console.log('Seeding campus locations & QR identifiers...');
    await Location.insertMany(locations);

    console.log('\n=============================================================');
    console.log(' DEMO DATA SEEDED SUCCESSFULLY TO MONGODB ATLAS!');
    console.log('=============================================================');
    console.log(' Administrator:');
    console.log('   Email:    admin@presidencyuniversity.in');
    console.log('   Password: Admin@123');
    console.log('   Role:     admin');
    console.log('-------------------------------------------------------------');
    console.log(' Faculty:');
    console.log('   Email:    faculty.cs@presidencyuniversity.in');
    console.log('   Password: Faculty@123');
    console.log('   Role:     faculty');
    console.log('-------------------------------------------------------------');
    console.log(' Students:');
    console.log('   1. rahul.sharma@presidencyuniversity.in (Reg: 2024MCA001)');
    console.log('      Password: Student@123');
    console.log('   2. priya.patel@presidencyuniversity.in (Reg: 2024MCA002)');
    console.log('      Password: Student@123');
    console.log('=============================================================');
    console.log(' Sample Campus QR Codes Seeded:');
    console.log('   1. PU-ENGG-LH204   (Engineering Wing, LH-204)');
    console.log('   2. PU-CS-LAB01     (CS Wing, LAB-102)');
    console.log('   3. PU-SEMINAR-HALL1(Management Block, SH-01)');
    console.log('   4. PU-LIB-REF01    (Central Library, 2nd Floor)');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seeding Error] ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDatabase();
    console.log('Destroying seeded test data...');
    await User.deleteMany({
      email: {
        $in: [
          'admin@presidencyuniversity.in',
          'faculty.cs@presidencyuniversity.in',
          'rahul.sharma@presidencyuniversity.in',
          'priya.patel@presidencyuniversity.in',
        ],
      },
    });
    await Location.deleteMany({
      qrCode: {
        $in: ['PU-ENGG-LH204', 'PU-CS-LAB01', 'PU-SEMINAR-HALL1', 'PU-LIB-REF01'],
      },
    });
    console.log('Seeded test data destroyed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`[Destroy Error] ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '--destroy') {
  destroyData();
} else {
  importData();
}

