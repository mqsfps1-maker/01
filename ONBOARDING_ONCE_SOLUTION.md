# ✅ SOLUÇÃO: Não ficar preso em Onboarding

## Problema
Ao deletar o usuário do banco, ao fazer login novamente, ficava preso pedindo onboarding infinitamente.

## Solução
Usar `has_set_password` como **indicador de "já completou onboarding uma vez"**:
- ✅ **Primeira vez**: `has_set_password = false` → Mostra Onboarding
- ✅ **Depois de completar**: `has_set_password = true` → Não mostra mais
- ✅ **Se deletar org depois**: Mesmo sem `organization_id`, não mostra Onboarding de novo

## Lógica Implementada

### Login - Redirecionamento
```typescript
if (event === 'SIGNED_IN') {
    if (profile.organization_id) {
        // Tem org → Dashboard
        navigate('/app/dashboard');
    } else if (!profile.has_set_password) {
        // Nunca fez onboarding → Onboarding (PRIMEIRA VEZ)
        navigate('/onboarding');
    } else {
        // Já fez onboarding mas deletou org → Dashboard mesmo assim
        navigate('/app/dashboard');
    }
}
```

### Rota /app/*
```typescript
if (user.organization_id) {
    // Dashboard normal
    <AppCore />
} else if (user.has_set_password) {
    // Já fez onboarding → Dashboard (sem org)
    <AppCore />
} else {
    // Nunca fez → Onboarding
    <Navigate to="/onboarding" />
}
```

### Rota /onboarding
```typescript
if (user.organization_id) {
    // Já tem org → Dashboard
    <Navigate to="/app/dashboard" />
} else if (user.has_set_password) {
    // Já completou antes → Dashboard
    <Navigate to="/app/dashboard" />
} else {
    // Primeira vez → Mostrar formulário
    <OnboardingPage />
}
```

## Fluxo Correto Agora

### 📋 Novo Usuário
```
1. Registra
2. Confirma email
3. Faz login
4. Vai para /onboarding (primeira vez)
5. Completa onboarding → has_set_password = true
6. Sai e volta para /login
7. Faz login de novo → Vai para /app/dashboard
```

### 📋 Usuário Existente (deletou org)
```
1. Já tinha account com has_set_password = true
2. Deletou a organização
3. Faz login
4. has_set_password ainda = true
5. ✅ Vai direto para /app/dashboard (não pede onboarding)
```

### 📋 Usuário Novo (sem account)
```
1. Primeira vez
2. has_set_password = false (padrão)
3. Faz login
4. Vai para /onboarding (deve preencher)
5. Após completar → has_set_password = true
```

## Status
✅ Compilado sem erros
✅ Lógica de onboarding "uma vez na vida"
✅ Não fica preso em loop
✅ Pronto para teste

## Teste
```
1. Deletar usuário completamente
2. Registrar de novo
3. Confirmar email
4. Fazer login
5. Deve ir para /onboarding (primeira vez)
6. Preencher CNPJ e enviar
7. Desconectar
8. Fazer login de novo
9. ✅ Deve ir para /app/dashboard (não pede onboarding)
