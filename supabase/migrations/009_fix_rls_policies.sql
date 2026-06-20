-- Migration 9: Fix RLS policies with explicit per-operation policies
-- The original FOR ALL ... USING policies may not correctly permit INSERT/UPDATE
-- because WITH CHECK defaults are nuanced. Explicit policies are safer.
--
-- Run this in Supabase SQL Editor (https://app.supabase.com → SQL Editor)

-- ============================================================
-- PROFILES TABLE
-- ============================================================
DROP POLICY IF EXISTS "own_profiles" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================================
-- TRANSCRIPTS TABLE
-- ============================================================
DROP POLICY IF EXISTS "own_transcripts" ON public.transcripts;

CREATE POLICY "transcripts_select" ON public.transcripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transcripts_insert" ON public.transcripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transcripts_update" ON public.transcripts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transcripts_delete" ON public.transcripts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- TRANSCRIPT_VERSIONS TABLE
-- ============================================================
DROP POLICY IF EXISTS "own_versions" ON public.transcript_versions;

CREATE POLICY "versions_select" ON public.transcript_versions
  FOR SELECT USING (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  );

CREATE POLICY "versions_insert" ON public.transcript_versions
  FOR INSERT WITH CHECK (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  );

CREATE POLICY "versions_update" ON public.transcript_versions
  FOR UPDATE USING (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  ) WITH CHECK (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  );

CREATE POLICY "versions_delete" ON public.transcript_versions
  FOR DELETE USING (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  );

-- ============================================================
-- PROCESSING_JOBS TABLE
-- ============================================================
DROP POLICY IF EXISTS "own_jobs" ON public.processing_jobs;

CREATE POLICY "jobs_select" ON public.processing_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "jobs_insert" ON public.processing_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_update" ON public.processing_jobs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_delete" ON public.processing_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- AI_OUTPUTS TABLE
-- ============================================================
DROP POLICY IF EXISTS "own_ai_outputs" ON public.ai_outputs;

CREATE POLICY "ai_outputs_select" ON public.ai_outputs
  FOR SELECT USING (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  );

CREATE POLICY "ai_outputs_insert" ON public.ai_outputs
  FOR INSERT WITH CHECK (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  );

CREATE POLICY "ai_outputs_update" ON public.ai_outputs
  FOR UPDATE USING (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  ) WITH CHECK (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  );

CREATE POLICY "ai_outputs_delete" ON public.ai_outputs
  FOR DELETE USING (
    transcript_id IN (SELECT id FROM public.transcripts WHERE user_id = auth.uid())
  );

-- ============================================================
-- Grant table-level permissions to authenticated and anon roles
-- This is CRITICAL: RLS policies only filter rows;
-- the role still needs base table privileges.
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transcripts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transcript_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processing_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_outputs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transcripts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transcript_versions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processing_jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_outputs TO anon;
