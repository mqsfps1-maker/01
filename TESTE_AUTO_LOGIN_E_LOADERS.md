# 🧪 GUIA DE TESTE - AUTO-LOGIN E LOADERS

## ✅ PRÉ-REQUISITOS

- [x] BANCO_LIMPO.sql executado no Supabase
- [x] npm run build (0 erros)
- [x] Código atualizado (OnboardingPage + App.tsx)

---

## 🚀 TESTE 1: AUTO-LOGIN ONBOARDING

### Passo 1: Inicie o servidor dev
```bash
cd c:\Users\MAQUINA\Downloads\thetagsflow
npm run dev
# ✓ localhost:5173
```

### Passo 2: Registre novo usuário
```
1. Clique em "Cadastrar"
2. Email: teste2024@example.com
3. Telefone: 11999999999
4. Senha: Senha@123
5. Clique "Cadastrar"
```

**Esperado**: ✅ Sem loader visível

### Passo 3: Onboarding (o importante!)
```
1. Preencha CNPJ: 34.028.317/0001-00
2. Tab (para sair do campo)
   → Aguarde 1-2 segundos
   → Empresa deve preencher com "MANUTENÇÃO E SUPORTE TÉCNICO LTDA"
3. Campo "Empresa" agora tem: 
   "MANUTENÇÃO E SUPORTE TÉCNICO LTDA"
4. Clique "Concluir e Acessar"
```

**Esperado**: 
- ✅ Sem spinner grande
- ✅ Sem recarregar página
- ✅ Dashboard aparece em ~300ms
- ✅ Você está logado e no dashboard

---

## 🎯 TESTE 2: VERIFICAR LOADERS REMOVIDOS

### Abra DevTools
```
F12 → Console
```

### Verifique os logs
```javascript
// Você deve ver:
[AUTH] Verificando sessão...
[AUTH] Sessão encontrada para: teste2024@example.com
[AUTH] Tentando buscar perfil para usuário: ...
[AUTH] ✓ Perfil encontrado com sucesso
// ou
[AUTH] Usando perfil temporário para entrada

// NÃO deve haver:
❌ "Conectando..."
❌ "Loading..."
❌ "Aguarde..."
```

### Tab Network
```
1. F12 → Network
2. Clique "Concluir" no onboarding
3. Veja as requisições:
   - POST /functions/v1/complete_new_user_profile ✓
   - GET /app/dashboard ✓
4. Não deve haver page reload
```

---

## 📊 TESTE 3: PERFORMANCE

### Ferramentas
```
F12 → Performance
```

### Teste o fluxo
```
1. Registre usuário
2. Vá para onboarding
3. Preencha CNPJ
4. Clique "Concluir"
5. Comece recording
6. Aguarde dashboard carregar
7. Pare recording
```

### Analise
```
Procure por:
- Nenhum "AppLoader" renderizado
- Transição suave entre páginas
- Sem "blank page" ou "white screen"
- Tempo total: < 500ms até dashboard visível
```

---

## ✨ TESTE 4: VERIFICAR CADA FEATURE

### Feature 1: Auto-Preenchimento CNPJ ✓
```
1. Onboarding page
2. CNPJ: 34.028.317/0001-00
3. Tab para sair do campo
4. Empresa deve preencher automáticamente
5. Nenhum loader visível durante isso
```

**Esperado**: 
- ✅ Empresa preenche em 1-2s
- ✅ Sem spinner de carregamento
- ✅ Sem erro no console

### Feature 2: Auto-Login ✓
```
1. Completa onboarding
2. Clica "Concluir e Acessar"
3. Observa a URL
```

**Esperado**:
- ✅ URL muda para `/app/dashboard` em ~100ms
- ✅ Dashboard carrega suavemente
- ✅ Sem `window.location.reload()`
- ✅ Sessão mantida (não desconecta)

### Feature 3: Sem Loaders ✓
```
1. Durante todo o fluxo (registro → onboarding → dashboard)
2. Abra DevTools
3. Verifique console e UI
```

