require('dotenv').config();

const PLACEHOLDER_VALUES = new Set([
  'your_api_key_here',
  'your_supabase_url_here',
  'your_supabase_anon_key_here',
  'sk-ant-...',
]);

function isRealEnvValue(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed)) return false;
  if (trimmed.includes('...')) return false;
  return true;
}

function isAnthropicConfigured() {
  const key = process.env.ANTHROPIC_API_KEY;
  return isRealEnvValue(key) && key.trim().startsWith('sk-ant-');
}

function isSupabaseConfiguredEnv() {
  return (
    isRealEnvValue(process.env.SUPABASE_URL) &&
    isRealEnvValue(process.env.SUPABASE_ANON_KEY)
  );
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  isAnthropicConfigured,
  isSupabaseConfiguredEnv,
};
