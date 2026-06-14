-- Migration 2: transcripts table
-- Run this in Supabase SQL Editor

CREATE TABLE public.transcripts (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                  TEXT NOT NULL DEFAULT 'Untitled Transcript',
  source_type            TEXT NOT NULL CHECK (source_type IN ('upload','youtube','url')),
  source_url             TEXT,
  original_filename      TEXT,
  duration_seconds       INTEGER,
  language_detected      TEXT,
  whisper_model          TEXT DEFAULT 'whisper-large-v3',
  transcription_provider TEXT DEFAULT 'groq' CHECK (
                           transcription_provider IN ('groq','gladia')),
  status                 TEXT NOT NULL DEFAULT 'pending' CHECK (
                           status IN ('pending','processing','completed','failed')),
  error_message          TEXT,
  word_count             INTEGER,
  search_vector          TSVECTOR,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_transcripts" ON transcripts
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_transcripts_user_id   ON transcripts(user_id);
CREATE INDEX idx_transcripts_status    ON transcripts(status);
CREATE INDEX idx_transcripts_created_at ON transcripts(created_at DESC);
CREATE INDEX idx_transcripts_fts       ON transcripts USING GIN(search_vector);
