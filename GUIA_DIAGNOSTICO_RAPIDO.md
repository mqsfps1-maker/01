# 🚨 GUIA DE DIAGNÓSTICO - PROBLEMA DE LOGIN/REGISTRO

## ⚡ O QUE FAZER AGORA

### PASSO 1: Abra o navegador em http://localhost:3000

### PASSO 2: Abra Developer Tools (F12 ou Ctrl+Shift+I)

### PASSO 3: Vá para a aba "Console"

### PASSO 4: Tente fazer LOGIN
- Digite um email qualquer (ex: test@test.com)
- Digite uma senha (ex: 123456)
- Clique em "Entrar"

### PASSO 5: Procure na Console por mensagens como:
```
[LoginPage] Tentando login com: test@test.com
[LoginPage] Erro de login: ...
OU
[LoginPage] Login bem-sucedido: ...
```

**Copie a mensagem de erro completa e compartilhe comigo!**

---

## 🔧 ALTERNATIVA: Testar Supabase SQL Editor

Acesse: https://app.supabase.com → Seu Projeto → SQL Editor

Execute ESTE comando:

```sql
SELECT * FROM public.users LIMIT 5;
```

**Resultado esperado:**
- Se der erro `does not exist` → Tabela não existe
- Se retornar 0 linhas → Tudo OK, tabela existe mas vazia
- Se retornar dados → Tudo funcionando

---

## ⚠️ PROBLEMAS COMUNS

### ❌ "Table does not exist"
**Solução:** Execute no SQL Editor:
```sql
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text,
    name text,
    phone text,
    role text DEFAULT 'CLIENTE_GERENTE',
    organization_id uuid,
    created_at timestamp DEFAULT now()
);
```

### ❌ "permission denied"
**Solução:** Desabilite RLS temporariamente:
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### ❌ "Invalid login credentials"
**Possibilidades:**
1. Usuário não existe ainda (usar /register primeiro)
2. Email/senha errados
3. Usuário foi deletado

### ❌ "Email confirmation required"
**Solução:**
1. Vá em: Auth → Providers → Email
2. Desabilite "Require email confirmation" (para dev)
3. OU configure SMTP para enviar emails reais

---

## 📱 TESTE RÁPIDO DO APP

### Para REGISTRAR novo usuário:
1. Vá para http://localhost:3000/#/register
2. Digite email: seu_email@teste.com
3. Digite senha: 123456
4. Clique "Cadastrar"
5. **Procure no console por:**
   - ✅ `[RegisterPage] Cadastro bem-sucedido`
   - ❌ `[RegisterPage] Erro de cadastro: ...`

### Para FAZER LOGIN:
1. Vá para http://localhost:3000/#/login
2. Use o email que acabou de registrar
3. Use a mesma senha
4. Clique "Entrar"
5. **Procure no console por:**
   - ✅ `[LoginPage] Login bem-sucedido`
   - ❌ `[LoginPage] Erro de login: ...`
   - ✅ `[App] Auth event: SIGNED_IN`

---

## 🎯 COMPARTILHE COMIGO

Quando testar, copie e cole para mim:

1. **Mensagem de erro do console** (se houver)
2. **Resultado do SQL:** `SELECT * FROM public.users LIMIT 5;`
3. **Resultado do SQL:** `SELECT * FROM auth.users LIMIT 5;`

Com essas informações vou corrigir 100% rápido! 🚀
