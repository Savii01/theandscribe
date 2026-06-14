-- Migration 5: processing_jobs table
-- Run this in Supabase SQL Editor

CREATE TABLE public.processing_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'queued' CHECK (
                  status IN ('queued','running','completed','failed')),
  provider_used TEXT,
  attempts      INTEGER DEFAULT 0,
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_jobs" ON processing_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_jobs_status ON processing_jobs(status);
