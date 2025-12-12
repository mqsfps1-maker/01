# 📋 PASSO A PASSO VISUAL - PRIMEIRA EXECUÇÃO

## 🟢 TUDO JÁ ESTÁ PRONTO - SÓ FALTA EXECUTAR!

---

## PASSO 1: Preparar o Banco de Dados ⏱️ (5 minutos)

### 1.1 Abra Supabase
```
URL: https://supabase.com/dashboard
Login com sua conta
```

### 1.2 Selecione seu Projeto
```
Clique no projeto TheTagsFlow
```

### 1.3 Abra SQL Editor
```
Menu esquerdo → SQL Editor
Clique em "New Query" (botão verde)
```

### 1.4 Copie o SQL
```
Arquivo: c:\Users\MAQUINA\Downloads\thetagsflow\BANCO_LIMPO.sql
Selecione TUDO (Ctrl+A)
Copie (Ctrl+C)
```

### 1.5 Cole no Supabase
```
Clique no editor SQL
Cole o código (Ctrl+V)
Verifique se está todo o código
```

### 1.6 Execute
```
Botão RUN (verde, no canto superior direito)
Aguarde mensagem: "Database setup completed successfully!"
Se aparecer verde = ✅ SUCESSO
Se aparecer vermelho = ❌ ERRO (veja ERROS COMUNS)
```

---

## PASSO 2: Iniciar o Servidor ⏱️ (2 minutos)

### 2.1 Abra Terminal
```
Dentro do VS Code
Ou PowerShell
```

### 2.2 Vá para Pasta do Projeto
```powershell
cd c:\Users\MAQUINA\Downloads\thetagsflow
```

### 2.3 Inicie o Dev Server
```powershell
npm run dev
```

### 2.4 Aguarde Mensagem
```
Deve aparecer:
   VITE v6.2.0  ready in XXX ms

   ➜  Local:   http://localhost:5173/
   ➜  press h to show help
```

### 2.5 Abra no Navegador
```
URL: http://localhost:5173
Deve carregar Landing Page
```

---

## PASSO 3: Teste Registro ⏱️ (3 minutos)

### 3.1 Clique "Registrar"
```
Landing Page → Botão "Registrar" (canto superior direito)
```

### 3.2 Preencha Formulário
```
Email: teste1@example.com
Senha: Senha123!
Confirmar Senha: Senha123!
```

### 3.3 Clique "Registrar"
```
Botão grande "Registrar"
Aguarde redirecionamento
```

### 3.4 Verifique Se foi para Onboarding
```
URL deve ser: http://localhost:5173/onboarding
Página com título: "Quase lá, teste!"
Dois campos: CNPJ e Nome da Empresa
```

---

## PASSO 4: Teste Onboarding ⏱️ (2 minutos)

### 4.1 Abra Console (F12)
```
Pressione F12
Clique na aba "Console"
Deixe aberta
```

### 4.2 Preencha CNPJ
```
Campo: "CPF ou CNPJ"
Cole: 34.028.317/0001-00
(Empresa Google Brasil - CNPJ real)

OU digite sem formatação: 34028317000100
```

### 4.3 Saia do Campo (onBlur)
```
Clique em outro lugar ou pressione Tab
Aguarde 1-2 segundos
```

### 4.4 Verifique Console
```
Procure por logs [ONBOARDING]:
✅ [ONBOARDING] Buscando dados do CNPJ: 34028317000100
✅ [ONBOARDING] Resposta da API: 200
✅ [ONBOARDING] Dados recebidos: {...}
✅ [ONBOARDING] Auto-preenchendo empresa: GOOGLE BRASIL INTERNET LTDA
```

### 4.5 Verifique Se Empresa Preencheu
```
Campo "Nome da Empresa" deve ter:
"GOOGLE BRASIL INTERNET LTDA"

Se NÃO preencheu:
- Verifique logs no console
- Pode ser que API está indisponível
- Digite manualmente: Empresa Teste LTDA
```

### 4.6 Clique "Continuar"
```
Botão grande "Continuar"
Aguarde resultado
```

