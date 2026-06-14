/**
 * analyzeController.js
 *
 * Handles POST /api/analyze
 *
 * Accepts either:
 *   A) multipart/form-data  — resume PDF file + targetRole text field
 *      (multer extracts the buffer, pdf-parse extracts the text)
 *   B) application/json     — { resumeText, targetRole }
 *      (caller already has the extracted text, e.g. from POST /api/upload)
 *
 * Delegates AI analysis to claudeService.
 */

const pdfParse = require('pdf-parse');
const { analyzeWithClaude } = require('../services/claudeService');

const SUPPORTED_ROLES = [
  'Software Developer (SDE)',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist / ML Engineer',
  'Product Manager',
  'DevOps / Cloud Engineer',
  'Blockchain Developer',
  'Cybersecurity Analyst',
  'UI/UX Designer',
];

/**
 * POST /api/analyze
 */
const analyzeResume = async (req, res) => {
  let resumeText = '';
  let targetRole = '';

  // ── A. Multipart upload — extract text from PDF on the fly ─────────────────
  if (req.file) {
    try {
      const parsed = await pdfParse(req.file.buffer);
      resumeText = (parsed.text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    } catch (err) {
      return res.status(422).json({
        success: false,
        message: 'Failed to parse the uploaded PDF.',
        detail: err.message,
      });
    }
    targetRole = (req.body.targetRole || '').trim();
  }
  // ── B. JSON body — caller passes pre-extracted text ────────────────────────
  else if (req.body.resumeText) {
    resumeText = String(req.body.resumeText).trim();
    targetRole = (req.body.targetRole || '').trim();
  }
  // ── C. Nothing usable ──────────────────────────────────────────────────────
  else {
    return res.status(422).json({
      success: false,
      message:
        'Send either a PDF file (field "resume") or a JSON body with "resumeText".',
    });
  }

  // ── Validate inputs ────────────────────────────────────────────────────────
  if (!resumeText || resumeText.length < 50) {
    return res.status(422).json({
      success: false,
      message:
        'Resume text is too short. Make sure the PDF contains selectable (non-scanned) text.',
    });
  }

  if (!targetRole) {
    return res.status(422).json({
      success: false,
      message: 'targetRole is required.',
    });
  }

  if (!SUPPORTED_ROLES.includes(targetRole)) {
    return res.status(422).json({
      success: false,
      message: `Unsupported role "${targetRole}". Supported: ${SUPPORTED_ROLES.join(', ')}`,
    });
  }

  // ── Call Claude ────────────────────────────────────────────────────────────
  const analysis = await analyzeWithClaude(resumeText, targetRole);

  return res.status(200).json({
    success: true,
    data: {
      targetRole,
      wordCount: resumeText.split(/\s+/).filter(Boolean).length,
      ...analysis,
    },
  });
};

module.exports = { analyzeResume };
