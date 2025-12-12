-- ============================================================================
-- THETAGSFLOW - DATABASE SETUP v2.0 (LIMPO E PRONTO)
-- ============================================================================
-- COLE TUDO ISSO NO SUPABASE SQL EDITOR E CLIQUE RUN
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TIPOS ENUMERADOS
DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('DONO_SAAS', 'CLIENTE_GERENTE', 'FUNCIONARIO'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.stock_item_kind AS ENUM ('INSUMO', 'PRODUTO', 'PROCESSADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.stock_item_unit AS ENUM ('kg', 'un', 'm', 'L'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.stock_movement_origin AS ENUM ('BIP', 'AJUSTE_MANUAL', 'IMPORT_XML', 'IMPORT_PLANILHA', 'PESAGEM', 'CANCELAMENTO_BIP', 'PRODUCAO_MANUAL', 'PRODUCAO_INTERNA', 'INVENTARIO_PLANILHA'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.canal_type AS ENUM ('ML', 'SHOPEE', 'SITE', 'ALL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.order_status_value AS ENUM ('NORMAL', 'BIPADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.scan_status AS ENUM ('OK', 'DUPLICATE', 'NOT_FOUND', 'ADJUSTED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- PLANOS
CREATE TABLE IF NOT EXISTS public.plans (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, price REAL, max_users INT DEFAULT 2, features JSONB, active BOOLEAN DEFAULT TRUE, stripe_price_id TEXT, label_limit INT DEFAULT 200, created_at TIMESTAMPTZ DEFAULT NOW());

-- ORGANIZAÇÕES
CREATE TABLE IF NOT EXISTS public.organizations (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), name TEXT NOT NULL, cpf_cnpj TEXT UNIQUE, owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL, plan_id INT REFERENCES public.plans(id), stripe_customer_id TEXT, max_users INT DEFAULT 2, created_at TIMESTAMPTZ DEFAULT NOW());

-- USUÁRIOS
CREATE TABLE IF NOT EXISTS public.users (id UUID PRIMARY KEY, name TEXT, email TEXT, phone TEXT, role public.user_role NOT NULL, organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL, cpf_cnpj TEXT, auth_provider TEXT, ui_settings JSONB, setor TEXT[], prefix TEXT, attendance JSONB, avatar TEXT, has_set_password BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());

DO $$ BEGIN ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ASSINATURAS
CREATE TABLE IF NOT EXISTS public.subscriptions (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, plan_id INT REFERENCES public.plans(id), stripe_subscription_id TEXT, status TEXT DEFAULT 'trialing', period_end TIMESTAMPTZ, monthly_label_count INT DEFAULT 0, bonus_balance INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(organization_id));

-- STOCK ITEMS
CREATE TABLE IF NOT EXISTS public.stock_items (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), code TEXT NOT NULL, name TEXT NOT NULL, kind public.stock_item_kind NOT NULL, unit public.stock_item_unit NOT NULL, current_qty REAL NOT NULL DEFAULT 0, min_qty REAL NOT NULL DEFAULT 0, category TEXT, color TEXT, composition TEXT, product_type TEXT, expedition_items JSONB, substitute_product_code TEXT, linked_skus JSONB, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(organization_id, code));

-- STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.stock_movements (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), stock_item_code TEXT NOT NULL, stock_item_name TEXT, origin public.stock_movement_origin NOT NULL, qty_delta REAL NOT NULL, ref TEXT, created_by_name TEXT, product_sku TEXT, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW());

-- PRODUCT BOMS
CREATE TABLE IF NOT EXISTS public.product_boms (product_sku TEXT NOT NULL, items JSONB NOT NULL, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, updated_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY(organization_id, product_sku));

-- SCAN LOGS
CREATE TABLE IF NOT EXISTS public.scan_logs (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), scanned_at TIMESTAMPTZ NOT NULL, user_id UUID, user_name TEXT, device TEXT, display_key TEXT NOT NULL, status public.scan_status NOT NULL, synced BOOLEAN NOT NULL DEFAULT FALSE, canal public.canal_type, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW());

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), order_id TEXT NOT NULL, tracking TEXT, sku TEXT NOT NULL, quantity INT, qty_original INT, multiplicador INT, qty_final INT, color TEXT, canal public.canal_type, data TEXT, status public.order_status_value DEFAULT 'NORMAL', error_reason TEXT, customer_name TEXT, customer_cpf_cnpj TEXT, resolution_details JSONB, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(organization_id, order_id, sku));

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), cpf_cnpj TEXT NOT NULL, name TEXT NOT NULL, order_history TEXT[] DEFAULT ARRAY[]::TEXT[], organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(organization_id, cpf_cnpj));

