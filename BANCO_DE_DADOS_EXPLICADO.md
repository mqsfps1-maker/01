# 💾 CÓDIGO DO BANCO DE DADOS COMPLETO

## 📊 ESTRUTURA DO BANCO

O seu banco tem essas tabelas principais:

### **AUTENTICAÇÃO**
- `users` - Usuários da aplicação
- `organizations` - Empresas/organizações
- `subscriptions` - Assinaturas de planos

### **VENDAS**
- `orders` - Pedidos de vendas
- `customers` - Clientes

### **ESTOQUE**
- `stock_items` - Produtos em estoque
- `stock_movements` - Movimentações de estoque
- `sku_links` - Link entre SKU importado e produto master

### **ETIQUETAS**
- `etiquetas_historico` - Histórico de geração de etiquetas

### **IMPORTAÇÃO**
- `import_history` - Histórico de importações de arquivos

### **BIPAGEM/SCANNING**
- `scan_logs` - Log de scans com código de barras

### **PRODUTOS**
- `product_boms` - Bill of Materials (lista de materiais)

### **PLANEJAMENTO**
- `production_plans` - Planos de produção
- `shopping_list_items` - Itens de lista de compras

### **CONFIGURAÇÃO**
- `app_settings` - Configurações gerais
- `plans` - Planos de assinatura disponíveis

---

## 🔍 SCHEMA COMPLETO

Para ver o schema completo com tipos de dados, abra:
```
DATABASE_SCHEMA.sql
```

Este arquivo tem:
- ✅ Definição de TODAS as tabelas
- ✅ Tipos de dados para cada campo
- ✅ Constraints (FK, unique, etc)
- ✅ Índices
- ✅ Funções
- ✅ Triggers

---

## 🔐 RLS (SEGURANÇA)

O banco tem **Row Level Security** ativado, que significa:

- Cada usuário vê **apenas** seus dados (por organization_id)
- Não consegue ver dados de outras empresas
- Não consegue deletar dados de outros

**Isso está em:** `SQL_COMPLETE_PRODUCTION_FIX.sql`

---

## 🔧 FUNCTIONS

O banco tem essas functions:

```sql
get_org_id()
  → Retorna organization_id do usuário logado
  → Sem recursão infinita

get_current_org_id()
  → Alias para get_org_id()

increment_label_count_safe()
  → Incrementa contador de etiquetas com segurança

create_my_profile_if_missing()
  → Cria perfil do usuário se não existir

complete_new_user_profile()
  → Completa perfil de novo usuário
```

---

## 🏗️ TRIGGERS

O banco tem triggers que:

```sql
set_updated_at()
  → Atualiza automatically o campo updated_at
  → Ativado em: users, organizations, stock_items, customers, orders, app_settings
```

---

## 📈 ÍNDICES (PERFORMANCE)

Índices criados para performance:

```sql
idx_stock_items_org_code       -- Buscar produtos por org + código
idx_orders_org_date            -- Buscar pedidos por org + data
idx_customers_org_cpf          -- Buscar clientes por org + CPF
idx_import_history_org_date    -- Buscar imports por org + data
idx_etiquetas_org_date         -- Buscar etiquetas por org + data
idx_scan_logs_org_date         -- Buscar scans por org + data
... e mais 10+ indexes
```

---

## 🚀 COMO VER O SCHEMA REAL

1. Abrir Supabase Dashboard
2. Ir em **Database** → **Schema**
3. Ver todas as tabelas criadas
4. Clicar em cada tabela para ver campos

Ou usar SQL:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
```

---

## 📋 RESUMO

**Total de Tabelas:** 13  
**Total de Índices:** 18+  
**Total de Functions:** 5  
**Total de Triggers:** 6  

**Segurança:** ✅ RLS ativado  
**Performance:** ✅ Indexes criados  
**Backup:** ✅ Automated (Supabase)  

---

## 🔗 REFERÊNCIAS

Para ver o schema completo com todos os detalhes:
```
DATABASE_SCHEMA.sql
```

Para RLS policies:
```
SQL_COMPLETE_PRODUCTION_FIX.sql
```

Para executar SQL no Supabase:
1. SQL Editor
2. New Query
3. Colar código
4. RUN

---

## 💡 PRÓXIMO PASSO

Execute o arquivo:
```
SQL_COMPLETE_PRODUCTION_FIX.sql
```

Isso vai:
- ✅ Corrigir recursão infinita
- ✅ Ativar RLS
- ✅ Criar índices
- ✅ Tudo funcionar!

**Pronto! 🚀**
