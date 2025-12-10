# Google Auth Flow: Visualização de Dados em Tempo Real

## 📱 O QUE VOCÊ VÊ NA TELA

### Momento 1: Usuário clica "Entrar com Google"

```
┌─────────────────────────────────────────────┐
│                  TagsFlow                   │
├─────────────────────────────────────────────┤
│                                             │
│         Bem-vindo de volta!                 │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🔵 Entrar com Google               │   │ ← User clicks
│  └─────────────────────────────────────┘   │
│                                             │
│            OU                               │
│                                             │
│  📱 Telefone: [ _________ ]                 │
│     [Enviar Código]                         │
│                                             │
│            OU                               │
│                                             │
│  📧 Email: [ _________ ]                    │
│  🔐 Senha: [ _________ ]                    │
│     [Entrar com Email]                      │
│                                             │
└─────────────────────────────────────────────┘
```

### Momento 2: Google pede permissão

```
┌────────────────────────────────────┐
│  Você está aceitando entrar em      │
│  TagsFlow com sua conta Google      │
│                                    │
│  ☐ GoogleAuth quer acessar:        │
│     • Email                         │
│     • Perfil básico                 │
│     • Foto de perfil                │
│                                    │
│  [Permitir]  [Cancelar]            │
└────────────────────────────────────┘
```

### Momento 3: Redirecionado para app

```
┌─────────────────────────────────────┐
│    ⏳ Autenticando...               │
│                                     │
│    Sincronizando com TagsFlow...    │
│                                     │
└─────────────────────────────────────┘
    ↓ (após 2-3 segundos)
┌─────────────────────────────────────┐
│           Dashboard                 │
│  Bem-vindo, João Silva! 👋         │
│                                     │
│  [Estoque] [Etiquetas] [Pedidos]   │
│  ...                                │
└─────────────────────────────────────┘
```

---

## 🗄️ O QUE FICA SALVO NO SUPABASE

### Banco de Dados: `TagsFlow` (seu projeto)

#### 1. Tabela: `auth.users` (Sistema Supabase)

```
┌─ auth.users ──────────────────────────────────────────┐
│                                                        │
│ id          │ 550e8400-e29b-41d4-a716-446655440000   │
│ email       │ joao.silva@empresa.com.br               │
│ created_at  │ 2025-12-10 14:35:42.123456+00           │
│ updated_at  │ 2025-12-10 14:35:42.123456+00           │
│ last_sign_in_at  │ 2025-12-10 14:35:42.123456+00      │
│                  │                                    │
│ encrypted_password    │ NULL ← Sem senha (só OAuth)   │
│ email_confirmed_at    │ 2025-12-10 14:35:42+00        │
│                       │ (Google verificou)            │
│ is_sso_user           │ true                          │
│                  │                                    │
│ raw_user_meta_data    │ {                             │
│                       │   "email": "joao...",        │
│                       │   "full_name": "João",       │
│                       │   "picture": "https://...",  │
│                       │   "provider_id": "11836..." │
│                       │ }                             │
│                  │                                    │
│ raw_app_meta_data     │ {                             │
│                       │   "provider": "google",      │
│                       │   "providers": ["google"]    │
│                       │ }                             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### 2. Tabela: `auth.identities` (Vinculação Google)

```
┌─ auth.identities ─────────────────────────────────────┐
│                                                        │
│ id          │ 118364077523402176152 ← Google ID      │
│ user_id     │ 550e8400-e29b-41d4-a716-446655440000   │
│ provider    │ "google"                                │
│ created_at  │ 2025-12-10 14:35:42.123456+00           │
│ updated_at  │ 2025-12-10 14:35:42.123456+00           │
│                                                        │
│ identity_data         │ {                             │
│                       │   "iss": "https://accounts.. │
│                       │   "sub": "118364077...",      │
│                       │   "email": "joao@...",       │
│                       │   "email_verified": true,    │
│                       │   "name": "João Silva",      │
│                       │   "full_name": "João Silva", │
│                       │   "picture": "https://lh3..  │
│                       │   "provider_id": "11836..."  │
│                       │ }                             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### 3. Tabela: `public.users` (Sua Tabela)

