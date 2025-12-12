# ⚡ CORREÇÃO CRÍTICA: Race Condition Auth Flow

## Problema
Havia **DOIS listeners de autenticação** rodando simultaneamente:
1. `checkSession()` - checava sessão ao montar
2. `onAuthStateChange()` - escutava eventos de auth

Isso causava **race condition** e quebrava a landing page.

## Solução
✅ **Removi `checkSession()` completamente**
✅ **Deixei apenas `onAuthStateChange()` como fonte única de verdade**
✅ **Adicionado evento `INITIAL_SESSION` para pegar sessão inicial**

## Mudanças no App.tsx

### ANTES (Bugado):
```tsx
const checkSession = async () => { ... };
checkSession();  // ❌ Chama 1x

const { data: { subscription } } = dbClient.auth.onAuthStateChange(async (event, session) => {
  // ❌ CONFLITO: Outro listener rodando
});
```

### DEPOIS (Correto):
```tsx
// ✅ UMA fonte única de verdade
const { data: { subscription } } = dbClient.auth.onAuthStateChange(async (event, session) => {
  if (event === 'INITIAL_SESSION') { /* primeira carga */ }
  if (event === 'SIGNED_IN') { /* login */ }
  if (event === 'TOKEN_REFRESHED') { /* refresh */ }
  if (event === 'SIGNED_OUT') { /* logout */ }
});
```

## Fluxo Corrigido

```
App monta
  ↓
onAuthStateChange dispara com 'INITIAL_SESSION'
  ↓
Busca perfil do usuário
  ↓
Seta loading = false
  ↓
Renderiza com usuário
  ↓
Landing page / Login / Dashboard aparece ✅
```

## Status
✅ Compilado sem erros
✅ Pronto para teste

## Próximos Passos
1. Hard refresh: **Ctrl+Shift+R**
2. Devem ver landing page aparecer normalmente
3. Sem mais "piscadas" ou delays estranhos
