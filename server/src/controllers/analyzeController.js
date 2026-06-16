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

const { extractTextFromPDF } = require('../services/pdfExtractor');
const { analyzeWithClaude, validateResumeWithClaude } = require('../services/claudeService');
const { analyzeLocally, detectResumeLocally } = require('../services/localAnalyzer');

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
      const { text: rawText } = await extractTextFromPDF(req.file.buffer);
      resumeText = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    } catch (err) {
      console.error('PDF Parse Error:', err);
      return res.status(422).json({
        success: false,
        message: 'Failed to parse the uploaded PDF. Make sure it contains selectable (non-scanned) text.',
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

  // ── Validate length/text availability ──────────────────────────────────────
  if (!resumeText || resumeText.trim().length < 100) {
    return res.status(422).json({
      success: false,
      message: 'Uploaded PDF contains too little text (under 100 characters). Please ensure your PDF is not empty, corrupted, or a scanned image with no selectable text.',
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

  // ── Run Resume Detection Check ─────────────────────────────────────────────
  let validation;
  try {
    validation = await validateResumeWithClaude(resumeText);
  } catch (err) {
    console.error('Claude Resume Validation Error:', err.message);
    console.log('Falling back to local rule-based resume detection...');
    validation = detectResumeLocally(resumeText);
  }

  if (!validation.is_resume || validation.confidence < 70) {
    return res.status(422).json({
      success: false,
      message: `Uploaded file does not appear to be a resume (Confidence: ${validation.confidence}%). Please upload a valid resume PDF.`,
      validation
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
    validation,
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

  // ── Save to history if email provided (non-blocking) ────────────────────────
  const email = (req.body?.email || '').trim();
  if (email) {
    setImmediate(async () => {
      try {
        const { saveHistory } = require('./historyController');
        let savedOk = false;
        const histReq = {
          body: {
            email,
            target_role: targetRole,
            readiness_score: analysis.readiness_score,
            ats_score: atsScore,
            skills_score: skillsScore,
            project_score: projectScore,
            layout_score: layoutScore,
            strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
            weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
            improvement_roadmap: Array.isArray(analysis.improvement_roadmap) ? analysis.improvement_roadmap : [],
            full_analysis_json: analysis,
          },
        };
        const histRes = {
          status: (code) => ({
            json: (body) => {
              if (code >= 400) {
                console.error('[History] Save failed:', body);
              } else {
                savedOk = true;
                console.log(`[History] Saved for ${email} (persisted=${body.persisted ?? 'unknown'})`);
              }
            },
          }),
        };
        await saveHistory(histReq, histRes);
        if (!savedOk) console.warn('[History] Save returned no response.');
      } catch (err) {
        console.error('[History] Save error:', err.message);
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: responseData,
  });
};

module.exports = { analyzeResume };
