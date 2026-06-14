const Anthropic = require('@anthropic-ai/sdk');
const { anthropicApiKey } = require('../config/env');

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

/**
 * Analyze resume using Claude API
 * @param {string} resumeText - Extracted text from resume
 * @param {string} targetRole - Target job role
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeResumeWithClaude(resumeText, targetRole) {
  if (!anthropicApiKey) {
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
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract the response text
    const responseText = message.content[0].text;

    // Parse JSON response
    const analysis = JSON.parse(responseText);

    // Validate response structure
    if (!analysis.readiness_score || !analysis.brutal_gaps || !analysis.fix_it_roadmap || !analysis.one_liner) {
      throw new Error('Invalid response structure from Claude');
    }

    return analysis;
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Failed to analyze resume: ${error.message}`);
  }
}

module.exports = {
  analyzeResumeWithClaude,
};