```
┌─ public.users ────────────────────────────────────────┐
│                                                        │
│ id              │ 550e8400-e29b-41d4-a716...        │
│ organization_id │ org-12345-abcd-ef01-gh23...        │
│ full_name       │ "João Silva"                        │
│ email           │ "joao.silva@empresa.com.br"         │
│ role            │ "FUNCIONARIO"                       │
│ setor           │ "TI"                                │
│ created_at      │ 2025-12-10 14:35:42+00              │
│ updated_at      │ 2025-12-10 14:35:42+00              │
│                                                        │
│ ui_settings     │ {                                   │
│                 │   "baseTheme": "system",           │
│                 │   "fontFamily": "Inter",           │
│                 │   "accentColor": "indigo",         │
│                 │   "fontSize": 16                   │
│                 │ }                                   │
│                                                        │
│ auth_method     │ "google_oauth" ← Novo campo        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🔐 VALIDAÇÃO DE SEGURANÇA

### JWT Token (localStorage)

```javascript
// Isto é salvo no navegador após login
{
  "iss": "https://seu-projeto.supabase.co",
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "joao.silva@empresa.com.br",
  "email_confirmed_at": 1733847342,
  "phone_confirmed_at": null,
  "app_metadata": {
    "provider": "google",
    "providers": ["google"]
  },
  "user_metadata": {
    "email": "joao.silva@empresa.com.br",
    "full_name": "João Silva",
    "picture": "https://lh3.googleusercontent.com/..."
  },
  "aud": "authenticated",
  "created_at": 1733847342,
  "confirmed_at": 1733847342,
  "last_sign_in_at": 1733847342,
  "exp": 1733850942,  ← Expira em 1 hora
  "iat": 1733847342,
  "jti": "..."
}
```

---

## 📊 COMPARAÇÃO: FLUXOS DE AUTENTICAÇÃO

### Fluxo 1: Email + Senha (Tradicional)

```
Login Page
    ↓
[Email, Senha] → POST /auth/v1/token
    ↓
✅ Senha válida? → Cria JWT + Refresh Token
    ↓
localStorage.setItem('token', JWT)
    ↓
Dashboard
    ↓ (próximo login)
POST /auth/v1/token com refresh_token
    ↓
Novo JWT
```

**Dados no Supabase:**
- `auth.users.encrypted_password` = hash bcrypt ✅
- `auth.identities` = vazio ❌
- `public.users.auth_method` = "email_password"

---

### Fluxo 2: Google OAuth (Social Login)

```
Login Page
    ↓
[Clica Google] → auth.signInWithOAuth('google')
    ↓
Redireciona para: https://accounts.google.com/oauth...
    ↓
✅ Google autentica → authorization_code
    ↓
Supabase troca code → access_token do Google
    ↓
Extrai dados: email, name, picture
    ↓
localStorage.setItem('token', JWT)
    ↓
Dashboard
    ↓ (próximo login)
[Clica Google] → Detecta sessão existente → Auto-login
```

**Dados no Supabase:**
- `auth.users.encrypted_password` = NULL ✅
- `auth.identities.provider` = "google" ✅
- `auth.identities.identity_data` = dados do Google ✅
- `public.users.auth_method` = "google_oauth"

---

### Fluxo 3: SMS OTP (Telefone)

```
Login Page
    ↓
[Telefone] → POST /auth/v1/otp
    ↓
Supabase envia SMS com código
    ↓
[Código SMS] → POST /auth/v1/verify
    ↓
✅ Código válido? → Cria JWT
    ↓
localStorage.setItem('token', JWT)
    ↓
Dashboard
```

**Dados no Supabase:**
- `auth.users.encrypted_password` = NULL ✅
- `auth.users.phone` = "+5511987654321" ✅
- `auth.identities.provider` = "phone" ✅
- `public.users.auth_method` = "sms_otp"

---

## 🔄 FLUXO HYBRID: Email Convite + Google Auth

### Cenário Real: Admin convida João, João aceita com Google

#### Dia 1: Admin envia convite

```
Admin clica [Convidar Usuário]
    ↓
Input: email = "joao.silva@empresa.com.br"
       name = "João Silva"
       setor = "TI"
       role = "FUNCIONARIO"
    ↓
POST /functions/v1/invite-user
    ↓
Supabase gera invite link com token JWT
    ↓
Email enviado:
"Clique aqui para ativar sua conta:
 https://app.tagsflow.com.br/accept-invite?token=eyJ0eXA..."
    ↓
