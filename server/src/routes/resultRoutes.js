/**
 * resultRoutes.js
 *
 * Mounts under /api/save-result (registered in app.js)
 *
 * POST /api/save-result   — persist a result row to Supabase
 * GET  /api/save-result   — retrieve saved results (supports ?email=&limit=&offset=)
 */

const express = require('express');
const router  = express.Router();
const { saveResult, getResults } = require('../controllers/resultController');

router.post('/', saveResult);
router.get('/',  getResults);

module.exports = router;
