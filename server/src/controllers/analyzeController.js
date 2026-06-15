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

const { PDFParse } = require('pdf-parse');
const { analyzeWithClaude } = require('../services/claudeService');
const { analyzeLocally } = require('../services/localAnalyzer');

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
      const parser = new PDFParse({ data: req.file.buffer });
      await parser.load();
      // getText() returns { pages: [...], text: string, total: number }
      const result = await parser.getText();
      const rawText = (result && result.text) ? result.text : '';
      resumeText = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    } catch (err) {
      console.error('PDF Parse Error:', err);
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
  let analysis;
  try {
    analysis = await analyzeWithClaude(resumeText, targetRole);
  } catch (err) {
    console.error('Claude API Error:', err.message);
    console.log('Falling back to local rule-based analysis...');
    analysis = analyzeLocally(resumeText, targetRole);
  }

  const responseData = {
    targetRole,
    wordCount: resumeText.split(/\s+/).filter(Boolean).length,
    ...analysis,
  };

  // ── Derive sub-scores from analysis text ───────────────────────────────────
  // These are approximations based on what the analyzer detected.
  // When Claude responds they may be present in full_analysis_json already.
  const textLower = resumeText.toLowerCase();

  const atsScore = Math.min(100, Math.max(0, Math.round(
    (analysis.readiness_score || 50) +
    (/github|linkedin/.test(textLower) ? 5 : -5) +
    (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(textLower) ? 2 : -2) +
    (Math.random() * 4 - 2) // small variance per upload
  )));

  const skillsScore = Math.min(100, Math.max(0, Math.round(
    analysis.skills_feedback && analysis.skills_feedback.includes('strong')
      ? (analysis.readiness_score || 50) + 8
      : (analysis.readiness_score || 50) - 5
  )));

  const projectScore = Math.min(100, Math.max(0, Math.round(
    /github\.com\//i.test(resumeText)
      ? (analysis.readiness_score || 50) + 6
      : /project/i.test(resumeText)
        ? (analysis.readiness_score || 50) - 3
        : (analysis.readiness_score || 50) - 12
  )));

  const layoutScore = Math.min(100, Math.max(0, Math.round(
    (() => {
      const bulletCount = (resumeText.match(/^[-•*▪➤]/gm) || []).length;
      const sectionCount = ['experience','education','skills','projects','summary','certifications'].filter(s => textLower.includes(s)).length;
      return 40 + (sectionCount * 6) + Math.min(20, bulletCount * 2);
    })()
  )));

  // ── Fire-and-forget: save to history if email provided ────────────────────
  const email = (req.body?.email || '').trim();
  if (email) {
    try {
      const { saveHistory } = require('./historyController');
      const fakeRes = { status: () => ({ json: () => {} }) };
      const fakeReq = {
        body: {
          email,
          target_role: targetRole,
          readiness_score: analysis.readiness_score,
          ats_score: atsScore,
          skills_score: skillsScore,
          project_score: projectScore,
          layout_score: layoutScore,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          improvement_roadmap: analysis.improvement_roadmap ?? [],
          full_analysis_json: analysis,
        },
      };
      saveHistory(fakeReq, fakeRes).catch(() => {});
    } catch (_) { /* silent */ }
  }

  return res.status(200).json({
    success: true,
    data: responseData,
  });
};

module.exports = { analyzeResume };
