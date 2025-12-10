# Google Auth → Supabase: Exemplos JSON Práticos

## 1️⃣ EXEMPLO 1: Novo usuário via Google OAuth

### Input: Dados que vêm do Google

```json
{
  "provider": "google",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joao.silva@empresa.com.br",
    "email_confirmed_at": "2025-12-10T14:30:00.123456Z",
    "phone": null,
    "confirmation_sent_at": null,
    "recovery_sent_at": null,
    "recovery_token": "",
    "otp_sent_at": null,
    "new_email": null,
    "new_phone": null,
    "invited_at": null,
    "action_link": "",
    "action_link_expires_at": "2025-12-10T14:40:00.123456Z",
    "email_change_token_new": "",
    "email_change_confirm_status": 0,
    "confirmed_at": "2025-12-10T14:30:00.123456Z",
    "information_updated_at": "2025-12-10T14:30:00.123456Z",
    "identity_last_sign_in_at": null,
    "identity_data": null,
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
          "picture": "https://lh3.googleusercontent.com/a/ACg8ocK7x1p9jF1Ak3x2B9pL6x5xM3x7x9xA1x2x3x4x5x6x7x8x9xA/s96-c",
          "provider_id": "118364077523402176152",
          "sub": "118364077523402176152"
        },
        "provider": "google",
        "last_sign_in_at": "2025-12-10T14:30:00.123456Z",
        "created_at": "2025-12-10T14:30:00.123456Z",
        "updated_at": "2025-12-10T14:30:00.123456Z"
      }
    ],
    "created_at": "2025-12-10T14:30:00.123456Z",
    "updated_at": "2025-12-10T14:30:00.123456Z",
    "is_anonymous": false,
    "name": "João Silva",
    "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK7x1p9jF1Ak3x2B9pL6x5xM3x7x9xA1x2x3x4x5x6x7x8x9xA/s96-c",
    "user_metadata": {
      "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK7x1p9jF1Ak3x2B9pL6x5xM3x7x9xA1x2x3x4x5x6x7x8x9xA/s96-c",
      "email": "joao.silva@empresa.com.br",
      "email_verified": true,
      "full_name": "João Silva",
      "iss": "https://accounts.google.com",
      "name": "João Silva",
      "picture": "https://lh3.googleusercontent.com/a/ACg8ocK7x1p9jF1Ak3x2B9pL6x5xM3x7x9xA1x2x3x4x5x6x7x8x9xA/s96-c",
      "provider_id": "118364077523402176152",
      "sub": "118364077523402176152"
    },
    "app_metadata": {
      "provider": "google",
      "providers": [
        "google"
      ]
    },
    "role": "authenticated",
    "updated_at": "2025-12-10T14:30:00.123456Z",
    "last_sign_in_at": "2025-12-10T14:30:00.123456Z",
    "amp": null,
    "aud": "authenticated",
    "confirmation_token": "",
    "email_link_token": "",
    "email_change_token": "",
    "recovery_token": "",
    "otp_token": ""
  },
  "session": {
    "provider_token": "ya29.a0AfH6SMBx1x2x3x4x5x6x7x8x9xA0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8",
    "provider_refresh_token": null,
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2p3dC5zdXBhYmFzZS5jbyIsInN1YiI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE3MzM4NDczNDIsImV4cCI6MTczMzg1MDk0MiwiZW1haWwiOiJqb2FvLnNpbHZhQGVtcHJlc2EuY29tLmJyIiwicGhvbmVfY29uZmlybWVkX2F0IjpudWxsLCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLX3JUMWFzZGYzcmRmQmNQMEJFNHJWcTZ6aVpmUW9uY1VsWmc9czk2LWMiLCJlbWFpbCI6ImpvYW8uc2lsdmFAZW1wcmVzYS5jb20uYnIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiSm/Do28gU2lsdmEiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiSm/Do28gU2lsdmEiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSzcxcDlqRjFBazN4MkI5cEw2eDV4TTN4N3g5eEExeDJ4M3g0eDV4Nng3eDh4OXhBL3M5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMTgzNjQwNzc1MjM0MDIxNzYxNTIiLCJzdWIiOiIxMTgzNjQwNzc1MjM0MDIxNzYxNTIifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTczMzg0NzM0Mn1dLCJjcmVkZW50aWFsX2lkIjoiMTQxYjFiN2ItNDUzOC00ZmY2LWFiMTItYTk1Yzc5NzVhZTI1In0.x1x2x3x4x5x6x7x8x9x0x1x2x3x4x5x6x7x8x9x0",
    "refresh_token": "sbr_1x2x3x4x5x6x7x8x9x0x1x2x3x4x5x6x7x8x9x0",
    "expires_in": 3600,
    "expires_at": 1733850942,
    "token_type": "bearer",
    "user": { ... }
  }
}
```

