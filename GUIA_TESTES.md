# 🧪 GUIA DE TESTES - VALIDAÇÃO DAS CORREÇÕES

## Como testar cada correção implementada

---

## ✅ TESTE 1: Erro 400 (Produtos não salvam)

**Para testar:**
1. Vá para `/app/produtos`
2. Clique em "+ Novo Produto"
3. Preencha:
   - Code: `TEST-SKU-001`
   - Name: `Produto de Teste`
   - Kind: `PRODUTO`
   - Unit: `un`
   - Current Qty: `10`
4. Clique em "Salvar"

**Resultado esperado:** ✅
- Toast verde: "Produto salvo com sucesso!"
- Produto aparece na lista imediatamente
- Sem erro 400 no console

**Se falhar:**
- Abra DevTools (F12) → Console
- Procure por erro com "stock_items"
- Verifique se banco tem tabela `stock_items` com constraints

---

## ✅ TESTE 2: Assinatura não encontrada

**Para testar:**
1. Vá para `/app/etiquetas`
2. Tente gerar um PDF com etiquetas (qualquer conteúdo)
3. Se for primeira vez, deve pedir permissão de cota

**Resultado esperado:** ✅
- Modal de cota aparece com valores do plano
- Não há erro "Assinatura não encontrada"
- Se trial ainda ativo, mostra dias restantes

**Se falhar:**
- Verifique Supabase → `subscriptions` table
- Deve ter uma linha para sua organização
- Se não tiver, foi criada automaticamente quando gerou PDF

---

## ✅ TESTE 3: Histórico de Importações

**Para testar:**
1. Vá para `/app/importer`
2. Carregue um arquivo Excel/CSV de pedidos
3. Clique em "Processar"
4. Verifique a coluna "Histórico de Importações" à direita

**Resultado esperado:** ✅
- Histórico mostra:
  - Nome do arquivo
  - Data e hora da importação
  - Nome de quem importou
  - Quantidade de itens
- Botão "Visualizar" funciona
- Botão "Excluir" (🗑️) funciona

**Se falhar:**
- Histórico está vazio mesmo importando
- DevTools Console mostrará erro em `setImportHistory`
- Verifique se `import_history` table existe no banco

---

## ✅ TESTE 4: Clientes aparecem após importação

**Para testar:**
1. Vá para `/app/importer`
2. Carregue arquivo Excel com pedidos (DEVE ter coluna de cliente)
3. Clique em "Lançar Pedidos Vinculados"
4. Vá para `/app/clientes`

**Resultado esperado:** ✅
- Clientes aparecem na lista
- Nome e CPF/CNPJ visíveis
- Ao clicar em cliente, mostra histórico de pedidos
- Toast mostra: "X pedido(s) e clientes salvos com sucesso!"

**Se falhar:**
- Clientes não aparecem em lista
- Verifique se arquivo Excel tem coluna de cliente/CPF
- Procure por erro em DevTools Console

---

## ✅ TESTE 5: Sidebar - Branding

**Para testar:**
1. Visualize qualquer página da app
2. Olhe para Sidebar à esquerda

**Resultado esperado:** ✅
- Topo mostra:
  - 📌 Icon
  - **TheTagsFlow** (sempre visível)
  - Seu nome/empresa (abaixo)
- Ao colapsar sidebar, nome desaparece
- Icon nunca desaparece

**Se falhar:**
- Não mostra "TheTagsFlow"
- Verifique `components/Sidebar.tsx`
- Procure por "TheTagsFlow" na linha 90

---

## ✅ TESTE 6: Favicon

**Para testar:**
1. Abra a app em navegador
2. Olhe a aba do navegador (tab title)

**Resultado esperado:** ✅
- Mostra: 📌 TheTagsFlow
- Nenhum erro 404 no Console
- Icon aparece corretamente

**Se falhar:**
- Erro 404 em DevTools → Network → `/favicon.ico`
- Recarregue F5 ou Ctrl+Shift+R para limpar cache

---

## ✅ TESTE 7: Loading screens (NÃO deve aparecer)

**Para testar:**
1. Abra qualquer página
2. Não deve haver tela de "Carregando..."
3. Dados devem aparecer instantaneamente

**Resultado esperado:** ✅
- Nenhuma tela de loading
- Dados carregam no background
- Interface responsiva imediatamente

**Se falhar:**
- Volta loading screen
- Procure por `if(isLoading)` em `src/AppCore.tsx`
- Verifique se foi removido

---

## ✅ TESTE 8: Botão "Excluir Tudo" Pedidos

**Para testar:**
1. Vá para `/app/pedidos`
2. Role para o final da página
3. Procure por seção vermelha "⚠️ Zona de Perigo"

**Resultado esperado:** ✅
- Seção vermelha visível com aviso
- Botão "Excluir Tudo" presente
- Ao clicar, abre modal de confirmação em vermelho
- Modal mostra número total de pedidos
- Após confirmar, todos deletados e lista vazia

**Se falhar:**
- Seção não aparece
- Verifique final do arquivo `pages/PedidosPage.tsx`
- Procure por "Zona de Perigo"

---

## ✅ TESTE 9: Mercado Livre com Date Filter

**Para testar:**
1. Vá para `/app/importer`
2. Carregue arquivo do **Mercado Livre** (não Shopee)
3. Se tiver coluna de data, deve pedir intervalo de datas

