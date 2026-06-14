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
 * GET /api/resume/roles
 * Returns the list of supported target roles.
 */
const getRoles = (_req, res) => {
  res.json({ success: true, data: SUPPORTED_ROLES });
};

/**
 * POST /api/resume/analyze
 * Receives the uploaded PDF buffer + targetRole, runs analysis,
 * and returns a structured result object.
 *
 * Replace the mock logic inside with your actual AI service call
 * (e.g. OpenAI, Gemini, custom Python microservice, etc.)
 */
const analyzeResume = async (req, res) => {
  // ── Validate inputs ──────────────────────────────────────────────────────
  if (!req.file) {
    return res.status(422).json({
      success: false,
      message: 'No PDF file uploaded. Use field name "resume".',
    });
  }

  const { targetRole } = req.body;

  if (!targetRole || !SUPPORTED_ROLES.includes(targetRole)) {
    return res.status(422).json({
      success: false,
      message: `Invalid or missing targetRole. Supported: ${SUPPORTED_ROLES.join(', ')}`,
    });
  }

  // ── File meta ────────────────────────────────────────────────────────────
  const fileMeta = {
    originalName: req.file.originalname,
    sizeBytes: req.file.size,
    mimeType: req.file.mimetype,
  };

  // ── TODO: plug in your AI service here ──────────────────────────────────
  // Example:
  //   const text = await extractTextFromPDF(req.file.buffer);
  //   const analysis = await callOpenAI(text, targetRole);
  //
  // For now we return a realistic mock payload so the frontend works end-to-end.
  const mockAnalysis = buildMockAnalysis(targetRole);

  res.status(200).json({
    success: true,
    data: {
      file: fileMeta,
      targetRole,
      analysis: mockAnalysis,
    },
  });
};

// ── Mock builder ─────────────────────────────────────────────────────────────
function buildMockAnalysis(role) {
  return {
    overallScore: 72,
    sections: {
      clarity: { score: 80, feedback: 'Good use of action verbs but some bullet points lack measurable impact.' },
      relevance: { score: 68, feedback: `Several skills listed are not directly relevant to ${role} roles.` },
      keywords: { score: 65, feedback: 'Missing several high-frequency ATS keywords for this role.' },
      formatting: { score: 90, feedback: 'Clean layout. Consistent date formatting. Single page — great.' },
      impact: { score: 58, feedback: 'Quantify your achievements. Replace vague phrases like "helped with" or "worked on".' },
    },
    strengths: [
      'Clear professional summary',
      'Consistent formatting and white space',
      'Relevant educational background',
    ],
    weaknesses: [
      'Bullet points lack numbers/metrics',
      'No mention of team size or scope',
      '"Responsible for" appears 4 times — replace with strong verbs',
      'Skills section uses outdated or generic terms',
    ],
    missingKeywords: ['TypeScript', 'CI/CD', 'system design', 'agile', 'code review'],
    suggestedImprovements: [
      'Quantify impact: "Reduced load time by 40%" beats "Improved performance"',
      `Add a ${role}-specific project or open-source contribution`,
      'Tailor the professional summary to match the job description',
      'Move most-relevant skills to the top of the skills section',
    ],
    roastQuote:
      'Your resume reads like a job description you copy-pasted from LinkedIn. Tell me what YOU did, not what the role involves.',
  };
}

module.exports = { analyzeResume, getRoles };
