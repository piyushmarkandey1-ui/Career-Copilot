/**
 * historyController.js
 *
 * POST /api/history        — save a resume analysis record with sub-scores
 * GET  /api/history?email=&target_role= — fetch records filtered by email + role
 */

const { getSupabase } = require('../services/supabaseClient');

const isValidEmail = (v) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ── In-Memory Fallback Store ──────────────────────────────────────────────────
// This allows the Growth Tracker to work perfectly with real data during the 
// current server session even if Supabase is not configured.
const localMemoryStore = [];
let memoryIdCounter = 1;

// ── POST /api/history ──────────────────────────────────────────────────────────
const saveHistory = async (req, res) => {
  const {
    email,
    target_role,
    resume_version,
    readiness_score,
    ats_score,
    skills_score,
    project_score,
    layout_score,
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
  if (!full_analysis_json || typeof full_analysis_json !== 'object') {
    errors.push('full_analysis_json must be a JSON object.');
  }

  if (errors.length) {
    return res.status(422).json({ success: false, errors });
  }

  // ── Try Supabase ─────────────────────────────────────────────────────────────
  try {
    const supabase = getSupabase();

    // Count existing records for this email+role to auto-increment version
    const { count } = await supabase
      .from('resume_history')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase())
      .eq('target_role', target_role);

    const version = resume_version ?? (count ? count + 1 : 1);

    const { data, error } = await supabase
      .from('resume_history')
      .insert({
        email: email.trim().toLowerCase(),
        target_role,
        resume_version: version,
        readiness_score: Math.round(readiness_score),
        ats_score: typeof ats_score === 'number' ? Math.round(ats_score) : null,
        skills_score: typeof skills_score === 'number' ? Math.round(skills_score) : null,
        project_score: typeof project_score === 'number' ? Math.round(project_score) : null,
        layout_score: typeof layout_score === 'number' ? Math.round(layout_score) : null,
        strengths: strengths ?? [],
        weaknesses: weaknesses ?? [],
        improvement_roadmap: improvement_roadmap ?? [],
        full_analysis_json,
        analysis_date: new Date().toISOString(),
      })
      .select('id, email, target_role, resume_version, readiness_score, analysis_date')
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      persisted: true,
      message: 'Analysis saved to history.',
      data,
    });
  } catch (err) {
    console.error('[Supabase] history insert error:', err.message);
    
    // In-Memory Fallback
    const userEmail = email.trim().toLowerCase();
    const existingRecords = localMemoryStore.filter(r => r.email === userEmail && r.target_role === target_role);
    const version = resume_version ?? (existingRecords.length + 1);

    const newRecord = {
      id: `local-${memoryIdCounter++}`,
      email: userEmail,
      target_role,
      resume_version: version,
      readiness_score: Math.round(readiness_score),
      ats_score: typeof ats_score === 'number' ? Math.round(ats_score) : null,
      skills_score: typeof skills_score === 'number' ? Math.round(skills_score) : null,
      project_score: typeof project_score === 'number' ? Math.round(project_score) : null,
      layout_score: typeof layout_score === 'number' ? Math.round(layout_score) : null,
      strengths: strengths ?? [],
      weaknesses: weaknesses ?? [],
      improvement_roadmap: improvement_roadmap ?? [],
      full_analysis_json,
      analysis_date: new Date().toISOString(),
    };

    localMemoryStore.push(newRecord);

    return res.status(201).json({
      success: true,
      persisted: false,
      message: 'Analysis saved to local session memory (database not configured).',
      data: {
        id: newRecord.id,
        email: newRecord.email,
        target_role: newRecord.target_role,
        resume_version: newRecord.resume_version,
        readiness_score: newRecord.readiness_score,
        analysis_date: newRecord.analysis_date,
      }
    });
  }
};

// ── GET /api/history?email=&target_role= ─────────────────────────────────────
const getHistory = async (req, res) => {
  const { email, target_role } = req.query;

  if (!email || !isValidEmail(email)) {
    return res.status(422).json({
      success: false,
      message: 'A valid email query param is required.',
    });
  }

  const userEmail = email.trim().toLowerCase();

  try {
    const supabase = getSupabase();

    let query = supabase
      .from('resume_history')
      .select(
        'id, email, target_role, resume_version, readiness_score, ats_score, skills_score, project_score, layout_score, strengths, weaknesses, improvement_roadmap, analysis_date, full_analysis_json'
      )
      .eq('email', userEmail)
      .order('analysis_date', { ascending: true });

    // Optional role filter
    if (target_role && typeof target_role === 'string' && target_role.trim()) {
      query = query.eq('target_role', target_role.trim());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Derive unique roles for the filter dropdown
    const allRoles = [...new Set((data ?? []).map((r) => r.target_role))];

    return res.status(200).json({
      success: true,
      persisted: true,
      data: data ?? [],
      available_roles: allRoles,
    });
  } catch (err) {
    console.error('[Supabase] history fetch error:', err.message);
    
    // In-Memory Fallback
    let data = localMemoryStore.filter(r => r.email === userEmail);
    const allRoles = [...new Set(data.map(r => r.target_role))];

    if (target_role && typeof target_role === 'string' && target_role.trim()) {
      data = data.filter(r => r.target_role === target_role.trim());
    }

    data.sort((a, b) => new Date(a.analysis_date).getTime() - new Date(b.analysis_date).getTime());

    return res.status(200).json({
      success: true,
      persisted: false,
      data,
      available_roles: allRoles,
      message: 'Retrieved from local session memory (Supabase not connected).',
    });
  }
};

module.exports = { saveHistory, getHistory };
