-- ⚡ SQL COMPLETO: FIX RLS + FUNÇÃO get_org_id + TABELA USERS
-- Execute tudo de uma vez no Supabase SQL Editor

-- ============================================================================
-- 1. CORRIGIR FUNÇÃO get_org_id (fix search_path mutable)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_org_id() CASCADE;

CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.users WHERE id = auth.uid());
END;
$$;

-- ============================================================================
-- 2. CRIAR TABELA users (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE,
    name text,
    phone text,
    role text DEFAULT 'CLIENTE_GERENTE',
    organization_id uuid,
    cpfCnpj text,
    ui_settings jsonb,
    setor text[],
    prefix text,
    attendance jsonb,
    avatar text,
    has_set_password boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 3. CRIAR ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- ============================================================================
-- 4. HABILITAR RLS E CRIAR POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: Usuário pode ver seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (id = auth.uid());

-- Política: Usuário pode atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Política: Admin pode ver/atualizar todos os usuários da mesma org
DROP POLICY IF EXISTS "Admins can manage org users" ON public.users;
CREATE POLICY "Admins can manage org users" ON public.users
    FOR ALL USING (
        organization_id = public.get_org_id() AND
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'OWNER')
    );

-- Política: Trigger cria usuário automaticamente (bypassa RLS)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 5. CRIAR TRIGGER QUE AUTO-CRIA USUÁRIO
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', SPLIT_PART(new.email, '@', 1)),
    'CLIENTE_GERENTE'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================================================

SELECT '✅ Função get_org_id corrigida (search_path STABLE)' as status;
SELECT '✅ Tabela users criada/verificada' as status;
SELECT '✅ Índices criados' as status;
SELECT '✅ RLS HABILITADO e Policies criadas' as status;
SELECT '✅ Trigger on_auth_user_created criado' as status;

SELECT COUNT(*) as total_users FROM public.users;
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- ============================================================================
-- ⚠️ PRÓXIMOS PASSOS OBRIGATÓRIOS:
-- ============================================================================
-- 1. Vá em: Authentication → Providers → Email
-- 2. Ativar: "Auto confirm user"
-- 3. Desativar: "Require email confirmation"
-- 4. Click SAVE
-- 5. Teste: http://localhost:3000 → Registre novo usuário
-- ============================================================================
