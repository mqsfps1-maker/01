# 📋 GOOGLE AUTH - TAREFAS PENDENTES

**Cliente ID:** `639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com`

---

## ⏳ PRÓXIMAS AÇÕES (em ordem)

### 1️⃣ CRIAR `.env.local`

**Status:** ❌ NÃO CRIADO YET

**Arquivo:** `c:\Users\MAQUINA\Downloads\thetagsflow\.env.local`

**Conteúdo:**
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
VITE_GOOGLE_CLIENT_ID=639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com
```

**Referência:** Ver `.env.local.example`

**Como fazer:**
```bash
# No VS Code:
# 1. File → New File
# 2. Nome: .env.local
# 3. Colar conteúdo acima (substituir valores Supabase)
# 4. Save (Ctrl+S)
# 5. Fechar (não fazer commit!)
```

---

### 2️⃣ OBTER SUPABASE URL E ANON KEY

**Status:** ⏳ VOCÊ PRECISA FORNECER

**Passos:**
1. Abrir https://app.supabase.com
2. Selecionar seu projeto "TagsFlow"
3. Settings (⚙️) → API
4. Copiar:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon public key** → `VITE_SUPABASE_ANON_KEY`

**Exemplo (fictício):**
```
VITE_SUPABASE_URL=https://abc12345def67890.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2p3dC5zdXBhYmFzZS5jbyIsInN1YiI6ImY1ZTlmNDI4LWZhMzgtNDczOC04Yzk1LWI3ZjkwMTJiYjY0MSIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE2OTUwMTYwMDAsImV4cCI6MTY5NTEwMjQwMH0.abc123xyz789...
```

---

### 3️⃣ HABILITAR GOOGLE PROVIDER NO SUPABASE

**Status:** ⏳ VERIFICAR

**Passos:**
1. Supabase Dashboard
2. Authentication → Providers
3. Google (procurar)
4. Se não tiver ativado:
   - [ ] Enabled
   - Preencer "Client ID": `639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com`
   - Precher "Client Secret": (obter do Google Cloud)
   - [SAVE]

**Onde obter Client Secret:**
```
Google Cloud Console
  → APIs & Services
  → Credentials
  → OAuth 2.0 Client IDs
  → [Seu Client ID]
  → Copy "Client Secret"
```

---

### 4️⃣ CONFIGURAR REDIRECT URIs NO GOOGLE CLOUD

**Status:** ⏳ FAZER

**Passos:**
1. Google Cloud Console
2. APIs & Services → OAuth consent screen
3. Scroll para "Authorized Redirect URIs"
4. [+ Add URI] para cada:
   - `https://seu-projeto.supabase.co/auth/v1/callback` ← seu projeto
   - `https://seu-dominio.com.br/` ← (se tiver domínio)
   - `https://seu-dominio.com.br/auth/v1/callback` ← (se tiver domínio)
   - `http://localhost:3000/` ← para testes locais
5. [SAVE]

**Nota:** Trocar `seu-projeto` pelo seu projeto Supabase (ex: `abc12345def67890`)

---

### 5️⃣ CONFIGURAR URLS NO SUPABASE

**Status:** ⏳ FAZER

**Passos:**
1. Supabase Dashboard
2. Authentication → URL Configuration
3. Preencher:
   - **Site URL**: `http://localhost:3000` (por agora)
   - **Redirect URLs**:
     - `http://localhost:3000/`
     - `http://localhost:3000/dashboard` (após login, para onde vai)
     - `http://localhost:3000/accept-invite` (se tiver invite system)
4. [SAVE]

**Quando for para produção, trocar para:**
```
Site URL: https://seu-dominio.com.br
Redirect URLs:
  - https://seu-dominio.com.br/
  - https://seu-dominio.com.br/dashboard
  - https://seu-dominio.com.br/accept-invite
```

---

### 6️⃣ TESTAR LOCALMENTE

**Status:** ⏳ APÓS FAZER OS PASSOS ACIMA

**Passos:**
```bash
# Terminal
npm run dev
```

Deve abrir `http://localhost:3000`

**Teste:**
1. Clique no botão "Entrar com Google"
2. Se redirecionar para Google login → ✅ OK
3. Login com sua conta Google
4. Se voltar para app logado → ✅ SUCESSO
5. Verificar em Supabase → Authentication → Users
   - Novo usuário deve aparecer com seu email Google

---

### 7️⃣ DEPOIS: DEPLOY

**Status:** ❌ DEPOIS

