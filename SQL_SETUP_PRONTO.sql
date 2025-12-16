-- ⚡ SQL PRONTO PARA COPIAR E COLAR NO SUPABASE SQL EDITOR
-- Execute tudo de uma vez (CTRL+A depois CTRL+Enter)

-- 1. Criar tabela users (com todas as colunas corretas)
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
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

-- 2. Criar índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_organization_id ON public.users(organization_id);

-- 3. Desabilitar RLS (segurança básica apenas - desenvolvimento)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Criar função que auto-cria usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', SPLIT_PART(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- 5. Criar trigger que executa função acima
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificar tudo funcionou
SELECT 'Tabela users criada ✅' as status;
SELECT 'Trigger on_auth_user_created criado ✅' as status;
SELECT COUNT(*) as total_users FROM public.users;

-- ✅ APÓS EXECUTAR TUDO ACIMA:
-- 1. Vá em: Authentication → Providers → Email
-- 2. Ativar: "Auto confirm user"
-- 3. Desativar: "Require email confirmation"
-- 4. Click SAVE
-- 5. Tente login/register novamente em http://localhost:3000
