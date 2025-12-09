

import React, { useState, useEffect } from 'react';
import { Check, CreditCard, Loader2, Crown, AlertTriangle, ExternalLink, Calendar, FileText, DollarSign } from 'lucide-react';
import { dbClient } from '../lib/supabaseClient';
import { User } from '../types';
import { loadStripe } from '@stripe/stripe-js';

// --- CONFIGURAÇÃO OBRIGATÓRIA ---

const STRIPE_PUBLIC_KEY = 'pk_live_51SR0u5H9gIP9tzTRELJkBlL2rBDXhGYto36neDli8x3ZXevZtxVz3HFScrzCnMB9s4PANSqoVQMNAs7HuLNUuxQM005lrP5que';

const STRIPE_PRICE_IDS: Record<string, string> = {
    'Starter': 'price_1ST6WUH9gIP9tzTRDrjI7fPf', 
    'Plus': 'price_1ST6YRH9gIP9tzTRgGgPv21v',
    'Escala': 'price_1ST6YiH9gIP9tzTR1VvlqsRl',
};

interface Plan {
    id: number;
    name: string;
    price: number | null;
    max_users: number | null;
    features: string[];
    stripe_price_id: string | null;
}

interface SubscriptionPageProps {
    user: User;
    subscription: any | null;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ user, subscription, addToast }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [financialDetails, setFinancialDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            const { data, error } = await dbClient.from('plans').select('*').order('price');
            if (error) {
                addToast('Erro ao carregar os planos.', 'error');
            } else {
                setPlans(data as Plan[]);
            }
        };
        fetchPlans();
    }, [addToast]);
    
    // Buscar detalhes financeiros via Edge Function
    useEffect(() => {
        const fetchDetails = async () => {
            if (!user.organization_id) return;
            setLoadingDetails(true);
            try {
                const { data, error } = await dbClient.functions.invoke('get-subscription-details');
                if (!error && data) {
                    setFinancialDetails(data);
                }
            } catch (e) {
                console.error("Failed to fetch subscription details", e);
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchDetails();
    }, [user.organization_id]);

    // Função para iniciar o Checkout via Edge Function
    const handleSubscribe = async (planName: string) => {
        const priceId = STRIPE_PRICE_IDS[planName];

        if (!priceId || priceId.includes('SEU_ID')) {
            addToast('Erro de Configuração: ID do preço não definido no código (STRIPE_PRICE_IDS).', 'error');
            return;
        }

        if (!user.organization_id) {
            addToast('Erro: Organização não identificada. Tente recarregar a página.', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const returnUrl = `${window.location.origin}/#/app/assinatura`;

            const { data, error } = await dbClient.functions.invoke('create-checkout-session', {
                body: {
                    priceId: priceId,
                    returnUrl: returnUrl,
                },
            });

            if (error) {
                let errorMessage = error.message || 'Falha na comunicação com o servidor.';
                try {
                     const errorBody = await error.context.json();
                     if (errorBody && errorBody.error) {
                         errorMessage = errorBody.error;
                     }
                } catch (e) {
                    // Ignora erro de parsing
                }
                throw new Error(errorMessage);
            }

            if (!data || !data.sessionId) {
                throw new Error(data?.error || 'A função não retornou uma sessão válida.');
            }

            const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
            if (!stripe) throw new Error('Falha ao carregar Stripe SDK.');

            const { error: stripeError } = await stripe.redirectToCheckout({
                sessionId: data.sessionId,
            });

            if (stripeError) {
                throw stripeError;
            }

        } catch (err: any) {
            console.error('Erro no Checkout:', err);
            addToast(`Erro ao iniciar pagamento: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Função para acessar o Portal do Cliente via Edge Function
    const handleManageSubscription = async () => {
        setIsLoading(true);
        try {
            const returnUrl = `${window.location.origin}/#/app/assinatura`;
            
            const { data, error } = await dbClient.functions.invoke('create-portal-session', {
                body: {
                    returnUrl: returnUrl,
                },
            });

            if (error) {
                 let errorMessage = error.message || 'Falha ao conectar com servidor.';
                 try {
                     const errorBody = await error.context.json();
                     if (errorBody && errorBody.error) {
                         errorMessage = errorBody.error;
                     }
                } catch (e) {
                    // Ignora erro de parsing
                }
                throw new Error(errorMessage);
            }

            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data?.error || 'Não foi possível gerar o link do portal.');
            }

        } catch (err: any) {
            console.error('Erro no Portal:', err);
            addToast(`Erro ao abrir portal: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const activeSubscription = subscription || {
        plan: { id: -1, name: 'Plano Grátis (Teste)', max_users: 1 },
        status: 'trialing',
        period_end: null
    };
    
    const currentPlanId = activeSubscription.plan?.id;
    const isFreeTrial = activeSubscription.status === 'trialing';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Assinatura e Faturas</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Gerencie seu plano e visualize seu histórico de pagamentos.</p>
            </div>
            
             <div className={`p-6 rounded-xl border-2 shadow-lg ${isFreeTrial ? 'bg-blue-50 border-blue-200' : 'bg-[var(--color-surface)] border-[var(--color-primary)]'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                            {isFreeTrial ? <Crown size={24} className="text-yellow-500" /> : <CreditCard size={24} className="text-[var(--color-primary)]" />}
                            Seu Plano Atual: <span className="text-[var(--color-primary)]">{activeSubscription.plan?.name}</span>
                        </h2>
                        
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Status: <span className={`font-semibold capitalize ${isFreeTrial ? 'text-blue-600' : 'text-green-600'}`}>
                                    {isFreeTrial ? 'Período de Teste' : activeSubscription.status}
                                </span>
                            </p>
                             <p className="text-sm text-[var(--color-text-secondary)]">
                                Usuários Permitidos: <strong>{activeSubscription.plan?.max_users}</strong>
                            </p>
                            {activeSubscription.period_end && (
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    {isFreeTrial ? 'Teste válido até:' : 'Renovação em:'} {new Date(activeSubscription.period_end).toLocaleDateString('pt-BR')}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {isFreeTrial ? (
                         <div className="text-right max-w-xs">
                             <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm mb-3">
                                <p className="text-sm text-blue-800 font-medium flex items-center justify-end gap-2"><AlertTriangle size={14} /> Modo de Teste Ativo</p>
                                <p className="text-xs text-gray-600 mt-1">Aproveite! Para continuar usando após o teste, assine um dos planos abaixo.</p>
                             </div>
                         </div>
                    ) : (
                        <button onClick={handleManageSubscription} disabled={isLoading} className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-semibold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)] w-full md:w-auto disabled:opacity-50">
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : <ExternalLink size={16}/>}
                            Gerenciar Assinatura e Cancelar
                        </button>
                    )}
                </div>
            </div>
            
            {!isFreeTrial && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] flex items-center gap-2"><Calendar size={16}/> Próxima Cobrança</h3>
                        {loadingDetails ? <Loader2 className="animate-spin h-5 w-5 mt-2 text-blue-500"/> : (
                            <>
                                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
                                    {financialDetails?.upcomingInvoice 
                                        ? new Date(financialDetails.upcomingInvoice.date).toLocaleDateString('pt-BR') 
                                        : 'N/A'}
                                </p>
                                {financialDetails?.upcomingInvoice && <p className="text-sm text-gray-500">R$ {financialDetails.upcomingInvoice.amount.toFixed(2)}</p>}
                            </>
                        )}
                    </div>
                    <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] flex items-center gap-2"><DollarSign size={16}/> Último Pagamento</h3>
                        {loadingDetails ? <Loader2 className="animate-spin h-5 w-5 mt-2 text-blue-500"/> : (
                            <>
                                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
                                     {financialDetails?.invoices?.[0] 
                                        ? `R$ ${financialDetails.invoices[0].amount.toFixed(2)}`
                                        : 'N/A'}
                                </p>
                                {financialDetails?.invoices?.[0] && <p className="text-sm text-gray-500">{new Date(financialDetails.invoices[0].date).toLocaleDateString('pt-BR')}</p>}
                            </>
                        )}
                    </div>
                    <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] flex items-center gap-2"><CreditCard size={16}/> Método de Pagamento</h3>
                         {loadingDetails ? <Loader2 className="animate-spin h-5 w-5 mt-2 text-blue-500"/> : (
                            <>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="capitalize font-bold text-[var(--color-text-primary)]">{financialDetails?.paymentMethod?.brand || 'Cartão'}</span>
                                    <span className="text-[var(--color-text-primary)]">•••• {financialDetails?.paymentMethod?.last4 || '----'}</span>
                                </div>
                                {financialDetails?.paymentMethod && <p className="text-sm text-gray-500">Expira em {financialDetails.paymentMethod.expMonth}/{financialDetails.paymentMethod.expYear}</p>}
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {!isFreeTrial && financialDetails?.invoices?.length > 0 && (
                <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                        <h3 className="font-bold text-[var(--color-text-primary)]">Histórico de Faturas</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--color-surface)] text-[var(--color-text-secondary)] font-medium">
                                <tr>
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3">Valor</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Recibo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {financialDetails.invoices.map((invoice: any) => (
                                    <tr key={invoice.id} className="hover:bg-[var(--color-surface-secondary)]">
                                        <td className="px-4 py-3 text-[var(--color-text-primary)]">{new Date(invoice.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-4 py-3 font-semibold">R$ {invoice.amount.toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {invoice.status === 'paid' ? 'Pago' : invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                <FileText size={14}/> PDF
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mx-auto grid max-w-md items-start gap-8 lg:max-w-5xl lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                return (
                    <div key={plan.id} className={`flex flex-col rounded-xl border transition-shadow hover:shadow-xl ${isCurrent ? 'border-2 border-[var(--color-primary)] shadow-2xl' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
                      <div className="p-6 items-start">
                        {isCurrent && <div className="inline-block rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-text)] mb-2">Plano Atual</div>}
                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-4xl font-extrabold text-[var(--color-text-primary)]">{plan.price ? `R$${plan.price}` : 'Custom'}</span>
                          {plan.price && <span className="text-[var(--color-text-secondary)]">/mês</span>}
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-2 h-10">Limite de {plan.max_users || 'múltiplos'} usuários.</p>
                      </div>
                      <div className="p-6 flex-1 bg-[var(--color-surface-secondary)]">
                        <ul className="space-y-4">
                          {plan.features?.map((feature: string, index: number) => (
                            <li key={index} className="flex items-center gap-3">
                              <Check className="h-5 w-5 text-[var(--color-primary)]" />
                              <span className="text-sm text-[var(--color-text-primary)]">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-6 bg-[var(--color-surface)] rounded-b-xl">
                        <button 
                            onClick={() => handleSubscribe(plan.name)}
                            disabled={isLoading || isCurrent}
                            className={`w-full px-4 py-3 font-bold rounded-md text-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2 ${isCurrent ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)] shadow-md'}`}>
                          {isLoading && !isCurrent ? <Loader2 className="animate-spin" /> : (isCurrent ? 'Plano Ativo' : 'Assinar Agora')}
                        </button>
                      </div>
                    </div>
                )
              })}
            </div>
        </div>
    );
};

export default SubscriptionPage;
