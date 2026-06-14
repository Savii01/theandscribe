-- Migration 4: ai_outputs table
-- Run this in Supabase SQL Editor

CREATE TABLE public.ai_outputs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  output_type   TEXT NOT NULL CHECK (output_type IN (
                  'summary_short','summary_detailed','summary_executive',
                  'key_insights','action_items','chapters',
                  'blog_post','seo_article',
                  'linkedin_post','twitter_thread',
                  'instagram_caption','facebook_post',
                  'study_notes','meeting_notes','research_notes'
                )),
  content       TEXT NOT NULL,
  model_used    TEXT DEFAULT 'llama-3.3-70b-versatile',
  provider      TEXT DEFAULT 'groq',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_ai_outputs" ON ai_outputs FOR ALL
  USING (transcript_id IN (
    SELECT id FROM transcripts WHERE user_id = auth.uid()
  ));

CREATE INDEX idx_ai_outputs_type ON ai_outputs(transcript_id, output_type);