Quando tudo estiver funcionando local:

1. **Supabase URL Configuration** → trocar para seu domínio
2. **Google Cloud** → adicionar seu domínio em Redirect URIs
3. **Env vars** no seu host (Vercel, Railway, etc.)
4. **Deploy**

---

## 📋 RESUMO: O QUE TEM E O QUE FALTA

| Item | Status | Como resolver |
|------|--------|---|
| **Google Client ID** | ✅ Você deu | `639844500678-3e34a0rifene0tu5fre2576u9o6fl1ko.apps.googleusercontent.com` |
| **Google Client Secret** | ⏳ Você precisa obter | Google Cloud Console → Copy |
| **Supabase URL** | ⏳ Você precisa obter | Supabase Dashboard → Settings → API |
| **Supabase Anon Key** | ⏳ Você precisa obter | Supabase Dashboard → Settings → API |
| **.env.local** | ❌ Não existe | Criar com as 3 vars acima |
| **Google Provider (Supabase)** | ⏳ Verificar | Supabase → Auth → Providers → Google |
| **Redirect URIs (Google Cloud)** | ⏳ Adicionar | Google Cloud → OAuth → Add URI |
| **Redirect URLs (Supabase)** | ⏳ Configurar | Supabase → URL Configuration |
| **Teste Local** | ❌ Não feito | npm run dev → clique Google login |

---

## 🎯 ORDEM EXATA DE FAZER

```
1. [Você] Fornecer Supabase URL + Anon Key
   ↓
2. [Você] Criar .env.local
   ↓
3. [Você] Obter Google Client Secret
   ↓
4. [Você] Habilitar Google Provider (Supabase)
   ↓
5. [Você] Adicionar Redirect URIs (Google Cloud)
   ↓
6. [Você] Configurar URL Configuration (Supabase)
   ↓
7. [Você] npm run dev + testar
   ↓
8. [Você] Verificar novo usuário em Supabase
   ↓
✅ FUNCIONANDO!
   ↓
   (Depois: Deploy com domínio)
```

---

## 📞 COMO PEGAR CADA VALOR

### Supabase URL

```
https://app.supabase.com
  → [Seu projeto]
  → Settings (⚙️ bottom left)
  → API
  → Project URL (azul)
  → Copy
```

Exemplo: `https://abc12345def67890.supabase.co`

### Supabase Anon Key

```
https://app.supabase.com
  → [Seu projeto]
  → Settings (⚙️ bottom left)
  → API
  → Anon public key (rosa)
  → Copy
```

Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...` (muito longo)

### Google Client Secret

```
Google Cloud Console
  → APIs & Services (top search)
  → Credentials
  → OAuth 2.0 Client IDs
  → [639844500678...]
  → Client Secret
  → Copy
```

Exemplo: `GOCSPX-abc123xyz789ABCDEFG...`

---

## ✅ FINAL CHECKLIST

Quando tudo estiver pronto:

- [ ] `.env.local` criado com 3 vars
- [ ] `npm run dev` não mostra erros
- [ ] Botão "Entrar com Google" funciona
- [ ] Redireciona para Google login
- [ ] Volta para app após auth
- [ ] Novo usuário em Supabase → Users

---

## 🔗 DOCUMENTOS DE REFERÊNCIA

Você tem 4 arquivos com mais detalhes:

1. **GOOGLE_AUTH_SUPABASE_MAPPING.md**
   - Explica como dados fluem Google → Supabase
   - Estrutura das tabelas
   - Exemplos reais

2. **GOOGLE_AUTH_VISUAL.md**
   - Diagramas visuais
   - Before/after das tabelas
   - Checklist de segurança

3. **GOOGLE_AUTH_JSON_EXAMPLES.md**
   - JSON completos de cada etapa
   - Exemplo: novo usuário via Google
   - Exemplo: usuário convidado que usa Google depois

4. **GOOGLE_AUTH_SETUP_CHECKLIST.md**
   - Setup detalhado passo a passo
   - Erros comuns
   - Debug tips

5. **GOOGLE_AUTH_SETUP_VISUAL.md** ← VOCÊ TÁ AQUI
   - Passos visuais com emojis
   - Onde clicar e o quê preencher
   - Flow completo do login

---

## 📲 Próximo Passo?

**Me envie quando tiver:**
1. Supabase URL
2. Supabase Anon Key

**Ou me diga se:**
- Já fez algum desses passos
- Teve algum erro específico
- Quer ajuda com alguma parte

**Ficamos ✅ 100% pronto!**

