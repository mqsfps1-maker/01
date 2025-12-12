# 🎯 Fluxo Completo de Autenticação e Navegação

## Cenários de Login

### 📋 Cenário 1: Usuário Novo (sem organização)
```
1. Register → Cria user em auth.users (trigger cria em public.users)
   ✅ Email vinculado
   ✅ User vinculado
   ❌ organization_id = NULL
   ❌ has_set_password = false

2. App.tsx carrega perfil
   Navega para: /onboarding (porque organization_id = NULL)

3. User preenche onboarding
   CNPJ: 34.028.317/0001-00
   Empresa: Brazillis
   
4. Clica "Concluir e Acessar"
   RPC cria organization
   ✅ organization_id = <uuid>
   ✅ email e user vinculados à organization
   
5. App.tsx faz refetch (forceRefetch = true)
   ✅ Carrega novo profile COM organization_id
   
6. Navega para: /set-password
   (porque has_set_password = false)

7. User define password
   ✅ has_set_password = true
   
8. Navega para: /app/dashboard ✅ SUCESSO
```

### 📋 Cenário 2: Usuário Retornando (já tem tudo)
```
1. Vai para /login
   Email + Senha (já tem ambos vinculados)

2. Auth.getSession() → retorna session ativa

3. App.tsx fetchUserProfile() retorna:
   ✅ organization_id = <uuid>
   ✅ has_set_password = true
   ✅ email vinculado
   ✅ user vinculado

4. Lógica no App.tsx:
   if (profile.organization_id && profile.has_set_password) {
       navigate('/app/dashboard', { replace: true })
   }

5. Navega para: /app/dashboard ✅ SUCESSO (direto!)
```

### 📋 Cenário 3: Usuário com Onboarding Incompleto
```
1. Login com credenciais
   ✅ organization_id = <uuid>
   ❌ has_set_password = false

2. App.tsx verifica:
   if (!has_set_password) {
       navigate('/set-password')
   }

3. Navega para: /set-password
   (usuário pula onboarding porque já tem org_id)

4. Define password
   ✅ has_set_password = true

5. Navega para: /app/dashboard ✅ SUCESSO
```

## Lógica de Roteamento

### 📍 Rota `/app/*` (Dashboard)
```tsx
if (!user.organization_id) {
    // Cenário 1: Novo user
    → /onboarding
}
else if (!user.has_set_password) {
    // Cenário 3: Tem org mas sem password
    → /set-password
}
else {
    // Cenário 2: User completo
    → AppCore (dashboard) ✅
}
```

### 🔄 Fluxo de Refetch Pós-Onboarding
```
1. OnboardingPage.handleSubmit()
   ↓
2. RPC complete_new_user_profile() executa
   ↓
3. Aguarda 500ms (banco processar)
   ↓
4. Chama onComplete()
   ↓
5. App.tsx recebe: setForceRefetch(true)
   ↓
6. useEffect([forceRefetch]) ativa
   ↓
7. fetchUserProfile() busca novo perfil
   ↓
8. Detecta organization_id
   ↓
9. Navega para /set-password ou /app/dashboard
```

## Vinculações Garantidas

| Campo | Quando é Setado | Garantido Por |
|-------|-----------------|--------------|
| `email` | Register (auth.users) | Supabase Auth |
| `user.id` | Register (trigger `handle_new_user`) | Banco de dados |
| `organization_id` | OnboardingPage RPC | RPC `complete_new_user_profile` |
| `has_set_password` | SetPasswordPage | RPC ao setar senha |

## Console Logs Para Debug

### ✅ Novo usuário registrando
```
[AUTH] Verificando sessão...
[AUTH] Sessão encontrada para: usuario@email.com
[AUTH] ✓ Login bem-sucedido, org_id: null, has_set_password: false
[ONBOARDING] Enviando dados para servidor
[ONBOARDING] Perfil completo com sucesso!
[ONBOARDING] Limpando cache para refetch...
[AUTH] ForceRefetch ativado, buscando novo perfil...
[AUTH] Perfil refetch com sucesso, org_id: <uuid>, has_set_password: false
[AUTH] Org_id encontrado, navegando para set-password...
```

### ✅ Usuário retornando (login normal)
```
[AUTH] Verificando sessão...
[AUTH] Sessão encontrada para: usuario@email.com
[AUTH] ✓ Login bem-sucedido, org_id: <uuid>, has_set_password: true
[AUTH] Usuário com profile completo (org_id + password), navegando para dashboard...
```

## Checklist de Funcionamento

- [ ] Register cria user com email vinculado ✅
- [ ] OnboardingPage completa com CNPJ auto-preenchido ✅
- [ ] RPC cria organization e vincula ao user ✅
- [ ] Refetch carrega novo profile com organization_id ✅
- [ ] SetPasswordPage define has_set_password = true ✅
- [ ] Login direto → dashboard (sem onboarding) ✅
- [ ] Sem tela branca no dashboard ✅
- [ ] Sem loaders visíveis ✅
- [ ] Email e user vinculados corretamente ✅

## Test Case: Login Completo

```bash
# Passo 1: Registrar
Email: teste@example.com
Senha: Senha123!
→ Vai para /onboarding

# Passo 2: Onboarding
CNPJ: 34.028.317/0001-00
Empresa: [Auto-preenchido]
Clica "Concluir e Acessar"
→ Vai para /set-password

# Passo 3: Definir Senha
Senha anterior: Senha123!
Senha nova: NovaSenh@123
Confirma
→ Vai para /app/dashboard ✅

# Passo 4: Logout e Login Novamente
Logout
Email: teste@example.com
Senha: NovaSenh@123
→ Vai DIRETO para /app/dashboard ✅✅✅
```

## Mudanças de Código

| Arquivo | Mudança |
|---------|---------|
| `App.tsx` | Adicionar verificação `org_id && has_set_password` |
| `App.tsx` | Navegar automático para dashboard se profile está completo |
| `App.tsx` | Melhorar lógica de rota `/app/*` |
| `OnboardingPage.tsx` | Remover `window.location.href` |

**Status:** ✅ Build sem erros, pronto para testar!
