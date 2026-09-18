-- =============================================
-- Kura — Global admins can update any community
-- Migration 014: additive policy repair (nothing removed)
--
-- The community edit page lets creators, community moderators, and
-- global admins update appearance/text. The first two were already
-- covered; this adds the global-admin branch. Idempotent.
-- Run in the Supabase SQL editor.
-- =============================================

DROP POLICY IF EXISTS "Community creators and moderators can update" ON public.communities;
CREATE POLICY "Community creators and moderators can update"
  ON public.communities FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = id AND user_id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
