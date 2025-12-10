# Google Auth → Supabase: Mapeamento Completo de Dados

## 1️⃣ DADOS QUE VÊM DO GOOGLE

Quando usuário clica "Entrar com Google", Google retorna:

```json
{
  "provider": "google",
  "user": {
    "id": "google-oauth2|118364077523402176152",
    "email": "joao.silva@empresa.com.br",
    "email_confirmed_at": "2025-12-10T14:30:00Z",
    "name": "João Silva",
    "avatar_url": "https://lh3.googleusercontent.com/a/default-user=s96-c",
    "raw_app_meta_data": {
      "provider": "google",
      "providers": ["google"]
    },
    "raw_user_meta_data": {
      "email": "joao.silva@empresa.com.br",
      "email_verified": true,
      "full_name": "João Silva",
      "iss": "https://accounts.google.com",
      "name": "João Silva",
      "picture": "https://lh3.googleusercontent.com/a/default-user=s96-c",
      "provider_id": "118364077523402176152",
      "sub": "118364077523402176152"
    },
    "user_metadata": {
      "email": "joao.silva@empresa.com.br",
      "full_name": "João Silva"
    },
    "identities": [
      {
        "id": "118364077523402176152",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "identity_data": {
          "email": "joao.silva@empresa.com.br",
          "email_verified": true,
          "full_name": "João Silva",
          "iss": "https://accounts.google.com",
          "name": "João Silva",
          "picture": "https://lh3.googleusercontent.com/a/default-user=s96-c",
          "provider_id": "118364077523402176152",
          "sub": "118364077523402176152"
        },
        "provider": "google",
        "last_sign_in_at": "2025-12-10T14:30:00Z",
        "created_at": "2025-12-10T14:30:00Z",
        "updated_at": "2025-12-10T14:30:00Z"
      }
    ]
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "expires_at": 1733847000,
    "refresh_token": "sbr_1234567890abc...",
    "user": { ... }
  }
}
```

---

## 2️⃣ COMO FICA NA TABELA `auth.users` (Supabase)

### Tabela: `auth.users`

```sql
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  role,
  instance_id,
  confirmation_sent_at,
  recovery_sent_at,
  is_sso_user
FROM auth.users
WHERE email = 'joao.silva@empresa.com.br';
```

**Resultado:**

| Coluna | Valor |
|--------|-------|
| `id` | `550e8400-e29b-41d4-a716-446655440000` |
| `email` | `joao.silva@empresa.com.br` |
| `encrypted_password` | `NULL` (sem senha, só OAuth) |
| `email_confirmed_at` | `2025-12-10 14:30:00+00` |
| `created_at` | `2025-12-10 14:30:00+00` |
| `updated_at` | `2025-12-10 14:30:00+00` |
| `raw_user_meta_data` | JSON com dados Google |
| `raw_app_meta_data` | `{"provider":"google","providers":["google"]}` |
| `role` | `authenticated` |
| `is_sso_user` | `true` |

---

## 3️⃣ COMO FICA NA TABELA `public.users` (Seu Schema)

Quando usuário faz login via Google, Supabase RPC `get_current_org_id()` vincula à org:

