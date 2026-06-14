-- Career Copilot Database Schema
-- Run this in your Supabase SQL Editor

-- Create resume_results table
CREATE TABLE IF NOT EXISTS resume_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  target_role TEXT NOT NULL,
  filename TEXT NOT NULL,
  readiness_score INTEGER NOT NULL CHECK (readiness_score >= 0 AND readiness_score <= 100),
  one_liner TEXT NOT NULL,
  brutal_gaps JSONB NOT NULL,
  fix_it_roadmap JSONB NOT NULL,
  num_pages INTEGER,
  text_length INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster queries
CREATE INDEX IF NOT EXISTS idx_resume_results_email ON resume_results(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_resume_results_created_at ON resume_results(created_at DESC);

-- Create index on target_role for filtering
CREATE INDEX IF NOT EXISTS idx_resume_results_target_role ON resume_results(target_role);

-- Enable Row Level Security (RLS)
ALTER TABLE resume_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own results
CREATE POLICY "Users can view their own results"
ON resume_results FOR SELECT
USING (true);  -- For now, allow all reads. In production, add auth: auth.uid() = user_id

-- Create policy to allow inserts
CREATE POLICY "Anyone can insert results"
ON resume_results FOR INSERT
WITH CHECK (true);  -- For now, allow all inserts. In production, add auth checks

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resume_results_updated_at
BEFORE UPDATE ON resume_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sample query to verify table
-- SELECT * FROM resume_results ORDER BY created_at DESC LIMIT 10;
