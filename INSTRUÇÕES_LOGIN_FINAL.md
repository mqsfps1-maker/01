# ✅ INSTRUÇÕES FINAIS PARA ATIVAR O SISTEMA

## O problema
O banco de dados Supabase precisa das RLS policies para liberar acesso à tabela `users`.

## Solução em 2 passos

### Passo 1: Executar o SQL de Fix
1. Abra `FIX_RLS_ONLY.sql`
2. Copie TODO o conteúdo (Ctrl+A → Ctrl+C)
3. Vá para **Supabase → SQL Editor**
4. Cole (Ctrl+V) e clique **Run**
5. Deve aparecer: "RLS Policies for users table created successfully!"

### Passo 2: Testar o Login
1. Recarregue o navegador (F5)
2. Tente fazer login novamente
3. **Deve funcionar agora!**

## Se Ainda Não Funcionar

Se o erro 403 persistir, tente executar TODO o arquivo `DATABASE_SETUP_FINAL.sql` novamente, mas desta vez:
- Clique **"New Query"** (cria um novo espaço)
- Cole TODO o conteúdo
- Clique **Run**

Verifique se há mensagens de erro durante a execução.

## Checklist de Verificação Após Login

- [ ] Dashboard carrega sem erros
- [ ] Perfil mostra dados corretos
- [ ] Consegue criar/editar produtos
- [ ] Consegue importar pedidos
- [ ] Consegue gerar etiquetas
- [ ] Histórico de importação aparece
- [ ] Clientes aparecem após importar

---

Se tudo funcionar, **o sistema está 100% pronto para uso!** 🎉
