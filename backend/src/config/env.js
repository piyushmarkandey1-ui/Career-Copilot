require('dotenv').config();

function isSupabaseConfiguredEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  return url && key && 
         url !== 'your_supabase_url_here' && 
         key !== 'your_supabase_anon_key_here' &&
         url.includes('supabase.co');
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  isSupabaseConfiguredEnv,
};