-- SKU LINKS
CREATE TABLE IF NOT EXISTS public.sku_links (imported_sku TEXT NOT NULL, master_product_sku TEXT NOT NULL, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY(organization_id, imported_sku));

-- APP SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (key TEXT NOT NULL, value JSONB NOT NULL, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, updated_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY(organization_id, key));

-- PRODUCTION PLANS
CREATE TABLE IF NOT EXISTS public.production_plans (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), name TEXT NOT NULL, parameters JSONB, status TEXT NOT NULL DEFAULT 'Draft', created_by TEXT, plan_date DATE, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW());

-- SHOPPING LIST
CREATE TABLE IF NOT EXISTS public.shopping_list_items (stock_item_code TEXT NOT NULL, name TEXT NOT NULL, quantity REAL NOT NULL, unit public.stock_item_unit NOT NULL, is_purchased BOOLEAN NOT NULL DEFAULT FALSE, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY(organization_id, stock_item_code));

-- IMPORT HISTORY
CREATE TABLE IF NOT EXISTS public.import_history (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), file_name TEXT NOT NULL, processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), user_name TEXT, item_count INT, unlinked_count INT, processed_data JSONB, canal public.canal_type, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE);

-- ETIQUETAS HISTORICO
CREATE TABLE IF NOT EXISTS public.etiquetas_historico (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by_name TEXT, page_count INT, zpl_content TEXT, settings_snapshot JSONB, page_hashes TEXT[], organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE);

-- WEIGHING BATCHES
CREATE TABLE IF NOT EXISTS public.weighing_batches (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), stock_item_code TEXT NOT NULL, stock_item_name TEXT, initial_qty REAL NOT NULL, used_qty REAL DEFAULT 0, weighing_type TEXT DEFAULT 'daily', user_id UUID NOT NULL, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW());

-- RETURNS
CREATE TABLE IF NOT EXISTS public.returns (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), tracking TEXT, customer_name TEXT, logged_by_id UUID, logged_by_name TEXT, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, logged_at TIMESTAMPTZ DEFAULT NOW());

-- GRINDING BATCHES
CREATE TABLE IF NOT EXISTS public.grinding_batches (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), source_insumo_code TEXT NOT NULL, source_insumo_name TEXT, source_qty_used REAL NOT NULL, output_insumo_code TEXT NOT NULL, output_insumo_name TEXT, output_qty_produced REAL NOT NULL, mode TEXT, user_id UUID, user_name TEXT, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW());

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_orders_organization ON public.orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_scan_logs_organization ON public.scan_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_status ON public.scan_logs(status);
CREATE INDEX IF NOT EXISTS idx_customers_organization ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_organization ON public.stock_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_code ON public.stock_items(code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization_id);

-- FUNÇÕES RPC
CREATE OR REPLACE FUNCTION public.get_current_org_id() RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN RETURN (SELECT organization_id FROM public.users WHERE id = auth.uid()); END; $$;

CREATE OR REPLACE FUNCTION public.check_setup_status() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN RETURN jsonb_build_object('db_version', '2.0', 'status', 'ready'); END; $$;

CREATE OR REPLACE FUNCTION public.get_my_claim(claim TEXT) RETURNS TEXT LANGUAGE sql STABLE SET search_path = public AS $$ SELECT current_setting('request.jwt.claims', true)::jsonb ->> claim; $$;

CREATE OR REPLACE FUNCTION public.update_user_claims() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('organization_id', new.organization_id, 'role', new.role) WHERE id = new.id; RETURN new; END; $$;

CREATE OR REPLACE TRIGGER update_user_claims_trigger AFTER INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_user_claims();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.users (id, email, role, name, auth_provider) VALUES (new.id, new.email, 'CLIENTE_GERENTE', COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), COALESCE(new.raw_app_meta_data->>'provider', 'email')) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = COALESCE(EXCLUDED.name, split_part(new.email, '@', 1)), auth_provider = COALESCE(new.raw_app_meta_data->>'provider', EXCLUDED.auth_provider); RETURN new; EXCEPTION WHEN others THEN RETURN new; END; $$;

CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_label_count_safe(amount INT) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE v_org_id UUID; v_plan_limit INT; v_current_count INT; v_bonus_balance INT; v_new_count INT; BEGIN SELECT organization_id INTO v_org_id FROM public.users WHERE id = auth.uid(); IF v_org_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Organização não encontrada'); END IF; SELECT s.monthly_label_count, s.bonus_balance, p.label_limit INTO v_current_count, v_bonus_balance, v_plan_limit FROM public.subscriptions s LEFT JOIN public.plans p ON s.plan_id = p.id WHERE s.organization_id = v_org_id; IF v_current_count IS NULL THEN v_current_count := 0; v_bonus_balance := 0; v_plan_limit := 200; END IF; v_new_count := v_current_count + amount; IF v_plan_limit > 0 AND (v_new_count > v_plan_limit + v_bonus_balance) THEN RETURN jsonb_build_object('success', false, 'error', 'Cota de etiquetas insuficiente'); END IF; UPDATE public.subscriptions SET monthly_label_count = v_new_count WHERE organization_id = v_org_id; RETURN jsonb_build_object('success', true, 'new_count', v_new_count); END; $$;

DROP FUNCTION IF EXISTS public.complete_new_user_profile(text, text);

CREATE OR REPLACE FUNCTION public.complete_new_user_profile(p_cpf_cnpj TEXT, p_organization_name TEXT) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE v_user_id UUID := auth.uid(); v_organization_id UUID; v_user_email TEXT; v_plan_id INT; v_user_exists BOOLEAN; BEGIN IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'User not authenticated'); END IF; -- Pega o email do usuário autenticado
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    
    -- Verifica se o usuário já existe em public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = v_user_id) INTO v_user_exists;
    
    -- Se não existe, cria (isso vai garantir que o usuário existe antes de atualizar)
    IF NOT v_user_exists THEN
        INSERT INTO public.users (id, email, role, auth_provider, name)
        VALUES (v_user_id, v_user_email, 'CLIENTE_GERENTE', 'email', COALESCE(v_user_email, 'Usuário'));
    END IF;
    
    -- Verifica se o CNPJ já existe
    IF EXISTS (SELECT 1 FROM public.organizations WHERE cpf_cnpj = p_cpf_cnpj) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Este CNPJ já está cadastrado em outra organização.');
    END IF;
    
    -- Cria a organização
    INSERT INTO public.organizations (name, cpf_cnpj, owner_id)
    VALUES (p_organization_name, p_cpf_cnpj, v_user_id)
    RETURNING id INTO v_organization_id;
    
    -- Pega o ID do plano grátis
    SELECT id INTO v_plan_id FROM public.plans WHERE name = 'Plano Grátis (Teste)' LIMIT 1;
    
    -- Cria a assinatura
    INSERT INTO public.subscriptions (organization_id, plan_id, status)
    VALUES (v_organization_id, v_plan_id, 'active');
    
    -- ATUALIZA o usuário com organization_id, cpf_cnpj e has_set_password
    UPDATE public.users
    SET organization_id = v_organization_id,
        cpf_cnpj = p_cpf_cnpj,
        has_set_password = TRUE
    WHERE id = v_user_id;
    
    -- Retorna sucesso com os dados
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Cadastro realizado com sucesso!',
        'organization_id', v_organization_id,
        'user_id', v_user_id,
        'email', v_user_email
    );
    
EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este CNPJ já está cadastrado em outra organização.');
WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Erro ao criar organização. Tente novamente.');
WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;



-- PLANOS INICIAIS
INSERT INTO public.plans (name, price, max_users, label_limit, features, active, stripe_price_id) VALUES ('Plano Grátis (Teste)', 0, 2, 200, '{"features": ["Teste 7 dias", "200 etiquetas/mês", "2 usuários"]}', true, NULL), ('Starter', 99.00, 5, 800, '{"features": ["800 etiquetas/mês", "5 usuários"]}', true, NULL), ('Plus', 199.00, 15, 2600, '{"features": ["2600 etiquetas/mês", "15 usuários"]}', true, NULL), ('Escala', 499.00, 50, 999999, '{"features": ["Ilimitado", "50 usuários"]}', true, NULL) ON CONFLICT (name) DO NOTHING;

-- RLS - DESABILITAR PARA LIMPAR
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas_historico DISABLE ROW LEVEL SECURITY;

