
export const SETUP_SQL_STRING = `
-- =================================================================
-- SCRIPT DE SEGURANÇA MÁXIMA E CONFIGURAÇÃO (v14.0 - Sintaxe Final)
-- =================================================================

-- 1. Limpeza e Permissões
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Tipos
CREATE TYPE public.user_role AS ENUM ('DONO_SAAS', 'CLIENTE_GERENTE', 'FUNCIONARIO');
CREATE TYPE public.stock_item_kind AS ENUM ('INSUMO', 'PRODUTO', 'PROCESSADO');
CREATE TYPE public.stock_item_unit AS ENUM ('kg', 'un', 'm', 'L');
CREATE TYPE public.stock_movement_origin AS ENUM ('BIP', 'AJUSTE_MANUAL', 'IMPORT_XML', 'IMPORT_PLANILHA', 'PESAGEM', 'CANCELAMENTO_BIP', 'PRODUCAO_MANUAL', 'PRODUCAO_INTERNA', 'INVENTARIO_PLANILHA');
CREATE TYPE public.canal_type AS ENUM ('ML', 'SHOPEE', 'SITE', 'ALL');
CREATE TYPE public.order_status_value AS ENUM ('NORMAL', 'BIPADO');
CREATE TYPE public.scan_status AS ENUM ('OK', 'DUPLICATE', 'NOT_FOUND', 'ADJUSTED', 'CANCELLED');

-- 4. Tabelas
CREATE TABLE public.plans ( id SERIAL PRIMARY KEY, name TEXT NOT NULL, price REAL, max_users INT, features JSONB, active BOOLEAN DEFAULT TRUE, stripe_price_id TEXT );
CREATE TABLE public.organizations ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), name TEXT NOT NULL, cpf_cnpj TEXT UNIQUE, owner_id UUID, plan_id INT REFERENCES public.plans(id), stripe_customer_id TEXT, max_users INT DEFAULT 2, created_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE public.users ( id UUID PRIMARY KEY, name TEXT, email TEXT, phone TEXT, role public.user_role NOT NULL, organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL, cpf_cnpj TEXT, auth_provider TEXT, ui_settings JSONB, setor TEXT[], prefix TEXT, attendance JSONB, avatar TEXT, has_set_password BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW() );

ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.organizations ADD CONSTRAINT fk_owner_id FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE public.subscriptions ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, plan_id INT REFERENCES public.plans(id), stripe_subscription_id TEXT, status TEXT, period_end TIMESTAMPTZ, monthly_label_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE public.stock_items ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), code TEXT NOT NULL, name TEXT NOT NULL, kind public.stock_item_kind NOT NULL, unit public.stock_item_unit NOT NULL, current_qty REAL NOT NULL DEFAULT 0, min_qty REAL NOT NULL DEFAULT 0, category TEXT, color TEXT, composition TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), product_type TEXT, expedition_items JSONB, substitute_product_code TEXT, linked_skus JSONB, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, UNIQUE(organization_id, code) );
CREATE TABLE public.stock_movements ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), stock_item_code TEXT NOT NULL, stock_item_name TEXT, origin public.stock_movement_origin NOT NULL, qty_delta REAL NOT NULL, ref TEXT, created_by_name TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, product_sku TEXT );
CREATE TABLE public.product_boms ( product_sku TEXT NOT NULL, items JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, PRIMARY KEY(organization_id, product_sku) );
CREATE TABLE public.scan_logs ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), scanned_at TIMESTAMPTZ NOT NULL, user_id UUID, user_name TEXT, device TEXT, display_key TEXT NOT NULL, status public.scan_status NOT NULL, synced BOOLEAN NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), canal public.canal_type, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE );
CREATE TABLE public.orders ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), order_id TEXT NOT NULL, tracking TEXT, sku TEXT NOT NULL, quantity INT, qty_original INT, multiplicador INT, qty_final INT, color TEXT, canal public.canal_type, data TEXT, status public.order_status_value, error_reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), customer_name TEXT, resolution_details JSONB, customer_cpf_cnpj TEXT, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, UNIQUE(organization_id, order_id, sku) );
CREATE TABLE public.customers ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), cpf_cnpj TEXT NOT NULL, name TEXT NOT NULL, order_history TEXT[], created_at TIMESTAMPTZ DEFAULT NOW(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, UNIQUE(organization_id, cpf_cnpj) );
CREATE TABLE public.sku_links ( imported_sku TEXT NOT NULL, master_product_sku TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, PRIMARY KEY(organization_id, imported_sku) );
CREATE TABLE public.app_settings ( key TEXT NOT NULL, value JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, PRIMARY KEY(organization_id, key) );
CREATE TABLE public.production_plans ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), name TEXT NOT NULL, parameters JSONB, status TEXT NOT NULL DEFAULT 'Draft', created_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), plan_date DATE, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE );
CREATE TABLE public.shopping_list_items ( stock_item_code TEXT NOT NULL, name TEXT NOT NULL, quantity REAL NOT NULL, unit public.stock_item_unit NOT NULL, is_purchased BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, PRIMARY KEY(organization_id, stock_item_code) );
CREATE TABLE public.import_history ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), file_name TEXT NOT NULL, processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), user_name TEXT, item_count INT, unlinked_count INT, processed_data JSONB, canal public.canal_type, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE );
CREATE TABLE public.etiquetas_historico ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by_name TEXT, page_count INT, zpl_content TEXT, settings_snapshot JSONB, page_hashes TEXT[], organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE );
CREATE TABLE public.weighing_batches ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), stock_item_code TEXT NOT NULL, stock_item_name TEXT, initial_qty REAL NOT NULL, used_qty REAL DEFAULT 0, weighing_type TEXT DEFAULT 'daily', user_id UUID NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE );
CREATE TABLE public.returns ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), tracking TEXT, customer_name TEXT, logged_by_id UUID, logged_by_name TEXT, logged_at TIMESTAMPTZ DEFAULT NOW(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE );
CREATE TABLE public.grinding_batches ( id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), source_insumo_code TEXT NOT NULL, source_insumo_name TEXT, source_qty_used REAL NOT NULL, output_insumo_code TEXT NOT NULL, output_insumo_name TEXT, output_qty_produced REAL NOT NULL, mode TEXT, user_id UUID, user_name TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE );

-- 5. Funções com Sintaxe Corrigida

CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.users WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.check_setup_status() 
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$ 
BEGIN 
    RETURN jsonb_build_object('db_version', '2.11.0', 'tables_status', '[]'::jsonb); 
END; 
$$;

CREATE OR REPLACE FUNCTION public.get_my_claim(claim TEXT) 
RETURNS TEXT 
LANGUAGE sql 
STABLE 
SET search_path = public 
AS $$ 
    SELECT current_setting('request.jwt.claims', true)::jsonb ->> claim; 
$$;

CREATE OR REPLACE FUNCTION public.update_user_claims() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$ 
BEGIN 
    UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('organization_id', new.organization_id, 'role', new.role) WHERE id = new.id; 
    RETURN new; 
END; 
$$;

CREATE OR REPLACE FUNCTION public.create_my_profile_if_missing() 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE v_user_id UUID := auth.uid(); v_auth_user RECORD;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
        SELECT email, raw_user_meta_data, raw_app_meta_data, phone INTO v_auth_user FROM auth.users WHERE id = v_user_id;
        IF FOUND THEN
            INSERT INTO public.users (id, email, role, name, avatar, auth_provider, phone, has_set_password)
            VALUES (v_user_id, v_auth_user.email, 'CLIENTE_GERENTE', COALESCE(v_auth_user.raw_user_meta_data->>'full_name', v_auth_user.raw_user_meta_data->>'name', v_auth_user.email), v_auth_user.raw_user_meta_data->>'avatar_url', v_auth_user.raw_app_meta_data->>'provider', COALESCE(v_auth_user.phone, v_auth_user.raw_user_meta_data->>'phone'), FALSE) ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_role public.user_role;
  v_org_id UUID;
BEGIN
  BEGIN
    v_org_id := (new.raw_user_meta_data->>'organization_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
  END;
  
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := (new.raw_user_meta_data->>'role')::public.user_role;
  ELSE
    v_role := 'CLIENTE_GERENTE';
  END;

  INSERT INTO public.users (
    id, email, role, name, avatar, auth_provider, phone, has_set_password, organization_id, setor
  ) VALUES (
    new.id, new.email, v_role,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider',
    COALESCE(new.phone, new.raw_user_meta_data->>'phone'),
    CASE WHEN v_org_id IS NOT NULL THEN FALSE ELSE FALSE END,
    v_org_id,
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(new.raw_user_meta_data->'setor', '[]'::jsonb)))
  ) ON CONFLICT (id) DO NOTHING;
    
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_label_count(amount INT) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE v_org_id UUID;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.users WHERE id = auth.uid();
    IF v_org_id IS NOT NULL THEN
        UPDATE public.subscriptions SET monthly_label_count = COALESCE(monthly_label_count, 0) + amount WHERE organization_id = v_org_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_critical_user_columns()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id THEN
     IF NEW.role != OLD.role THEN RAISE EXCEPTION 'Você não tem permissão para alterar seu próprio cargo.'; END IF;
     IF NEW.organization_id != OLD.organization_id THEN RAISE EXCEPTION 'Você não tem permissão para alterar sua organização.'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_new_user_profile(p_organization_name TEXT, p_cpf_cnpj TEXT) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$ 
DECLARE v_user_id UUID := auth.uid(); v_organization_id UUID; 
BEGIN 
    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id AND organization_id IS NOT NULL) THEN RAISE EXCEPTION 'User profile is already complete.'; END IF; 
    INSERT INTO public.organizations (name, cpf_cnpj) VALUES (p_organization_name, p_cpf_cnpj) RETURNING id INTO v_organization_id; 
    UPDATE public.users SET organization_id = v_organization_id, cpf_cnpj = p_cpf_cnpj, has_set_password = TRUE WHERE id = v_user_id; 
    UPDATE public.organizations SET owner_id = v_user_id WHERE id = v_organization_id; 
END; 
$$;

CREATE OR REPLACE FUNCTION public.hard_reset_database_for_user(p_user_id UUID) 
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$ 
DECLARE v_org_id UUID; 
BEGIN 
    SELECT organization_id INTO v_org_id FROM public.users WHERE id = p_user_id; 
    IF v_org_id IS NULL THEN RAISE EXCEPTION 'Usuário não pertence a uma organização.'; END IF; 
    DELETE FROM public.orders WHERE organization_id = v_org_id; 
    DELETE FROM public.scan_logs WHERE organization_id = v_org_id; 
    DELETE FROM public.stock_movements WHERE organization_id = v_org_id; 
    DELETE FROM public.import_history WHERE organization_id = v_org_id; 
    DELETE FROM public.etiquetas_historico WHERE organization_id = v_org_id; 
    DELETE FROM public.customers WHERE organization_id = v_org_id; 
    DELETE FROM public.production_plans WHERE organization_id = v_org_id; 
    DELETE FROM public.shopping_list_items WHERE organization_id = v_org_id; 
    DELETE FROM public.app_settings WHERE organization_id = v_org_id; 
    DELETE FROM public.product_boms WHERE organization_id = v_org_id; 
    DELETE FROM public.sku_links WHERE organization_id = v_org_id; 
    DELETE FROM public.stock_items WHERE organization_id = v_org_id; 
    DELETE FROM public.weighing_batches WHERE organization_id = v_org_id; 
    DELETE FROM public.returns WHERE organization_id = v_org_id; 
    DELETE FROM public.grinding_batches WHERE organization_id = v_org_id;
    DELETE FROM public.users WHERE organization_id = v_org_id AND id != p_user_id; 
    RETURN 'Reset concluído com sucesso.'; 
END; 
$$;

-- TRIGGERS
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
CREATE TRIGGER on_user_profile_change AFTER INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_user_claims();
CREATE TRIGGER enforce_user_column_security BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.protect_critical_user_columns();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN ('users', 'organizations', 'plans') LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t); END LOOP; END; $$;

CREATE POLICY "Ver Proprio Perfil" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Ver Colegas" ON public.users FOR SELECT USING (organization_id = public.get_current_org_id() AND public.get_current_org_id() IS NOT NULL);
CREATE POLICY "Atualizar Proprio Perfil" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Inserir Proprio Perfil" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can see their own organization" ON public.organizations FOR SELECT USING (id = public.get_current_org_id());
CREATE POLICY "Allow public read access to active plans" ON public.plans FOR SELECT USING (active = true);

DO $$ 
DECLARE t text; 
BEGIN 
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name NOT IN ('users', 'organizations', 'plans') 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Tenant Isolation Policy" ON public.%I FOR ALL USING (organization_id = public.get_current_org_id()) WITH CHECK (organization_id = public.get_current_org_id());', t); 
    END LOOP; 
END; 
$$;

INSERT INTO public.plans (name, price, max_users, features, stripe_price_id) VALUES
('Starter', 59.90, 2, '["Etiquetas Ilimitadas", "2 Usuários", "Suporte por E-mail"]'::jsonb, 'price_1ST6WUH9gIP9tzTRDrjI7fPf'),
('Plus', 99.90, 4, '["Tudo do Starter", "4 Usuários", "Relatórios Avançados", "Suporte Prioritário via Chat"]'::jsonb, 'price_1ST6YRH9gIP9tzTRgGgPv21v'),
('Escala', 399.90, 8, '["Tudo do plano Plus", "8 Usuários", "Gerente de conta dedicado", "Suporte 24/7"]'::jsonb, 'price_1ST6YiH9gIP9tzTR1VvlqsRl');

GRANT EXECUTE ON FUNCTION public.get_current_org_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_label_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
`;
