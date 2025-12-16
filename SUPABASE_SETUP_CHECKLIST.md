# 📋 CHECKLIST - CONFIGURAÇÃO SUPABASE

## ✅ VERIFICAR ESSAS COISAS NO SUPABASE

### 1. Database Setup
- [ ] Tabela `users` existe em `public`
- [ ] Tabela `users` tem coluna `id` (uuid, FK para auth.users)
- [ ] Tabela `users` tem coluna `email` (text)
- [ ] RLS (Row Level Security) **DESABILITADO** ou com política correta

### 2. Authentication Setup
- [ ] Email provider está habilitado
- [ ] Require email confirmation: **DESABILITADO** (para dev)
- [ ] Auto confirm user: **HABILITADO** (para dev)
- [ ] SMTP configurado (OU confirmação automática)

### 3. Auth Triggers
- [ ] Trigger `on_auth_user_created` existe
- [ ] Trigger cria registro em `public.users` automaticamente

### 4. SQL Queries Rápidas

```sql
-- 1. Verificar se tabela existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- 2. Verificar RLS
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 3. Verificar dados
SELECT COUNT(*) FROM public.users;
SELECT COUNT(*) FROM auth.users;

-- 4. Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_schema = 'public';
```

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### Se RLS Está Bloqueando:

```sql
-- DESABILITAR RLS (desenvolvimento apenas!)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- OU criar política aberta:
CREATE POLICY "Allow all" ON public.users FOR ALL USING (true) WITH CHECK (true);
```

### Se Tabela Não Existe:

```sql
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE,
    name text,
    phone text,
    role text DEFAULT 'CLIENTE_GERENTE',
    organization_id uuid,
    cpfCnpj text,
    ui_settings jsonb,
    setor text[],
    prefix text,
    attendance jsonb,
    avatar text,
    has_set_password boolean DEFAULT false,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_organization ON public.users(organization_id);
```

### Se Trigger Não Existe:

```sql
-- Criar função que cria usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, SPLIT_PART(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 🎯 ORDEM DE EXECUÇÃO (SE TUDO ESTIVER QUEBRADO)

1. **Abra Supabase SQL Editor**
2. **Copie e execute TUDO abaixo na ordem:**

```sql
-- 1. Criar tabela users
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE,
    name text,
    phone text,
    role text DEFAULT 'CLIENTE_GERENTE',
    organization_id uuid,
    cpfCnpj text,
    ui_settings jsonb,
    setor text[],
    prefix text,
    attendance jsonb,
    avatar text,
    has_set_password boolean DEFAULT false,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 2. Criar índices
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_organization ON public.users(organization_id);

-- 3. Desabilitar RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Criar função de trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, SPLIT_PART(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificar se tudo funcionou
SELECT * FROM public.users LIMIT 1;
SELECT * FROM auth.users LIMIT 1;
```

3. **Se der erro em qualquer linha, copie o erro e compartilhe comigo**

---

## ⚠️ CONFIGURAÇÕES DO SUPABASE DASHBOARD

### 1. Vá em: Authentication → Providers → Email

- [ ] Email **habilitado** (ativar se não estiver)
- [ ] Auto confirm user: **ATIVAR** (para desenvolvimento)
- [ ] Require email confirmation: **DESATIVAR** (para desenvolvimento)

### 2. Vá em: Database → Row Level Security

- [ ] Se `users` aparecer: clique e verifique políticas
- [ ] Se tiver políticas restritivas: desabilite RLS ou libere INSERT

### 3. Vá em: Authentication → URL Configuration

- [ ] Site URL: `http://localhost:3000` (adicione se não tiver)
- [ ] Redirect URLs: `http://localhost:3000/#/app/dashboard` (adicione)

---

## 🔍 TESTAR DEPOIS DE TUDO

1. **Frontend dev server:**
   ```
   npm run dev
   ```

2. **Abra http://localhost:3000**

3. **Teste CADASTRO:**
   - Email: novo@teste.com
   - Senha: 123456
   - Deve ir para "Cadastro Enviado!"

4. **Teste LOGIN:**
   - Email: novo@teste.com
   - Senha: 123456
   - Deve redirecionar para dashboard

5. **Se não funcionar:**
   - Abra DevTools (F12)
   - Vá para Console
   - Copie os erros em vermelho
   - Compartilhe comigo!

---

## 📞 COMPARTILHE ISSO SE NÃO FUNCIONAR

```
1. Erro exato do console (F12 → Console)
2. Resultado de: SELECT * FROM public.users LIMIT 5;
3. Resultado de: SELECT * FROM auth.users LIMIT 5;
4. RLS está ativado ou desativado? (Supabase → Database)
```

Com essas informações vou corrigir 100%! 🚀
