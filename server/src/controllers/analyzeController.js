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
 * Delegates AI analysis to geminiService.
 */

const { extractTextFromPDF } = require('../services/pdfExtractor');
const { analyzeWithGemini, validateResumeWithGemini } = require('../services/geminiService');
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
  const words = resumeText ? resumeText.split(/\s+/).filter(Boolean).length : 0;
  if (!resumeText || words < 150) {
    return res.status(422).json({
      success: false,
      message: 'Resume text is too limited to analyze. Please upload a complete resume.',
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
    validation = await validateResumeWithGemini(resumeText);
  } catch (err) {
    console.error('Gemini Resume Validation Error:', err.message);
    console.log('Falling back to local rule-based resume detection...');
    validation = detectResumeLocally(resumeText);
  }

  if (!validation.is_resume || validation.confidence < 75) {
    return res.status(422).json({
      success: false,
      message: 'This file does not appear to be a resume. Please upload a proper resume PDF containing sections like Education, Skills, Projects, Experience, and Contact Information.',
      validation
    });
  }

  // ── Call Gemini ────────────────────────────────────────────────────────────
  let analysis;
  try {
    analysis = await analyzeWithGemini(resumeText, targetRole);
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    console.log('Falling back to local rule-based analysis...');
    analysis = analyzeLocally(resumeText, targetRole);
  }

  const responseData = {
    targetRole,
    wordCount: resumeText.split(/\s+/).filter(Boolean).length,
    validation,
    ...analysis,
  };

  // ── Derive sub-scores from analysis ────────────────────────────────────────
  // We now use the exact section scores provided by the AI instead of heuristics.
  const atsScore = analysis.section_scores?.ats_compatibility ?? 0;
  const skillsScore = analysis.section_scores?.skills ?? 0;
  const projectScore = analysis.section_scores?.projects ?? 0;
  const layoutScore = analysis.section_scores?.layout ?? 0;

  // ── Save to history if email provided (non-blocking) ────────────────────────
  const email = (req.body?.email || '').trim();
  if (email) {
    setImmediate(async () => {
      try {
        const { saveHistory } = require('./historyController');
        let savedOk = false;

        // Map rich objects back to simple strings so GrowthTracker charts don't break
        const mappedStrengths = Array.isArray(analysis.strengths) 
          ? analysis.strengths.map(s => s.point || s) 
          : [];
        const mappedWeaknesses = Array.isArray(analysis.weaknesses) 
          ? analysis.weaknesses.map(w => w.point || w) 
          : [];
        
        let mappedRoadmap = [];
        if (analysis.recommendations) {
          mappedRoadmap = [
            ...(analysis.recommendations.high_impact || []),
            ...(analysis.recommendations.medium_impact || []),
            ...(analysis.recommendations.low_impact || [])
          ];
        } else if (Array.isArray(analysis.improvement_roadmap)) {
          mappedRoadmap = analysis.improvement_roadmap;
        }

        const histReq = {
          body: {
            email,
            target_role: targetRole,
            readiness_score: analysis.readiness_score,
            ats_score: atsScore,
            skills_score: skillsScore,
            project_score: projectScore,
            layout_score: layoutScore,
            strengths: mappedStrengths,
            weaknesses: mappedWeaknesses,
            improvement_roadmap: mappedRoadmap,
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
