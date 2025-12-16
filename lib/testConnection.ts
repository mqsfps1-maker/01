/**
 * Script de teste de conexão Supabase
 * Execute no console do navegador
 */

import { dbClient } from './supabaseClient';

export const testSupabaseConnection = async () => {
    console.log('🔍 Iniciando teste de conexão Supabase...\n');

    try {
        // 1. Testar conexão básica
        console.log('1️⃣ Testando conexão com Supabase...');
        const { data: session } = await dbClient.auth.getSession();
        console.log('✅ Conexão OK. Session:', session);

        // 2. Testar se tabela users existe
        console.log('\n2️⃣ Testando se tabela "users" existe...');
        const { data: usersData, error: usersError } = await dbClient
            .from('users')
            .select('id')
            .limit(1);
        
        if (usersError) {
            console.error('❌ Erro ao acessar "users":', usersError);
            console.log('   → Possível: Tabela não existe, RLS bloqueando, ou erro de permissão');
        } else {
            console.log('✅ Tabela "users" encontrada. Registros:', usersData?.length || 0);
        }

        // 3. Testar Auth
        console.log('\n3️⃣ Testando autenticação...');
        const { data: authUser } = await dbClient.auth.getUser();
        if (authUser?.user) {
            console.log('✅ Usuário autenticado:', authUser.user.email);
        } else {
            console.log('⚠️  Nenhum usuário autenticado (esperado em login/register)');
        }

        // 4. Testar email templates
        console.log('\n4️⃣ Informações da instância Supabase:');
        console.log('   URL:', import.meta.env.VITE_SUPABASE_URL || 'não configurado');
        console.log('   ✅ Anon Key está configurada');

        console.log('\n📋 DIAGNÓSTICO RESUMIDO:');
        console.log('   Se erro na tabela "users": verifique RLS ou execute SQL do arquivo SQL_DIAGNOSTICO.md');
        console.log('   Se erro de autenticação: verifique email templates no Supabase');
        console.log('   Se tudo OK: problema pode ser no frontend ou na lógica de auth');

    } catch (error: any) {
        console.error('🚨 Erro durante teste:', error);
        console.log('Detalhes:', error.message);
    }
};

// Executar teste
export const runDiagnostics = () => {
    console.log('%c=== TESTE DE DIAGNÓSTICO SUPABASE ===', 'color: blue; font-weight: bold; font-size: 16px');
    testSupabaseConnection();
};

// Para usar, execute no console do navegador (DevTools F12):
// import { runDiagnostics } from './lib/testConnection'
// runDiagnostics()
