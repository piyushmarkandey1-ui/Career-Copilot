/**
 * analyzeRoutes.js
 *
 * Mounts under /api/analyze (registered in app.js)
 *
 * Two ways to call POST /api/analyze:
 *
 * ① Upload PDF directly (multipart/form-data):
 *      Field "resume"     — PDF file
 *      Field "targetRole" — role string
 *
 * ② Send pre-extracted text (application/json):
 *      { "resumeText": "...", "targetRole": "Frontend Developer" }
 */

const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { analyzeResume } = require('../controllers/analyzeController');

// multer.single is called with optional chaining:
// if Content-Type is not multipart, multer just calls next() without setting req.file
router.post('/', upload.single('resume'), analyzeResume);

module.exports = router;
