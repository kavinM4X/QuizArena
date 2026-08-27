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

// Trust proxy for hosted platforms (Render, Railway, Heroku)
app.set('trust proxy', 1);

// ─── Bulletproof CORS ─────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Reflect request origin to allow all origins with credentials
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan('dev'));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

// Rate limiter (skip preflight OPTIONS)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  return generalLimiter(req, res, next);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/api/quiz', quizRoutes);

// Root endpoint
app.get('/', (req, res) => res.json({
  message: '🚀 QuizArena API Server is running!',
  health: '/api/health',
}));

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
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
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
