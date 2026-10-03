/**
 * SmartMedia AI Backend Server
 *
 * Intelligent Media Management Platform
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getDBStatus } = require('./config/database');
const { configureCloudinary } = require('./config/cloudinary');
const cloudinaryService = require('./services/cloudinaryService');
const mediaRoutes = require('./routes/mediaRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure Cloudinary SDK instance
configureCloudinary();


// CORS Middleware - supports both localhost and 127.0.0.1 local development hosts
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SmartMedia AI Backend',
    database: getDBStatus() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Media Routes
app.use('/api/media', mediaRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server: Enforce startup sequence (connect DB before accepting requests)
const startServer = async () => {
  await connectDB();

  // Initialize Cloudinary structured metadata fields (Phase 7)
  try {
    await cloudinaryService.ensureMetadataFields();
  } catch (metaErr) {
    console.warn('[SmartMedia AI] Non-fatal metadata initialization warning:', metaErr.message);
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`[SmartMedia AI] Backend server running on port ${PORT}`);
    });
  }
};

startServer();

module.exports = app;
