const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from .env
dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().then((connected) => {
  if (!connected) {
    console.log('[Notice] Server running with database disconnected.');
    console.log('[Notice] Add your current IP (or 0.0.0.0/0) to Atlas Network Access.');
    console.log('[Notice] Background auto-reconnect timer active (retrying every 15s)...\n');

    const reconnectTimer = setInterval(async () => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(reconnectTimer);
        return;
      }
      const ok = await connectDB();
      if (ok) {
        console.log('[Auto-Reconnect] Database successfully connected in background!\n');
        clearInterval(reconnectTimer);
      }
    }, 15000);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================================`);
    console.log(` SMART CAMPUS CONNECT SERVER RUNNING`);
    console.log(` Event: MERNOVA X 2026 - Presidency University`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Port: ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=============================================================\n`);
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    // Keep server running in development or close gracefully
  });
});

