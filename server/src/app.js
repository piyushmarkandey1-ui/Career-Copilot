const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('express-async-errors');

const errorHandler = require('./middleware/errorHandler');
const resumeRoutes = require('./routes/resumeRoutes');
const healthRoutes = require('./routes/healthRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');
const resultRoutes = require('./routes/resultRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/save-result', resultRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/resume', resumeRoutes);

// ─── 404 catch-all ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
