-- ============================================================
--  Career Copilot — Supabase migration
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Enable the pgcrypto extension for gen_random_uuid()
--    (already enabled on most Supabase projects — safe to run twice)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create the results table
CREATE TABLE IF NOT EXISTS public.results (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT,                          -- optional; NULL when user skips
  role        TEXT        NOT NULL,          -- target role string
  score       INTEGER     NOT NULL           -- readiness score 0-100
                          CHECK (score BETWEEN 0 AND 100),
  ai_result   JSONB       NOT NULL,          -- full Gemini response payload
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Useful indexes
CREATE INDEX IF NOT EXISTS results_email_idx      ON public.results (email);
CREATE INDEX IF NOT EXISTS results_role_idx       ON public.results (role);
CREATE INDEX IF NOT EXISTS results_score_idx      ON public.results (score);
CREATE INDEX IF NOT EXISTS results_created_at_idx ON public.results (created_at DESC);

-- 4. Row Level Security — table is private by default;
--    the backend uses the service-role key which bypasses RLS entirely.
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Optional: allow authenticated users to read their own rows
-- (uncomment when you add Supabase Auth)
--
-- CREATE POLICY "Users can read own results"
--   ON public.results FOR SELECT
--   USING (auth.jwt() ->> 'email' = email);

-- 5. Helper view — latest result per email (useful for analytics)
CREATE OR REPLACE VIEW public.latest_results_per_email AS
SELECT DISTINCT ON (email)
  id, email, role, score, created_at
FROM public.results
WHERE email IS NOT NULL
ORDER BY email, created_at DESC;

-- ============================================================
--  Verify
-- ============================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'results'
ORDER BY ordinal_position;
