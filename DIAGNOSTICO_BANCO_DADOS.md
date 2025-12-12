# 📋 INTEGRAÇÃO COM BANCO DE DADOS - CHECKLIST

## ⚠️ PROBLEMA IDENTIFICADO
Funcionalidades não vinculadas com banco + Importação não funcionando

## 🔍 DIAGNÓSTICO NECESSÁRIO

### 1. **Qual funcionalidade está com problema?**
- [ ] Dashboard (não carrega dados)
- [ ] Produtos (CRUD não funciona)
- [ ] Pedidos (não aparecem)
- [ ] Clientes (não sincronizam)
- [ ] Estoque (não atualiza)
- [ ] Etiquetas (não gera)
- [ ] Importação (XML/Planilha)
- [ ] Outro: ___________

### 2. **Qual é o erro específico?**
Cole o erro do console (F12 → Console):
```
[COLE O ERRO AQUI]
```

### 3. **O que está tentando fazer?**
Descreva o passo a passo:
```
1. Clica em [botão]
2. Espera que [ação aconteça]
3. Ao invés, [error/nada acontece]
```

---

## 🔧 O QUE PROVAVELMENTE PRECISA

### **Se não carrega dados do Dashboard:**
```typescript
// Falta isso em DashboardPage.tsx
useEffect(() => {
  // Buscar dados do banco
  const fetchData = async () => {
    const { data } = await dbClient
      .from('orders')
      .select('*')
      .eq('organization_id', user.organization_id);
    
    setOrders(data);
  };
  
  fetchData();
}, [user.organization_id]);
```

### **Se importação não funciona:**
- ❌ Arquivo ImporterPage.tsx não tem RPC call
- ❌ Não está salvando no banco
- ❌ Não está fazendo upload para Supabase

### **Se CRUD não funciona:**
- ❌ Falta chamada RPC para INSERT
- ❌ Falta chamada RPC para UPDATE
- ❌ Falta chamada RPC para DELETE
- ❌ Não está tratando `organization_id`

---

## ✅ O QUE JÁ FUNCIONA

- ✅ Autenticação
- ✅ Roteamento
- ✅ Banco de dados (schema pronto)
- ✅ RLS policies (segurança)

---

## 📝 PRÓXIMO PASSO

**Responda estas perguntas:**

1. Qual página está com problema? (Dashboard, Produtos, etc)
2. O que deveria acontecer?
3. O que está acontecendo?
4. Há erro no console? (F12 → Console)

**Ou descreva:**
- Está branco?
- Está vazio?
- Dá erro?
- Não atualiza?

---

## 🚀 UMA VEZ DEFINIDO O PROBLEMA

Vou:
1. Verificar qual arquivo precisa integração
2. Adicionar chamadas RPC ao banco
3. Conectar UI com dados do banco
4. Testar o fluxo completo