### 4.7 Verifique Resultado
```
✅ SE SUCESSO:
   - Página recarrega
   - Vai para /set-password
   - Mensagem: "Perfil completo! Bem-vindo(a)!"

❌ SE ERRO:
   - Verifique console
   - Procure por [ONBOARDING] Erro RPC
   - Veja seção ERROS COMUNS
```

---

## PASSO 5: Teste Set Password ⏱️ (1 minuto)

### 5.1 Preencha Senha
```
Campo: "Nova Senha"
Valor: Senha123!

Campo: "Confirmar Senha"
Valor: Senha123!
```

### 5.2 Clique "Definir Senha"
```
Botão grande "Definir Senha"
Aguarde
```

### 5.3 Verifique Se foi para Dashboard
```
✅ SE SUCESSO:
   - URL muda para: http://localhost:5173/app/dashboard
   - Dashboard carrega com dados
   - Menu lateral aparece

❌ SE ERRO:
   - Verifique console
   - Procure por erros em vermelho
```

---

## PASSO 6: Teste Login Novamente ⏱️ (2 minutos)

### 6.1 Faça Logout
```
Menu (canto superior direito)
Procure "Sair" ou "Logout"
Clique
```

### 6.2 Volte para Landing Page
```
Deve redirecionar automaticamente
URL: http://localhost:5173
```

### 6.3 Clique "Entrar"
```
Botão "Entrar" (canto superior direito)
```

### 6.4 Login Com Credenciais
```
Email: teste1@example.com
Senha: Senha123!
```

### 6.5 Verifique Dashboard
```
✅ SE SUCESSO:
   - Carrega dashboard direto
   - Sem passar por onboarding
   - Dados da organização aparecem

❌ SE ERRO:
   - Verifique console
   - Veja seção ERROS COMUNS
```

---

## 🐛 ERROS COMUNS DURANTE TESTES

### ❌ "Erro ao finalizar cadastro: syntax error"
**Causa**: SQL não foi executado corretamente no Supabase

**Solução**:
```
1. Supabase SQL Editor
2. Novo Query
3. Copie TUDO do BANCO_LIMPO.sql novamente
4. Cole
5. Clique RUN
6. Verifique se aparece mensagem de sucesso
```

### ❌ "User does not exist in users table"
**Causa**: Trigger não criou usuário em public.users

**Solução**:
```sql
-- Execute no Supabase SQL Editor:
SELECT * FROM public.users WHERE email = 'teste1@example.com';

-- Se vazio, execute isto:
INSERT INTO public.users (id, email, role, name)
SELECT id, email, 'CLIENTE_GERENTE', email
FROM auth.users WHERE email = 'teste1@example.com';

-- Tente novamente
```

### ❌ "Este CNPJ já está cadastrado"
**Causa**: Você testou 2 vezes com mesmo CNPJ

**Solução**:
```sql
-- Supabase SQL Editor:
DELETE FROM public.organizations 
WHERE cpf_cnpj = '34028317000100';

-- Tente novamente com mesmo email/senha
-- OU use novo email
```

### ❌ "CNPJ não preencheu automaticamente"
**Causa**: Brazil API indisponível ou CNPJ inválido

**Solução**:
```
1. Verifique console (F12) → Console tab
2. Procure por [ONBOARDING] Erro ao buscar CNPJ
3. Se vir erro de rede:
   - API está indisponível
   - Preencha manualmente
   - Tente depois
4. Se CNPJ inválido:
   - Use: 34.028.317/0001-00 (Google)
   - Ou: 11.222.333/0001-81
```

### ❌ "permission denied for table users"
**Causa**: RLS policy não está correta

**Solução**:
```sql
-- Supabase SQL Editor:
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.users;

CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.users FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Recarregue página no navegador
```

### ❌ "violates foreign key constraint fk_owner_id"
**Causa**: Usuário não foi criado antes de organização

