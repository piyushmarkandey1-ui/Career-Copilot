const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiApiKey } = require('../config/env');

let model = null;

if (geminiApiKey && geminiApiKey !== 'your_api_key_here') {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('✅ Gemini AI initialized');
} else {
  console.warn('⚠️  GEMINI_API_KEY not configured. Using mock analysis.');
}

async function analyzeResumeWithGemini(resumeText, targetRole) {
  if (!model) return getMockAnalysis(targetRole);

  const prompt = `You are a brutally honest senior tech recruiter with 15 years of experience. Analyze this resume for the role: "${targetRole}".

RESUME:
${resumeText.slice(0, 4000)}

Respond ONLY with a valid JSON object, no markdown, no explanation, just raw JSON:
{
  "readiness_score": <integer 0-100>,
  "summary": "<one brutal honest sentence about the biggest issue>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "resume_structure_feedback": "<1-2 sentences on formatting and layout>",
  "project_feedback": "<1-2 sentences on projects and experience>",
  "skills_feedback": "<1-2 sentences on skills alignment for ${targetRole}>",
  "target_role_fit": "<1-2 sentences on fit for ${targetRole}>",
  "improvement_roadmap": ["<action 1>", "<action 2>", "<action 3>", "<action 4>"],
  "resume_specific_observations": ["<specific observation from their actual resume 1>", "<specific observation 2>"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    const analysis = JSON.parse(cleaned);

    // Validate required fields exist
    const required = ['readiness_score', 'summary', 'strengths', 'weaknesses', 'improvement_roadmap'];
    for (const key of required) {
      if (!analysis[key]) throw new Error(`Missing field: ${key}`);
    }

    return analysis;
  } catch (error) {
    console.error('Gemini error:', error.message);
    return getMockAnalysis(targetRole);
  }
}

function getMockAnalysis(targetRole) {
  return {
    readiness_score: 62,
    summary: `Decent foundation but your resume won't survive the 6-second recruiter scan for ${targetRole}.`,
    strengths: [
      'Shows relevant technical experience with modern tools.',
      'Project work demonstrates end-to-end delivery capability.',
      'Clear career progression is visible.'
    ],
    weaknesses: [
      'No quantifiable achievements — zero metrics anywhere.',
      'Skills section is a generic list, not tailored to the role.',
      'Resume reads like a job description, not an impact story.'
    ],
    resume_structure_feedback: 'Layout is clean but bullets are too long. Each bullet should be one line with a metric.',
    project_feedback: 'Projects lack live links and context. Add what problem you solved and what the result was.',
    skills_feedback: `Missing key skills expected for ${targetRole}. Prioritize what the job descriptions ask for.`,
    target_role_fit: `You have potential for ${targetRole} but the resume doesn\'t prove it yet. Rewrite to show impact, not just activity.`,
    improvement_roadmap: [
      'Add metrics to every bullet: percentages, time saved, users impacted.',
      'Add live URLs and GitHub links to all projects.',
      'Tailor your skills section to match the exact keywords in job postings.',
      'Cut your resume to one page — remove anything older than 3 years.'
    ],
    resume_specific_observations: [
      'Consider adding a brief professional summary at the top.',
      'Make sure contact information is complete and professional.'
    ]
  };
}

module.exports = { analyzeResumeWithGemini };
