const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<YOUR_ATLAS_USERNAME>') || uri.includes('<username>')) {
    console.error('\n=============================================================');
    console.error(' [DATABASE CONFIGURATION REQUIRED]');
    console.error(' MongoDB Atlas connection string is not configured.');
    console.error(' Open server/.env and replace MONGODB_URI with your Atlas URI:');
    console.error(' Target Cluster Database: SmartCampusConnect');
    console.error(' Example: mongodb+srv://user:pass@cluster.mongodb.net/SmartCampusConnect?retryWrites=true&w=majority');
    console.error('=============================================================\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log('\n=============================================================');
    console.log(` MongoDB Atlas Connected Successfully!`);
    console.log(` Host: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
    console.log('=============================================================\n');
    return true;
  } catch (error) {
    console.error('\n=============================================================');
    console.error(' [MONGODB ATLAS CONNECTION FAILED]');
    console.error(` Error Message: ${error.message}`);
    console.error(' Troubleshooting Checklist:');
    console.error(' 1. Verify username and password in server/.env');
    console.error(' 2. Verify IP Whitelist on Atlas (Add 0.0.0.0/0 for development)');
    console.error(' 3. Ensure database name "SmartCampusConnect" is specified in URI');
    console.error('=============================================================\n');
    return false;
  }
};

module.exports = connectDB;

