# 🔧 FIX PARA GOOGLE LOGIN BUG

## Problema Identificado

1. **Google Login não funcionava**: Usuários que faziam login com Google eram redirecionados para onboarding mesmo após completar
2. **Rotas bugadas**: Após completar onboarding e fazer login novamente, voltava para /onboarding
3. **organization_id não era salvo**: O campo `organization_id` não estava sendo persistido após onboarding

## Causa Raiz

1. O trigger `handle_new_user` estava com problemas ao fazer UPSERT
2. O `checkSession` e `onAuthStateChange` não estavam fazendo refresh do perfil após onboarding
3. A verificação de `organization_id` na rota `/app/*` era incorreta

## Mudanças Implementadas

### 1. **App.tsx** - Corrigido fluxo de autenticação
```tsx
// ANTES: Ignorava recarga do perfil se usuário já estava carregado
if (currentUserIdRef.current === session.user.id && user) {
    return; // ❌ PROBLEMA: Não refazia fetch
}

// DEPOIS: SEMPRE busca o perfil atualizado
const profile = await fetchUserProfile(session.user.id); // ✅ CORRETO
```

**Impacto**: Agora, após completar onboarding, quando você faz login de novo, o sistema vai refetch o perfil e encontrar o `organization_id` que foi salvo.

### 2. **App.tsx** - Melhorado fetchUserProfile
```tsx
// Agora identifica melhor quando o usuário não existe
if (error.code === 'PGRST116' || error.code === 'PGRST0' || 
    error.message.includes('permission denied') || 
    error.message.includes('No rows found')) {
    // Cria um fallback se não encontrar
}
```

### 3. **BANCO_LIMPO.sql** - Corrigido trigger handle_new_user
```sql
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    name = COALESCE(EXCLUDED.name, split_part(new.email, '@', 1)),
    auth_provider = COALESCE(new.raw_app_meta_data->>'provider', EXCLUDED.auth_provider);
```

**Impacto**: Agora o trigger faz UPSERT corretamente e não gera duplicatas.

### 4. **App.tsx** - Rota /app/* simplificada
```tsx
{user ? (
    user.organization_id ? (
        <AppCore user={user} setUser={setUser} addToast={addToast} />
    ) : (
        <Navigate to="/onboarding" replace />
    )
) : (
    <Navigate to="/login" replace />
)}
```

## Como Corrigir o Banco de Dados

### Opção 1: Rápido (Recomendado)
1. Abra Supabase
2. Vá para "SQL Editor"
3. Abra o arquivo `SQL_FIX_GOOGLE_LOGIN.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em "Run"

### Opção 2: Completo (Limpar Tudo)
1. Execute `BANCO_LIMPO.sql` novamente
2. Ele vai dropar e recriar todas as funções e triggers

## Teste o Fluxo Corrigido

### Teste 1: Google Login → Onboarding
```
1. Hard Refresh: Ctrl+Shift+R
2. Vá para /login
3. Clique "Entrar com Google"
4. ✅ Deve redirecionar para /onboarding
5. Preencha CNPJ: 34.028.317/0001-00
6. Clique "Cadastrar"
7. ✅ Toast de sucesso
8. ✅ Redirecionado para /login
```

### Teste 2: Login Após Onboarding
```
1. Em /login, faça login com a conta Google
2. ✅ NÃO deve voltar para /onboarding
3. ✅ Deve ir para /app/dashboard
4. ✅ Dashboard deve carregar normalmente
```

### Teste 3: Email/Senha Login
```
1. Registre com novo email
2. Confirme email
3. Faça login
4. ✅ Deve ir para /onboarding
5. Preencha e cadastre
6. ✅ Redirecionado para /login
7. Faça login novamente
8. ✅ Deve ir para /app/dashboard (NÃO /onboarding)
```

## Indicadores de Sucesso no Console

Você deve ver logs como:

```
[AUTH] ✓ Sessão ativa para: seu@email.com
[AUTH] ✓ Perfil carregado { org_id: "uuid-aqui", has_password: true }
[AUTH] ✓ Organization encontrada
```

## Mudanças de Arquivo

✅ **App.tsx** - Corrigido
- fetchUserProfile: melhorado
- checkSession: sempre refaz fetch
- onAuthStateChange: sempre refaz fetch
- Rota /app/*: lógica simplificada

✅ **BANCO_LIMPO.sql** - Atualizado
- handle_new_user: trigger corrigido

✅ **SQL_FIX_GOOGLE_LOGIN.sql** - Novo arquivo
- Script rápido para aplicar apenas o fix

## ⚠️ IMPORTANTE

**Execute a correção do banco ANTES de testar!**

Sem isso, o sistema ainda terá problemas porque o trigger antigo está ativo.
