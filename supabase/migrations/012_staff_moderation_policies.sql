-- =============================================
-- Kura — Staff moderation powers in RLS
-- Migration 012: purely ADDITIVE repair (no tables/columns removed)
--
-- Problem: the app shows admins a Remove button, but the database only
-- ever permitted the raw author — so admin removals (and any author
-- update when policies are otherwise stale) die with:
--   "new row violates row-level security policy"
-- This migration grants, idempotently (works with or without 007):
--   posts/comments UPDATE → author OR moderator OR admin
--   posts/comments DELETE → author OR admin
-- Run in the Supabase SQL editor AFTER 007.
-- =============================================

-- ---------- POSTS UPDATE (author + staff) ----------
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- ---------- POSTS DELETE (author + admin) ----------
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
CREATE POLICY "Authors can delete own posts"
  ON public.posts FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---------- COMMENTS UPDATE (author + staff) ----------
DROP POLICY IF EXISTS "Authors can update own comments" ON public.comments;
CREATE POLICY "Authors can update own comments"
  ON public.comments FOR UPDATE USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- ---------- COMMENTS DELETE (author + admin) ----------
DROP POLICY IF EXISTS "Authors can delete own comments" ON public.comments;
CREATE POLICY "Authors can delete own comments"
  ON public.comments FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
