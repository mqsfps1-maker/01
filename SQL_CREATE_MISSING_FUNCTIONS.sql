-- SQL_CREATE_MISSING_FUNCTIONS.sql
-- Cria funções ausentes necessárias pela aplicação e aplica grants.
-- Execute no Supabase SQL Editor (copiar + RUN).

-- 1) create_my_profile_if_missing(): cria um perfil em public.users a partir de auth.users
CREATE OR REPLACE FUNCTION public.create_my_profile_if_missing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_auth_user RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    SELECT email, raw_user_meta_data, raw_app_meta_data, phone INTO v_auth_user
    FROM auth.users WHERE id = v_user_id;

    IF FOUND THEN
      INSERT INTO public.users (
        id, email, role, name, avatar, auth_provider, phone, has_set_password, created_at
      ) VALUES (
        v_user_id,
        v_auth_user.email,
        'CLIENTE_GERENTE',
        COALESCE(v_auth_user.raw_user_meta_data->>'full_name', v_auth_user.raw_user_meta_data->>'name', v_auth_user.email),
        v_auth_user.raw_user_meta_data->>'avatar_url',
        v_auth_user.raw_app_meta_data->>'provider',
        COALESCE(v_auth_user.phone, v_auth_user.raw_user_meta_data->>'phone'),
        FALSE,
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END;
$$;

-- 2) save_etiqueta_history(): insere e retorna id (UUID) — usado pela UI
CREATE OR REPLACE FUNCTION public.save_etiqueta_history(
  p_created_by_name TEXT,
  p_page_count INT,
  p_zpl_content TEXT,
  p_settings_snapshot JSONB,
  p_page_hashes TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_org UUID := (SELECT organization_id FROM public.users WHERE id = auth.uid());
BEGIN
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Usuário não pertence a uma organização.';
  END IF;

  INSERT INTO public.etiquetas_historico (created_by_name, page_count, zpl_content, settings_snapshot, page_hashes, organization_id)
  VALUES (p_created_by_name, p_page_count, p_zpl_content, p_settings_snapshot, p_page_hashes, v_org)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 3) increment_label_count_safe(amount INT) -> jsonb (success, error, remaining)
CREATE OR REPLACE FUNCTION public.increment_label_count_safe(amount INT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_plan_limit INT := 200;
    v_monthly_count INT := 0;
    v_bonus INT := 0;
    v_new_total INT;
    v_remaining INT;
    v_status TEXT;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.users WHERE id = auth.uid();
    IF v_org_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário sem organização', 'remaining', 0);
    END IF;

    SELECT COALESCE(s.monthly_label_count, 0), COALESCE(s.bonus_balance, 0), COALESCE(p.label_limit, 200), s.status
    INTO v_monthly_count, v_bonus, v_plan_limit, v_status
    FROM public.subscriptions s
    LEFT JOIN public.plans p ON s.plan_id = p.id
    WHERE s.organization_id = v_org_id
    LIMIT 1;

    IF v_status IS NULL THEN
        v_status := 'trialing';
    END IF;

    v_new_total := v_monthly_count + amount;
    v_remaining := (v_plan_limit + v_bonus) - v_new_total;

    IF v_new_total > (v_plan_limit + v_bonus) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cota insuficiente', 'remaining', GREATEST((v_plan_limit + v_bonus) - v_monthly_count, 0));
    END IF;

    UPDATE public.subscriptions SET monthly_label_count = v_new_total WHERE organization_id = v_org_id;

    RETURN jsonb_build_object('success', true, 'error', '', 'remaining', v_remaining);
END;
$$;

-- 4) complete_new_user_profile(p_cpf_cnpj, p_organization_name) -> jsonb (used by onboarding)
CREATE OR REPLACE FUNCTION public.complete_new_user_profile(p_cpf_cnpj TEXT, p_organization_name TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_organization_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
    END IF;

    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id AND organization_id IS NOT NULL) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Perfil já completo');
    END IF;

    INSERT INTO public.organizations (name, cpf_cnpj) VALUES (p_organization_name, p_cpf_cnpj) RETURNING id INTO v_organization_id;

    UPDATE public.users SET organization_id = v_organization_id, cpf_cnpj = p_cpf_cnpj, has_set_password = TRUE WHERE id = v_user_id;

    UPDATE public.organizations SET owner_id = v_user_id WHERE id = v_organization_id;

    -- criar assinatura padrão (trial) caso não exista
    INSERT INTO public.subscriptions (organization_id, plan_id, status, period_end, monthly_label_count, bonus_balance)
    SELECT v_organization_id, p.id, 'trialing', NOW() + INTERVAL '7 days', 0, 0
    FROM public.plans p WHERE p.name = 'Starter' LIMIT 1
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('success', true, 'organization_id', v_organization_id);
END;
$$;

-- 5) Grants (aplicar permissões de execução)
GRANT EXECUTE ON FUNCTION public.create_my_profile_if_missing() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_etiqueta_history(TEXT, INT, TEXT, JSONB, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_label_count_safe(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_new_user_profile(TEXT, TEXT) TO authenticated;

-- 6) Segurança final: mensagem de sucesso
SELECT 'MISSING FUNCTIONS CREATED AND GRANTED' AS status;
