-- =============================================
-- Kura — Ensure every RLS policy exists with correct semantics
-- Migration 007: purely ADDITIVE repair (no tables/columns removed)
--
-- Symptom fixed: authors getting
--   "new row violates row-level security policy for table posts"
-- on their own UPDATE/DELETE. That error means the UPDATE policy check
-- failed — most commonly because a live database is missing the policy
-- (partial migration history) or carries a stale variant. No client code
-- can fix that; the policy must exist server-side.
--
-- This file drops and recreates every policy from 001/004/005 with
-- identical semantics, so running it is always safe and converges any
-- database to the correct state. Run in the Supabase SQL editor.
-- =============================================

-- ---------- PROFILES ----------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ---------- COMMUNITIES ----------
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities;
CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT
  USING (NOT is_private OR EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

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
  );

-- ---------- COMMUNITY_MEMBERS ----------
DROP POLICY IF EXISTS "Community members are viewable by everyone" ON public.community_members;
CREATE POLICY "Community members are viewable by everyone"
  ON public.community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can join communities" ON public.community_members;
CREATE POLICY "Authenticated users can join communities"
  ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE USING (auth.uid() = user_id);

-- ---------- POSTS ----------
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT USING (NOT is_removed);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
CREATE POLICY "Authors can delete own posts"
  ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- ---------- COMMENTS ----------
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (NOT is_removed);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own comments" ON public.comments;
CREATE POLICY "Authors can update own comments"
  ON public.comments FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own comments" ON public.comments;
CREATE POLICY "Authors can delete own comments"
  ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- ---------- VOTES ----------
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote" ON public.votes;
CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
CREATE POLICY "Users can update own votes"
  ON public.votes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
CREATE POLICY "Users can delete own votes"
  ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- ---------- SAVED_POSTS ----------
DROP POLICY IF EXISTS "Users can view own saved posts" ON public.saved_posts;
CREATE POLICY "Users can view own saved posts"
  ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save posts" ON public.saved_posts;
CREATE POLICY "Users can save posts"
  ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave posts" ON public.saved_posts;
CREATE POLICY "Users can unsave posts"
  ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

-- ---------- REPORTS ----------
DROP POLICY IF EXISTS "Reporters can view own reports" ON public.reports;
CREATE POLICY "Reporters can view own reports"
  ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Moderators can view all reports" ON public.reports;
CREATE POLICY "Moderators can view all reports"
  ON public.reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));

DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Moderators can update reports" ON public.reports;
CREATE POLICY "Moderators can update reports"
  ON public.reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));

-- ---------- MODERATION_LOGS ----------
DROP POLICY IF EXISTS "Moderators can view moderation logs" ON public.moderation_logs;
CREATE POLICY "Moderators can view moderation logs"
  ON public.moderation_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));

DROP POLICY IF EXISTS "Moderators can create moderation logs" ON public.moderation_logs;
CREATE POLICY "Moderators can create moderation logs"
  ON public.moderation_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));

-- ---------- NOTIFICATIONS ----------
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ---------- STORAGE (buckets + policies, idempotent) ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('community-banners', 'community-banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('community-icons', 'community-icons', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('post-images', 'post-images', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
CREATE POLICY "Users can upload post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload community banners" ON storage.objects;
CREATE POLICY "Users can upload community banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-banners');

DROP POLICY IF EXISTS "Users can upload community icons" ON storage.objects;
CREATE POLICY "Users can upload community icons"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-icons');

DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public read access for post images" ON storage.objects;
CREATE POLICY "Public read access for post images"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Public read access for community banners" ON storage.objects;
CREATE POLICY "Public read access for community banners"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'community-banners');

DROP POLICY IF EXISTS "Public read access for community icons" ON storage.objects;
CREATE POLICY "Public read access for community icons"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'community-icons');

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update profile banners" ON storage.objects;
CREATE POLICY "Users can update profile banners"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'community-banners');

DROP POLICY IF EXISTS "Users can delete profile banners" ON storage.objects;
CREATE POLICY "Users can delete profile banners"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-banners');

DROP POLICY IF EXISTS "Users can update own post images" ON storage.objects;
CREATE POLICY "Users can update own post images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own post images" ON storage.objects;
CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update community icons" ON storage.objects;
CREATE POLICY "Users can update community icons"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'community-icons');

DROP POLICY IF EXISTS "Users can delete community icons" ON storage.objects;
CREATE POLICY "Users can delete community icons"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-icons');
