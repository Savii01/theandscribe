-- Migration 3: transcript_versions table
-- Run this in Supabase SQL Editor

CREATE TABLE public.transcript_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id  UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        TEXT NOT NULL,
  segments       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transcript_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_versions" ON transcript_versions FOR ALL
  USING (transcript_id IN (
    SELECT id FROM transcripts WHERE user_id = auth.uid()
  ));

CREATE INDEX idx_versions_transcript ON transcript_versions(transcript_id);
