// Polyfill DOM objects for pdf-parse to run in serverless environments
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {};
}
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {};
}

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

app.use(
  cors({
    origin: true, // true mirrors the requesting origin, allowing dynamic Vercel URLs
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Core Middleware ──────────────────────────────────────────────────────────
// Only parse JSON/urlencoded bodies for non-multipart requests.
// For multipart/form-data (file uploads), multer handles body parsing — if
// express.json() runs first it consumes the stream and multer gets nothing.
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
    return next(); // skip — multer will handle it
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

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
