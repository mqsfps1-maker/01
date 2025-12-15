-- ============================================================
-- SQL_NEW_DATABASE_SETUP.sql
-- Script COMPLETO para novo banco do zero
-- Execute TUDO isso no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. CRIAR TODAS AS TABELAS
-- ============================================================

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj_cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  max_products INTEGER,
  max_users INTEGER,
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'FUNCIONARIO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  status TEXT DEFAULT 'trial',
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  min_qty DECIMAL(10,2) DEFAULT 0,
  qty DECIMAL(10,2) DEFAULT 0,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sku TEXT,
  description TEXT,
  qty DECIMAL(10,2),
  data DATE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  code TEXT,
  quantity DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL,
  movement_type TEXT,
  quantity DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.sku_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  imported_sku TEXT NOT NULL,
  internal_sku TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, imported_sku)
);

CREATE TABLE public.customer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  imported_customer_id TEXT,
  internal_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.general_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

CREATE TABLE public.import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name TEXT,
  file_type TEXT,
  status TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.etiquetas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL,
  quantity INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

CREATE TABLE public.users_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.product_boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL,
  component_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.production_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_name TEXT,
  quantity DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.weighing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL,
  weight DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.grinding_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  batch_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. CRIAR FUNÇÃO get_org_id (SEM RECURSÃO!)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- 4. CRIAR POLÍTICAS RLS (SEM RECURSÃO)
-- ============================================================

-- USERS TABLE
CREATE POLICY "users_own_record" ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_insert_own" ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ORGANIZATIONS TABLE
CREATE POLICY "org_read" ON public.organizations FOR SELECT
  USING (true);

-- DATA TABLES - TENANT ISOLATION
CREATE POLICY "orders_tenant_isolation" ON public.orders FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "customers_tenant_isolation" ON public.customers FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "subscriptions_tenant_isolation" ON public.subscriptions FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "import_history_tenant_isolation" ON public.import_history FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "etiquetas_tenant_isolation" ON public.etiquetas_historico FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "app_settings_tenant_isolation" ON public.app_settings FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "stock_items_tenant_isolation" ON public.stock_items FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "stock_movements_tenant_isolation" ON public.stock_movements FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "scan_logs_tenant_isolation" ON public.scan_logs FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "sku_links_tenant_isolation" ON public.sku_links FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "product_boms_tenant_isolation" ON public.product_boms FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "production_plans_tenant_isolation" ON public.production_plans FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "shopping_list_items_tenant_isolation" ON public.shopping_list_items FOR ALL
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

-- PLANS TABLE - PUBLIC READ
CREATE POLICY "plans_public_active" ON public.plans FOR SELECT
  USING (active = true);

-- ============================================================
-- 5. INSERIR 4 PLANOS PADRÃO
-- ============================================================

INSERT INTO public.plans (id, name, price_monthly, price_yearly, max_products, max_users, features, active) 
VALUES 
  ('plan_free', 'Grátis', 0, 0, 100, 1, '{"warehouse":true,"reports":false,"api":false}', true),
  ('plan_starter', 'Starter', 99.90, 999.00, 500, 3, '{"warehouse":true,"reports":true,"api":false}', true),
  ('plan_professional', 'Professional', 299.90, 2999.00, 5000, 10, '{"warehouse":true,"reports":true,"api":true}', true),
  ('plan_enterprise', 'Enterprise', 999.90, 9999.00, -1, -1, '{"warehouse":true,"reports":true,"api":true,"support":true}', true);

-- ============================================================
-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX idx_stock_items_org_code ON public.stock_items(organization_id, code);
CREATE INDEX idx_orders_org_date ON public.orders(organization_id, data DESC);
CREATE INDEX idx_customers_org_cpf ON public.customers(organization_id, cpf_cnpj);
CREATE INDEX idx_users_org_id ON public.users(organization_id);
CREATE INDEX idx_stock_items_org_id ON public.stock_items(organization_id);
CREATE INDEX idx_orders_org_id ON public.orders(organization_id);
CREATE INDEX idx_customers_org_id ON public.customers(organization_id);
CREATE INDEX idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX idx_import_history_org_date ON public.import_history(organization_id, processed_at DESC);
CREATE INDEX idx_scan_logs_org_date ON public.scan_logs(organization_id, scanned_at DESC);

-- ============================================================
-- 7. GRANTS (Permissões)
-- ============================================================

GRANT EXECUTE ON FUNCTION public.get_org_id TO authenticated;

-- ============================================================
-- FIM - BANCO 100% PRONTO!
-- ============================================================

SELECT '✅ NOVO BANCO CRIADO COM SUCESSO! TUDO PRONTO!' AS status;
