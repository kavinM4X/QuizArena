require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const quizRoutes = require('./routes/quizRoutes');
const socketHandler = require('./socket/socketHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(morgan('dev'));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5174',
  process.env.ADMIN_URL  || 'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/api/quiz', quizRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ─── HTTP + Socket.IO ─────────────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io available in controllers via req.app.get('io')
app.set('io', io);

socketHandler(io);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} is already in use.`);
    console.error(`   Free it in PowerShell:\n`);
    console.error(`   netstat -ano | findstr :${PORT}`);
    console.error(`   taskkill /PID <PID> /F\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

httpServer.listen({ port: PORT, host: '0.0.0.0', reuseAddress: true }, () => {
  console.log(`🚀 QuizArena server running on http://localhost:${PORT}`);
});

