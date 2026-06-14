const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const resumeController = require('../controllers/resumeController');

/**
 * POST /api/resume/analyze
 * Body  : multipart/form-data
 *   - resume   : PDF file (required)
 *   - targetRole : string (required)
 */
router.post('/analyze', upload.single('resume'), resumeController.analyzeResume);

/**
 * GET /api/resume/roles
 * Returns the list of supported target roles.
 */
router.get('/roles', resumeController.getRoles);

module.exports = router;
