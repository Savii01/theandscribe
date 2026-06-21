-- Migration 012: Add brand_voice column to profiles
-- Allows users to define a brand tone/style that gets injected into AI generation prompts.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brand_voice TEXT DEFAULT NULL
  CHECK (char_length(brand_voice) <= 500);
