-- Migration 7: search vector trigger
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transcripts_search_update
  BEFORE INSERT OR UPDATE ON transcripts
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();
