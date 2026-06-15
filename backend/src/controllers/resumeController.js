const pdfParse = require('pdf-parse');
const { analyzeResumeWithGemini } = require('../services/geminiService');
const { saveAnalysisResult, getResultsByEmail, getResultById, isSupabaseConfigured } = require('../services/supabaseService');

// Upload and analyze resume
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please upload a PDF file.' });
    }

    const { targetRole, email } = req.body;

    if (!targetRole) {
      return res.status(400).json({ success: false, message: 'Target role is required' });
    }

    // Parse PDF from memory buffer (no disk I/O needed)
    const pdfData = await pdfParse(req.file.buffer);

    if (!pdfData.text || pdfData.text.trim().length < 50) {
      return res.status(400).json({ success: false, message: 'Could not extract text from PDF. Make sure the PDF has selectable text.' });
    }

    // Analyze with Gemini
    console.log(`Analyzing resume for: ${targetRole}`);
    const analysis = await analyzeResumeWithGemini(pdfData.text, targetRole);

    const metadata = { numPages: pdfData.numpages, textLength: pdfData.text.length };

    // Save to Supabase if email provided
    let savedResult = null;
    if (email && isSupabaseConfigured()) {
      try {
        savedResult = await saveAnalysisResult({ email, targetRole, filename: req.file.originalname, analysis, metadata });
      } catch (dbError) {
        console.error('DB save error:', dbError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: {
        id: savedResult?.id || null,
        filename: req.file.originalname,
        targetRole,
        analysis,
        metadata,
        saved: !!savedResult,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ success: false, message: 'Error processing resume', error: error.message });
  }
};

// Save result to database
const saveResult = async (req, res) => {
  try {
    const { email, targetRole, filename, analysis, metadata } = req.body;
    if (!email || !targetRole || !analysis) {
      return res.status(400).json({ success: false, message: 'email, targetRole, and analysis are required' });
    }
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }
    const saved = await saveAnalysisResult({ email, targetRole, filename: filename || 'resume.pdf', analysis, metadata: metadata || {} });
    res.status(201).json({ success: true, message: 'Saved successfully', data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving result', error: error.message });
  }
};

// Get results by email
const getResults = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) return res.status(503).json({ success: false, message: 'Database not configured' });
    const results = await getResultsByEmail(req.params.email);
    res.status(200).json({ success: true, data: results, count: results.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching results', error: error.message });
  }
};

// Get single result by ID
const getResult = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) return res.status(503).json({ success: false, message: 'Database not configured' });
    const result = await getResultById(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching result', error: error.message });
  }
};

// Text-only analysis (for testing)
const analyzeResume = async (req, res) => {
  try {
    const { resumeText, targetRole } = req.body;
    if (!resumeText || !targetRole) {
      return res.status(400).json({ success: false, message: 'resumeText and targetRole are required' });
    }
    const analysis = await analyzeResumeWithGemini(resumeText, targetRole);
    res.status(200).json({ success: true, data: { targetRole, analysis, timestamp: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error analyzing resume', error: error.message });
  }
};

// Health check
const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Career Copilot API is running',
    services: {
      gemini: !!(process.env.GEMINI_API_KEY),
      supabase: isSupabaseConfigured(),
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = { uploadResume, saveResult, getResults, getResult, analyzeResume, healthCheck };
