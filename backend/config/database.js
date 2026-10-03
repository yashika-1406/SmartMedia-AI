/**
 * Database Connection Module
 *
 * Configures and manages connection to MongoDB Atlas via Mongoose.
 */

const dns = require('dns');
const mongoose = require('mongoose');

// Disable query buffering so disconnected queries fail fast rather than hanging
mongoose.set('bufferCommands', false);

let isConnected = false;

/**
 * Configure DNS fallback for SRV resolution.
 * On Windows systems where the local DNS stub resolver is loopback (127.0.0.1)
 * or refuses SRV queries, switch to public DNS resolvers (8.8.8.8, 1.1.1.1).
 */
const configureDns = () => {
  try {
    const currentServers = dns.getServers();
    if (!currentServers || currentServers.length === 0 || currentServers.includes('127.0.0.1')) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
  } catch (err) {
    // Non-fatal, proceed with existing resolver
  }
};

const sanitizeError = (message) => {
  if (!message) return '';
  return message.replace(/:\/\/[^:]+:[^@]+@/, '://user:****@');
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[Database Error] MONGODB_URI is not set in backend/.env');
    isConnected = false;
    return false;
  }

  configureDns();
  console.log('[Database] Connecting to MongoDB...');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return true;
  } catch (error) {
    let finalError = error;

    // If SRV lookup failed on initial DNS, try explicitly setting public DNS and retry once
    if (error.message && (error.message.includes('querySrv ECONNREFUSED') || error.message.includes('querySrv ENOTFOUND'))) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log(`[Database] MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
        return true;
      } catch (retryError) {
        finalError = retryError;
      }
    }

    isConnected = false;
    if (finalError.name === 'MongoServerError' && finalError.code === 8000) {
      console.error('[Database Error] Authentication failed: Invalid username or password in MONGODB_URI. Please verify Atlas Database Access user credentials.');
    } else {
      console.error(`[Database Error] MongoDB connection failed: ${sanitizeError(finalError.message)}`);
    }
    return false;
  }
};

const getDBStatus = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  getDBStatus,
};
