-- SQL_SYNC_ADDITIONAL_FIXES.sql
-- Correções adicionais para sincronizar o DB e resolver: import_history, etiquetas_historico, app_settings, subscriptions e RPCs.
-- Execute este script no Supabase SQL Editor (copiar + RUN).

-- 1) Garantir políticas de RLS para tabelas críticas (permitir ações apenas para o tenant correto)

-- app_settings
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver configurações da sua organização" ON public.app_settings;
DROP POLICY IF EXISTS "Usuários podem atualizar configurações da sua organização" ON public.app_settings;
DROP POLICY IF EXISTS "Usuários podem inserir configurações da sua organização" ON public.app_settings;
CREATE POLICY "Usuários podem ver configurações da sua organização" ON public.app_settings FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem atualizar configurações da sua organização" ON public.app_settings FOR UPDATE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem inserir configurações da sua organização" ON public.app_settings FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());

-- import_history
ALTER TABLE IF EXISTS public.import_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Import: tenant select" ON public.import_history;
DROP POLICY IF EXISTS "Import: tenant insert" ON public.import_history;
CREATE POLICY "Import: tenant select" ON public.import_history FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Import: tenant insert" ON public.import_history FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());

-- etiquetas_historico
ALTER TABLE IF EXISTS public.etiquetas_historico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Etiquetas: tenant select" ON public.etiquetas_historico;
DROP POLICY IF EXISTS "Etiquetas: tenant insert" ON public.etiquetas_historico;
CREATE POLICY "Etiquetas: tenant select" ON public.etiquetas_historico FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Etiquetas: tenant insert" ON public.etiquetas_historico FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());

-- subscriptions (allow authenticated users to read/write their organization's subscription)
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Subscriptions: tenant policy" ON public.subscriptions;
CREATE POLICY "Subscriptions: tenant policy" ON public.subscriptions FOR ALL USING (organization_id = public.get_current_org_id()) WITH CHECK (organization_id = public.get_current_org_id());

-- plans (allow public read of active plans)
ALTER TABLE IF EXISTS public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to active plans" ON public.plans;
CREATE POLICY "Allow public read access to active plans" ON public.plans FOR SELECT USING (active = true);

-- 2) Função RPC robusta para incrementar cota de etiquetas (retorna jsonb {success, error, remaining})
DROP FUNCTION IF EXISTS public.increment_label_count_safe(INTEGER);
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
        -- trial fallback if no subscription
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

GRANT EXECUTE ON FUNCTION public.increment_label_count_safe(INT) TO authenticated;

-- 3) Garantir que complete_new_user_profile retorna jsonb (frontend depende disso)
DROP FUNCTION IF EXISTS public.complete_new_user_profile(TEXT, TEXT);
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

GRANT EXECUTE ON FUNCTION public.complete_new_user_profile(TEXT, TEXT) TO authenticated;

-- 4) Garantir permissões de execução de triggers/funções importantes
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_my_profile_if_missing() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_label_count(INT) TO authenticated;

-- 5) Garantir que app_settings e etiquetas import_history tenham índices e colunas necessárias
CREATE INDEX IF NOT EXISTS idx_app_settings_org_key ON public.app_settings(organization_id, key);
CREATE INDEX IF NOT EXISTS idx_import_history_org ON public.import_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_history_org ON public.etiquetas_historico(organization_id);

-- 6) Seed básico para planos (caso não exista)
INSERT INTO public.plans (name, price, max_users, features, stripe_price_id, label_limit)
SELECT 'Starter', 59.90, 2, '[]'::jsonb, NULL, 800
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Starter');

INSERT INTO public.plans (name, price, max_users, features, stripe_price_id, label_limit)
SELECT 'Plus', 99.90, 4, '[]'::jsonb, NULL, 2600
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Plus');

INSERT INTO public.plans (name, price, max_users, features, stripe_price_id, label_limit)
SELECT 'Escala', 399.90, 8, '[]'::jsonb, NULL, 999999
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Escala');

-- 7) Recomendações finais (mensagem)
SELECT 'SQL_SYNC_ADDITIONAL_FIXES applied. Verifique no Supabase: Policies, Functions e Grants.' AS status;