```sql
SELECT 
  id,
  organization_id,
  full_name,
  email,
  role,
  setor,
  created_at,
  updated_at,
  ui_settings
FROM public.users
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

**Resultado (NOVO USUÁRIO):**

| Coluna | Valor | Nota |
|--------|-------|------|
| `id` | `550e8400-e29b-41d4-a716-446655440000` | UUID do auth.users |
| `organization_id` | `org_uuid_123` | Vinculado via invite-user ou auto-assign |
| `full_name` | `João Silva` | Do Google (name) |
| `email` | `joao.silva@empresa.com.br` | Do Google |
| `role` | `FUNCIONARIO` | Padrão (pode ser mudado) |
| `setor` | `NULL` | Definir depois |
| `created_at` | `2025-12-10 14:30:00+00` | Agora |
| `updated_at` | `2025-12-10 14:30:00+00` | Agora |
| `ui_settings` | `{...}` | Padrão do sistema |

---

## 4️⃣ FLUXO COMPLETO: Google Auth → Supabase

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. USUÁRIO CLICA "Entrar com Google"                      │
│     ↓                                                       │
│  2. LoginPage.tsx chama: dbClient.auth.signInWithOAuth()   │
│     ↓                                                       │
│  3. Google Auth Server:                                    │
│     ├─ Valida credenciais                                  │
│     ├─ Retorna authorization_code                          │
│     └─ Redirect para callback URL                          │
│     ↓                                                       │
│  4. Supabase OAuth Callback:                               │
│     ├─ Recebe authorization_code                           │
│     ├─ Troca por access_token com Google                   │
│     ├─ Extrai dados: email, name, picture                  │
│     ├─ CRIA SESSION: JWT + refresh_token                   │
│     └─ Redireciona para app (/app/dashboard)               │
│     ↓                                                       │
│  5. App Recebe Session:                                    │
│     ├─ localStorage.setItem('supabase.auth.token', JWT)    │
│     ├─ Chama onAuthStateChange()                           │
│     ├─ Se novo user → INSERT em public.users               │
│     ├─ Se exist user → UPDATE last_login                   │
│     └─ Redireciona para dashboard                          │
│     ↓                                                       │
│  6. Dados SALVO no Supabase:                               │
│     ├─ auth.users (gerado por Supabase)                   │
│     ├─ public.users (sua tabela)                           │
│     ├─ auth.identities (vinculação Google ID)              │
│     └─ audit_logs (opcional, para rastrear)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ TABELAS AFETADAS E ESTRUTURA

### 5.1 `auth.identities` (Supabase Auto)

```sql
SELECT * FROM auth.identities
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
```

**Resultado:**

```
id: "118364077523402176152"
user_id: "550e8400-e29b-41d4-a716-446655440000"
identity_data:
{
  "email": "joao.silva@empresa.com.br",
  "email_verified": true,
  "full_name": "João Silva",
  "picture": "https://lh3.googleusercontent.com/a/...",
  "provider_id": "118364077523402176152",
  "sub": "118364077523402176152"
}
provider: "google"
last_sign_in_at: "2025-12-10 14:30:00+00"
created_at: "2025-12-10 14:30:00+00"
updated_at: "2025-12-10 14:30:00+00"
```

### 5.2 `public.users` (Sua Tabela)

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  organization_id UUID REFERENCES organizations,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('CLIENTE_GERENTE', 'DONO_SAAS', 'FUNCIONARIO')),
  setor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ui_settings JSONB,
  -- Novo: rastrear auth_method
  auth_method TEXT CHECK (auth_method IN ('email_password', 'google_oauth', 'sms_otp')),
  CONSTRAINT check_has_role CHECK (role IS NOT NULL)
);
```

**INSERT automático quando novo user via Google:**

```sql
INSERT INTO public.users (
  id, 
  organization_id, 
  full_name, 
  email, 
  role, 
  auth_method,
  ui_settings
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'org_uuid_123',
  'João Silva',
  'joao.silva@empresa.com.br',
  'FUNCIONARIO',
  'google_oauth',
  '{"baseTheme":"system","fontFamily":"Inter","accentColor":"indigo"}'
);
```

---

## 6️⃣ EXEMPLO REAL: COMO FICA NA PRÁTICA

### Cenário: Admin convida João via Email, João aceita com Google

#### Passo 1: Admin convida
```bash
# FuncionariosPage.tsx → AppCore.tsx → invoke('invite-user')
POST /functions/v1/invite-user HTTP/1.1
Body: {
  "email": "joao.silva@empresa.com.br",
  "name": "João Silva",
  "setor": "TI",
  "role": "FUNCIONARIO"
}
```

