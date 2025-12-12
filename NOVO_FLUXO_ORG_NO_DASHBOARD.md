# ✅ NOVO FLUXO: Organização no Dashboard

## Mudança Principal
❌ **ANTES**: `/onboarding` era uma rota separada
✅ **DEPOIS**: Criar organização é feito **dentro do Dashboard**

## Novo Fluxo

### 1️⃣ Registrar
```
Registrar → Email + Senha
  ↓
Toast: "Cadastro enviado!"
  ↓
Mensagem: "Confirme seu email"
  ↓
Confirmar email
```

### 2️⃣ Login
```
Login → Email + Senha
  ↓
onAuthStateChange: SIGNED_IN
  ↓
App busca perfil
  ↓
✅ SEMPRE vai para /app/dashboard
```

### 3️⃣ Dashboard (Sem Organização)
```
Dashboard loads
  ↓
User sem organization_id
  ↓
Modal aparece: "Crie sua organização"
  ↓
Preenche CNPJ + Nome Empresa
  ↓
Clica "Criar"
  ↓
RPC cria organização_id
  ↓
Dashboard atualiza com dados
```

### 4️⃣ Dashboard (Com Organização)
```
Login
  ↓
Dashboard load
  ↓
User tem organization_id
  ↓
Dashboard funciona normalmente
```

## Mudanças no Código

### App.tsx
```typescript
// ANTES
if (profile.organization_id) {
  navigate('/app/dashboard');
} else {
  navigate('/onboarding');  // ❌ REMOVIDO
}

// DEPOIS
navigate('/app/dashboard');  // ✅ SEMPRE dashboard
```

### Rota /onboarding
```typescript
// ANTES
if (organization_id) {
  <Navigate to="/app/dashboard" />
} else {
  <OnboardingPage /> // ❌ MOSTRAVA FORMULÁRIO
}

// DEPOIS
<Navigate to="/app/dashboard" />  // ✅ NUNCA MOSTRA
```

### Rota /app/*
```typescript
// ANTES
if (organization_id) {
  <AppCore />
} else {
  <Navigate to="/onboarding" /> // ❌ REDIRECIONAVA
}

// DEPOIS
<AppCore />  // ✅ SEMPRE MOSTRA DASHBOARD
```

## O que fazer no Dashboard

No `AppCore.tsx` ou no componente raiz do dashboard, adicionar:

```typescript
if (!user.organization_id) {
  // Mostrar modal para criar organização
  <CreateOrganizationModal 
    user={user}
    onCreated={(org_id) => {
      setUser({ ...user, organization_id: org_id });
    }}
  />
}
```

## Benefícios

✅ Fluxo mais simples
✅ Usuário vê dashboard mesmo sem organização
✅ Pode criar organização a qualquer momento
✅ Sem rota `/onboarding` confusa
✅ Reutiliza componente `OnboardingPage` como modal se quiser

## Status
✅ App.tsx compilado
✅ RegisterPage compilado
✅ Pronto para teste
