// components/SubscriptionUpgradeModal.tsx
import React, { useState } from 'react';
import { Loader2, AlertTriangle, CreditCard, X } from 'lucide-react';

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  currentPlan: string;
  onClose: () => void;
  user?: any;
  organization_id?: string;
}

const SubscriptionUpgradeModal: React.FC<SubscriptionUpgradeModalProps> = ({
  isOpen,
  currentPlan,
  onClose,
  user,
  organization_id,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'plan_starter',
      name: 'Starter',
      price: 99.90,
      priceId: 'price_1ST6WUH9gIP9tzTRDrjI7fPf',
      features: ['100 produtos', '3 usuários', 'Relatórios básicos'],
    },
    {
      id: 'plan_professional',
      name: 'Professional',
      price: 299.90,
      priceId: 'price_1ST6YRH9gIP9tzTRgGgPv21v',
      features: ['5000 produtos', '10 usuários', 'Relatórios avançados', 'API'],
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise',
      price: 999.90,
      priceId: 'price_1ST6YiH9gIP9tzTR1VvlqsRl',
      features: ['Produtos ilimitados', 'Usuários ilimitados', 'Suporte prioritário', 'API'],
    },
  ];

  const handleUpgrade = async (priceId: string, planName: string) => {
    setError('');
    setIsLoading(true);

    try {
      if (!user?.id || !organization_id) {
        throw new Error('Usuário ou organização não encontrada');
      }

      // Chamar Edge Function para criar checkout session
      const response = await fetch(
        'https://gdnmukufvlyeqsasjelx.supabase.co/functions/v1/create-checkout-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId,
            organizationId: organization_id,
            userId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ao fazer upgrade para ${planName}`);
      }

      // Redirecionar para checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Upgrade de Plano</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-8">
            Plano atual: <span className="font-semibold text-gray-900">{currentPlan}</span>
          </p>

          {error && (
            <div className="flex items-center p-4 mb-6 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="text-red-600 mr-3" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 transition ${
                  currentPlan === plan.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    R$ {plan.price.toFixed(2)}
                  </span>
                  <span className="text-gray-600 text-sm ml-2">/mês</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.priceId, plan.name)}
                  disabled={isLoading || currentPlan === plan.name}
                  className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                    currentPlan === plan.name
                      ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processando...
                    </>
                  ) : currentPlan === plan.name ? (
                    'Plano Atual'
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Fazer Upgrade
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Você será redirecionado para o Stripe para completar o pagamento.
            Nenhum dado será armazenado em nossos servidores.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUpgradeModal;
