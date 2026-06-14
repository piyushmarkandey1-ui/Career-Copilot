const Anthropic = require('@anthropic-ai/sdk');
const { anthropicApiKey, nodeEnv, isAnthropicConfigured } = require('../config/env');

let anthropic = null;

function getAnthropicClient() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: anthropicApiKey });
  }
  return anthropic;
}

function parseClaudeJson(responseText) {
  const trimmed = responseText.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

function validateAnalysis(analysis) {
  if (
    typeof analysis.readiness_score !== 'number' ||
    !Array.isArray(analysis.brutal_gaps) ||
    !Array.isArray(analysis.fix_it_roadmap) ||
    typeof analysis.one_liner !== 'string'
  ) {
    throw new Error('Invalid response structure from Claude');
  }
  return analysis;
}

function getMockAnalysis(targetRole) {
  return {
    readiness_score: 45,
    brutal_gaps: [
      `Your resume does not clearly show experience aligned with ${targetRole} expectations.`,
      'Bullet points describe tasks, not measurable impact or outcomes.',
      'Missing modern tools, projects, or portfolio links that prove current skills.',
    ],
    fix_it_roadmap: [
      {
        week: 'Week 1-2',
        action: 'Rewrite each bullet with metrics (latency, revenue, users, cost saved).',
        why: 'Recruiters scan for proof of impact, not generic responsibilities.',
      },
      {
        week: 'Week 3-4',
        action: `Build one role-relevant project and link it prominently for ${targetRole}.`,
        why: 'A concrete project proves you can do the work today, not years ago.',
      },
      {
        week: 'Month 2',
        action: 'Add a concise skills section mapped to the job description keywords.',
        why: 'ATS and hiring managers match resumes to role requirements first.',
      },
    ],
    one_liner:
      "Your resume reads like a task list — show impact, current stack, and proof you can do the role.",
  };
}

/**
 * Analyze resume using Claude API
 * @param {string} resumeText - Extracted text from resume
 * @param {string} targetRole - Target job role
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeResumeWithClaude(resumeText, targetRole) {
  if (!isAnthropicConfigured()) {
    if (nodeEnv === 'development') {
      console.warn('⚠️  ANTHROPIC_API_KEY not configured — returning mock analysis for local dev');
      return getMockAnalysis(targetRole);
    }
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const systemPrompt = `You are a brutally honest career coach with 20 years of experience in tech recruitment. Your job is to tell people the harsh truth about why their resume won't get them hired, then give them a concrete roadmap to fix it.

You analyze resumes for specific tech roles and provide:
1. A readiness score (0-100) with no sugar-coating
2. Brutal gaps - the hard truths about what's missing or wrong
3. A fix-it roadmap - actionable steps to improve
4. A memorable one-liner that captures their biggest issue

Be direct, honest, and actionable. No corporate speak. No false encouragement.`;

  const userPrompt = `Analyze this resume for the role: ${targetRole}

RESUME TEXT:
${resumeText}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "readiness_score": <number 0-100>,
  "brutal_gaps": [
    "Gap 1: Specific issue",
    "Gap 2: Another specific issue",
    "Gap 3: Yet another issue"
  ],
  "fix_it_roadmap": [
    {
      "week": "Week 1-2",
      "action": "Specific action to take",
      "why": "Why this matters"
    },
    {
      "week": "Week 3-4",
      "action": "Next specific action",
      "why": "Why this matters"
    }
  ],
  "one_liner": "A brutally honest, memorable summary of the biggest issue"
}`;

  try {
    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText = message.content[0].text;
    return validateAnalysis(parseClaudeJson(responseText));
  } catch (error) {
    console.error('Claude API Error:', error);

    if (error?.status === 401 || error?.message?.includes('authentication_error')) {
      throw new Error('ANTHROPIC_API_KEY is invalid. Update backend/.env with a valid key from console.anthropic.com');
    }

    throw new Error(`Failed to analyze resume: ${error.message}`);
  }
}

module.exports = {
  analyzeResumeWithClaude,
  getMockAnalysis,
};
