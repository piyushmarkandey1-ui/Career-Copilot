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
  if (!resumeText || resumeText.trim().length < 100) {
    return {
      is_resume: false,
      confidence: 0,
      missing_sections: ['Too little text']
    };
  }

  const model = getModel();
  const systemPrompt = `You are an AI assistant designed to detect whether a given document is a resume or CV.
Analyze the document text and look for standard resume components:
- Name
- Contact information
- Education section
- Skills section
- Projects section
- Experience section
- Certifications
- Resume-like structure

Determine:
1. "is_resume": boolean (Set to false if it does not look like a professional resume/CV, e.g. a research paper, article, recipe, code listing, or random text. Set to true if it is a CV/resume, even if some sections are missing)
2. "confidence": integer (0 to 100) representing how likely this document is a resume. A typical resume has a confidence of 80% or above. A poor/fresher resume might have 70-80%. Non-resumes should be below 70% (usually below 40%).
3. "missing_sections": array of strings (e.g., "Skills section", "Education section", "Contact information"). Only list standard sections that appear to be completely missing.

Return your response in this exact JSON format, with no other text, markdown formatting or wrappers:
{
  "is_resume": <boolean>,
  "confidence": <integer>,
  "missing_sections": ["<section name>", ...]
}`;

  const prompt = `${systemPrompt}\n\nVerify this document:\n\n${resumeText.slice(0, 8000)}`;

  try {
    const result = await model.generateContent(prompt);
    const rawContent = result.response.text().trim();
    const jsonStr = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed = JSON.parse(jsonStr);

    return {
      is_resume: typeof parsed.is_resume === 'boolean' ? parsed.is_resume : (parsed.confidence >= 70),
      confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 0,
      missing_sections: Array.isArray(parsed.missing_sections) ? parsed.missing_sections : []
    };
  } catch (err) {
    throw Object.assign(
      new Error(`Gemini validation failed: ${err.message}`),
      { status: 502 }
    );
  }
};

module.exports = { analyzeWithGemini, validateResumeWithGemini };
