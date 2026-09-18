-- =============================================
-- Kura — AI post tags for the recommendation engine
-- Migration 008: purely ADDITIVE (one column + one index)
--
-- posts.tags holds 3–8 normalized lowercase tags per post, written by
-- the /api/tag-post route (Groq). The home feed blends per-user tag
-- affinity from upvotes into ranking. Run in the Supabase SQL editor.
-- =============================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING gin (tags);
