-- =============================================
-- Kura — Grant the developer admin account
-- Migration 009: data-only, idempotent, nothing removed
--
-- Gives ninjacoder26@gmail.com the 'admin' role (yellow crown badge +
-- moderation powers in the app). Safe to re-run. Run in the Supabase
-- SQL editor.
-- =============================================

UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE id IN (SELECT id FROM auth.users WHERE email = 'ninjacoder26@gmail.com')
  AND (role IS DISTINCT FROM 'admin');
