# ⚠️ EXECUTAR SQL NO SUPABASE - CORREÇÃO DE LOGIN

## Problema Crítico
Erro `403 Forbidden` ao tentar fazer login. Causa: RLS policies faltando na tabela `users`.

## Solução: Executar DATABASE_SETUP_FINAL.sql

### Passo 1: Abrir Supabase
1. Acesse https://supabase.com
2. Faça login com sua conta
3. Selecione seu projeto TheTagsFlow

### Passo 2: Acessar SQL Editor
1. Na barra lateral esquerda, clique em **"SQL Editor"**
2. Clique em **"New Query"** ou **"+"**

### Passo 3: Copiar e Colar SQL
1. Abra o arquivo `DATABASE_SETUP_FINAL.sql` neste projeto
2. **Selecione TODO o conteúdo** (Ctrl+A)
3. **Copie** (Ctrl+C)
4. Cole no SQL Editor do Supabase (Ctrl+V)

### Passo 4: Executar
1. Clique no botão **"Run"** (ou aperte Ctrl+Enter)
2. **Aguarde** a execução completar (geralmente 10-30 segundos)

### Passo 5: Verificar Sucesso
Você deve ver:
- ✅ **Nenhuma mensagem de erro**
- ✅ **Mensagem verde de sucesso** (geralmente "Query executed successfully")
- ✅ **Sem avisos vermelhos**

## O Que Vai Mudar

Após executar, o SQL fará:

✅ Criar todas as tabelas necessárias
✅ Adicionar políticas RLS de segurança
✅ Inserir planos de assinatura
✅ Criar funções PostgreSQL necessárias
✅ **MAIS IMPORTANTE**: Corrigir o erro 403 adicionando policies à tabela `users`

## Após Executar: Testar Login

1. **Logout completo**
   - Clique no avatar no canto superior direito
   - Selecione "Sair" ou "Logout"

2. **Limpar cache do navegador**
   - Aperte `Ctrl+Shift+Delete`
   - Marque "Cookies e outros dados de sites"
   - Clique "Limpar dados"

3. **Atualizar página** (`F5` ou `Ctrl+R`)

4. **Fazer login novamente**
   - Insira seu email
   - Insira sua senha
   - Clique "Entrar"

5. **Dashboard deve carregar normalmente** ✅

## Se Algo Deu Errado

### Erro: "relation already exists"
**Solução**: Execute apenas a seção de RLS Policies (linhas 406-550)

### Erro: "permission denied for schema public"
**Solução**: Você precisa ter permissão de admin no Supabase. Peça ao dono do projeto.

### Login ainda não funciona após SQL
1. Abra DevTools (F12)
2. Vá para aba "Console"
3. Procure por erro 403 ou similar
4. Compartilhe o erro completo

## Checklist de Verificação

Após login bem-sucedido:

- [ ] Dashboard carrega sem erros
- [ ] Perfil mostra dados corretos
- [ ] Consegue criar produto novo
- [ ] Consegue importar pedidos
- [ ] Consegue gerar etiquetas
- [ ] Consegue deletar pedidos (Zona de Perigo)
- [ ] Histórico de importação mostra dados reais
- [ ] Clientes aparecem após importar pedidos

## Contato / Dúvidas

Se alguma coisa não funcionar:
1. Confirme que o SQL foi executado sem erros
2. Tente fazer logout e login novamente
3. Verifique o console do navegador (F12) para erros específicos

---

**Status**: 🟢 Todos os bugs estão corrigidos no código
**Próximo passo**: Executar este SQL para ativar as correções no banco de dados