**Resultado no Supabase:**
```sql
-- auth.users (criado como "invited" sem senha)
INSERT INTO auth.users (email, is_sso_user)
VALUES ('joao.silva@empresa.com.br', false);

-- public.users (vinculado à org do admin)
INSERT INTO public.users (
  id, organization_id, full_name, email, role, setor
) VALUES (
  'new_uuid', 'admin_org_id', 'João Silva', 'joao.silva@empresa.com.br', 'FUNCIONARIO', 'TI'
);
```

#### Passo 2: João recebe email com link de convite
```
Assunto: Você foi convidado para TagsFlow!

Clique aqui: https://app.tagsflow.com.br/accept-invite?token=eyJ0eXAiOiJKV1QiLCJhbGc...

Token válido por: 7 dias
```

#### Passo 3: João clica, vai para SetPasswordPage
- João deveria definir senha
- OU João clica "Entrar com Google" (alternativa)

#### Passo 4: João escolhe Google OAuth
```javascript
// LoginPage.tsx
handleGoogleLogin = async () => {
  await dbClient.auth.signInWithOAuth({ provider: 'google' });
}
```

**O que acontece:**
1. ✅ Google autentica João
2. ✅ Supabase mapeia google ID → user existente (por email)
3. ✅ `encrypted_password = NULL` (mantém assim)
4. ✅ Atualiza `raw_user_meta_data` com dados Google
5. ✅ `auth.identities` vincula Google ID ao user
6. ✅ Cria JWT session
7. ✅ João logado, acesso ao app

**Resultado final no Supabase:**

```sql
-- auth.users (ATUALIZADO)
id: 'new_uuid'
email: 'joao.silva@empresa.com.br'
encrypted_password: NULL (sem senha)
email_confirmed_at: '2025-12-10 14:30:00' (Google verificou)
raw_user_meta_data: {
  "email": "joao.silva@empresa.com.br",
  "full_name": "João Silva",
  "picture": "https://lh3.googleusercontent.com/...",
  "provider_id": "118364077523402176152"
}
raw_app_meta_data: {
  "provider": "google",
  "providers": ["google"]
}
is_sso_user: true

-- public.users (MANTÉM COMO ESTAVA)
id: 'new_uuid'
organization_id: 'admin_org_id'
full_name: 'João Silva'
email: 'joao.silva@empresa.com.br'
role: 'FUNCIONARIO'
setor: 'TI'
auth_method: 'google_oauth' ← ATUALIZADO

-- auth.identities (NOVO)
id: '118364077523402176152'
user_id: 'new_uuid'
provider: 'google'
identity_data: { ... }
```

---

## 7️⃣ DADOS COMPARTILHADOS COM GOOGLE

⚠️ **O que Google coleta:**

```
✅ Email (necessário para autenticação)
✅ Nome (necessário para perfil)
✅ Foto (necessário para avatar)
❌ Histórico de navegação (não compartilhado com Supabase)
❌ Localização (não compartilhado com Supabase)
❌ Contatos (não compartilhado com Supabase)
```

✅ **O que Supabase armazena:**
- Email ✅ (necessário)
- Nome ✅ (necessário)
- Foto/Avatar ✅ (necessário)
- Google ID ✅ (para vinculação)

---

## 8️⃣ QUERY ÚTIL: VER TODOS OS USUÁRIOS E SEUS MÉTODOS AUTH

```sql
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.organization_id,
  u.auth_method,
  CASE 
    WHEN au.encrypted_password IS NOT NULL THEN 'Senha'
    WHEN ai.provider = 'google' THEN 'Google OAuth'
    WHEN ai.provider = 'phone' THEN 'SMS OTP'
    ELSE 'Desconhecido'
  END as auth_type,
  au.email_confirmed_at,
  au.last_sign_in_at,
  ai.provider,
  STRING_AGG(DISTINCT ai.provider, ', ') as linked_providers
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
LEFT JOIN auth.identities ai ON u.id = ai.user_id
GROUP BY u.id, au.id, ai.provider
ORDER BY u.created_at DESC;
```

**Exemplo de Resultado:**