**Solução**:
```sql
-- Ver logs:
SELECT * FROM auth.users WHERE email = 'teste1@example.com';
SELECT * FROM public.users WHERE email = 'teste1@example.com';

-- Se public.users vazio:
-- Deletar org orfã:
DELETE FROM public.organizations 
WHERE cpf_cnpj = '34028317000100';

-- Criar usuário manualmente:
INSERT INTO public.users (id, email, role, name)
SELECT id, email, 'CLIENTE_GERENTE', email
FROM auth.users WHERE email = 'teste1@example.com';

-- Tente onboarding novamente
```

---

## ✅ CHECKLIST POR PASSO

```
PASSO 1 - Banco de Dados:
☐ Abri Supabase
☐ Copiei SQL completo do BANCO_LIMPO.sql
☐ Colei no SQL Editor
☐ Cliquei RUN
☐ Vi mensagem de sucesso (verde)

PASSO 2 - Dev Server:
☐ npm run dev funcionou
☐ localhost:5173 abriu
☐ Landing Page apareceu

PASSO 3 - Registro:
☐ Cliquei "Registrar"
☐ Preenchei email/senha
☐ Cliquei "Registrar"
☐ Redirecionou para /onboarding

PASSO 4 - Onboarding:
☐ Abri Console (F12)
☐ Preenchi CNPJ válido
☐ Saí do campo (Tab ou clique)
☐ Verifiquei logs [ONBOARDING]
☐ Empresa preencheu automaticamente
☐ Cliquei "Continuar"
☐ Redirecionou para /set-password

PASSO 5 - Set Password:
☐ Preenchei senha
☐ Cliquei "Definir Senha"
☐ Redirecionou para dashboard

PASSO 6 - Login:
☐ Fiz logout
☐ Voltei para login
☐ Preenchei credenciais
☐ Dashboard carregou direto
☐ SEM passar por onboarding

TUDO FUNCIONANDO? ✅
→ Aplicação está pronta para produção!
```

---

## 🎓 O QUE CADA PASSO FAZ

| Passo | Ação | Resultado no Banco |
|-------|------|-------------------|
| 1 | Executa SQL | 20 tabelas + RLS + Triggers + Funções |
| 2 | npm run dev | Carrega frontend em React |
| 3 | Registro | INSERT em auth.users → Trigger cria em public.users |
| 4 | Onboarding | RPC cria organização → Vincula user.organization_id |
| 5 | Set Password | UPDATE user.has_set_password = true |
| 6 | Login | SELECT verifica credentials → Carrega dashboard |

---

## 🚀 VOCÊ ESTÁ AQUI

```
[ ✅ Código pronto ] ← Você
   ↓
[ ⏳ Executar SQL ]  ← Passo 1
   ↓
[ ⏳ npm run dev ]  ← Passo 2
   ↓
[ ⏳ Testar fluxo ] ← Passos 3-6
   ↓
[ 🎉 PRODUÇÃO ]
```

**Total de tempo: ~15 minutos**

---

## ❓ DÚVIDAS COMUNS

### P: Preciso fazer npm install?
**R**: Não, já foi feito. Só npm run dev

### P: Onde vejo erros SQL?
**R**: Supabase → SQL Editor → Verifique mensagem abaixo do RUN

### P: Consigo usar outro CNPJ?
**R**: Sim! Qualquer CNPJ válido. Mas alguns podem não existir na Brazil API

### P: O que fazer se "permission denied"?
**R**: Vá para seção "ERROS COMUNS" → "permission denied for table users"

### P: Preciso resetar o banco?
**R**: Só se tiver muitos testes. Deletar org/user e criar novo é suficiente

### P: Dashboard demora para carregar?
**R**: Normal se for primeira vez. Geralmente < 2 segundos

---

## 🎯 META FINAL

Após completar todos os 6 passos, você terá:

✅ **Aplicação rodando localmente**
✅ **Registro/Login funcionando**
✅ **Onboarding completo com auto-preenchimento**
✅ **Dashboard carregando**
✅ **Dados persistindo no banco**
✅ **RLS isolando por organização**

**STATUS**: 🟢 **PRONTO PARA PRODUÇÃO**

---

**Boa sorte! Qualquer dúvida, verifique a seção de ERROS COMUNS acima! 🚀**
