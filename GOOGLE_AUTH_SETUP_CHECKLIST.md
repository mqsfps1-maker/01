# 🔧 Google Auth Setup - Checklist Completo

**Cliente ID:** `639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com`

---

## ✅ PARTE 1: Google Cloud Console (JÁ FEITO)

- ✅ Projeto criado no Google Cloud Console
- ✅ OAuth 2.0 Client ID gerado
- ✅ Client ID: `639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com`

---

## ✅ PARTE 2: Supabase Auth Providers (REVISAR)

### 2.1 Acessar Supabase Dashboard

```
https://app.supabase.com
  → Seu projeto TagsFlow
    → Authentication
      → Providers
```

### 2.2 Google Provider Setup

**Status esperado:**

```
Provider: Google
├─ Status: ✅ ENABLED
├─ Client ID: [PREENCHIDO COM SEU ID]
├─ Client Secret: [PREENCHIDO]
└─ Authorized Redirect URIs: 
    ├─ https://[seu-projeto].supabase.co/auth/v1/callback
    ├─ https://[seu-projeto].supabase.co/auth/v1/callback?provider=google
    └─ http://localhost:3000/ (dev)
```

**Para obter Client Secret:**

1. Google Cloud Console → OAuth 2.0 Client ID
2. Click no seu Client ID
3. Copy o **Client Secret** (não a chave)
4. Colar no Supabase

---

## ✅ PARTE 3: URLs Autorizadas (CRÍTICO!)

### 3.1 No Google Cloud Console

```
APIs & Services → OAuth consent screen → Application settings
  → Authorized redirect URIs
    + https://seu-dominio.com.br/auth/v1/callback
    + https://seu-dominio.com.br/ (home page)
    + http://localhost:3000/ (desenvolvimento local)
```

### 3.2 No Supabase

```
Authentication → URL Configuration
  ├─ Site URL: https://seu-dominio.com.br
  ├─ Redirect URLs: 
  │   + https://seu-dominio.com.br/
  │   + http://localhost:3000/
  │   + https://seu-dominio.com.br/accept-invite
  │   + https://seu-dominio.com.br/set-password
  └─ Additional Redirect URLs: (se houver)
      + https://seu-dominio.com.br/dashboard
```

---

## ⚠️ PARTE 4: Variáveis de Ambiente (.env)

### 4.1 Criar arquivo `.env.local`

```bash
# Supabase URLs (obter em Supabase → Settings → API)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=seu-anon-key-muito-longo

# Google OAuth (seu Client ID)
VITE_GOOGLE_CLIENT_ID=639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com
```

### 4.2 Atualizar `vite.config.ts`

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

---

## ⚠️ PARTE 5: Supabase Client Config

### 5.1 Verificar `lib/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima';

export const dbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // ✅ IMPORTANTE para OAuth callback
  },
});
```

### 5.2 Verificar se está configurado

Se não tiver `.env.local`, o app vai usar valores padrão e falhar. 

**Status atual do seu projeto:**

```typescript
// lib/supabaseClient.ts - linha 3
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://[PREENCHIDO?]'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '[PREENCHIDO?]'
```

---

## ⚠️ PARTE 6: Verificar Configuração de Auth em App.tsx

### 6.1 Listener para detectar login

```typescript
// AppCore.tsx ou App.tsx
useEffect(() => {
  const { data: { subscription } } = dbClient.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth event:', event, 'Session:', session?.user?.email);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // ✅ Usuário logado (email+password, phone OTP, ou Google OAuth)
        setIsAuthenticated(true);
        setCurrentUser(session?.user);
      } else if (event === 'SIGNED_OUT') {
        // ❌ Usuário deslogou
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }
  );
  
  return () => subscription?.unsubscribe();
}, []);
```

---

## 🧪 PARTE 7: Teste Local

### 7.1 Verificar Ambiente

```bash
# Terminal
npm run dev
```

Vai abrir `http://localhost:3000`

### 7.2 Testar Google Login

1. Clique no botão "Entrar com Google"
2. Se redirecionar para Google → ✅ **Funciona**
3. Se der erro 400 ou não fizer nada → ❌ **Falta configuração**

**Erros comuns:**

| Erro | Causa | Solução |
|------|-------|--------|
| `redirect_uri_mismatch` | URL não autorizada no Google Cloud | Adicionar em "Authorized Redirect URIs" |
| `invalid_client` | Client ID errado ou inválido | Verificar `VITE_GOOGLE_CLIENT_ID` |
| Branco/não faz nada | Env vars não carregadas | Verificar `.env.local` |
| CORS error | Client Secret errado | Verificar Supabase provider setup |

---

## 🚀 PARTE 8: Deploy (Production)

### 8.1 Supabase → URL Configuration

```
Settings → URL Configuration
  ├─ Site URL: https://seu-dominio.com.br
  ├─ Redirect URLs:
  │   + https://seu-dominio.com.br/
  │   + https://seu-dominio.com.br/accept-invite
  │   + https://seu-dominio.com.br/set-password
  └─ Additional Redirect URLs: (se houver)
```

### 8.2 Google Cloud Console → Authorized Redirect URIs

```
APIs & Services → OAuth 2.0 Client IDs → [Seu Client ID]
  Authorized Redirect URIs:
  + https://seu-dominio.com.br/auth/v1/callback
  + https://seu-dominio.com.br/
  + https://seu-projeto.supabase.co/auth/v1/callback
```

### 8.3 Environment Variables (Vercel/Railway/seu host)

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_GOOGLE_CLIENT_ID=639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com
```

---

## 📋 Checklist Final

### Antes de fazer login:

- [ ] `.env.local` criado com todas as 3 vars
- [ ] `VITE_SUPABASE_URL` correto
- [ ] `VITE_SUPABASE_ANON_KEY` correto
- [ ] `VITE_GOOGLE_CLIENT_ID` = `639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com`

### Antes de ir para produção:

- [ ] Google Cloud Console: Redirect URIs incluem `https://seu-dominio.com.br/auth/v1/callback`
- [ ] Supabase: Site URL = `https://seu-dominio.com.br`
- [ ] Supabase: Google Provider habilitado com Client ID e Secret
- [ ] Supabase: Redirect URLs includes seu domain
- [ ] Env vars no host de deploy configuradas

---

## 🔍 Debug: Como Verificar Status

### No browser console:

```javascript
// Verificar se env vars foram carregadas
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

// Verificar se está logado
const session = await dbClient.auth.getSession();
console.log('Session:', session);

// Tentar login com Google
await dbClient.auth.signInWithOAuth({ provider: 'google' });
```

### No Supabase dashboard:

```
Authentication → Users
```

Depois de fazer login com Google, deve aparecer um novo usuário com:
- Email da conta Google
- Avatar (opcional)
- Last Sign In: agora

---

## 💡 Próximas Etapas

1. **CRIAR `.env.local`** com as 3 variáveis
2. **TESTAR localmente** clicando no "Entrar com Google"
3. **VERIFICAR Supabase** se novo usuário aparece em Users
4. **CONFIGURAR domínio** antes de fazer deploy
5. **TESTAR em produção** após deploy

---

## 📞 Suporte

**Se der erro:**

1. Verificar `http://localhost:3000` → F12 → Console → erros
2. Verificar Supabase Dashboard → Logs
3. Verificar Google Cloud Console → Audit logs
4. Verificar se `.env.local` existe (não fazer commit!)

