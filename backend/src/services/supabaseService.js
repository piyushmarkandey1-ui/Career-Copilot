const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseAnonKey } = require('../config/env');

// Initialize Supabase client
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️  Supabase credentials not configured. Database features will be disabled.');
}

/**
 * Save resume analysis result to Supabase
 * @param {Object} data - Analysis data to save
 * @returns {Promise<Object>} Saved record
 */
async function saveAnalysisResult(data) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { email, targetRole, filename, analysis, metadata } = data;

  // Prepare record
  const record = {
    email: email,
    target_role: targetRole,
    filename: filename,
    readiness_score: analysis.readiness_score,
    one_liner: analysis.one_liner,
    brutal_gaps: analysis.brutal_gaps,
    fix_it_roadmap: analysis.fix_it_roadmap,
    num_pages: metadata?.numPages || null,
    text_length: metadata?.textLength || null,
    created_at: new Date().toISOString(),
  };

  const { data: savedData, error } = await supabase
    .from('resume_results')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    throw new Error(`Failed to save result: ${error.message}`);
  }

  return savedData;
}

/**
 * Get all results for a specific email
 * @param {string} email - User email
 * @returns {Promise<Array>} List of results
 */
async function getResultsByEmail(email) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('resume_results')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase query error:', error);
    throw new Error(`Failed to fetch results: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific result by ID
 * @param {string} id - Result ID
 * @returns {Promise<Object>} Result record
 */
async function getResultById(id) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('resume_results')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase query error:', error);
    throw new Error(`Failed to fetch result: ${error.message}`);
  }

  return data;
}

/**
 * Check if Supabase is configured and ready
 * @returns {boolean}
 */
function isSupabaseConfigured() {
  return supabase !== null;
}

module.exports = {
  saveAnalysisResult,
  getResultsByEmail,
  getResultById,
  isSupabaseConfigured,
};
