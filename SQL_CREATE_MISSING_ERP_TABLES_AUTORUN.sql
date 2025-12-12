-- SQL_CREATE_MISSING_ERP_TABLES_AUTORUN.sql
-- Detecta tabelas ERP ausentes e cria-as automaticamente (com segurança).
-- Execute no Supabase SQL Editor (copiar + RUN).

-- Lista de tabelas requeridas
DO $$
DECLARE
  missing_count INT := 0;
BEGIN
  -- Certifique-se de que a extensão de UUID está disponível
  PERFORM 1 FROM pg_extension WHERE extname = 'uuid-ossp';
  IF NOT FOUND THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"';
  END IF;

  -- Verifica se alguma tabela requerida está ausente
  SELECT COUNT(1) INTO missing_count FROM (
    VALUES
      ('plans'), ('organizations'), ('users'), ('subscriptions'), ('stock_items'), ('stock_movements'), ('product_boms'), ('scan_logs'), ('orders'), ('customers'), ('sku_links'), ('app_settings'), ('production_plans'), ('shopping_list_items'), ('import_history'), ('etiquetas_historico'), ('weighing_batches'), ('returns'), ('grinding_batches')
  ) AS required(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = required.name
  );

  IF missing_count = 0 THEN
    RAISE NOTICE 'Todas as tabelas ERP já existem no schema public.';
    RETURN;
  END IF;

  RAISE NOTICE 'Tabelas ERP ausentes detectadas - criando tabelas...';

  -- Criar tabelas (IF NOT EXISTS) - reutiliza o script ERP idempotente
  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.plans (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      price REAL,
      max_users INT DEFAULT 2,
      features JSONB,
      active BOOLEAN DEFAULT TRUE,
      stripe_price_id TEXT,
      label_limit INT DEFAULT 200,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.organizations (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      name TEXT NOT NULL,
      cpf_cnpj TEXT UNIQUE,
      owner_id UUID,
      plan_id INT REFERENCES public.plans(id),
      stripe_customer_id TEXT,
      max_users INT DEFAULT 2,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      role TEXT,
      organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
      cpf_cnpj TEXT,
      auth_provider TEXT,
      ui_settings JSONB,
      setor TEXT[],
      prefix TEXT,
      attendance JSONB,
      avatar TEXT,
      has_set_password BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.subscriptions (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      plan_id INT REFERENCES public.plans(id),
      stripe_subscription_id TEXT,
      status TEXT DEFAULT 'trialing',
      period_end TIMESTAMPTZ,
      monthly_label_count INT DEFAULT 0,
      bonus_balance INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id)
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.stock_items (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      kind TEXT,
      unit TEXT,
      current_qty REAL NOT NULL DEFAULT 0,
      min_qty REAL NOT NULL DEFAULT 0,
      category TEXT,
      color TEXT,
      composition TEXT,
      product_type TEXT,
      expedition_items JSONB,
      substitute_product_code TEXT,
      linked_skus JSONB,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id, code)
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.stock_movements (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      stock_item_code TEXT NOT NULL,
      stock_item_name TEXT,
      origin TEXT,
      qty_delta REAL NOT NULL,
      ref TEXT,
      created_by_name TEXT,
      product_sku TEXT,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.product_boms (
      product_sku TEXT NOT NULL,
      items JSONB NOT NULL,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY(organization_id, product_sku)
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.scan_logs (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      scanned_at TIMESTAMPTZ NOT NULL,
      user_id UUID,
      user_name TEXT,
      device TEXT,
      display_key TEXT NOT NULL,
      status TEXT,
      synced BOOLEAN NOT NULL DEFAULT FALSE,
      canal TEXT,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.orders (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      order_id TEXT NOT NULL,
      tracking TEXT,
      sku TEXT NOT NULL,
      quantity INT,
      qty_original INT,
      multiplicador INT,
      qty_final INT,
      color TEXT,
      canal TEXT,
      data TEXT,
      status TEXT DEFAULT 'NORMAL',
      error_reason TEXT,
      customer_name TEXT,
      customer_cpf_cnpj TEXT,
      resolution_details JSONB,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id, order_id, sku)
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.customers (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      cpf_cnpj TEXT NOT NULL,
      name TEXT NOT NULL,
      order_history TEXT[] DEFAULT ARRAY[]::TEXT[],
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id, cpf_cnpj)
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.sku_links (
      imported_sku TEXT NOT NULL,
      master_product_sku TEXT NOT NULL,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY(organization_id, imported_sku)
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.app_settings (
      key TEXT NOT NULL,
      value JSONB NOT NULL,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY(organization_id, key)
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.production_plans (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      name TEXT NOT NULL,
      parameters JSONB,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_by TEXT,
      plan_date DATE,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.shopping_list_items (
      stock_item_code TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY(organization_id, stock_item_code)
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.import_history (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      file_name TEXT NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_name TEXT,
      item_count INT,
      unlinked_count INT,
      processed_data JSONB,
      canal TEXT,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.etiquetas_historico (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by_name TEXT,
      page_count INT,
      zpl_content TEXT,
      settings_snapshot JSONB,
      page_hashes TEXT[],
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.weighing_batches (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      stock_item_code TEXT NOT NULL,
      stock_item_name TEXT,
      initial_qty REAL NOT NULL,
      used_qty REAL DEFAULT 0,
      weighing_type TEXT DEFAULT 'daily',
      user_id UUID NOT NULL,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.returns (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      tracking TEXT,
      customer_name TEXT,
      logged_by_id UUID,
      logged_by_name TEXT,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      logged_at TIMESTAMPTZ DEFAULT NOW()
    );
  $sql$;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.grinding_batches (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      source_insumo_code TEXT NOT NULL,
      source_insumo_name TEXT,
      source_qty_used REAL NOT NULL,
      output_insumo_code TEXT NOT NULL,
      output_insumo_name TEXT,
      output_qty_produced REAL NOT NULL,
      mode TEXT,
      user_id UUID,
      user_name TEXT,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  $sql$;

  -- Índices
  EXECUTE $sql$ CREATE INDEX IF NOT EXISTS idx_orders_organization ON public.orders(organization_id); $sql$;
  EXECUTE $sql$ CREATE INDEX IF NOT EXISTS idx_customers_organization ON public.customers(organization_id); $sql$;
  EXECUTE $sql$ CREATE INDEX IF NOT EXISTS idx_stock_items_organization ON public.stock_items(organization_id); $sql$;
  EXECUTE $sql$ CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON public.subscriptions(organization_id); $sql$;
  EXECUTE $sql$ CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization_id); $sql$;

  -- RLS habilitação (apenas caso necessário)
  EXECUTE $sql$ ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY; $sql$;
  EXECUTE $sql$ ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY; $sql$;
  EXECUTE $sql$ ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY; $sql$;
  EXECUTE $sql$ ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY; $sql$;
  EXECUTE $sql$ ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY; $sql$;

  RAISE NOTICE 'Criação das tabelas ERP (quando ausentes) concluída.';
END
$$ LANGUAGE plpgsql;

SELECT 'ERP_TABLES_AUTO_CREATED' as result;
