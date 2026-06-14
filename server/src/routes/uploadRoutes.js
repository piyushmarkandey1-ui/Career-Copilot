/**
 * uploadRoutes.js
 *
 * Mounts under /api/upload (registered in app.js)
 */

const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { uploadAndExtract } = require('../controllers/uploadController');

/**
 * POST /api/upload
 *
 * Accepts a single PDF file in the "resume" field.
 * Returns extracted text + metadata as JSON.
 *
 * multipart/form-data fields:
 *   resume  — PDF file (required, max 10 MB)
 *
 * Success 200:
 * {
 *   success: true,
 *   data: { file, text, wordCount, preview }
 * }
 *
 * Error 422 — wrong file type or corrupted PDF
 */
router.post('/', upload.single('resume'), uploadAndExtract);

module.exports = router;