**Resultado esperado:** ✅
- Modal de "Filtro de Data" aparece
- Pode escolher data inicial e final
- Depois de filtrar, mostra apenas pedidos naquele período

**Se falhar:**
- Não aparece modal de data para ML
- Verifique linha 150 do `pages/ImporterPage.tsx`
- Deve ter: `if (data.canal === 'SHOPEE' || data.canal === 'ML')`

---

## ✅ TESTE 10: Expedição Customizável

**Para testar:**
1. Vá para `/app/configuracoes-gerais`
2. Procure "Regras de Expedição"
3. Clique em "+ Adicionar"

**Resultado esperado:** ✅
- Pode adicionar quantos itens quiser
- Não tem limite
- Pode escolher qualquer insumo/categoria
- Salva sem erros

**Status:** ✅ Já implementado, nada a testar adicional

---

## ✅ TESTE 11: Avatar Redondo

**Para testar:**
1. Vá para `/app/perfil`
2. Clique no avatar (círculo com icon de câmera)
3. Selecione uma foto sua
4. Salve as alterações

**Resultado esperado:** ✅
- Avatar aparece **perfeitamente redondo**
- Não ovalado nem distorcido
- Tem border azul em volta
- Proporção da foto mantida

**Se falhar:**
- Avatar fica oval
- Verifique CSS em linha 111 de `pages/ProfilePage.tsx`
- Deve ter `object-cover` e `w-24 h-24`

---

## ✅ TESTE 12: CPF/CNPJ Legível

**Para testar:**
1. Vá para `/app/perfil`
2. Procure campo "CPF/CNPJ"
3. Olhe o valor

**Resultado esperado:** ✅
- Valor é **totalmente legível**
- Background claro (não cinzento opaco)
- Texto em preto/branco normal
- Campo desabilitado mas visível

**Se falhar:**
- Texto cinzento ou invisível
- Verifique linha 178 de `pages/ProfilePage.tsx`
- Remova `opacity-70` e mude `bg-[var(--color-surface-tertiary)]` para `bg-[var(--color-surface-secondary)]`

---

## 🗄️ TESTE DO BANCO DE DADOS

**Para validar que tudo está correto no Supabase:**

1. **Abra Supabase → SQL Editor**
2. Execute este comando para testar RLS:

```sql
SELECT * FROM public.orders LIMIT 1;
```

✅ Se retornar dados = RLS funcionando
❌ Se retornar erro = Problema de segurança

3. **Valide constraints:**

```sql
\d public.orders
```

✅ Deve mostrar: `UNIQUE (organization_id, order_id, sku)`

4. **Verifique Índices:**

```sql
SELECT * FROM pg_indexes WHERE tablename = 'orders';
```

✅ Deve listar vários índices para performance

---

## 📱 TESTE DO FLUXO COMPLETO

**Fazer este teste por completo:**

1. **Login** → Criar conta ou fazer login
2. **Importar Pedidos** → Upload Excel/CSV
3. **Ver Clientes** → Verificar se aparecem
4. **Gerar Etiquetas** → Testar cota
5. **Marcar Bipado** → Selecionar pedidos e marcar
6. **Ver Histórico** → Importação e etiquetas
7. **Deletar Tudo** → Usar botão vermelho
8. **Perfil** → Atualizar avatar e CPF visível

**Se tudo passar = 100% FUNCIONAL ✅**

---

## 🐛 TROUBLESHOOTING

### Erro: "Organização não encontrada"
- Faça logout e login novamente
- Limpe cache (Ctrl+Shift+R)
- Verifique banco: `SELECT * FROM users WHERE id = 'seu-id'`

### Erro: "Assinatura não encontrada"
- Gere um PDF de etiqueta
- Sistema cria automaticamente
- Recarregue página (F5)

### Erro: "Cota insuficiente"
- Normal = você atingiu limite do plano
- Upgrade para plano maior em `/app/assinatura`

### Dados não aparecem
- F5 para recarregar
- DevTools → Network → Verifique requests para Supabase
- Procure por 401/403 = problema de autenticação

### Upload de arquivo não funciona
- Arquivo deve ser `.xlsx` ou `.csv`
- Tamanho máximo: ~10MB
- Consulte DevTools → Console para erros específicos

---

## ✅ CHECKLIST FINAL

Depois de testar tudo:

- [ ] Produtos salvam (Teste 1)
- [ ] Assinatura criada automaticamente (Teste 2)
- [ ] Histórico mostra dados reais (Teste 3)
- [ ] Clientes aparecem após import (Teste 4)
- [ ] Sidebar mostra "TheTagsFlow + Empresa" (Teste 5)
- [ ] Favicon 📌 no tab (Teste 6)
- [ ] Sem loading screens (Teste 7)
- [ ] Botão "Excluir Tudo" funciona (Teste 8)
- [ ] ML com date filter funciona (Teste 9)
- [ ] Expedição customizável (Teste 10)
- [ ] Avatar redondo (Teste 11)
- [ ] CPF/CNPJ legível (Teste 12)
- [ ] Banco de dados OK (RLS, constraints, índices)
- [ ] Fluxo completo funcionando

**Se todos os testes passarem: SISTEMA 100% PRONTO PARA USO! 🚀**

---

Versão: 1.0
Data: 11 de dezembro de 2025
