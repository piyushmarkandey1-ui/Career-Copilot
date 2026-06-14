/**
 * claudeService.js
 *
 * Wraps the Anthropic Claude API.
 * Sends resume text + target role and returns a structured analysis object.
 *
 * Returned shape:
 * {
 *   readiness_score : number (0–100),
 *   brutal_gaps     : string[],
 *   fix_it_roadmap  : { priority: "high"|"medium"|"low", action: string }[],
 *   one_liner       : string
 * }
 */

const Anthropic = require('@anthropic-ai/sdk');

// Lazily initialised so the module can be imported without a key (e.g. tests)
let _client = null;
const getClient = () => {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw Object.assign(
        new Error('ANTHROPIC_API_KEY is not set in environment variables.'),
        { status: 500 }
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
};

// ── Prompt ────────────────────────────────────────────────────────────────────
const buildSystemPrompt = () => `
You are a professional career coach and senior tech recruiter with 10+ years of hiring experience. A student has uploaded their resume and selected a target role. Your job is to give a balanced, unbiased, and realistic resume review.

Highlight both strengths and weaknesses. Be honest but respectful. Do not exaggerate. Do not insult. Do not discourage. Base your feedback only on the resume content.

Return your response in this exact JSON format:
{
  "readiness_score": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "resume_structure_feedback": "<feedback on formatting, clarity, sections, readability>",
  "project_feedback": "<feedback on projects, technical depth, impact, deployment, GitHub links>",
  "skills_feedback": "<feedback on skills relevance and gaps>",
  "target_role_fit": "<how suitable the resume is for the selected role>",
  "improvement_roadmap": ["action1", "action2", "action3"],
  "summary": "<professional one-line summary>"
}
`.trim();

const buildUserPrompt = (resumeText, targetRole) => `
Analyze this resume for someone targeting the role of "${targetRole}".

RESUME:
"""
${resumeText.slice(0, 12000)}
"""

Return exactly this JSON structure (no extra keys, no markdown fences):
{
  "readiness_score": <integer 0-100>,
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "resume_structure_feedback": "...",
  "project_feedback": "...",
  "skills_feedback": "...",
  "target_role_fit": "...",
  "improvement_roadmap": ["...", "...", "..."],
  "summary": "..."
}
`.trim();

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * @param {string} resumeText  - Plain text extracted from the PDF
 * @param {string} targetRole  - e.g. "Frontend Developer"
 * @returns {Promise<{readiness_score, strengths, weaknesses, resume_structure_feedback, project_feedback, skills_feedback, target_role_fit, improvement_roadmap, summary}>}
 */
const analyzeWithClaude = async (resumeText, targetRole) => {
  if (!resumeText || resumeText.trim().length < 50) {
    throw Object.assign(
      new Error('Resume text is too short to analyze. Make sure the PDF has selectable text.'),
      { status: 422 }
    );
  }

  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [
      { role: 'user', content: buildUserPrompt(resumeText, targetRole) },
    ],
  });

  // Extract the text block from Claude's response
  const rawContent = message.content.find((b) => b.type === 'text')?.text ?? '';

  // Parse JSON — strip any accidental markdown fences Claude may add
  const jsonStr = rawContent
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw Object.assign(
      new Error(`Claude returned non-JSON output: ${rawContent.slice(0, 200)}`),
      { status: 502 }
    );
  }

  // ── Validate shape ──────────────────────────────────────────────────────────
  const {
    readiness_score,
    strengths,
    weaknesses,
    resume_structure_feedback,
    project_feedback,
    skills_feedback,
    target_role_fit,
    improvement_roadmap,
    summary
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
    throw Object.assign(
      new Error('Claude response is missing required fields.'),
      { status: 502 }
    );
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
    summary,
  };
};

module.exports = { analyzeWithClaude };