| id | full_name | email | organization_id | auth_method | auth_type | email_confirmed_at | last_sign_in_at | provider |
|---|---|---|---|---|---|---|---|---|
| uuid1 | João Silva | joao@empresa.com | org1 | google_oauth | Google OAuth | 2025-12-10 | 2025-12-10 14:30 | google |
| uuid2 | Maria Santos | maria@empresa.com | org1 | email_password | Senha | 2025-12-08 | 2025-12-10 10:15 | NULL |
| uuid3 | Pedro Costa | pedro@empresa.com | org2 | email_password + google | Senha, Google OAuth | 2025-12-05 | 2025-12-10 09:45 | google |

---

## 9️⃣ COMO IMPLEMENTAR NO SEU CÓDIGO

### 9.1 Adicionar `auth_method` à tabela users

```sql
-- Executar no Supabase SQL Editor
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_method TEXT 
CHECK (auth_method IN ('email_password', 'google_oauth', 'sms_otp'));
```

### 9.2 Atualizar AppCore.tsx para rastrear método

```typescript
// Quando usuário faz login (qualquer método)
const handleLoginSuccess = async (method: 'email_password' | 'google_oauth' | 'sms_otp') => {
  const { data: { user }, error } = await dbClient.auth.getUser();
  
  if (user && user.id) {
    // Atualizar ou criar registro
    await dbClient.from('users').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      auth_method: method,
      // ... outros campos
    });
  }
};
```

### 9.3 Adicionar Aviso LGPD em LoginPage.tsx

```typescript
// Adicionar em LoginPage.tsx, antes do botão Google
<div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 text-xs text-yellow-900">
  <strong>⚠️ Privacidade:</strong> Ao usar Google OAuth, seus dados básicos (email, 
  nome) serão compartilhados com Google Inc. Leia nossa{' '}
  <a href="/privacy" className="underline font-medium">Política de Privacidade</a>.
</div>
```

---

## 🔟 SEGURANÇA: O QUE ESTÁ PROTEGIDO

✅ **JWT Token:**
- Armazenado em localStorage
- Enviado em Authorization header
- Expira em 1 hora
- Refresh token para renovação

✅ **RLS (Row Level Security):**
- Usuário só vê dados da sua org
- Queries automaticamente filtram por organization_id

✅ **Senhas:**
- Google: não armazenamos
- Email: bcrypt com salt 12

✅ **Email:**
- Verificado por Google ou Supabase
- Único por organization_id

---

## 📊 RESUMO: MAPEAMENTO FINAL

```
Google Auth Input
│
├─ email: "joao.silva@empresa.com.br"
├─ name: "João Silva"
├─ picture: "https://lh3.googleusercontent.com/..."
├─ provider_id: "118364077523402176152"
└─ sub: "118364077523402176152"
│
│ ↓ Supabase processa ↓
│
Supabase auth.users
│
├─ id: UUID gerado
├─ email: joao.silva@empresa.com.br
├─ email_confirmed_at: data/hora
├─ encrypted_password: NULL
├─ raw_user_meta_data: { ... }
└─ raw_app_meta_data: { provider: 'google' }
│
│ ↓ App cria registro ↓
│
Supabase public.users
│
├─ id: referencia auth.users
├─ organization_id: seu_org
├─ full_name: "João Silva"
├─ email: joao.silva@empresa.com.br
├─ role: FUNCIONARIO
├─ auth_method: "google_oauth"
└─ ui_settings: { ... }
│
│ ↓ Vinculação ↓
│
Supabase auth.identities
│
├─ id: provider_id
├─ user_id: UUID (referencia auth.users)
├─ provider: "google"
└─ identity_data: { ... }
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Google OAuth já está implementado
2. ✅ Supabase já gerencia tudo automaticamente
3. 🟡 Considere adicionar `auth_method` coluna
4. 🟡 Adicione aviso LGPD em LoginPage
5. 🟡 Implemente auditoria de logins
6. ✅ Testar fluxo completo em produção
