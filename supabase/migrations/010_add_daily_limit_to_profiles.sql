-- Migration 10: Add daily_limit and daily_usage_offset to profiles
-- Run this in the Supabase SQL Editor

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 10 CHECK (daily_limit >= 0),
ADD COLUMN IF NOT EXISTS daily_usage_offset INTEGER DEFAULT 0 CHECK (daily_usage_offset >= 0);
