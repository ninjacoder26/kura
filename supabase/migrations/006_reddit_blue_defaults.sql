-- =============================================
-- Kura — Reddit-blue community defaults
-- Migration 006: purely ADDITIVE (no tables/columns removed)
--
-- New communities default to Reddit blue instead of indigo.
-- Existing rows keep whatever color they already have.
-- Run in the Supabase SQL editor alongside 001–005.
-- =============================================

ALTER TABLE public.communities
  ALTER COLUMN color SET DEFAULT '#0079D3'::text;
