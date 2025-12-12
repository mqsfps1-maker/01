# ✅ Fluxo Simplificado de Autenticação (CORRIGIDO)

## 🎯 Novo Fluxo

```
┌─────────────────────────────────────────┐
│ 1. REGISTER                             │
│ Email + Senha (senha já é definida)    │
│ ✅ auth.users criado                   │
│ ✅ public.users criado (trigger)       │
│ ✅ has_set_password = FALSE (padrão)   │
│ ❌ organization_id = NULL               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 2. ONBOARDING (/onboarding)             │
│ Preenche CNPJ + Nome Empresa            │
│ RPC complete_new_user_profile():        │
│   ✅ Cria organization                  │
│   ✅ Vincula ao user (organization_id)  │
│   ✅ NÃO altera has_set_password        │
│   ✅ Retorna success + organization_id  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 3. REDIRECT para /login ← AQUI!        │
│ "Cadastro concluído! Faça login..."     │
│ User sai da sessão (logout)             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 4. LOGIN (/login)                       │
│ Email + Senha (mesma do registro)      │
│ Auth valida credenciais                 │
│ App.tsx fetches user profile            │
│ Status: ✅ org_id ✅ has_set_password   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 5. DASHBOARD (/app/dashboard)           │
│ ✅ Sem tela branca                      │
│ ✅ Sem loaders visíveis                 │
│ ✅ Dados carregam corretamente          │
└─────────────────────────────────────────┘
```

## 📋 Mudanças Implementadas

### 1️⃣ **BANCO_LIMPO.sql** - RPC `complete_new_user_profile`
```sql
-- ANTES: Setava has_set_password = TRUE
UPDATE public.users SET 
  organization_id = v_organization_id,
  cpf_cnpj = p_cpf_cnpj,
  has_set_password = TRUE  ← REMOVER!

-- DEPOIS: Apenas vincula organization
UPDATE public.users SET 
  organization_id = v_organization_id,
  cpf_cnpj = p_cpf_cnpj
  -- has_set_password continua FALSE
```

### 2️⃣ **OnboardingPage.tsx** - Redirecionar para /login
```tsx
// ANTES: Tentava navegar para dashboard via forceRefetch
onComplete();

// DEPOIS: Redireciona direto para login
addToast('Cadastro concluído! Faça login com suas credenciais.', 'success');
setTimeout(() => navigate('/login', { replace: true }), 500);
onComplete();
```

### 3️⃣ **App.tsx** - Remover lógica de refetch e password check
```tsx
// ANTES: Verificava has_set_password para redirecionar /set-password
if (!has_set_password) {
  navigate('/set-password')
}

// DEPOIS: Se tem organization_id, vai para dashboard. Simples!
if (!organization_id) {
  navigate('/onboarding')
} else {
  <AppCore /> // dashboard
}
```

## ✅ Fluxo por Cenário

### Cenário 1: Usuário Novo (Completo)
```
1. Register: email@example.com / Senha123!
   → Vai para /onboarding (porque organization_id = NULL)

2. Onboarding: CNPJ + Empresa
   → RPC cria organization
   → Redireciona para /login ← AQUI MUDA!
   → "Cadastro concluído! Faça login..."

3. Login: email@example.com / Senha123!
   → Valida senha
   → Fetches user com organization_id ✅
   → Vai para /app/dashboard ✅

4. Dashboard: Carrega dados corretamente!
```

### Cenário 2: Usuário Retornando
```
1. Login: email@example.com / Senha123!
   → Valida credenciais
   → Fetches user: org_id ✅ has_set_password ✅
   → Vai direto para /app/dashboard ✅
```

### Cenário 3: User Tenta Onboarding 2x
```
1. Primeira vez:
   CNPJ: 34.028.317/0001-00
   → RPC cria organization
   → Sucesso! Redireciona para /login

2. Segunda vez (se tentar acessar /onboarding novamente):
   → User já tem organization_id
   → Rota redireciona: /onboarding → /app/dashboard
   → Evita duplicar organization!
```

## 🗄️ Mudanças no Banco de Dados

**Nenhuma migração necessária!** Apenas reexecute o BANCO_LIMPO.sql em Supabase:

```sql
-- Isso vai:
1. ✅ Dropar função antiga
2. ✅ Criar nova função SEM has_set_password = TRUE
3. ✅ Mantém todas as outras tables e policies intactas
```

## 🧪 Teste Manual

### ✅ Fluxo Completo
```bash
# Passo 1: HARD REFRESH (Ctrl+Shift+R)
→ Limpa todo o cache

# Passo 2: REGISTER
Email: novo@example.com
Senha: Senha@123
→ Vai para /onboarding

# Passo 3: ONBOARDING
CNPJ: 34.028.317/0001-00
Empresa: [Auto-preenchido = Brazillis]
Clica "Concluir e Acessar"
→ ✅ Toast: "Cadastro concluído! Faça login com suas credenciais."
→ ✅ URL muda para /login ← AQUI!
→ ✅ Sessão encerrada

# Passo 4: LOGIN
Email: novo@example.com
Senha: Senha@123
→ ✅ Valida email/senha
→ ✅ Vai direto para /app/dashboard (SEM set-password)
→ ✅ Dashboard carrega dados corretamente

# Passo 5: LOGOUT E LOGIN NOVAMENTE
→ ✅ Login funciona normalmente
→ ✅ Dashboard carrega direto
```

## 📊 Tabela de Estados

| Etapa | Email | Org_ID | Password | Resultado |
|-------|-------|--------|----------|-----------|
| Register | ✅ | ❌ | ✅ | → /onboarding |
| Onboarding | ✅ | ✅ | ✅ | → /login |
| Login | ✅ | ✅ | ✅ | → /dashboard |

## 🚀 Status Final

| Item | Status |
|------|--------|
| Build | ✅ Sem erros |
| TypeScript | ✅ 0 erros |
| RPC | ✅ Atualizada |
| Fluxo | ✅ Simplificado |
| Testes | ⏳ Aguardando testar |

## ⚠️ IMPORTANTE: Próximos Passos

1. **Reexecute BANCO_LIMPO.sql em Supabase**
   - Abra Supabase Dashboard
   - SQL Editor → New Query
   - Cole todo o conteúdo de BANCO_LIMPO.sql
   - Clique RUN

2. **Hard Refresh no navegador (Ctrl+Shift+R)**
   - Limpa localStorage e sessionStorage
   - Força reload de todos os arquivos

3. **Teste o fluxo completo**
   - Veja os logs no console [ONBOARDING] e [AUTH]
   - Confirme que redireciona para /login após onboarding
   - Confirme que login leva para dashboard

4. **Se houver erro, avise-me!**
   - Mostre a mensagem de erro
   - Mostre os logs do console
   - Mostre o que estava tentando fazer
