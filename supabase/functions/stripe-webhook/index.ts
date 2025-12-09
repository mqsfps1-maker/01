
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req: any) => {
  const signature = req.headers.get('Stripe-Signature')

  // A chave de assinatura do webhook (pegar no dashboard do Stripe)
  const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')

  if (!signingSecret) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  let event
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, signature!, signingSecret, undefined, cryptoProvider)
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await handleCheckoutSessionCompleted(session, supabaseAdmin)
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        await handleSubscriptionUpdated(subscription, supabaseAdmin)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await handleSubscriptionDeleted(subscription, supabaseAdmin)
        break
      }
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return new Response(`Error processing webhook: ${error.message}`, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function handleCheckoutSessionCompleted(session: any, supabase: any) {
  const orgId = session.metadata?.supabase_org_id
  const subscriptionId = session.subscription

  if (!orgId || !subscriptionId) {
    console.error('Missing orgId or subscriptionId in session metadata')
    return
  }

  // Recuperar detalhes da assinatura para pegar o ID do plano/preço
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0].price.id

  // Encontrar o plano no banco de dados que corresponde a este preço do Stripe
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single()

  if (planError || !plan) {
    console.error('Plan not found for price ID:', priceId)
    return
  }

  // Atualizar ou criar a assinatura na tabela 'subscriptions'
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      organization_id: orgId,
      stripe_subscription_id: subscriptionId,
      plan_id: plan.id,
      status: subscription.status,
      period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }, { onConflict: 'organization_id' }) // Garante que uma org só tenha uma assinatura ativa

  if (subError) console.error('Error updating subscription:', subError)
  
  // Atualizar o ID do cliente na organização se ainda não estiver lá
  if (session.customer) {
      await supabase.from('organizations').update({ stripe_customer_id: session.customer }).eq('id', orgId);
  }
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  const priceId = subscription.items.data[0].price.id
  
  // Busca o plano
  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single()

  if (!plan) return

  // Atualiza a assinatura existente baseada no ID do stripe
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      plan_id: plan.id,
      period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  // Marca como cancelada ou deleta
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id)
}
