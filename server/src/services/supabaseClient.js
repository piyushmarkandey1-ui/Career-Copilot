/**
 * supabaseClient.js
 *
 * Singleton Supabase client for the server.
 * Uses the SERVICE ROLE key so the backend can bypass RLS
 * when writing results. Never expose this key to the browser.
 */

const { createClient } = require('@supabase/supabase-js');

let _client = null;

const getSupabase = () => {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw Object.assign(
      new Error(
        'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
      ),
      { status: 500 }
    );
  }

  _client = createClient(url, key, {
    auth: {
      // We're operating server-side — disable auto session persistence
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _client;
};

module.exports = { getSupabase };