### Output: Como fica no Supabase

#### auth.users

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "joao.silva@empresa.com.br",
  "encrypted_password": null,
  "email_confirmed_at": "2025-12-10T14:30:00.123456+00:00",
  "invited_at": null,
  "confirmation_sent_at": null,
  "confirmation_token": "",
  "confirmed_at": "2025-12-10T14:30:00.123456+00:00",
  "recovery_sent_at": null,
  "recovery_token": "",
  "otp_sent_at": null,
  "otp_token": "",
  "phone": null,
  "phone_confirmed_at": null,
  "phone_change_sent_at": null,
  "phone_change_token": "",
  "email_change_sent_at": null,
  "email_change_token_new": "",
  "email_change_confirm_status": 0,
  "banned_until": null,
  "reauthentication_token": "",
  "reauthentication_sent_at": null,
  "is_sso_user": true,
  "deleted_at": null,
  "is_anonymous": false,
  "created_at": "2025-12-10T14:30:00.123456+00:00",
  "updated_at": "2025-12-10T14:30:00.123456+00:00",
  "last_sign_in_at": "2025-12-10T14:30:00.123456+00:00",
  "raw_app_meta_data": {
    "provider": "google",
    "providers": ["google"]
  },
  "raw_user_meta_data": {
    "avatar_url": "https://lh3.googleusercontent.com/a/...",
    "email": "joao.silva@empresa.com.br",
    "email_verified": true,
    "full_name": "João Silva",
    "iss": "https://accounts.google.com",
    "name": "João Silva",
    "picture": "https://lh3.googleusercontent.com/a/...",
    "provider_id": "118364077523402176152",
    "sub": "118364077523402176152"
  },
  "is_super_admin": false,
  "created_at_formatted": "2025-12-10 14:30:00.123456+00"
}
```

#### auth.identities

```json
{
  "identity_id": "118364077523402176152",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "identity_data": {
    "email": "joao.silva@empresa.com.br",
    "email_verified": true,
    "full_name": "João Silva",
    "iss": "https://accounts.google.com",
    "name": "João Silva",
    "picture": "https://lh3.googleusercontent.com/a/ACg8ocK7x1p9...",
    "provider_id": "118364077523402176152",
    "sub": "118364077523402176152"
  },
  "provider": "google",
  "last_sign_in_at": "2025-12-10T14:30:00.123456+00:00",
  "created_at": "2025-12-10T14:30:00.123456+00:00",
  "updated_at": "2025-12-10T14:30:00.123456+00:00"
}
```

#### public.users (SUA TABELA)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organization_id": "org-12345-6789-abcd-ef01-23456789abcd",
  "full_name": "João Silva",
  "email": "joao.silva@empresa.com.br",
  "role": "FUNCIONARIO",
  "setor": null,
  "created_at": "2025-12-10T14:30:00.123456+00:00",
  "updated_at": "2025-12-10T14:30:00.123456+00:00",
  "ui_settings": {
    "baseTheme": "system",
    "fontFamily": "Inter",
    "accentColor": "indigo",
    "customAccentColor": "#4f46e5",
    "fontSize": 16,
    "soundOnSuccess": true,
    "soundOnDuplicate": true,
    "soundOnError": true
  },
  "auth_method": "google_oauth"
}
```

---

## 2️⃣ EXEMPLO 2: Usuário existente recebe invite, depois usa Google

### Dia 1: Admin envia convite

```json
{
  "action": "invite_user",
  "by_admin_id": "admin-uuid-001",
  "email": "maria.santos@empresa.com.br",
  "name": "Maria Santos",
  "setor": "Vendas",
  "role": "CLIENTE_GERENTE"
}
```

**Estado no Supabase após convite:**

#### auth.users

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440999",
  "email": "maria.santos@empresa.com.br",
  "encrypted_password": null,
  "email_confirmed_at": null,
  "invited_at": "2025-12-10T10:00:00.123456+00:00",
  "confirmation_sent_at": "2025-12-10T10:00:00.123456+00:00",
  "confirmation_token": "cfr_abcd1234efgh5678ijkl9012mnop3456",
  "confirmed_at": null,
  "is_sso_user": false,
  "raw_app_meta_data": {
    "is_invited": true
  },
  "raw_user_meta_data": {}
}
```

#### public.users

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440999",
  "organization_id": "org-12345-6789-abcd-ef01-23456789abcd",
  "full_name": "Maria Santos",
  "email": "maria.santos@empresa.com.br",
  "role": "CLIENTE_GERENTE",
  "setor": "Vendas",
  "created_at": "2025-12-10T10:00:00.123456+00:00",
  "updated_at": "2025-12-10T10:00:00.123456+00:00",
  "ui_settings": {},
  "auth_method": null
}
```

