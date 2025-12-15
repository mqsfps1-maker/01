# ✅ Google Auth Setup - Próximas Ações (SUA ORDEM)

## ✅ FEITO

- ✅ `.env.local` criado com Supabase URL e Anon Key
- ✅ Google Client ID configurado
- ✅ Variáveis de ambiente prontas

**Arquivo:** `.env.local`
```
VITE_SUPABASE_URL=https://gdnmukufvlyeqsasjelx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID=639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com
```

---

## ⏳ PRÓXIMAS AÇÕES (3 passos)

### 1️⃣ Configurar Google Provider no Supabase

**Link:** https://app.supabase.com/project/gdnmukufvlyeqsasjelx/auth/providers

**Passos:**

```
1. Ir em: Authentication → Providers
2. Procurar por "Google"
3. Se não estiver habilitado:
   ├─ Clique no "Google"
   ├─ Toggle "Enable" (ativar)
   ├─ Preencher:
   │  ├─ Client ID: 639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com
   │  └─ Client Secret: [OBTER DO GOOGLE CLOUD]
   └─ [SAVE]
```

**Como obter Client Secret:**

```
Google Cloud Console (console.cloud.google.com)
  → APIs & Services (search bar)
  → Credentials
  → OAuth 2.0 Client IDs
  → Clique em [639844500678-...]
  → Copie o "Client Secret"
```

---

### 2️⃣ Configurar URL Configuration no Supabase

**Link:** https://app.supabase.com/project/gdnmukufvlyeqsasjelx/auth/url-configuration

**Passos:**

```
1. Ir em: Authentication → URL Configuration
2. Preencher:
   ├─ Site URL: 
   │  └─ http://localhost:3000 (para desenvolvimento)
   │
   ├─ Redirect URLs:
   │  ├─ http://localhost:3000/
   │  ├─ http://localhost:3000/dashboard
   │  ├─ http://localhost:3000/accept-invite
   │  └─ http://localhost:3000/set-password
   │
   └─ [SAVE]
```

---

### 3️⃣ Autorizar URLs no Google Cloud Console

**Link:** Google Cloud Console → OAuth Consent Screen

**Passos:**

```
1. Google Cloud Console (console.cloud.google.com)
2. APIs & Services → OAuth consent screen
3. Scroll até "Authorized Redirect URIs"
4. [+ Add URI] para cada:
   ├─ https://gdnmukufvlyeqsasjelx.supabase.co/auth/v1/callback
   └─ http://localhost:3000/
5. [SAVE]
```

---

## 🧪 TESTE LOCAL

Após fazer os 3 passos acima:

```bash
# Terminal
npm run dev
```

Deve abrir `http://localhost:3000`

### Teste do Google Login:

```
1. Clique no botão "Entrar com Google"
2. Deve redirecionar para accounts.google.com
3. Login com sua conta Google
4. Deve voltar para http://localhost:3000/dashboard
5. ✅ SUCESSO!
```

### Verificar no Supabase:

```
1. Supabase Dashboard
2. Authentication → Users
3. Deve aparecer novo usuário com seu email Google
4. Status: "Confirmed" (verificado)
5. Provider: "google"
```

---

## 📋 Checklist Final

- [ ] Google Provider habilitado (com Client Secret preenchido)
- [ ] Site URL = http://localhost:3000
- [ ] Redirect URLs incluem http://localhost:3000/
- [ ] Google Cloud: Authorized Redirect URIs incluem gdnmukufvlyeqsasjelx.supabase.co/auth/v1/callback
- [ ] `npm run dev` executa sem erros
- [ ] Botão "Entrar com Google" funciona
- [ ] Novo usuário aparece em Supabase → Users

---

## 🎯 Depois: Deploy em Produção

Quando tudo funcionar local, antes de fazer deploy:

```
1. Mudar Site URL de http://localhost:3000 para seu domínio
   ├─ Exemplo: https://seu-dominio.com.br

2. Adicionar Redirect URLs com seu domínio
   ├─ https://seu-dominio.com.br/
   ├─ https://seu-dominio.com.br/dashboard
   └─ etc.

3. Google Cloud: Adicionar seu domínio em Authorized Redirect URIs

4. Env vars no seu host (Vercel, Railway, etc.)
   ├─ VITE_SUPABASE_URL
   ├─ VITE_SUPABASE_ANON_KEY
   └─ VITE_GOOGLE_CLIENT_ID
```

---

## 📞 Problemas?

**Erro ao clicar "Entrar com Google"?**

1. Abrir F12 (DevTools)
2. Aba "Console"
3. Ver a mensagem de erro
4. Verificar:
   - [ ] `.env.local` carregado? (verifique no Console: `import.meta.env.VITE_GOOGLE_CLIENT_ID`)
   - [ ] Google Provider habilitado no Supabase?
   - [ ] Client Secret correto?
   - [ ] Redirect URI autorizado no Google Cloud?

**Erro "redirect_uri_mismatch"?**

- Falta adicionar URL em Google Cloud → Authorized Redirect URIs

**Erro "invalid_client"?**

- Client ID errado ou não carregado via `.env.local`

**Blank page após Google login?**

- Verificar erro em F12 → Console
- Ou em Supabase → Logs

---

## 📚 Mais Documentos

Se precisar de mais detalhes:

- **GOOGLE_AUTH_SUPABASE_MAPPING.md** → Como dados fluem
- **GOOGLE_AUTH_SETUP_VISUAL.md** → Passo a passo visual
- **GOOGLE_AUTH_JSON_EXAMPLES.md** → Exemplos JSON reais
- **GOOGLE_AUTH_SETUP_CHECKLIST.md** → Checklist completo

---

## 🚀 Status: QUASE PRONTO!

```
[ ✅ Env Vars ]
    ↓
[ ⏳ Google Provider ]
    ↓
[ ⏳ URL Configuration ]
    ↓
[ ⏳ Google Cloud URLs ]
    ↓
[ ⏳ Teste Local ]
    ↓
[ 🎉 FUNCIONANDO! ]
```

**Próximo passo:** Fazer os 3 passos acima (estimado 10-15 min) e testar.

**Me avise quando terminar!** 🎯

