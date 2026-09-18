-- =============================================
-- Kura — Searchable post tags (prefix/substring matching)
-- Migration 011: purely ADDITIVE (one helper + one column + one index)
--
-- Problem: Postgres cannot ILIKE a text[] column, so typing a tag
-- prefix ("dis") could never match stored tags ("discussion").
-- Fix: a STORED generated column flattening tags to text, indexed
-- with trigrams for fast substring search. It stays in sync
-- automatically — no app code maintains it.
--
-- Technical note: array_to_string is only STABLE, but generated
-- columns require IMMUTABLE expressions, so the join goes through a
-- thin immutable wrapper (standard workaround — same computation).
--
-- Guarded: safely no-ops if 008 was skipped. Safe to re-run (the
-- first version of this file errored before creating anything).
-- Run in the Supabase SQL editor AFTER 008.
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Immutable wrapper (required for use in a GENERATED column)
CREATE OR REPLACE FUNCTION public.immutable_array_to_text(arr text[], sep text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT array_to_string(arr, sep)
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.posts
      ADD COLUMN IF NOT EXISTS tags_text text
      GENERATED ALWAYS AS (public.immutable_array_to_text(tags, ' ')) STORED;
    CREATE INDEX IF NOT EXISTS idx_posts_tags_text
      ON public.posts USING gin (tags_text gin_trgm_ops);
  END IF;
END $$;
