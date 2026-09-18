-- =============================================
-- Kura — Follow posts (notify on new comments)
-- Migration 010: purely ADDITIVE (one table + policies)
-- =============================================

CREATE TABLE IF NOT EXISTS public.post_follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_follows_user ON public.post_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_post_follows_post ON public.post_follows(post_id);

ALTER TABLE public.post_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own post follows" ON public.post_follows;
CREATE POLICY "Users can view own post follows"
  ON public.post_follows FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can follow posts" ON public.post_follows;
CREATE POLICY "Users can follow posts"
  ON public.post_follows FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unfollow posts" ON public.post_follows;
CREATE POLICY "Users can unfollow posts"
  ON public.post_follows FOR DELETE USING (auth.uid() = user_id);
