# ⚡ QUICK START - 5 MINUTOS

## 🚀 EXECUTE AGORA

### 1. SQL (Supabase) - 2 min
```
1. https://supabase.com/dashboard
2. SQL Editor → New Query
3. Copiar BANCO_LIMPO.sql (tudo)
4. Colar no editor
5. RUN
6. ✅ Aguarde: "Database setup completed successfully!"
```

### 2. Frontend - 1 min
```bash
npm run dev
# Abra: http://localhost:5173
```

### 3. Teste - 2 min
```
1. Clique "Registrar"
2. teste@example.com / Senha123!
3. Preencha CNPJ: 34.028.317/0001-00
4. Saia do campo (Tab)
5. Empresa deve preencher automaticamente
6. Clique "Continuar"
7. Defina senha
8. Dashboard deve carregar
```

---

## ✅ PRONTO?

Se tudo funcionou:
- ✅ Banco de dados: OK
- ✅ Frontend: OK
- ✅ Autenticação: OK
- ✅ Onboarding: OK

**Você pode colocar em produção agora.**

---

## ❌ DEU ERRO?

### SQL não executa?
```sql
-- Supabase SQL Editor → Novo Query
-- Copie BANCO_LIMPO.sql inteiro
-- RUN
-- Se erro: verifique console de erro
```

### Frontend não inicia?
```bash
npm install
npm run dev
```

### Usuário não criado?
```sql
-- Verifique
SELECT * FROM public.users WHERE email = 'teste@example.com';
-- Se vazio, usuário não foi criado
-- Trigger pode não ter disparado
```

### CNPJ não preenche?
```
1. Abra F12 → Console
2. Procure [ONBOARDING] logs
3. Se vir erro de rede: API está down
4. Preencha manualmente
```

---

## 📚 DOCUMENTOS DISPONÍVEIS

| Arquivo | Para quem |
|---------|-----------|
| RESUMO_EXECUTIVO.md | Todos (1 pág) |
| PASSO_A_PASSO_VISUAL.md | Usuários (15 pág) |
| GUIA_FINAL_PRODUCAO.md | DevOps (20 pág) |
| SOLUCOES_COMPLETAS.md | Developers (25 pág) |
| STATUS_FINAL.md | Gerentes (20 pág) |

👉 **Comece por**: PASSO_A_PASSO_VISUAL.md

---

**Status: 🟢 PRONTO PARA PRODUÇÃO**

Execute os 3 passos acima e tudo funciona!
