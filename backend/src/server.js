/**
 * Server Entry Point (Bootstrap file)
 * 
 * Concepts Demonstrated:
 * 1. Express Middleware Pipeline order (Config -> Parsers -> Routes -> Centralized Error Handler).
 * 2. Process Lifecycle Handling: Listening to port & establishing DB connections before serving requests.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const holdRoutes = require('./routes/holdRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const initExpireHoldsJob = require('./jobs/expireHoldsJob');
const errorHandler = require('./middleware/errorHandler');

const setupSwagger = require('./config/swagger');

// Initialize Express Application
const app = express();

// 1. Establish Database Connection & Initialize Cron Workers
connectDB();
initExpireHoldsJob();

// 2. Global Middleware
app.use(cors()); // Enable CORS for frontend applications
app.use(express.json()); // Parse incoming requests with JSON payloads

// 3. Mount Swagger Interactive API Documentation UI
setupSwagger(app);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'EventBook API Engine',
  });
});

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings/hold', holdRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', paymentRoutes);
app.use('/api/bookings', ticketRoutes);

// 5. Global Centralized Error Handling Middleware (MUST be registered last)
app.use(errorHandler);


// 6. Start HTTP Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server] EventBook Engine running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