**Esperado**:
- ✅ Nenhum spinner no meio da tela
- ✅ Nenhum "Conectando..." 
- ✅ Nenhum "Aguarde..."
- ✅ Apenas a página normal carregando

---

## 🔍 TESTE 5: CENÁRIOS ESPECIAIS

### Cenário A: Usuário Convidado
```
1. Admin convida: novo@example.com
2. Novo usuário clica no link
3. Faz login (sem loader)
4. Define senha
5. Redireciona para login para fazer login novamente
```

**Esperado**:
- ✅ Sem loader no meio do fluxo
- ✅ Redireção suave

### Cenário B: Volta para Onboarding
```
1. Usuário cancela onboarding
2. Volta para onboarding mais tarde
3. Retoma o processo
```

**Esperado**:
- ✅ Sem duplicação de dados
- ✅ Campo CNPJ vazio novamente
- ✅ Auto-preenchimento funciona

---

## 📋 CHECKLIST FINAL

### ✅ Loaders Removidos
- [ ] Nenhum loader ao registrar
- [ ] Nenhum loader ao fazer login
- [ ] Nenhum loader no onboarding
- [ ] Nenhum loader após onboarding
- [ ] Nenhum loader ao acessar dashboard

### ✅ Auto-Login
- [ ] Após completar onboarding, vai direto para dashboard
- [ ] Não recarrega a página
- [ ] Leva menos de 500ms

### ✅ Auto-Preenchimento
- [ ] CNPJ auto-preenche empresa
- [ ] Sem erro no console
- [ ] Funciona com vários CNPJs

### ✅ Performance
- [ ] Nenhuma "white screen"
- [ ] Nenhum "flicker" ou "blink"
- [ ] Transições suaves

### ✅ Console (DevTools)
- [ ] Nenhum erro vermelho
- [ ] Logs [AUTH] aparecem normalmente
- [ ] Logs [ONBOARDING] aparecem normalmente

---

## 🐛 SE ALGO NÃO FUNCIONAR

### Loader aparece mas não some
```javascript
// DevTools > Console
// Cole isso para diagnosticar:
localStorage.clear();
sessionStorage.clear();
window.location.href = '/';
```

### Auto-login não funciona
```javascript
// Verifique se RPC retornou sucesso:
F12 > Network > complete_new_user_profile
// Procure por 200 OK (não 4xx ou 5xx)
```

### CNPJ não auto-preenche
```javascript
// Console deve mostrar:
[ONBOARDING] Buscando dados do CNPJ: 34028317000100
[ONBOARDING] Resposta da API: 200
[ONBOARDING] Auto-preenchendo empresa: ...
// Se não aparecer, verifique a API da BrasilAPI
```

---

## 📸 SCREENSHOTS ESPERADAS

### Tela 1: Registro
```
[Email          ] teste2024@example.com
[Telefone       ] 11999999999
[Senha          ] Senha@123
[Cadastrar      ] ← Botão (sem spinner)
```

### Tela 2: Onboarding
```
[CNPJ           ] 34.028.317/0001-00
[Empresa        ] MANUTENÇÃO E SUPORTE TÉCNICO LTDA
[Concluir...    ] ← Botão (sem spinner grande)
```

### Tela 3: Dashboard
```
Carrega suavemente sem spinner
Você está na home do app
```

---

## ⏱️ TEMPOS ESPERADOS

| Ação | Tempo | Status |
|------|-------|--------|
| Registro → Onboarding | < 1s | ✅ |
| CNPJ blur → Auto-preencher | 1-2s | ✅ |
| Clique Concluir → Dashboard | 100-300ms | ✅ |
| Dashboard carregamento | < 2s | ✅ |
| **Total fluxo completo** | **4-5s** | ✅ |

---

## 🎉 SUCESSO!

Se todos os testes passaram:

```bash
# Build final
npm run build
# ✓ 0 erros

# Pronto para produção!
```

✨ **Auto-login e loaders removidos com sucesso!** ✨
