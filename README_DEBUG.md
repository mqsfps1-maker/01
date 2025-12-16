# 🚀 DIAGNOSTICANDO PROBLEMA DE AUTH

## ✅ O QUE FOI FEITO

Adicionei **logs de debug** em todos os arquivos de autenticação para você ver exatamente onde está o problema:

### 📝 Arquivos modificados:
1. **pages/LoginPage.tsx** - Adicionado `console.log` para debug
2. **pages/RegisterPage.tsx** - Adicionado `console.log` para debug
3. **App.tsx** - Adicionado `console.log` detalhado
4. **lib/testConnection.ts** - Script para testar conexão Supabase
5. **SQL_DIAGNOSTICO.md** - Comandos SQL para verificar BD
6. **GUIA_DIAGNOSTICO_RAPIDO.md** - Guia passo a passo

---

## 🎯 PRÓXIMOS PASSOS (FAÇA ISSO AGORA!)

### OPÇÃO 1: Testar via Console do Navegador ⭐ (MAIS RÁPIDO)

1. Abra http://localhost:3000 no navegador
2. Pressione **F12** (Developer Tools)
3. Vá para aba **Console**
4. **Tente fazer CADASTRO:**
   - Email: `test@test.com`
   - Senha: `123456`
   - Clique "Cadastrar"

5. **Procure por mensagens como:**
   ```
   [RegisterPage] Tentando cadastro com: test@test.com
   [RegisterPage] Erro de cadastro: ERRO_AQUI
   ```

6. **Copie o erro e me envie!**

---

### OPÇÃO 2: Testar via SQL Supabase (COMPLETO)

1. Abra: https://app.supabase.com → Seu Projeto
2. Vá para **SQL Editor**
3. Execute este comando:
   ```sql
   SELECT * FROM public.users LIMIT 5;
   ```

4. **Se der erro:**
   - `table does not exist` → Tabela não foi criada
   - `permission denied` → RLS está bloqueando
   - Outros → Copie e compartilhe o erro

5. **Depois execute:**
   ```sql
   SELECT * FROM auth.users LIMIT 5;
   ```

6. Compartilhe os resultados!

---

## 🔴 PROBLEMAS MAIS COMUNS & SOLUÇÕES

### ❌ "table 'public.users' does not exist"
**Solução:** Execute no SQL Editor:
```sql
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

-- Desabilitar RLS para dev
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### ❌ "Email confirmation required"
1. Vá em: **Authentication → Providers → Email**
2. Desabilite "Require email confirmation" (para desenvolvimento)
3. Clique **Save**

### ❌ "Invalid login credentials"
Significa que o email/senha estão errados ou usuário não existe

**Solução:**
1. Primeiro faça **CADASTRO** (não login)
2. Confirme que aparece "Cadastro Enviado!"
3. Depois faça **LOGIN** com o mesmo email/senha

---

## 📊 ESTRUTURA DO BANCO ESPERADA

Sua tabela `users` deve ter essas colunas:

```sql
Column              Type        Nullable  Default
================    ===========  ========  =========
id                  uuid         NO        (auth.users.id)
email               text         YES       
name                text         YES       
phone               text         YES       
role                text         YES       'CLIENTE_GERENTE'
organization_id     uuid         YES       
cpfCnpj             text         YES       
ui_settings         jsonb        YES       
setor               text[]       YES       
prefix              text         YES       
attendance          jsonb        YES       
avatar              text         YES       
has_set_password    boolean      YES       false
created_at          timestamp    YES       now()
updated_at          timestamp    YES       now()
```

---

## 🔗 RECURSOS

- [Guia SQL Diagnóstico](./SQL_DIAGNOSTICO.md) - Comandos completos
- [Guia Rápido](./GUIA_DIAGNOSTICO_RAPIDO.md) - Passo a passo visual
- [Test Connection](./lib/testConnection.ts) - Script de teste

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Tabela `users` existe no Supabase
- [ ] RLS não está bloqueando inserts
- [ ] Email confirmation está desabilitado (para dev)
- [ ] Logs estão aparecendo no console (F12)
- [ ] Erro no console foi copiado

**Depois de fazer o diagnóstico, compartilhe o erro comigo! 🚀**
