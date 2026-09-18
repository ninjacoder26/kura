-- =============================================
-- Kura — Searchable post tags (prefix/substring matching)
-- Migration 011: purely ADDITIVE (one generated column + one index)
--
-- Problem: Postgres cannot ILIKE a text[] column, so typing a tag
-- prefix ("dis") could never match stored tags ("discussion").
-- Fix: a STORED generated column flattening tags to text, indexed
-- with trigrams for fast substring search. It stays in sync
-- automatically — no app code needed. Run in the Supabase SQL editor
-- AFTER 008 (guarded: safely no-ops if 008 was skipped).
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.posts
      ADD COLUMN IF NOT EXISTS tags_text text
      GENERATED ALWAYS AS (array_to_string(tags, ' ')) STORED;
    CREATE INDEX IF NOT EXISTS idx_posts_tags_text
      ON public.posts USING gin (tags_text gin_trgm_ops);
  END IF;
END $$;
