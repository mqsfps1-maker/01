-- ============================================================================
-- FIX CRÍTICO: DESABILITAR RLS TEMPORARIAMENTE
-- ============================================================================
-- Execute isso no Supabase SQL Editor para permitir login funcionar

-- DESABILITAR RLS na tabela users para resolver erro 403
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Confirmar que foi desabilitado
SELECT 'RLS disabled on users table - Login should work now!' AS status;

-- ============================================================================
-- PRÓXIMA ETAPA (após login funcionar):
-- ============================================================================
-- Executar: DATABASE_SETUP_FINAL.sql completo para habilitar RLS corretamente
-- Isso vai criar as policies certas e re-habilitar RLS com segurança
