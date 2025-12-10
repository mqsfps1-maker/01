# 🎯 Google Auth Setup - PASSO A PASSO VISUAL

## PASSO 1️⃣: Preparar seu `.env.local`

### 1.1 Criar arquivo na raiz do projeto

```
c:\Users\MAQUINA\Downloads\thetagsflow\
├─ .env.local                    ← CRIAR AQUI (não fazer commit)
├─ .env.local.example            ← Template (referência)
├─ src/
├─ pages/
├─ components/
├─ lib/
│  └─ supabaseClient.ts
├─ vite.config.ts
└─ package.json
```

### 1.2 Conteúdo do `.env.local`

```bash
# Obter estas informações do Supabase
VITE_SUPABASE_URL=https://xxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc...

# Seu Client ID Google
VITE_GOOGLE_CLIENT_ID=639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com
```

---

## PASSO 2️⃣: Obter Supabase URL e ANON KEY

### 2.1 Acesse Supabase Dashboard

```
https://app.supabase.com
  ↓
[Seu projeto TagsFlow]
  ↓
Settings (⚙️ ícone)
  ↓
API
  ↓
Verá:
├─ Project URL: https://xxxxxxx.supabase.co  ← COPIAR
└─ Anon public key: eyJhbGc... ← COPIAR
```

### 2.2 Exemplo visual

```
┌─ Settings ──────────────────────────────┐
│                                         │
│  API                                   │
│                                         │
│  Project URL                           │
│  https://abc12345.supabase.co ◄────────┼──► Copiar para VITE_SUPABASE_URL
│                                         │
│  Anon public key                        │
│  eyJhbGciOiJIUzI1NiIsInR5c... ◄────────┼──► Copiar para VITE_SUPABASE_ANON_KEY
│                                         │
└─────────────────────────────────────────┘
```

---

## PASSO 3️⃣: Configurar Google Provider no Supabase

### 3.1 Acesse Authentication → Providers

```
Supabase Dashboard
  ↓
Authentication
  ↓
Providers
  ↓
Google (você verá)
```

### 3.2 Setup do Google Provider

```
┌─ Google Provider ──────────────────────────────┐
│                                                │
│  ☐ Enabled                                    │
│    ↓                                           │
│  ✅ Enabled  ← ATIVAR SE NÃO ESTIVER         │
│                                                │
│  Client ID *                                  │
│  [639844500678-3e34...] ◄─────────────────────┤ Seu Client ID Google
│                                                │
│  Client Secret *                              │
│  [xxxxxxxxxxxxxxxxxxx] ◄──────────────────────┤ DO Google Cloud Console
│                                                │
│  Authorized Redirect URIs (read-only)         │
│  https://abc12345.supabase.co/auth/v1/callback│
│                                                │
│  [SAVE]                                        │
│                                                │
└────────────────────────────────────────────────┘
```

### 3.3 Como obter Client Secret?

```
Google Cloud Console
  ↓
APIs & Services
  ↓
Credentials (Credenciais)
  ↓
OAuth 2.0 Client IDs
  ↓
[Seu Client ID 639844500678...]
  ↓
Clique nele
  ↓
Verá:
├─ Client ID: 639844500678-3e34...
└─ Client Secret: xxxxxxxxxxxxxxxxxxx  ← COPIAR PARA SUPABASE
```

---

## PASSO 4️⃣: Configurar URLs no Supabase

### 4.1 Authentication → URL Configuration

```
Supabase Dashboard
  ↓
Authentication
  ↓
URL Configuration
  ↓
Aparecerá:
```

### 4.2 Preencher campos

```
┌─ URL Configuration ──────────────────────────┐
│                                              │
│  Site URL *                                 │
│  [https://seu-dominio.com.br] ◄──────────────┤ Seu domínio
│                                              │
│  Redirect URLs *                            │
│  ├─ https://seu-dominio.com.br/            │
│  ├─ http://localhost:3000/                 │
│  ├─ https://seu-dominio.com.br/accept-invite│
│  └─ https://seu-dominio.com.br/set-password│
│                                              │
│  Additional Redirect URLs (opcional)        │
│  [https://seu-dominio.com.br/dashboard]    │
│                                              │
│  [SAVE]                                     │
│                                              │
└──────────────────────────────────────────────┘
```

### ⚠️ IMPORTANTE para DESENVOLVIMENTO LOCAL

```
URL Configuration → Redirect URLs
  ├─ https://seu-dominio.com.br/  (produção)
  └─ http://localhost:3000/       (desenvolvimento)
```

---

## PASSO 5️⃣: Autorizar URLs no Google Cloud

### 5.1 Google Cloud Console → OAuth Consent

```
Google Cloud Console
  ↓
APIs & Services
  ↓
OAuth consent screen
  ↓
Scroll até "Authorized Redirect URIs"
  ↓
[+ ADD URI]
  ↓
Adicione:
├─ https://seu-projeto.supabase.co/auth/v1/callback
├─ https://seu-dominio.com.br/
├─ https://seu-dominio.com.br/auth/v1/callback
└─ http://localhost:3000/
```

### 5.2 Visual

```
┌─ OAuth consent screen ─────────────────┐
│                                        │
│  Authorized Redirect URIs              │
│  [+ Add URI]                          │
│                                        │
│  https://projeto.supabase.co/auth/... │
│  https://seu-dominio.com.br/          │
│  https://seu-dominio.com.br/auth/...  │
│  http://localhost:3000/               │
│                                        │
│  [SAVE]                                │
│                                        │
└────────────────────────────────────────┘
```

---

## PASSO 6️⃣: Testar Localmente

### 6.1 Reiniciar servidor

```bash
# Terminal
npm run dev
```

