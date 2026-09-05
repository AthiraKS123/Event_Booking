/**
 * MongoDB Database Connection Configuration
 * 
 * Concept: Mongoose Connection Lifecycle & Async Management
 * Mongoose manages a default connection pool. `mongoose.connect()` returns a promise.
 * Handling connection errors gracefully prevents unhandled rejection crashes during startup.
 */

const mongoose = require('mongoose');
const dns = require('dns');

// Set public DNS servers (Google/Cloudflare) to resolve Windows SRV lookup blocks
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    // Exit process with failure (1) if database connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
