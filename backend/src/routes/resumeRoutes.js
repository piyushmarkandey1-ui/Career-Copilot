const express = require('express');
const router = express.Router();
const { uploadResume, saveResult, getResults, getResult, analyzeResume, healthCheck } = require('../controllers/resumeController');
const upload = require('../middleware/uploadMiddleware');

// Health check route
router.get('/health', healthCheck);

// Resume upload route - accepts PDF file and targetRole
router.post('/upload', upload.single('resume'), uploadResume);

// Save result route - save analysis result to database
router.post('/save-result', saveResult);

// Get results by email
router.get('/results/:email', getResults);

// Get single result by ID
router.get('/result/:id', getResult);

// Resume analysis route (text-only, for testing)
router.post('/analyze', analyzeResume);

module.exports = router;
