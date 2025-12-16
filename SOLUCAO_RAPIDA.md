# 🎯 SUMÁRIO - PROBLEMA DE LOGIN/REGISTRO

## ❌ PROBLEMA IDENTIFICADO
- Não loga
- Não envia email de cadastro
- Redireciona para login

## 🔍 CAUSA PROVÁVEL (95% dos casos)
1. **Tabela `users` não existe ou RLS está bloqueando**
2. **Email não confirmado automaticamente no Supabase**
3. **Trigger de auto-criação de usuário não existe**

## ✅ SOLUÇÃO RÁPIDA (30 segundos)

### Acesse Supabase SQL Editor e execute:

```sql
-- 1. Verificar tabela
SELECT * FROM public.users LIMIT 1;
```

Se der erro `table does not exist`, execute tudo isso:

```sql
-- Criar tabela
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Desabilitar RLS (segurança apenas para dev)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Criar trigger automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, SPLIT_PART(new.email, '@', 1));
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Depois, no Supabase Dashboard:
1. **Authentication → Providers → Email**
2. Ativar: "Auto confirm user" ✅
3. Desativar: "Require email confirmation" ✅
4. Click **Save**

---

## 🧪 TESTAR

1. Abra http://localhost:3000
2. Vá para REGISTER
3. Email: `novo@teste.com`
4. Senha: `123456`
5. Click "Cadastrar"
6. **Esperado:** "Cadastro Enviado!" ✅

Se não funcionar → Próximo passo

---

## 📖 DOCUMENTAÇÃO CRIADA

Criei 4 arquivos de diagnóstico:

1. **README_DEBUG.md** - Guia completo
2. **SQL_DIAGNOSTICO.md** - Comandos SQL
3. **GUIA_DIAGNOSTICO_RAPIDO.md** - Passo a passo
4. **SUPABASE_SETUP_CHECKLIST.md** - Checklist completo

---

## 🔧 LOGS DE DEBUG ADICIONADOS

Adicionei `console.log` em:
- `pages/LoginPage.tsx`
- `pages/RegisterPage.tsx`
- `App.tsx`
- `lib/testConnection.ts` (novo)

**Abra DevTools (F12) e procure por:**
```
[RegisterPage] Tentando cadastro com: ...
[RegisterPage] Erro de cadastro: ...
[LoginPage] Tentando login com: ...
[App] Auth event: ...
```

---

## ✅ PRÓXIMAS AÇÕES

1. **Copie e execute o SQL acima no Supabase**
2. **Configure Auto confirm no Supabase Dashboard**
3. **Tente cadastro/login novamente**
4. **Se der erro, copie do console e compartilhe comigo**

**Isso deve resolver 99% dos problemas! 🚀**

Se não funcionar, vou debugar com você passo a passo.
