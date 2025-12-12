import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { dbClient } from '../lib/supabaseClient';
import { Loader2, AlertTriangle, Building, Save } from 'lucide-react';
import { isValidCpfCnpj, isValidCNPJ } from '../lib/validators'; // Importar a função de validação

interface OnboardingPageProps {
    user: User;
    onComplete: () => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onComplete, addToast }) => {
    const [organizationName, setOrganizationName] = useState('');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const cleanValue = cpfCnpj.replace(/[^\d]/g, '');
        
        if (!isValidCpfCnpj(cleanValue)) {
            setError('CPF ou CNPJ inválido. Verifique o número digitado.');
            setIsLoading(false);
            return;
        }

        if (!organizationName.trim()) {
            setError('Nome da empresa é obrigatório. Digite manualmente ou aguarde o preenchimento automático.');
            setIsLoading(false);
            return;
        }

        console.log('[ONBOARDING] Enviando dados para servidor:', { cpf_cnpj: cleanValue, organization_name: organizationName });

        try {
            const { data, error: rpcError } = await dbClient.rpc('complete_new_user_profile', {
                p_cpf_cnpj: cleanValue,
                p_organization_name: organizationName,
            });

            if (rpcError) {
                console.error('[ONBOARDING] Erro RPC:', rpcError);
                throw new Error(`Erro ao finalizar cadastro: ${rpcError.message}`);
            }

            if (data && data.success === false) {
                console.error('[ONBOARDING] Erro na resposta:', data.error);
                throw new Error(data.error || 'Erro desconhecido');
            }
            
            console.log('[ONBOARDING] ✅ Perfil completo com sucesso!', { 
                org_id: data?.organization_id?.substring(0, 8),
                user_id: data?.user_id?.substring(0, 8)
            });
            
            addToast('✅ Cadastro realizado com sucesso!', 'success');
            
            // Fazer logout explícito
            console.log('[ONBOARDING] Desconectando usuário...');
            const { error: signOutError } = await dbClient.auth.signOut();
            if (signOutError) {
                console.warn('[ONBOARDING] Erro ao fazer logout:', signOutError);
            } else {
                console.log('[ONBOARDING] ✓ Logout bem-sucedido');
            }
            
            // Limpar storage
            sessionStorage.clear();
            localStorage.removeItem('sb-auth-token');
            
            // Redirecionar para login
            console.log('[ONBOARDING] Redirecionando para login...');
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 800);

        } catch (err: any) {
            console.error('[ONBOARDING] Erro ao completar perfil:', err);
            setError(err.message || 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^\d]/g, '');
        if (value.length <= 11) {
            setCpfCnpj(
                value
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                    .substring(0, 14)
            );
        } else {
             setCpfCnpj(
                value
                    .replace(/(\d{2})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1/$2')
                    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
                    .substring(0, 18)
            );
        }
    };
    
    const fetchCnpjData = async () => {
        const cleanValue = cpfCnpj.replace(/[^\d]/g, '');
        if (cleanValue.length !== 14 || !isValidCNPJ(cleanValue)) {
            console.log('[ONBOARDING] CNPJ inválido ou incompleto:', cleanValue);
            return;
        }

        console.log('[ONBOARDING] Buscando dados do CNPJ:', cleanValue);
        setIsFetchingCnpj(true);
        setError('');
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanValue}`);
            console.log('[ONBOARDING] Resposta da API:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[ONBOARDING] Dados recebidos:', data);
                
                if (data && data.razao_social) {
                    console.log('[ONBOARDING] Auto-preenchendo empresa:', data.razao_social);
                    setOrganizationName(data.razao_social);
                } else {
                    console.warn('[ONBOARDING] Nenhuma razão social encontrada nos dados');
                }
            } else {
                console.warn('[ONBOARDING] Erro na resposta da API:', response.status);
            }
        } catch (fetchError) {
            console.error("[ONBOARDING] Erro ao buscar CNPJ:", fetchError);
            // Don't show an error to the user, they can still type manually
        } finally {
            setIsFetchingCnpj(false);
        }
    };


    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-['Inter']">
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-069242114a7c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
            ></div>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
            
            <div className="relative z-10 w-full max-w-lg p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 text-white">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Quase lá, {user.name.split(' ')[0]}!</h1>
                    <p className="mt-2 text-slate-300">Para finalizar, precisamos de mais algumas informações sobre sua empresa.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="cpfCnpj" className="block text-sm font-medium text-slate-300 mb-1">CPF ou CNPJ</label>
                         <div className="relative">
                            <input
                                id="cpfCnpj"
                                type="text"
                                value={cpfCnpj}
                                onChange={handleCpfCnpjChange}
                                onBlur={fetchCnpjData} // Fetch data on blur
                                maxLength={18}
                                className="appearance-none relative block w-full px-4 py-3 border placeholder-slate-400 bg-white/10 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition"
                                placeholder="Seu CPF ou o CNPJ da empresa"
                                required
                            />
                            {isFetchingCnpj && (
                                <Loader2 className="animate-spin h-5 w-5 text-slate-300 absolute right-3 top-1/2 -translate-y-1/2" />
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="organizationName" className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2"><Building size={16}/> Nome da Empresa</label>
                        <input
                            id="organizationName"
                            type="text"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            className="appearance-none relative block w-full px-4 py-3 border placeholder-slate-400 bg-white/10 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition"
                            placeholder="Sua Empresa Ltda."
                            required
                        />
                    </div>
                    
                    {error && (
                        <div className="flex items-center p-3 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <button type="submit" disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 mt-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition duration-300 ease-in-out transform hover:scale-105">
                           {isLoading ? <Loader2 className="animate-spin h-5 w-5"/> : <><Save size={18} className="mr-2"/> Concluir e Acessar</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;