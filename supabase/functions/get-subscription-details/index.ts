
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('Configuração de pagamento ausente (Stripe Key).');

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Usuário não autenticado.');
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) throw new Error('Token inválido.');

    // 2. Buscar ID do Cliente Stripe da Organização
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) throw new Error('Perfil sem organização.');

    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', profile.organization_id)
      .single()

    if (!org?.stripe_customer_id) {
        return new Response(
            JSON.stringify({ 
                hasSubscription: false,
                invoices: [],
                paymentMethod: null,
                upcomingInvoice: null
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }

    const customerId = org.stripe_customer_id;

    // 3. Buscar Dados no Stripe em Paralelo
    const [paymentMethods, invoices] = await Promise.all([
        stripe.paymentMethods.list({ customer: customerId, type: 'card' }),
        stripe.invoices.list({ customer: customerId, limit: 5, status: 'paid' })
    ]);

    let upcomingInvoice = null;
    try {
        upcomingInvoice = await stripe.invoices.retrieveUpcoming({ customer: customerId });
    } catch (e) {
        // Ignora se não tiver próxima fatura
    }

    // 4. Formatar Resposta
    const responseData = {
        hasSubscription: true,
        paymentMethod: paymentMethods.data.length > 0 ? {
            brand: paymentMethods.data[0].card.brand,
            last4: paymentMethods.data[0].card.last4,
            expMonth: paymentMethods.data[0].card.exp_month,
            expYear: paymentMethods.data[0].card.exp_year
        } : null,
        upcomingInvoice: upcomingInvoice ? {
            amount: upcomingInvoice.total / 100,
            date: new Date(upcomingInvoice.next_payment_attempt * 1000).toISOString()
        } : null,
        invoices: invoices.data.map((inv: any) => ({
            id: inv.id,
            number: inv.number,
            amount: inv.total / 100,
            status: inv.status,
            date: new Date(inv.created * 1000).toISOString(),
            pdfUrl: inv.invoice_pdf
        }))
    };

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
