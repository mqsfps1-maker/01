# 🔍 DIAGNÓSTICO - SUPABASE AUTH

## PROBLEMA RELATADO
- Não loga
- Não envia email de cadastro  
- Redireciona para login

## CHECKLIST - Execute no Supabase SQL Editor

### 1️⃣ VERIFICAR SE TABELA DE USUÁRIOS EXISTE
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';
```

### 2️⃣ VERIFICAR ESTRUTURA DA TABELA
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
```

### 3️⃣ VERIFICAR RLS (Row Level Security) - BLOQUEIO
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'users';
```

### 4️⃣ VERIFICAR SE EXISTEM USUÁRIOS
```sql
SELECT id, email, created_at FROM public.users LIMIT 10;
```

### 5️⃣ VERIFICAR AUTH USERS (Supabase Auth)
```sql
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
LIMIT 10;
```

### 6️⃣ VERIFICAR TRIGGERS DE CRIAÇÃO DE USUÁRIO
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'users' OR event_object_schema = 'auth';
```

### 7️⃣ VERIFICAR CONFIGURAÇÕES DE EMAIL
```sql
SELECT * FROM auth.audit_log_entries 
ORDER BY created_at DESC 
LIMIT 20;
```

## 🔧 SOLUÇÕES COMUNS

### ❌ SE RLS ESTÁ BLOQUEANDO:
```sql
-- Desabilitar RLS temporariamente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Ou criar política correta:
CREATE POLICY "Enable all for authenticated users" 
ON public.users FOR ALL 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Para INSERT (novo usuário):
CREATE POLICY "Enable insert for new users" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);
```

### ❌ SE TABELA NÃO EXISTE:
```sql
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    name text,
    phone text,
    role text DEFAULT 'CLIENTE_GERENTE',
    organization_id uuid,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_organization_id ON public.users(organization_id);
```

### ❌ SE TRIGGER DE AUTO-CREATE NÃO EXISTE:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, SPLIT_PART(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### ❌ SE EMAIL NÃO ESTÁ CONFIGURADO NO SUPABASE:
1. Ir para: **Authentication → Email Templates**
2. Verificar se "Confirm signup" está habilitado
3. Verificar se SMTP está configurado em: **Settings → Email**

## 📊 PRÓXIMOS PASSOS

1. Execute os 7 comandos SQL acima
2. Identifique qual verificação falha
3. Aplique a solução correspondente
4. Teste login/cadastro novamente

## 🚨 LOGS PARA VERIFICAR NO NAVEGADOR

Abra **DevTools (F12) → Console** e tente cadastro/login.
Procure por logs:
```
[RegisterPage] Tentando cadastro com: seu@email.com
[RegisterPage] Erro de cadastro: ...
```

Compartilhe esse erro para diagnóstico preciso!
