/**
 * Resume Controller
 * Handles resume upload and analysis
 */

const { extractPdfText } = require('../services/pdfService');
const { analyzeResumeWithClaude } = require('../services/claudeService');
const { saveAnalysisResult, getResultsByEmail, getResultById, isSupabaseConfigured } = require('../services/supabaseService');
const { isAnthropicConfigured } = require('../config/env');

// Upload and analyze resume with Claude
const uploadResume = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF file.',
      });
    }

    // Get target role from form data
    const { targetRole, email } = req.body;

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Target role is required',
      });
    }

    // Parse PDF from in-memory buffer
    const header = req.file.buffer.slice(0, 5).toString();
    if (header !== '%PDF-') {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is not a valid PDF. Please upload a PDF document.',
      });
    }

    const pdfBuffer = Buffer.from(req.file.buffer);
    const pdfData = await extractPdfText(pdfBuffer);

    // Check if we extracted any text
    if (!pdfData.text || pdfData.text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract meaningful text from PDF. Please ensure your resume has selectable text (not just images).',
      });
    }

    // Analyze with Claude
    console.log(`Analyzing resume for ${targetRole}...`);
    const analysis = await analyzeResumeWithClaude(pdfData.text, targetRole);

    const metadata = {
      numPages: pdfData.numpages,
      textLength: pdfData.text.length,
    };

    // Save to Supabase if email is provided and Supabase is configured
    let savedResult = null;
    if (email && isSupabaseConfigured()) {
      try {
        savedResult = await saveAnalysisResult({
          email,
          targetRole,
          filename: req.file.originalname,
          analysis,
          metadata,
        });
        console.log(`✅ Result saved to database for ${email}`);
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Don't fail the request if DB save fails
      }
    }

    // Return analysis results
    res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: {
        id: savedResult?.id || null,
        filename: req.file.originalname,
        targetRole: targetRole,
        analysis: {
          readiness_score: analysis.readiness_score,
          brutal_gaps: analysis.brutal_gaps,
          fix_it_roadmap: analysis.fix_it_roadmap,
          one_liner: analysis.one_liner,
        },
        metadata,
        saved: savedResult !== null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error processing resume:', error);

    // Check for specific error types
    if (error.message.includes('ANTHROPIC_API_KEY')) {
      return res.status(500).json({
        success: false,
        message: 'API configuration error. Please contact support.',
        error: 'API key not configured',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error processing resume',
      error: error.message,
    });
  }
};

// Save result to database
const saveResult = async (req, res) => {
  try {
    const { email, targetRole, filename, analysis, metadata } = req.body;

    // Validate required fields
    if (!email || !targetRole || !analysis) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, targetRole, and analysis are required',
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is not configured',
      });
    }

    // Save to database
    const savedResult = await saveAnalysisResult({
      email,
      targetRole,
      filename: filename || 'unknown.pdf',
      analysis,
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      message: 'Result saved successfully',
      data: savedResult,
    });
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving result',
      error: error.message,
    });
  }
};

// Get results by email
const getResults = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is not configured',
      });
    }

    const results = await getResultsByEmail(email);

    res.status(200).json({
      success: true,
      message: 'Results retrieved successfully',
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching results',
      error: error.message,
    });
  }
};

// Get single result by ID
const getResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Result ID is required',
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is not configured',
      });
    }

    const result = await getResultById(id);

    res.status(200).json({
      success: true,
      message: 'Result retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching result',
      error: error.message,
    });
  }
};

// Analyze resume endpoint (without file upload, for testing)
const analyzeResume = async (req, res) => {
  try {
    const { resumeText, targetRole } = req.body;

    if (!resumeText || !targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Both resumeText and targetRole are required',
      });
    }

    // Analyze with Claude
    const analysis = await analyzeResumeWithClaude(resumeText, targetRole);
    
    res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: {
        targetRole,
        analysis,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing resume',
      error: error.message,
    });
  }
};

// Health check endpoint
const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Career Copilot API is running',
    services: {
      anthropic: isAnthropicConfigured(),
      supabase: isSupabaseConfigured(),
      mockAnalysis: !isAnthropicConfigured() && process.env.NODE_ENV !== 'production',
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  uploadResume,
  saveResult,
  getResults,
  getResult,
  analyzeResume,
  healthCheck,
};