**Email enviado:**

```
From: noreply@tagsflow.com.br
To: maria.santos@empresa.com.br
Subject: Você foi convidado para TagsFlow!

Olá Maria,

Você foi convidado por [Admin Name] para fazer parte de TagsFlow.

Clique aqui para ativar sua conta:
https://app.tagsflow.com.br/accept-invite?token=cfr_abcd1234efgh5678ijkl9012mnop3456

Este link expira em 7 dias.

Atenciosamente,
TagsFlow Team
```

### Dia 2: Maria clica no link

```
Maria clica no link
    ↓
Página: SetPasswordPage
    ├─ Opção 1: Definir senha
    └─ Opção 2: [Entrar com Google] ← Maria escolhe
    ↓
Google Auth ← Autentica como maria.santos@empresa.com.br
    ↓
Supabase verifica: email já existe? SIM ✅
    ↓
Vincula Google ID ao user existente
```

**Estado no Supabase APÓS Google Auth:**

#### auth.users (ATUALIZADO)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440999",
  "email": "maria.santos@empresa.com.br",
  "encrypted_password": null,
  "email_confirmed_at": "2025-12-11T09:15:00.123456+00:00",  ← ATUALIZADO
  "invited_at": "2025-12-10T10:00:00.123456+00:00",
  "confirmation_sent_at": "2025-12-10T10:00:00.123456+00:00",
  "confirmation_token": "",
  "confirmed_at": "2025-12-11T09:15:00.123456+00:00",  ← PREENCHIDO
  "is_sso_user": true,  ← ATUALIZADO
  "raw_app_meta_data": {
    "provider": "google",  ← NOVO
    "providers": ["google"],  ← NOVO
    "is_invited": true
  },
  "raw_user_meta_data": {
    "avatar_url": "https://lh3.googleusercontent.com/a/...",
    "email": "maria.santos@empresa.com.br",
    "email_verified": true,
    "full_name": "Maria Santos",
    "iss": "https://accounts.google.com",
    "name": "Maria Santos",
    "picture": "https://lh3.googleusercontent.com/a/...",
    "provider_id": "105239876543210987654",
    "sub": "105239876543210987654"
  },
  "last_sign_in_at": "2025-12-11T09:15:00.123456+00:00"  ← ATUALIZADO
}
```

#### auth.identities (NOVO REGISTRO)

```json
{
  "identity_id": "105239876543210987654",
  "user_id": "550e8400-e29b-41d4-a716-446655440999",
  "identity_data": {
    "email": "maria.santos@empresa.com.br",
    "email_verified": true,
    "full_name": "Maria Santos",
    "iss": "https://accounts.google.com",
    "name": "Maria Santos",
    "picture": "https://lh3.googleusercontent.com/a/...",
    "provider_id": "105239876543210987654",
    "sub": "105239876543210987654"
  },
  "provider": "google",
  "last_sign_in_at": "2025-12-11T09:15:00.123456+00:00",
  "created_at": "2025-12-11T09:15:00.123456+00:00",
  "updated_at": "2025-12-11T09:15:00.123456+00:00"
}
```

#### public.users (MESMO REGISTRO, MAS ATUALIZADO)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440999",
  "organization_id": "org-12345-6789-abcd-ef01-23456789abcd",
  "full_name": "Maria Santos",
  "email": "maria.santos@empresa.com.br",
  "role": "CLIENTE_GERENTE",
  "setor": "Vendas",
  "created_at": "2025-12-10T10:00:00.123456+00:00",
  "updated_at": "2025-12-11T09:15:00.123456+00:00",  ← ATUALIZADO
  "ui_settings": {
    "baseTheme": "system",
    "fontFamily": "Inter",
    "accentColor": "indigo"
  },
  "auth_method": "google_oauth"  ← ATUALIZADO
}
```

---

## 3️⃣ EXEMPLO 3: Desconto de Etiquetas (Integrado com Auth)

### Usuário logado via Google gera PDF

