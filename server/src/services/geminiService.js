const { GoogleGenerativeAI } = require('@google/generative-ai');

let _model = null;
const getModel = () => {
  if (!_model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw Object.assign(
        new Error('GEMINI_API_KEY is not set in environment variables.'),
        { status: 500 }
      );
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    _model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return _model;
};

const buildSystemPrompt = () => `
You are an experienced technical recruiter, resume reviewer, and career coach.
Your task is to perform a highly personalized, evidence-based review of the uploaded resume against the selected target role.

STRICT RULES:
1. BUILD AN INTERNAL PROFILE FIRST: Before writing feedback, internally map the candidate's education, experience level, exact skills, projects, and achievements.
2. EVIDENCE ONLY: Every observation, strength, weakness, and recommendation MUST reference specific content from the resume (e.g., project names, company names, specific metrics, listed skills). 
3. NO ASSUMPTIONS: Do not invent missing information. If evidence is missing, state: "Unable to evaluate this area because the resume does not provide enough information."
4. NO TEMPLATES: Do not use generic phrases like "Add more projects", "Improve skills", "Gain experience". Explain the exact technical reason behind every recommendation.
5. EXPLAIN SCORES: Justify the Readiness Score and Section Scores using evidence from the text.
6. COMPARE EXPECTATIONS: Evaluate the candidate's specific skills against the typical industry expectations for the target role.
7. VARY SENTENCE STRUCTURE: Ensure the writing style feels human, dynamic, and unique to this specific candidate.

Return exactly this JSON format:
{
  "readiness_score": <int 0-100>,
  "score_explanation": "<string explaining score with evidence>",
  "executive_summary": "<unique personalized executive summary>",
  "candidate_profile_internal": {
    "education_level": "<string>",
    "experience_level": "<string>",
    "top_skills": ["<string>"],
    "target_role": "<string>",
    "notable_achievements": ["<string>"]
  },
  "section_scores": {
    "layout": <int 0-100>,
    "contact_info": <int 0-100>,
    "education": <int 0-100>,
    "skills": <int 0-100>,
    "projects": <int 0-100>,
    "experience": <int 0-100>,
    "ats_compatibility": <int 0-100>,
    "target_role_alignment": <int 0-100>
  },
  "strengths": [
    { "point": "<unique strength based on actual content>", "confidence": "High|Medium|Low" }
  ],
  "weaknesses": [
    { "point": "<unique weakness based on actual content>", "confidence": "High|Medium|Low" }
  ],
  "recommendations": {
    "high_impact": ["<actionable item with reason>"],
    "medium_impact": ["<actionable item>"],
    "low_impact": ["<actionable item>"]
  },
  "resume_specific_observations": [
    "<observation unique to this resume>"
  ],
  "recruiter_summary": {
    "standout_factor": "<string>",
    "biggest_improvement_area": "<string>",
    "interview_readiness": "<string>",
    "overall_assessment": "<string>"
  },
  "target_role_comparison": {
    "role_expectations": "<string>",
    "candidate_alignment": "<string>"
  }
}
`.trim();

const buildUserPrompt = (resumeText, targetRole) => `
Analyze this resume for the target role of "${targetRole}".
Ensure every single piece of feedback references a specific word, project, company, or metric from the text below.
If a section is entirely missing, deduct points heavily in that section_score and mention it explicitly.

RESUME TEXT:
"""
${resumeText.slice(0, 14000)}
"""

Output pure JSON exactly as defined.
`.trim();

const analyzeWithGemini = async (resumeText, targetRole) => {
  if (!resumeText || resumeText.split(/\\s+/).filter(Boolean).length < 150) {
    throw Object.assign(
      new Error('Resume text is too short to analyze.'),
      { status: 422 }
    );
  }

  const model = getModel();
  const prompt = \`\${buildSystemPrompt()}\\n\\n\${buildUserPrompt(resumeText, targetRole)}\`;

  try {
    const result = await model.generateContent(prompt);
    const rawContent = result.response.text().trim();
    const jsonStr = rawContent.replace(/^\\s*\\x60\\x60\\x60(?:json)?\\s*/i, '').replace(/\\s*\\x60\\x60\\x60\\s*$/i, '').trim();

    let parsed = JSON.parse(jsonStr);

    if (
      typeof parsed.readiness_score !== 'number' ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.weaknesses) ||
      !parsed.section_scores ||
      !parsed.recommendations ||
      !parsed.recruiter_summary
    ) {
      throw new Error('Gemini response is missing required fields.');
    }

    return parsed;
  } catch (err) {
    throw Object.assign(
      new Error(\`Gemini analysis failed: \${err.message}\`),
      { status: 502 }
    );
  }
};

const validateResumeWithGemini = async (resumeText) => {
  const words = resumeText ? resumeText.split(/\s+/).filter(Boolean).length : 0;
  if (!resumeText || words < 150) {
    return {
      is_resume: false,
      confidence: 0,
      reason: "Resume text is too limited to analyze. Please upload a complete resume.",
      detected_document_type: "short_text",
      resume_signals_found: [],
      non_resume_signals_found: ["too_short"]
    };
  }

  const model = getModel();
  const systemPrompt = `You are an AI assistant designed to rigorously detect whether a given document is a professional resume or CV.
Analyze the document text and look for standard resume components:
- Name and Contact information (Email, Phone)
- Education section
- Skills section
- Projects section
- Experience or internship section
- Certifications or achievements
- LinkedIn, GitHub, or portfolio link
- Resume-style bullet points
- Dates related to education or work

Determine:
1. "is_resume": boolean. Set to false if it does not look like a professional resume/CV (e.g. story, essay, research paper, assignment, article, notes, certificate, report, book, question paper, code listing, random text). Set to true ONLY if it is a CV/resume and contains at least 4 of the standard resume signals.
2. "confidence": integer (0 to 100) representing how likely this document is a resume. Non-resumes, stories, and assignments should be below 40%. Valid resumes should be 75-100%.
3. "reason": string explaining why it is or is not a resume.
4. "detected_document_type": string (e.g., "resume", "story", "essay", "assignment", "unknown").
5. "resume_signals_found": array of strings (e.g., ["Education section", "Contact info", "Skills list"]).
6. "non_resume_signals_found": array of strings (e.g., ["Story narrative", "Chapter headers", "Essay structure"]).

Return your response in this exact JSON format, with no other text, markdown formatting or wrappers:
{
  "is_resume": <boolean>,
  "confidence": <integer>,
  "reason": "<string>",
  "detected_document_type": "<string>",
  "resume_signals_found": ["<string>", ...],
  "non_resume_signals_found": ["<string>", ...]
}`;

  const prompt = `${systemPrompt}\n\nVerify this document:\n\n${resumeText.slice(0, 8000)}`;

  try {
    const result = await model.generateContent(prompt);
    const rawContent = result.response.text().trim();
    const jsonStr = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed = JSON.parse(jsonStr);

    let is_resume = typeof parsed.is_resume === 'boolean' ? parsed.is_resume : (parsed.confidence >= 75);
    let confidence = typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 0;
    
    // Safety guard
    if (confidence < 75) is_resume = false;

    return {
      is_resume,
      confidence,
      reason: parsed.reason || (is_resume ? "Appears to be a valid resume." : "Does not meet resume criteria."),
      detected_document_type: parsed.detected_document_type || (is_resume ? "resume" : "unknown_document"),
      resume_signals_found: Array.isArray(parsed.resume_signals_found) ? parsed.resume_signals_found : [],
      non_resume_signals_found: Array.isArray(parsed.non_resume_signals_found) ? parsed.non_resume_signals_found : []
    };
  } catch (err) {
    throw Object.assign(
      new Error(`Gemini validation failed: ${err.message}`),
      { status: 502 }
    );
  }
};

module.exports = { analyzeWithGemini, validateResumeWithGemini };
