# 🔧 FIX RECURSÃO INFINITA - EXECUTE AGORA!

## ❌ O ERRO QUE VOCÊ TEM

```
42P17 infinite recursion detected in policy for relation "users"
```

**Causa:** A política RLS estava fazendo SELECT dentro de SELECT na mesma tabela.

---

## ✅ A SOLUÇÃO

Precisamos de:
1. **Criar uma FUNCTION** para buscar `organization_id` 
2. **Usar essa função** nas políticas (sem recursão)
3. **Dropar políticas antigas** que causam o loop

---

## 🎯 3 PASSOS PARA ARRUMAR

### PASSO 1: Abrir SQL Editor Supabase

1. Ir em https://supabase.com/dashboard
2. Seu projeto
3. **SQL Editor**
4. Novo Query

### PASSO 2: Copiar e Colar TODO ESSE ARQUIVO

```
SQL_FIX_INFINITE_RECURSION.sql
```

**Copie TODO o conteúdo** e cole no SQL Editor.

### PASSO 3: Executar

1. Clique em **RUN** (botão verde)
2. Espere a mensagem:
```
✅ RECURSION FIXED - RLS FUNCIONANDO!
```

---

## 🧠 O QUE ESSE SQL FAZ

**FASE 1:** Remove todas as políticas problemáticas

**FASE 2:** Cria uma **FUNCTION** chamada `get_org_id()` que retorna a organização do usuário:
```sql
CREATE FUNCTION public.get_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

**FASE 3:** Cria **políticas NOVAS** que usam essa function (sem recursão):
```sql
CREATE POLICY "stock_items_tenant_isolation" ON public.stock_items FOR ALL
  USING (organization_id = public.get_org_id())  -- ✅ Sem subquery!
  WITH CHECK (organization_id = public.get_org_id());
```

**FASE 4:** Dá permissão para as functions executarem

---

## 📊 ANTES vs DEPOIS

| Antes | Depois |
|-------|--------|
| ❌ Recursão infinita | ✅ Sem recursão |
| ❌ Erro ao fazer login | ✅ Login funciona |
| ❌ Não consegue salvar dados | ✅ Salva normalmente |
| ❌ 500 Internal Server Error | ✅ Tudo funciona |

---

## 🧪 COMO TESTAR DEPOIS

1. **Recarregar app** (F5 hard refresh)
2. **Fazer login** com Google ou email
3. **Ir em Produtos**
4. **Salvar novo produto**
5. **Esperado:** Toast verde "Produto salvo com sucesso"

Se der erro ainda:
- Abra DevTools (F12) → Console
- Procure por erros
- Se ainda disser "permission denied" → execute SQL novamente

---

## 📁 ARQUIVOS IMPORTANTES

```
SQL_FIX_INFINITE_RECURSION.sql
  ↓ Copiar conteúdo
  ↓ Colar em Supabase SQL Editor
  ↓ RUN
  ✅ Done!

DATABASE_SCHEMA.sql
  ↓ Referência de toda estrutura de banco
  ↓ Use para entender as tabelas
  ↓ NÃO precisa executar (já existe no seu banco)
```

---

## 🚨 SE AINDA DER ERRO

**Erro: "policy already exists"**
- Tudo bem! Significa que já foi executado.
- Ignora e continua.

**Erro: "function does not exist"**
- Tente executar `DATABASE_SCHEMA.sql` primeiro
- Depois execute `SQL_FIX_INFINITE_RECURSION.sql`

**Erro: "permission denied"**
- Significa que ainda tem política problemática
- Execute `SQL_FIX_INFINITE_RECURSION.sql` NOVAMENTE

---

## ✅ CHECKLIST

- [ ] Abrir Supabase SQL Editor
- [ ] Copiar `SQL_FIX_INFINITE_RECURSION.sql`
- [ ] Colar no SQL Editor
- [ ] Clicker RUN
- [ ] Ver mensagem de sucesso
- [ ] Recarregar app (F5)
- [ ] Fazer login
- [ ] Ir em Produtos
- [ ] Salvar novo produto
- [ ] Ver toast de sucesso ✅

---

## 💡 RESUMO

O erro era causado por **recursão infinita na política RLS**.

A solução é usar uma **FUNCTION** que não causa recursão.

Agora RLS vai funcionar sem problemas! 🚀

**Execute `SQL_FIX_INFINITE_RECURSION.sql` AGORA!**
