-- Migration 8: Quota system tables (provider_usage, transcription_jobs, notifications) and check constraint updates
-- Run this in the Supabase SQL Editor

-- 1. Alter transcripts check constraint to allow assemblyai and deepgram
ALTER TABLE public.transcripts DROP CONSTRAINT IF EXISTS transcripts_transcription_provider_check;
ALTER TABLE public.transcripts ADD CONSTRAINT transcripts_transcription_provider_check CHECK (
  transcription_provider IN ('groq', 'gladia', 'assemblyai', 'deepgram')
);

-- 2. Create provider_usage table
CREATE TABLE IF NOT EXISTS public.provider_usage (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL CHECK (provider IN ('groq', 'gladia', 'assemblyai', 'deepgram')),
  month_year     TEXT NOT NULL, -- Format: 'YYYY-MM'
  minutes_used   DOUBLE PRECISION NOT NULL DEFAULT 0,
  minutes_limit  DOUBLE PRECISION NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, month_year)
);

-- 3. Create transcription_jobs table (for queuing transcripts when quotas are exhausted)
CREATE TABLE IF NOT EXISTS public.transcription_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript_id  UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  audio_url      TEXT, -- Supabase Storage key
  language       TEXT,
  model          TEXT,
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  message        TEXT NOT NULL,
  read           BOOLEAN NOT NULL DEFAULT FALSE,
  type           TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.provider_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcription_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
CREATE POLICY "own_provider_usage" ON public.provider_usage
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_transcription_jobs" ON public.transcription_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- 7. Create Indexes
CREATE INDEX IF NOT EXISTS idx_provider_usage_user_month ON public.provider_usage(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_transcription_jobs_status ON public.transcription_jobs(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