Salvo no Supabase:
auth.users: {
  id: new_uuid,
  email: "joao@...",
  encrypted_password: NULL,
  email_confirmed_at: NULL,
  raw_app_meta_data: { is_invited: true }
}
public.users: {
  id: new_uuid,
  organization_id: admin_org,
  full_name: "João Silva",
  role: "FUNCIONARIO",
  setor: "TI",
  auth_method: NULL  ← Ainda não escolheu
}
```

#### Dia 2: João clica no link

```
João clica link de convite
    ↓
Página: SetPasswordPage
"Você foi convidado! Defina uma senha:"
    [Senha] [Confirmar]
    
OU (novo!)
"Preferir Google?"
    [Entrar com Google] ← João escolhe isto
    ↓
redireciona para Google Login
    ↓
Google autentica João
    ↓
Supabase:
1. Detecta user com email "joao@..." já existe
2. Vincula Google ID ao user existente
3. Atualiza auth.users
4. Cria auth.identities
5. Atualiza public.users.auth_method = "google_oauth"
    ↓
João logado! ✅
```

**Resultado final no Supabase:**

```
auth.users (MESMO UUID):
├─ id: new_uuid (mesmo)
├─ email: joao@... (mesmo)
├─ encrypted_password: NULL (mantém)
├─ email_confirmed_at: 2025-12-11 10:30:00 (Google confirmou)
├─ raw_user_meta_data: { email, full_name, picture } (atualizado)
└─ raw_app_meta_data: { provider: "google" } (novo)

auth.identities (NOVO):
├─ id: 118364077...
├─ user_id: new_uuid (vinculado!)
├─ provider: "google"
└─ identity_data: {...}

public.users (MESMO REGISTRO):
├─ id: new_uuid (mesmo)
├─ full_name: "João Silva" (mantém)
├─ organization_id: admin_org (mantém)
└─ auth_method: "google_oauth" (atualizado)
```

---

## 📝 LOGS DE AUDITORIA (Recomendado)

Para rastrear logins:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  organization_id UUID REFERENCES organizations,
  event_type TEXT,  -- 'login', 'logout', 'invite', etc.
  auth_method TEXT, -- 'email_password', 'google_oauth', 'sms_otp'
  ip_address INET,
  user_agent TEXT,
  status TEXT,  -- 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exemplo de INSERT (fazer no lado do servidor)
INSERT INTO audit_logs (
  user_id, organization_id, event_type, 
  auth_method, ip_address, status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'org-12345-abcd',
  'login',
  'google_oauth',
  INET '192.168.1.100',
  'success'
);
```

---

## 🎯 RESUMO VISUAL

### Antes: Só Email

```
TagsFlow Database
│
├─ auth.users
│  ├─ id: uuid1
│  ├─ email: joao@...
│  ├─ encrypted_password: $2b$12$... ✅
│  └─ is_sso_user: false
│
└─ public.users
   ├─ id: uuid1
   ├─ full_name: João
   └─ auth_method: "email_password"
```

### Depois: Email + Google

```
TagsFlow Database
│
├─ auth.users
│  ├─ id: uuid1
│  ├─ email: joao@...
│  ├─ encrypted_password: NULL
│  ├─ is_sso_user: true
│  └─ raw_user_meta_data: { picture, ... } ✨
│
├─ auth.identities
│  ├─ id: 118364077...
│  ├─ user_id: uuid1
│  ├─ provider: "google"
│  └─ identity_data: { ... } ✨
│
└─ public.users
   ├─ id: uuid1
   ├─ full_name: João
   └─ auth_method: "google_oauth" ✨
```

---

## ✅ CHECKLIST: DADOS SEGUROS?

- ✅ Senha: Não armazenada com Google (NULL)
- ✅ Email: Verificado por Google
- ✅ Foto: De fonte confiável (Google)
- ✅ ID Google: Vinculado mas não exposto
- ✅ JWT: Expira em 1 hora
- ✅ Refresh Token: Seguro e renovável
- ✅ RLS: Filtra por organization_id automaticamente
- ✅ HTTPS: Obrigatório para OAuth

---

## 🚀 PRÓXIMAS AÇÕES

1. ✅ Adicionar coluna `auth_method` em `public.users`
2. ✅ Testar fluxo Google + Email convite
3. 🔄 Implementar auditoria de logins
4. 🔄 Adicionar aviso LGPD em LoginPage
5. ✅ Validar em produção
