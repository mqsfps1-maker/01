// lib/stripe.ts
// Nota: Usamos Edge Functions do Supabase para checkout
// A Edge Function retorna a URL de checkout do Stripe

interface CheckoutSessionOptions {
  priceId: string;
  organizationId: string;
  userId: string;
}

export const createCheckoutSession = async (options: CheckoutSessionOptions) => {
  // Chamar a Edge Function do Supabase
  const response = await fetch(
    'https://gdnmukufvlyeqsasjelx.supabase.co/functions/v1/create-checkout-session',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao criar sessão de checkout');
  }

  // Redirecionar para o checkout (URL vem da Edge Function)
  if (data.url) {
    window.location.href = data.url;
  } else if (data.sessionId) {
    // Fallback se precisar
    throw new Error('URL de checkout não encontrada');
  }
};

// Hook para usar em componentes
export const useStripeCheckout = () => {
  const handleCheckout = async (options: CheckoutSessionOptions) => {
    try {
      await createCheckoutSession(options);
    } catch (error) {
      console.error('Erro no checkout:', error);
      throw error;
    }
  };

  return { handleCheckout };
};
