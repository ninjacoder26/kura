-- =============================================
-- Kura — Profile customization + storage hardening
-- Migration 005: purely ADDITIVE (no tables/columns removed)
--
-- Fixes "customize profile throws Supabase error":
--  1. Ensures every column the settings page writes actually exists
--     (safe to run even if 001/003 were applied — IF NOT EXISTS).
--  2. Re-uploading a profile banner failed with an RLS violation:
--     settings uses upsert on fixed paths, but only `avatars` had
--     UPDATE/DELETE storage policies. Adds the missing policies for
--     all app buckets.
--  3. Hardens handle_new_user so a username collision can never
--     abort signup (unique violation in the trigger used to fail
--     the whole auth.users insert).
-- =============================================

-- 1. Profile columns used by /settings (all idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS twitter text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS github text,
  ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#dc143c'::text;

-- 2. Buckets used by avatar / banner / post / community uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('community-banners', 'community-banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('community-icons', 'community-icons', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('post-images', 'post-images', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 3. Missing UPDATE/DELETE storage policies.
-- Settings saves avatar/banner with upsert:true on fixed per-user paths
-- (<user_id>/avatar.ext, <user_id>/banner.ext), so re-uploads need
-- UPDATE permission. (Policies are not tables — recreating them is safe.)
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update profile banners" ON storage.objects;
CREATE POLICY "Users can update profile banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'community-banners');

DROP POLICY IF EXISTS "Users can delete profile banners" ON storage.objects;
CREATE POLICY "Users can delete profile banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-banners');

DROP POLICY IF EXISTS "Users can update own post images" ON storage.objects;
CREATE POLICY "Users can update own post images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own post images" ON storage.objects;
CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update community icons" ON storage.objects;
CREATE POLICY "Users can update community icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'community-icons');

DROP POLICY IF EXISTS "Users can delete community icons" ON storage.objects;
CREATE POLICY "Users can delete community icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-icons');

-- 4. Collision-safe auto profile creation (replaces 001 version).
-- Previously two users with the same email prefix (e.g. OAuth signups)
-- made the trigger raise a unique violation and abort signup entirely.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
BEGIN
  base_username := coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1), 'user');
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  base_username := substring(base_username from 1 for 20);
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;

  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    final_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), final_username),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
