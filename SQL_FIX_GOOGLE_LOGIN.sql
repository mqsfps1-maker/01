-- ============================================================================
-- CORREÇÃO PARA GOOGLE LOGIN BUG - EXECUTE ISTO NO SUPABASE
-- ============================================================================
-- Este arquivo corrige o problema onde Google login não funciona corretamente

-- 1. DROPAR E RECREAR O TRIGGER handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ 
BEGIN 
  INSERT INTO public.users (id, email, role, name, auth_provider) 
  VALUES (
    new.id, 
    new.email, 
    'CLIENTE_GERENTE', 
    COALESCE(
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'name', 
      split_part(new.email, '@', 1)
    ), 
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  ) 
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    name = COALESCE(EXCLUDED.name, split_part(new.email, '@', 1)),
    auth_provider = COALESCE(new.raw_app_meta_data->>'provider', EXCLUDED.auth_provider);
  RETURN new; 
EXCEPTION WHEN others THEN 
  RETURN new; 
END; 
$$;

CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW 
EXECUTE FUNCTION public.handle_new_user();

-- 2. ADICIONAR CONSTRAINT PARA GARANTIR QUE role TEM UM PADRÃO
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'CLIENTE_GERENTE';

-- 3. Adicionar um índice para email para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 4. Verificar se há usuários sem role e corrigir
UPDATE public.users SET role = 'CLIENTE_GERENTE' WHERE role IS NULL;

SELECT 'Google Login Fix Applied Successfully!' AS status;
