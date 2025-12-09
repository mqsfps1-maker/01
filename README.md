# TagsFlow SaaS

Este é um sistema de Software como Serviço (SaaS) projetado para otimizar o processo de expedição de e-commerces, com foco na geração de etiquetas, controle de separação e baixa de estoque.

## Configuração do Ambiente

Para rodar este projeto, é necessário configurar as variáveis de ambiente. Elas são essenciais para a comunicação com os serviços de backend (Supabase) e pagamentos (Stripe).

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do seu projeto de desenvolvimento local (para Edge Functions) ou configure estas variáveis diretamente no painel do seu provedor de hospedagem (ex: Supabase Dashboard > Settings > Edge Functions).

**IMPORTANTE:** Nunca exponha as chaves `SECRET` ou `SERVICE_ROLE` no código do frontend. Elas devem ser usadas apenas em ambientes seguros no lado do servidor, como as Supabase Edge Functions.

```env
# Supabase
SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA_DO_SUPABASE
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE_SECRETA_DO_SUPABASE

# Stripe (será usado em fases futuras)
STRIPE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL_DO_STRIPE
STRIPE_SECRET_KEY=SUA_CHAVE_SECRETA_DO_STRIPE
```

### Explicação das Chaves

-   **`SUPABASE_URL`**: A URL base do seu projeto Supabase.
-   **`SUPABASE_ANON_KEY`**: Chave **pública** do Supabase. É seguro usá-la no código do frontend. A segurança dos dados é garantida pelas Políticas de Segurança a Nível de Linha (RLS) do seu banco de dados.
-   **`SUPABASE_SERVICE_ROLE_KEY`**: Chave **secreta** de serviço do Supabase. **NUNCA** deve ser exposta no frontend. Ela bypassa todas as políticas de RLS e concede acesso total ao seu banco. Use-a apenas em Edge Functions ou em um backend seguro.
-   **`STRIPE_PUBLISHABLE_KEY`**: Chave **pública** do Stripe. É usada no frontend para inicializar o Stripe.js.
-   **`STRIPE_SECRET_KEY`**: Chave **secreta** do Stripe. **NUNCA** deve ser exposta no frontend. Usada no backend (Edge Functions) para processar pagamentos, criar assinaturas, etc.

---

## Configuração das Edge Functions

As funções abaixo são necessárias para que a aplicação funcione corretamente. Você deve criá-las no seu projeto Supabase.

**Como Criar uma Edge Function no Supabase:**
1.  Instale a CLI do Supabase: `npm install supabase --save-dev`
2.  Faça o login: `npx supabase login`
3.  Vincule seu projeto: `npx supabase link --project-ref SEU_ID_DE_PROJETO`
4.  Crie uma nova função: `npx supabase functions new NOME_DA_FUNCAO`
5.  Isso criará uma pasta em `supabase/functions/NOME_DA_FUNCAO/index.ts`.
6.  Copie e cole o código correspondente abaixo dentro de cada arquivo `index.ts`.
7.  Faça o deploy da função: `npx supabase functions deploy NOME_DA_FUNCAO`
8.  **Não esqueça** de adicionar as variáveis de ambiente necessárias (como `STRIPE_SECRET_KEY`) em `Settings > Edge Functions` no seu painel Supabase.

### 1. Função `create-checkout-session` (Assinaturas)

**Caminho:** `supabase/functions/create-checkout-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@11.1.0';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2022-11-15',
});

serve(async (req) => {
  try {
    const { priceId, returnUrl } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );
    
    // Obter o usuário autenticado a partir do token
    const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization').replace('Bearer ', ''));
    if (!user) throw new Error('User not found');

    // Obter o perfil do usuário para pegar o organization_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error('Profile not found');
    
    // Obter a organização para pegar o stripe_customer_id
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', profile.organization_id)
      .single();

    if (orgError || !organization) throw new Error('Organization not found');

    let customerId = organization.stripe_customer_id;

    // Se não houver um stripe_customer_id, cria um novo cliente no Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          supabase_organization_id: profile.organization_id,
        },
      });
      customerId = customer.id;

      // Atualiza a organização no Supabase com o novo ID do cliente Stripe
      await supabaseAdmin
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.organization_id);
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: returnUrl,
      cancel_url: returnUrl,
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

```

### 2. Função `create-portal-session` (Gerenciar Assinatura)

**Caminho:** `supabase/functions/create-portal-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@11.1.0';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2022-11-15',
});

serve(async (req) => {
  try {
    const { returnUrl } = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization').replace('Bearer ', ''));
    if (!user) throw new Error('User not found');
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) throw new Error('Profile not found');

    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', profile.organization_id)
      .single();
    if (orgError || !organization || !organization.stripe_customer_id) {
      throw new Error('Stripe customer not found for this organization.');
    }

    const { url } = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: returnUrl,
    });
    
    return new Response(JSON.stringify({ url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

```

### 3. Função `invite-user` (Convidar Usuário)

**Caminho:** `supabase/functions/invite-user/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { email, name, setor, role } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Obter o usuário que está fazendo o convite
    const { data: { user: inviter } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization').replace('Bearer ', ''));
    if (!inviter) throw new Error('Not authenticated');

    // Obter o perfil do usuário que está convidando para pegar a organization_id
    const { data: inviterProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', inviter.id)
      .single();

    if (profileError || !inviterProfile) throw new Error('Inviter profile not found');
    if (inviterProfile.role !== 'CLIENTE_GERENTE' && inviterProfile.role !== 'DONO_SAAS') {
        throw new Error('Only managers can invite users.');
    }

    // Usar a API Admin para convidar o novo usuário
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        name: name,
        role: role,
        setor: setor,
        organization_id: inviterProfile.organization_id,
      },
    });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### 4. Função `delete-user` (Excluir Usuário)

**Caminho:** `supabase/functions/delete-user/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { userId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Obter o usuário que está fazendo a exclusão para validação de permissão
    const { data: { user: requester } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization').replace('Bearer ', ''));
    if (!requester) throw new Error('Not authenticated');

    // ... (Opcional: Adicionar lógica para verificar se o 'requester' tem permissão para excluir o 'userId')

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return new Response(JSON.stringify({ message: "User deleted successfully", data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### 5. Função `hard-reset-organization-data` (Reset Total de Dados)

**Caminho:** `supabase/functions/hard-reset-organization-data/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { password } = await req.json();

    // 1. Criar um cliente com a autenticação do usuário que fez a requisição
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: req.headers.get('Authorization') } } }
    );

    // 2. Obter os dados do usuário para pegar o email
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) throw new Error('Usuário não autenticado.');

    // 3. Verificar a senha do usuário para autorizar a ação destrutiva
    const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
    });
    if (passwordError) throw new Error('Senha de administrador incorreta.');

    // 4. Se a senha estiver correta, criar um cliente com privilégios de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );
    
    // 5. Chamar a função RPC segura que executa a limpeza no banco de dados
    const { data, error: rpcError } = await supabaseAdmin.rpc('hard_reset_database_for_user', { p_user_id: user.id });

    if (rpcError) throw rpcError;

    return new Response(JSON.stringify({ message: data }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, // Bad Request, pois o erro é provavelmente do cliente (senha errada, etc)
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```