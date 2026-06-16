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
You are an experienced recruiter, resume reviewer, and career coach with 10+ years of experience across technology and business roles.
Your task is to perform a professional, objective, balanced, and evidence-based review of the uploaded resume for the selected target role.

STRICT RULES — You MUST follow all of these:
1. Every single observation must reference SPECIFIC content from the resume — a project name, a company name, a skill listed, an education detail, a specific bullet point, or a missing section.
2. Do NOT use generic filler phrases such as "Add more projects", "Improve your skills", "Gain more experience", or "Make it ATS friendly". Replace every such phrase with a specific, evidence-based improvement.
3. Do NOT reuse the same sentence patterns across different sections.
4. Do NOT give the same strengths or weaknesses unless the resume content actually repeats.
5. Before writing each point, ask: "Does this reference something SPECIFIC in this resume?"
6. If a weakness is common (e.g., missing metrics), explain it using the user's ACTUAL bullet points or project names from the resume.
7. Be honest but respectful. Do not exaggerate. Do not insult. Do not discourage.
8. Vary the sentence structure and wording of each point.

Return your response in this exact JSON format and no other format:
{
  "readiness_score": <integer 0-100>,
  "summary": "<2–3 sentence personalized assessment referencing specific resume content>",
  "strengths": ["<evidence-based strength 1>", "<evidence-based strength 2>", "<evidence-based strength 3>"],
  "weaknesses": ["<evidence-based weakness 1>", "<evidence-based weakness 2>", "<evidence-based weakness 3>"],
  "resume_structure_feedback": "<specific structural observations about this resume>",
  "project_feedback": "<specific feedback on the actual projects listed, by name>",
  "skills_feedback": "<specific feedback referencing the exact skills present and absent>",
  "target_role_fit": "<personalized assessment of fit for the selected role>",
  "improvement_roadmap": ["<specific action 1>", "<specific action 2>", "<specific action 3>", "<specific action 4>"],
  "resume_specific_observations": [
    "<observation that only applies to THIS resume based on its actual content>",
    "<observation that only applies to THIS resume based on its actual content>",
    "<observation that only applies to THIS resume based on its actual content>"
  ],
  "generic_feedback_detected": false,
  "simple_review": {
    "summary": "<simplified student-friendly 2-3 sentence summary>",
    "strengths": ["<simplified strength 1>", "<simplified strength 2>", "<simplified strength 3>"],
    "weaknesses": ["<simplified weakness 1>", "<simplified weakness 2>", "<simplified weakness 3>"],
    "improvement_roadmap": ["<simplified roadmap 1>", "<simplified roadmap 2>", "<simplified roadmap 3>"],
    "section_feedback": [
      { "section": "Structure", "feedback": "<simplified structure feedback>" },
      { "section": "Projects", "feedback": "<simplified project feedback>" },
      { "section": "Skills", "feedback": "<simplified skills feedback>" },
      { "section": "Role Fit", "feedback": "<simplified role fit>" }
    ]
  }
}
`.trim();

const buildUserPrompt = (resumeText, targetRole) => `
Analyze this resume for the role of "${targetRole}".

Before writing the review, internally identify:
- What is unique about this resume?
- Which specific sections are strong, and why?
- Which specific sections are weak, with evidence from the text?
- What is completely missing?
- What should be removed or shortened?
- What should be added for this exact target role?

IMPORTANT: You must also generate a "simple_review". This must be based on the EXACT SAME detailed review you just created, but translated into simple, jargon-free language that a college student or fresher can easily understand. Preserve all meaning, just remove the complexity.

Use the candidate's ACTUAL project names, company names, skill mentions, education details, and bullet points in your feedback — not generic placeholders.

RESUME:
"""
${resumeText.slice(0, 14000)}
"""

Return exactly the JSON structure defined in the system prompt. No markdown fences. No extra keys.
`.trim();

const analyzeWithGemini = async (resumeText, targetRole) => {
  if (!resumeText || resumeText.trim().length < 100) {
    throw Object.assign(
      new Error('Resume text is too short to analyze. Make sure the PDF has selectable text.'),
      { status: 422 }
    );
  }

  const model = getModel();
  const prompt = `${buildSystemPrompt()}\n\n${buildUserPrompt(resumeText, targetRole)}`;

  try {
    const result = await model.generateContent(prompt);
    const rawContent = result.response.text().trim();
    const jsonStr = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed = JSON.parse(jsonStr);

    const {
      readiness_score,
      strengths,
      weaknesses,
      resume_structure_feedback,
      project_feedback,
      skills_feedback,
      target_role_fit,
      improvement_roadmap,
      summary,
      resume_specific_observations,
      generic_feedback_detected,
      simple_review,
    } = parsed;

    if (
      typeof readiness_score !== 'number' ||
      !Array.isArray(strengths) ||
      !Array.isArray(weaknesses) ||
      typeof resume_structure_feedback !== 'string' ||
      typeof project_feedback !== 'string' ||
      typeof skills_feedback !== 'string' ||
      typeof target_role_fit !== 'string' ||
      !Array.isArray(improvement_roadmap) ||
      typeof summary !== 'string'
    ) {
      throw new Error('Gemini response is missing required fields.');
    }

    return {
      readiness_score: Math.min(100, Math.max(0, Math.round(readiness_score))),
      strengths,
      weaknesses,
      resume_structure_feedback,
      project_feedback,
      skills_feedback,
      target_role_fit,
      improvement_roadmap,
      summary: summary || 'A customized summary could not be generated.',
      resume_specific_observations: Array.isArray(resume_specific_observations) ? resume_specific_observations : [],
      generic_feedback_detected: !!generic_feedback_detected,
      simple_review: simple_review || {
        summary: summary || '',
        strengths: Array.isArray(strengths) ? strengths : [],
        weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
        improvement_roadmap: Array.isArray(improvement_roadmap) ? improvement_roadmap : [],
        section_feedback: []
      }
    };
  } catch (err) {
    throw Object.assign(
      new Error(`Gemini analysis failed: ${err.message}`),
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
