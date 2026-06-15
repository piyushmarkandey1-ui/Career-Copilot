/**
 * historyController.js
 *
 * Handles:
 *   POST /api/history        — save a resume analysis record
 *   GET  /api/history?email= — fetch all records for an email
 */

const { getSupabase } = require('../services/supabaseClient');

const isValidEmail = (v) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ── POST /api/history ──────────────────────────────────────────────────────────
const saveHistory = async (req, res) => {
  const {
    email,
    target_role,
    resume_version,
    readiness_score,
    strengths,
    weaknesses,
    improvement_roadmap,
    full_analysis_json,
  } = req.body ?? {};

  // ── Validate ─────────────────────────────────────────────────────────────────
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('A valid email address is required to track history.');
  }
  if (!target_role || typeof target_role !== 'string') {
    errors.push('target_role is required.');
  }
  if (typeof readiness_score !== 'number' || readiness_score < 0 || readiness_score > 100) {
    errors.push('readiness_score must be a number between 0 and 100.');
  }
  if (!Array.isArray(strengths)) {
    errors.push('strengths must be an array.');
  }
  if (!Array.isArray(weaknesses)) {
    errors.push('weaknesses must be an array.');
  }
  if (!Array.isArray(improvement_roadmap)) {
    errors.push('improvement_roadmap must be an array.');
  }
  if (!full_analysis_json || typeof full_analysis_json !== 'object') {
    errors.push('full_analysis_json must be a JSON object.');
  }

  if (errors.length) {
    return res.status(422).json({ success: false, errors });
  }

  // ── Try Supabase; fall back to in-memory store for demo ─────────────────────
  try {
    const supabase = getSupabase();

    // Count existing records for this email to auto-increment resume_version
    const { count } = await supabase
      .from('resume_history')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase());

    const version = resume_version ?? (count ? count + 1 : 1);

    const { data, error } = await supabase
      .from('resume_history')
      .insert({
        email: email.trim().toLowerCase(),
        target_role,
        resume_version: version,
        readiness_score: Math.round(readiness_score),
        strengths,
        weaknesses,
        improvement_roadmap,
        full_analysis_json,
        analysis_date: new Date().toISOString(),
      })
      .select('id, email, target_role, resume_version, readiness_score, analysis_date')
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Analysis saved to history.',
      data,
    });
  } catch (err) {
    console.error('[Supabase] history insert error:', err.message);
    // Graceful: return success=true with a flag so frontend knows it wasn't persisted
    return res.status(200).json({
      success: true,
      persisted: false,
      message: 'Analysis completed but history could not be saved (database not configured).',
    });
  }
};

// ── GET /api/history?email= ───────────────────────────────────────────────────
const getHistory = async (req, res) => {
  const { email } = req.query;

  if (!email || !isValidEmail(email)) {
    return res.status(422).json({ success: false, message: 'A valid email query param is required.' });
  }

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('resume_history')
      .select('id, email, target_role, resume_version, readiness_score, strengths, weaknesses, improvement_roadmap, analysis_date, full_analysis_json')
      .eq('email', email.trim().toLowerCase())
      .order('analysis_date', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data ?? [],
    });
  } catch (err) {
    console.error('[Supabase] history fetch error:', err.message);
    // Return mock history data for demo purposes
    return res.status(200).json({
      success: true,
      persisted: false,
      data: generateMockHistory(email),
    });
  }
};

// ── Mock data generator for demo when Supabase is not configured ──────────────
function generateMockHistory(email) {
  const now = new Date();
  const roles = ['Frontend Developer', 'Frontend Developer', 'Full Stack Developer'];
  const scores = [52, 67, 78];
  const strengthSets = [
    ['Good educational background', 'Clean formatting'],
    ['Good educational background', 'Clean formatting', 'Shows project initiative'],
    ['Good educational background', 'Clean formatting', 'Shows project initiative', 'Improved metrics in bullet points'],
  ];
  const weaknessSets = [
    ['No quantifiable metrics', 'Missing GitHub links', 'No professional summary', 'Skills not categorized'],
    ['No quantifiable metrics', 'Missing GitHub links', 'Skills not categorized'],
    ['Skills not fully categorized', 'Missing system design experience'],
  ];

  return scores.map((score, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (60 - i * 30));
    return {
      id: `mock-${i + 1}`,
      email: email.trim().toLowerCase(),
      target_role: roles[i],
      resume_version: i + 1,
      readiness_score: score,
      strengths: strengthSets[i],
      weaknesses: weaknessSets[i],
      improvement_roadmap: [
        'Quantify bullet points with metrics',
        'Add GitHub links to all projects',
        'Write a professional summary',
      ],
      analysis_date: date.toISOString(),
      full_analysis_json: { summary: `Version ${i + 1} analysis for demo.` },
    };
  });
}

module.exports = { saveHistory, getHistory };