```json
{
  "action": "generate_pdf",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_email": "joao.silva@empresa.com.br",
  "user_name": "João Silva",
  "organization_id": "org-12345-6789-abcd-ef01-23456789abcd",
  "auth_method": "google_oauth",
  "label_count": 12,
  "timestamp": "2025-12-10T14:35:00.123456Z"
}
```

**Supabase RPC chamado:**

```sql
SELECT increment_label_count_safe(12) 
FROM auth.users 
WHERE id = '550e8400-e29b-41d4-a716-446655440000'
AND organization_id = 'org-12345-6789-abcd-ef01-23456789abcd';
```

**Resposta:**

```json
{
  "success": true,
  "message": "12 labels consumed",
  "remaining_labels": 988,
  "labels_used": 12,
  "plan_limit": 1000,
  "bonus_balance": 0,
  "timestamp": "2025-12-10T14:35:00.123456Z"
}
```

**Registrado em audit_logs (recomendado):**

```json
{
  "id": "audit-uuid-001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "organization_id": "org-12345-6789-abcd-ef01-23456789abcd",
  "event_type": "generate_pdf",
  "auth_method": "google_oauth",
  "resource": "etiquetas",
  "action": "consume_labels",
  "quantity_affected": 12,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "status": "success",
  "created_at": "2025-12-10T14:35:00.123456+00:00"
}
```

---

## 4️⃣ QUERY ÚTIL: VER TODOS USUÁRIOS COM MÉTODO AUTH

```sql
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.organization_id,
  u.auth_method,
  au.email_confirmed_at,
  au.last_sign_in_at,
  au.is_sso_user,
  CASE 
    WHEN ai.id IS NOT NULL THEN 'Google ID: ' || ai.id
    WHEN au.encrypted_password IS NOT NULL THEN 'Email+Senha'
    ELSE 'Sem método'
  END as auth_provider,
  CASE 
    WHEN DATE_PART('day', NOW() - au.last_sign_in_at) < 1 THEN 'Online'
    WHEN DATE_PART('day', NOW() - au.last_sign_in_at) < 7 THEN 'Semanal'
    ELSE 'Inativo'
  END as activity
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
LEFT JOIN auth.identities ai ON u.id = ai.user_id AND ai.provider = 'google'
ORDER BY u.created_at DESC;
```

**Resultado esperado:**

| id | full_name | email | auth_method | email_confirmed_at | last_sign_in_at | is_sso_user | auth_provider | activity |
|---|---|---|---|---|---|---|---|---|
| uuid1 | João Silva | joao@... | google_oauth | 2025-12-10 | 2025-12-10 14:30 | true | Google ID: 118364... | Online |
| uuid2 | Maria Santos | maria@... | google_oauth | 2025-12-11 | 2025-12-11 09:15 | true | Google ID: 105239... | Online |
| uuid3 | Pedro Costa | pedro@... | email_password | 2025-12-05 | 2025-12-10 10:45 | false | Email+Senha | Semanal |

---

## ✅ RESUMO: O QUE FICA SALVO

```
Google Input                    │  Supabase Storage
────────────────────────────────┼─────────────────────────────
email                           │  auth.users.email
                                │  public.users.email
                                │
full_name                       │  auth.users.raw_user_meta_data
                                │  public.users.full_name
                                │
picture/avatar                  │  auth.users.raw_user_meta_data
                                │  
provider_id                     │  auth.identities.id
sub                             │  auth.identities.identity_data.sub
                                │
email_verified                  │  auth.users.email_confirmed_at
                                │  auth.identities.identity_data.email_verified
                                │
iss (issuer)                    │  auth.identities.identity_data.iss
```

---

## 🎯 FLUXO FINAL

```json
[Google Login Button Click]
        ↓
[Google OAuth Dialog]
        ↓
[Email: joao.silva@empresa.com.br ✓ Verificado]
[Name: João Silva ✓ Obtido]
[Picture: https://lh3... ✓ Obtido]
[Provider: google ✓ Marcado]
        ↓
[Supabase processa...]
        ↓
{
  "auth.users": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joao.silva@empresa.com.br",
    "email_confirmed_at": "2025-12-10T14:30:00Z",
    "encrypted_password": null,
    "is_sso_user": true,
    "raw_app_meta_data": {"provider": "google"}
  },
  "auth.identities": {
    "id": "118364077523402176152",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "provider": "google",
    "identity_data": {...}
  },
  "public.users": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "João Silva",
    "email": "joao.silva@empresa.com.br",
    "auth_method": "google_oauth"
  }
}
        ↓
[JWT Token gerado]
[localStorage.setItem('token', JWT)]
        ↓
[Dashboard carregado]
[João logado! ✓]
```
