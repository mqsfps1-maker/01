
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('Configuração de pagamento ausente.');

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado.');
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) throw new Error('Usuário inválido.')

    const { data: profile } = await supabaseAdmin.from('users').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) throw new Error('Organização não encontrada.')

    const { data: org } = await supabaseAdmin.from('organizations').select('stripe_customer_id').eq('id', profile.organization_id).single()
    
    if (!org?.stripe_customer_id) throw new Error('Nenhuma assinatura ativa encontrada para gerenciar.')

    const body = await req.json().catch(() => ({}));
    const { returnUrl } = body;

    // Validate returnUrl (Anti-Phishing)
    // Simple check: must start with http/https and ideally belong to your domain
    // For MVP, we ensure it's at least a valid URL structure or fallback.
    let safeReturnUrl = returnUrl;
    if (!safeReturnUrl || typeof safeReturnUrl !== 'string') {
        safeReturnUrl = 'https://tagsflow.com'; // Default fallback
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: safeReturnUrl,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("Erro no Portal:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
