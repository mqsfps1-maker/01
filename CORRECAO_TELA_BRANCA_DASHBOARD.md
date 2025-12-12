# 🔧 Correção: Tela Branca no Dashboard Após Onboarding

## Problema Identificado
Após completar o onboarding (colocar CNPJ e nome da empresa), ao tentar acessar o dashboard:
- ❌ Tela fica branca/em branco
- ❌ Ao dar F5 (refresh), volta para a tela de onboarding
- ❌ `organization_id` não estava sendo carregado no estado do App

## Causa Raiz
O fluxo anterior era:
1. ✅ OnboardingPage completa a RPC `complete_new_user_profile`
2. ✅ Banco atualiza o user com `organization_id`
3. ❌ **MAS** OnboardingPage usava `window.location.href` para redirecionar
4. ❌ Isso recarregava a página inteira SEM refetch do perfil no App.tsx
5. ❌ App.tsx tentava carregar o user, mas o cache (`currentUserIdRef`) indicava que já estava carregado
6. ❌ Perfil antigo (SEM `organization_id`) era mantido em memória
7. ❌ Dashboard não carregava porque `organization_id === null`

## Solução Implementada

### 1. **OnboardingPage.tsx** - Remover redirecionamento imediato
**Antes:**
```tsx
// PROBLEMA: Recarrega página sem refetch
setTimeout(() => window.location.href = '/app/dashboard', 100);
onComplete();
```

**Depois:**
```tsx
// SOLUÇÃO: Aguarda processamento e sinaliza para refetch
await new Promise(resolve => setTimeout(resolve, 500));
localStorage.removeItem('_user_profile_cache');
console.log('[ONBOARDING] Completado, sinalizando app para refetch...');
onComplete();
```

### 2. **App.tsx** - Adicionar estado `forceRefetch`
```tsx
const [forceRefetch, setForceRefetch] = useState(false);
```

**Uso:**
- Quando `onComplete()` é chamado → `setForceRefetch(true)`
- Novo `useEffect` monitora `forceRefetch`
- Se `true` → faz refetch do perfil do usuário
- Se perfil tem `organization_id` → navega para dashboard
- Se não tem → fica na onboarding

### 3. **App.tsx** - Novo useEffect para Refetch
```tsx
useEffect(() => {
    if (forceRefetch && user) {
        console.log('[AUTH] ForceRefetch ativado, buscando novo perfil...');
        const refetchProfile = async () => {
            const { data: { session } } = await dbClient.auth.getSession();
            if (session?.user) {
                const profile = await fetchUserProfile(session.user.id);
                if (profile && profile.organization_id) {
                    console.log('[AUTH] Org_id encontrado, navegando para dashboard...');
                    setUser(profile);
                    setTimeout(() => navigate('/app/dashboard', { replace: true }), 200);
                }
                setForceRefetch(false);
            }
        };
        refetchProfile();
    }
}, [forceRefetch, user, navigate]);
```

### 4. **App.tsx** - Rota de Onboarding atualizada
```tsx
<OnboardingPage 
    user={user!} 
    onComplete={() => { 
        console.log('[ONBOARDING] Forçando refetch do perfil...');
        setForceRefetch(true);  // ← Ativa o refetch
    }} 
    addToast={addToast} 
/>
```

## Fluxo Corrigido

```
┌─────────────────────────────────────────────────────┐
│ 1. User coloca CNPJ + Nome empresa                  │
│    (/onboarding)                                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. OnboardingPage executa RPC                       │
│    complete_new_user_profile()                      │
│    ✅ Retorna organization_id                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Aguarda 500ms para banco processar               │
│    Limpa localStorage                               │
│    Chama onComplete()                               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. App.tsx recebe onComplete()                      │
│    setForceRefetch(true) ← Ativa refetch            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. useEffect([forceRefetch]) ativa                  │
│    fetchUserProfile() busca dados mais novos        │
│    ✅ Retorna user COM organization_id             │
│    setUser(newProfile)                              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Navega para /app/dashboard                       │
│    ✅ Dashboard carrega dados corretamente          │
│    ✅ Sem tela branca                               │
│    ✅ Sem loaders visíveis                          │
└─────────────────────────────────────────────────────┘
```

## Mudanças de Arquivos

| Arquivo | Mudança | Linha |
|---------|---------|-------|
| `pages/OnboardingPage.tsx` | Remover `window.location.href`, adicionar delay 500ms | ~70 |
| `App.tsx` | Adicionar estado `forceRefetch` | ~110 |
| `App.tsx` | Atualizar lógica de cache check | ~230 |
| `App.tsx` | Adicionar novo useEffect para refetch | ~350 |
| `App.tsx` | Atualizar rota de onboarding | ~385 |

## Teste Manual

### ✅ Fluxo de Teste Completo

1. **Abrir app**
   ```
   npm run dev
   → Acessa http://localhost:3000/
   ```

2. **Registrar nova conta**
   - Email: `teste@example.com`
   - Senha: `Senha123!`
   - ✅ Redireciona para `/onboarding`

3. **Completar onboarding**
   - CNPJ: `34.028.317/0001-00` (Brazillis)
   - Empresa: `Brazillis` (auto-preenchido)
   - Clica em "Concluir e Acessar"

4. **Observar console**
   ```
   [ONBOARDING] Perfil completo com sucesso!
   [ONBOARDING] Limpando cache para refetch...
   [ONBOARDING] Completado, sinalizando app para refetch...
   [AUTH] ForceRefetch ativado, buscando novo perfil...
   [AUTH] Perfil refetch com sucesso, org_id: <uuid>
   [AUTH] Org_id encontrado, navegando para dashboard...
   ```

5. **Verificar dashboard**
   - ✅ Dashboard carrega SEM tela branca
   - ✅ Sem spinners visíveis
   - ✅ Dados carregam em 100-300ms

6. **Sair e voltar**
   - Logout
   - Login novamente
   - ✅ Dashboard carrega direto (sem re-fetch desnecessário)
   - ✅ Tab switch não faz re-fetch

## Status

✅ **Build:** 0 erros, 2075 módulos transformados  
✅ **Código:** TypeScript compilado com sucesso  
✅ **Lógica:** Fluxo de refetch implementado  
✅ **Teste:** Pronto para testar no browser

## Próximos Passos

1. Recarregar página no navegador (Ctrl+Shift+R para hard refresh)
2. Testar fluxo completo: Register → Onboarding → Dashboard
3. Verificar console para logs [ONBOARDING] e [AUTH]
4. Confirmar que não há tela branca e que redirecionamento funciona
