-- SQL_SAFE_GRANTS.sql
-- Executar este script no Supabase SQL Editor para aplicar GRANTs apenas se as funções existirem.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_my_profile_if_missing') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_my_profile_if_missing() TO authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_org_id') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_current_org_id() TO authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_label_count') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.increment_label_count(INT) TO authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_new_user_profile') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.complete_new_user_profile(TEXT, TEXT) TO authenticated';
  END IF;
END$$;

SELECT 'SAFE GRANTS APPLIED' AS status;
