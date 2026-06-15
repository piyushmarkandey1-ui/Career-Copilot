/**
 * historyRoutes.js
 *
 * Mounts under /api/history (registered in app.js)
 *
 * POST /api/history        — save a new analysis record
 * GET  /api/history?email= — fetch all records for an email
 */

const express = require('express');
const router = express.Router();
const { saveHistory, getHistory, clearHistory } = require('../controllers/historyController');

router.post('/', saveHistory);
router.get('/', getHistory);
router.delete('/', clearHistory);

module.exports = router;
