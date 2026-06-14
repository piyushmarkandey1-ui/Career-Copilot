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
You are an elite technical recruiter and career coach with 15+ years of hiring experience at FAANG companies.
Your job is to review resumes with brutal honesty — no sugar-coating, no platitudes.
You give feedback that genuinely helps candidates fix their resume and land the role they want.

Always respond with ONLY a valid JSON object. No markdown, no explanation outside the JSON.
`.trim();

const buildUserPrompt = (resumeText, targetRole) => `
Analyze this resume for someone targeting the role of "${targetRole}".

RESUME:
"""
${resumeText.slice(0, 12000)}
"""

Return exactly this JSON structure (no extra keys, no markdown fences):
{
  "readiness_score": <integer 0-100, how ready this resume is for the ${targetRole} role>,
  "brutal_gaps": [
    "<specific gap or weakness — be direct and concrete, no filler words>",
    ...
  ],
  "fix_it_roadmap": [
    {
      "priority": "<high | medium | low>",
      "action": "<one specific, actionable step the candidate must take>"
    },
    ...
  ],
  "one_liner": "<one punchy, memorable sentence that captures the core problem with this resume>"
}

Rules:
- readiness_score must be an integer between 0 and 100.
- brutal_gaps: 3 to 6 items. Be specific — name exact missing skills, weak phrasing, or missing metrics.
- fix_it_roadmap: 4 to 7 items sorted by priority (high first). Each action must be concrete and doable.
- one_liner: max 20 words. Punchy. Honest. Like something a senior recruiter would say after 10 seconds.
- Respond with ONLY the JSON object. No explanation, no markdown code fences.
`.trim();

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * @param {string} resumeText  - Plain text extracted from the PDF
 * @param {string} targetRole  - e.g. "Frontend Developer"
 * @returns {Promise<{readiness_score, brutal_gaps, fix_it_roadmap, one_liner}>}
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
  const { readiness_score, brutal_gaps, fix_it_roadmap, one_liner } = parsed;

  if (
    typeof readiness_score !== 'number' ||
    !Array.isArray(brutal_gaps) ||
    !Array.isArray(fix_it_roadmap) ||
    typeof one_liner !== 'string'
  ) {
    throw Object.assign(
      new Error('Claude response is missing required fields.'),
      { status: 502 }
    );
  }

  return {
    readiness_score: Math.min(100, Math.max(0, Math.round(readiness_score))),
    brutal_gaps,
    fix_it_roadmap,
    one_liner,
  };
};

module.exports = { analyzeWithClaude };
