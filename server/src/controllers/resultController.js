/**
 * resultController.js
 *
 * Handles:
 *   POST /api/save-result   — persist a roast result to Supabase
 *   GET  /api/save-result   — fetch saved results (optionally filtered by email)
 */

const { getSupabase } = require('../services/supabaseClient');

// ── Validation helpers ────────────────────────────────────────────────────────
const isValidEmail = (v) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const isValidScore = (v) =>
  Number.isInteger(v) && v >= 0 && v <= 100;

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

// ── POST /api/save-result ─────────────────────────────────────────────────────
/**
 * Body (application/json):
 * {
 *   email      : string | null   (optional)
 *   role       : string          (required — must be a supported role)
 *   score      : number          (required — 0-100 integer)
 *   ai_result  : object          (required — full Claude payload)
 * }
 */
const saveResult = async (req, res) => {
  const { email, role, score, ai_result } = req.body ?? {};

  // ── Validate ────────────────────────────────────────────────────────────────
  const errors = [];

  if (email !== undefined && email !== null && !isValidEmail(email)) {
    errors.push('email must be a valid email address or null.');
  }

  if (!role || typeof role !== 'string') {
    errors.push('role is required.');
  } else if (!SUPPORTED_ROLES.includes(role)) {
    errors.push(`role "${role}" is not supported.`);
  }

  if (score === undefined || score === null) {
    errors.push('score is required.');
  } else if (!isValidScore(score)) {
    errors.push('score must be an integer between 0 and 100.');
  }

  if (!ai_result || typeof ai_result !== 'object' || Array.isArray(ai_result)) {
    errors.push('ai_result must be a non-null JSON object.');
  } else {
    // Ensure the four Claude fields are present
    const required = ['readiness_score', 'brutal_gaps', 'fix_it_roadmap', 'one_liner'];
    const missing  = required.filter((k) => !(k in ai_result));
    if (missing.length) {
      errors.push(`ai_result is missing required fields: ${missing.join(', ')}.`);
    }
  }

  if (errors.length) {
    return res.status(422).json({ success: false, errors });
  }

  // ── Insert ──────────────────────────────────────────────────────────────────
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('results')
    .insert({
      email     : email ? email.trim().toLowerCase() : null,
      role,
      score,
      ai_result,
    })
    .select('id, email, role, score, created_at')
    .single();

  if (error) {
    console.error('[Supabase] insert error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error while saving result.',
      detail : error.message,
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Result saved successfully.',
    data,
  });
};

// ── GET /api/save-result ──────────────────────────────────────────────────────
/**
 * Query params:
 *   email  — filter by email (optional)
 *   limit  — max rows returned (default 20, max 100)
 *   offset — pagination offset (default 0)
 */
const getResults = async (req, res) => {
  const { email, limit = '20', offset = '0' } = req.query;

  const limitN  = Math.min(parseInt(limit,  10) || 20, 100);
  const offsetN = Math.max(parseInt(offset, 10) || 0,  0);

  const supabase = getSupabase();

  let query = supabase
    .from('results')
    .select('id, email, role, score, created_at, ai_result')
    .order('created_at', { ascending: false })
    .range(offsetN, offsetN + limitN - 1);

  if (email) {
    if (!isValidEmail(email)) {
      return res.status(422).json({ success: false, message: 'Invalid email query param.' });
    }
    query = query.eq('email', email.trim().toLowerCase());
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[Supabase] select error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error while fetching results.',
      detail : error.message,
    });
  }

  return res.status(200).json({
    success: true,
    data,
    pagination: { limit: limitN, offset: offsetN, returned: data.length },
  });
};

module.exports = { saveResult, getResults };
