-- =============================================
-- Kura — Bulletproof author/staff deletes via RPC
-- Migration 013: one additive script (two functions, no tables touched)
--
-- Why this exists: client-side UPDATEs depend on the RLS UPDATE policies
-- being present and correct. If a database missed or mangled those
-- policies (partial migration history), every delete dies with
-- "new row violates row-level security policy" no matter what the app
-- does. These SECURITY DEFINER functions enforce the SAME rules
-- (author, or admin for deletes) in code, so deletes work regardless
-- of RLS policy state — and report exactly WHY when they refuse.
--
-- Return shape (jsonb): { ok: true } or
--   { ok: false, code: 'no_session' | 'not_found' | 'forbidden',
--     owner: <author uuid or null>, caller: <uid or null> }
-- Safe to re-run. Run in the Supabase SQL editor.
-- =============================================

-- ---------- delete_post ----------
CREATE OR REPLACE FUNCTION public.delete_post(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_author uuid;
  v_role text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'no_session', 'owner', NULL, 'caller', NULL);
  END IF;

  SELECT author_id INTO v_author FROM public.posts WHERE id = p_post_id;
  IF v_author IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'owner', NULL, 'caller', v_uid);
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;

  IF v_author <> v_uid AND (v_role IS DISTINCT FROM 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'owner', v_author, 'caller', v_uid);
  END IF;

  UPDATE public.posts SET is_removed = true WHERE id = p_post_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_post(uuid) TO authenticated;

-- ---------- delete_comment ----------
CREATE OR REPLACE FUNCTION public.delete_comment(p_comment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_author uuid;
  v_role text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'no_session', 'owner', NULL, 'caller', NULL);
  END IF;

  SELECT author_id INTO v_author FROM public.comments WHERE id = p_comment_id;
  IF v_author IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'owner', NULL, 'caller', v_uid);
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;

  IF v_author <> v_uid AND (v_role IS DISTINCT FROM 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'owner', v_author, 'caller', v_uid);
  END IF;

  UPDATE public.comments SET is_removed = true, body = '[deleted]' WHERE id = p_comment_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_comment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_comment(uuid) TO authenticated;