Deve aparecer:
```
  VITE v6.2.0  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### 6.2 Ir para http://localhost:3000

```
Verá a tela de login com:
┌─────────────────────────────────┐
│  TagsFlow                       │
│                                 │
│  [Entrar com Google]     ◄─────┬┤ Clique aqui
│  ────────────── OU ──────────   │
│  [1x SMS/Telefone]              │
│  ────────────── OU ──────────   │
│  Email: [_________]             │
│  Senha: [_________]             │
│  [Entrar]                       │
│                                 │
└─────────────────────────────────┘
```

### 6.3 Teste #1: Clique "Entrar com Google"

```
Esperado:
  ↓
Redireciona para: accounts.google.com/signin
  ↓
Pede email e senha da sua conta Google
  ↓
Volta para http://localhost:3000/dashboard
  ↓
SUCESSO! ✅
```

```
Se der erro:
  ↓
Abra F12 → Console
  ↓
Verá mensagem como:
- "redirect_uri_mismatch" → Falta adicionar URL no Google Cloud
- "invalid_client" → Client ID errado
- "Blank page" → .env.local não carregado
```

---

## PASSO 7️⃣: Verificar Usuário no Supabase

### 7.1 Após fazer login com Google

```
Supabase Dashboard
  ↓
Authentication
  ↓
Users
  ↓
Verá novo usuário:
```

### 7.2 Detalhes do usuário

```
┌─ User Details ──────────────────┐
│                                 │
│  UID: 550e8400-e29b-41d4...   │
│  Email: seu@email.com          │
│  Confirmed: ✅ Yes             │
│  Last Sign In: 2 seconds ago    │
│                                 │
│  Identities:                    │
│  └─ google                      │
│     ID: 118364077523402176152   │
│     Provider: google            │
│                                 │
│  User Metadata:                 │
│  {                              │
│    "name": "Seu Nome",         │
│    "picture": "https://...",   │
│    "provider_id": "118364..."  │
│  }                              │
│                                 │
└─────────────────────────────────┘
```

Se aparecer assim → ✅ **FUNCIONANDO!**

---

## PASSO 8️⃣: Checklist Final

### ✅ Antes de testar

- [ ] `.env.local` criado (não `.env.local.example`)
- [ ] `VITE_SUPABASE_URL` preenchido
- [ ] `VITE_SUPABASE_ANON_KEY` preenchido
- [ ] `VITE_GOOGLE_CLIENT_ID` = `639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com`
- [ ] `npm run dev` executado
- [ ] Terminal não mostra erros

### ✅ Após testar login

- [ ] Google login funciona
- [ ] Novo usuário aparece em Supabase → Users
- [ ] Dashboard carrega após login

### ✅ Antes de produção

- [ ] Google Cloud: Authorized Redirect URIs incluem seu domínio
- [ ] Supabase: Site URL = seu domínio
- [ ] Supabase: Google Provider ativado
- [ ] Env vars em seu host (Vercel, Railway, etc.)

---

## 🎓 Resumo Visual: Fluxo Completo

```
┌──────────────┐
│ App Local    │
│ :3000        │
└──────┬───────┘
       │
       │ "Entrar com Google" click
       ↓
┌──────────────────────────┐
│ Google Login Dialog      │
│ accounts.google.com      │
└──────┬───────────────────┘
       │
       │ Email + Password verificados
       ↓
┌──────────────────────────────────┐
│ Google retorna:                  │
│ - ID: 118364077523402176152     │
│ - Email: seu@email.com          │
│ - Name: Seu Nome               │
│ - Picture: https://...         │
└──────┬───────────────────────────┘
       │
       │ (JWT Token)
       ↓
┌──────────────────────────────────┐
│ Supabase verifica:               │
│ ✅ Google signature válida       │
│ ✅ Email confirmado             │
│ ✅ Client ID correto            │
└──────┬───────────────────────────┘
       │
       │ cria/atualiza:
       │ - auth.users
       │ - auth.identities (google)
       │ - public.users (se novo)
       ↓
┌──────────────────────────────────┐
│ Retorna JWT ao App               │
└──────┬───────────────────────────┘
       │
       │ localStorage.setItem('token', JWT)
       ↓
┌──────────────────────────────────┐
│ App redireciona para /dashboard  │
│ Carrega dados com JWT            │
│                                  │
│ ✅ LOGADO COM SUCESSO!          │
└──────────────────────────────────┘
```

---

## 🚨 Se der erro no PASSO 6

| Erro | Local | Solução |
|------|-------|---------|
| Botão não faz nada | Browser | `.env.local` não carregado ou Server não reiniciado |
| `redirect_uri_mismatch` | Google | Adicionar URL em Google Cloud → OAuth Consent → Authorized Redirect URIs |
| `invalid_client` | Google | Client ID errado em `.env.local` ou Google |
| `CORS error` | Browser F12 | Supabase Client Secret errado ou Google Provider não ativado |
| Blank page | Browser | Erro na função `handleGoogleLogin` - verificar F12 |

---

## 💾 Salvar Credenciais com Segurança

### NÃO FAZER:

```bash
# ❌ Não colocar secrets em código
export const GOOGLE_CLIENT_ID = "639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com"

# ❌ Não fazer commit de .env.local
git add .env.local  # ERRADO!
git commit -m "Add secrets"
```

### FAZER:

```bash
# ✅ Usar .env.local (local only)
# .env.local
VITE_GOOGLE_CLIENT_ID=639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com

# ✅ Adicionar ao .gitignore
echo ".env.local" >> .gitignore

# ✅ Fazer commit apenas de .env.local.example
git add .env.local.example
git commit -m "Add env example"
```

