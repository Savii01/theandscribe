-- Migration 1: profiles table
-- Run this in Supabase SQL Editor

CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT,
  avatar_url       TEXT,
  role             TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('dark','light')),
  onboarded        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profiles" ON profiles FOR ALL USING (auth.uid() = id);
