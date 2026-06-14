const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Lightweight liveness probe used by deployment platforms and the frontend.
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