-- RLS - LIMPAR POLICIES ANTIGAS
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuários podem ver pedidos da sua organização" ON public.orders;
DROP POLICY IF EXISTS "Usuários podem inserir pedidos na sua organização" ON public.orders;
DROP POLICY IF EXISTS "Usuários podem atualizar pedidos da sua organização" ON public.orders;
DROP POLICY IF EXISTS "Usuários podem deletar pedidos da sua organização" ON public.orders;
DROP POLICY IF EXISTS "Usuários podem ver clientes da sua organização" ON public.customers;
DROP POLICY IF EXISTS "Usuários podem inserir clientes na sua organização" ON public.customers;
DROP POLICY IF EXISTS "Usuários podem atualizar clientes da sua organização" ON public.customers;
DROP POLICY IF EXISTS "Usuários podem deletar clientes da sua organização" ON public.customers;
DROP POLICY IF EXISTS "Usuários podem ver produtos da sua organização" ON public.stock_items;
DROP POLICY IF EXISTS "Usuários podem inserir produtos na sua organização" ON public.stock_items;
DROP POLICY IF EXISTS "Usuários podem atualizar produtos da sua organização" ON public.stock_items;
DROP POLICY IF EXISTS "Usuários podem deletar produtos da sua organização" ON public.stock_items;
DROP POLICY IF EXISTS "Usuários podem ver bipagens da sua organização" ON public.scan_logs;
DROP POLICY IF EXISTS "Usuários podem inserir bipagens na sua organização" ON public.scan_logs;
DROP POLICY IF EXISTS "Usuários podem deletar bipagens da sua organização" ON public.scan_logs;
DROP POLICY IF EXISTS "Usuários podem ver assinatura da sua organização" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários podem atualizar assinatura da sua organização" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários podem ver configurações da sua organização" ON public.app_settings;
DROP POLICY IF EXISTS "Usuários podem atualizar configurações da sua organização" ON public.app_settings;
DROP POLICY IF EXISTS "Usuários podem inserir configurações da sua organização" ON public.app_settings;
DROP POLICY IF EXISTS "Usuários podem ver histórico de importações da sua organização" ON public.import_history;
DROP POLICY IF EXISTS "Usuários podem inserir histórico na sua organização" ON public.import_history;
DROP POLICY IF EXISTS "Usuários podem ver histórico de etiquetas da sua organização" ON public.etiquetas_historico;
DROP POLICY IF EXISTS "Usuários podem inserir histórico de etiquetas na sua organização" ON public.etiquetas_historico;

-- RLS - CRIAR POLICIES
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Usuários podem ver pedidos da sua organização" ON public.orders FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem inserir pedidos na sua organização" ON public.orders FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem atualizar pedidos da sua organização" ON public.orders FOR UPDATE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem deletar pedidos da sua organização" ON public.orders FOR DELETE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem ver clientes da sua organização" ON public.customers FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem inserir clientes na sua organização" ON public.customers FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem atualizar clientes da sua organização" ON public.customers FOR UPDATE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem deletar clientes da sua organização" ON public.customers FOR DELETE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem ver produtos da sua organização" ON public.stock_items FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem inserir produtos na sua organização" ON public.stock_items FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem atualizar produtos da sua organização" ON public.stock_items FOR UPDATE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem deletar produtos da sua organização" ON public.stock_items FOR DELETE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem ver bipagens da sua organização" ON public.scan_logs FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem inserir bipagens na sua organização" ON public.scan_logs FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem deletar bipagens da sua organização" ON public.scan_logs FOR DELETE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem ver assinatura da sua organização" ON public.subscriptions FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem atualizar assinatura da sua organização" ON public.subscriptions FOR UPDATE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem ver configurações da sua organização" ON public.app_settings FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem atualizar configurações da sua organização" ON public.app_settings FOR UPDATE USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem inserir configurações da sua organização" ON public.app_settings FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem ver histórico de importações da sua organização" ON public.import_history FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem inserir histórico na sua organização" ON public.import_history FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem ver histórico de etiquetas da sua organização" ON public.etiquetas_historico FOR SELECT USING (organization_id = public.get_current_org_id());
CREATE POLICY "Usuários podem inserir histórico de etiquetas na sua organização" ON public.etiquetas_historico FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());

-- RLS - REABILITAR
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas_historico ENABLE ROW LEVEL SECURITY;

SELECT 'Database setup completed successfully!' AS status;
