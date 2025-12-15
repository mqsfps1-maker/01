import React, { useState } from 'react';
import { dbClient } from '../lib/supabaseClient';
import { Building2, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { isValidCNPJ, isValidCpfCnpj } from '../lib/validators';

interface CreateOrganizationModalProps {
    user: any;
    isOpen: boolean;
    onCreated: (organizationId: string) => void;
    onClose: () => void;
    onLogout?: () => void;
}

const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
    user,
    isOpen,
    onCreated,
    onClose,
    onLogout,
}) => {
    const [step, setStep] = useState<'cpf' | 'confirm'>('cpf');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false);

    if (!isOpen) return null;

    // Função para fazer logout de emergência
    const handleEmergencyLogout = async () => {
        try {
            await dbClient.auth.signOut();
            if (onLogout) onLogout();
            window.location.href = '/login';
        } catch (err) {
            console.error('Erro ao fazer logout:', err);
            window.location.href = '/login';
        }
    };

    // Função para buscar dados do CNPJ
    const fetchCompanyDataByCNPJ = async (cnpj: string) => {
        const cleanCNPJ = cnpj.replace(/\D/g, '');
        
        if (cleanCNPJ.length !== 14) {
            setError('CNPJ deve ter 14 dígitos');
            return;
        }

        setIsFetchingCNPJ(true);
        setError('');

        try {
            // API pública gratuita para consultar CNPJ
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
            
            if (!response.ok) {
                setError('CNPJ não encontrado ou inválido');
                setIsFetchingCNPJ(false);
                return;
            }

            const data = await response.json();
            
            // Pega o nome da razão social
            if (data.name || data.razao_social) {
                setCompanyName(data.name || data.razao_social);
                setError('');
            } else {
                setError('Não foi possível encontrar o nome da empresa');
            }
        } catch (err) {
            console.error('Erro ao buscar CNPJ:', err);
            setCompanyName('');
        } finally {
            setIsFetchingCNPJ(false);
        }
    };

    // Chamado quando o usuário termina de digitar o CNPJ
    const handleCNPJChange = (value: string) => {
        setCpfCnpj(value);
        setError('');

        // Se é um CNPJ válido e tem 14 dígitos, busca automaticamente
        const cleanCNPJ = value.replace(/\D/g, '');
        if (cleanCNPJ.length === 14 && isValidCNPJ(value)) {
            fetchCompanyDataByCNPJ(value);
        }
    };

    const handleContinue = async () => {
        setError('');

        if (!cpfCnpj || !companyName) {
            setError('Preencha todos os campos');
            return;
        }

        if (!isValidCpfCnpj(cpfCnpj)) {
            setError('CPF/CNPJ inválido');
            return;
        }

        setStep('confirm');
    };

    const handleCreateOrganization = async () => {
        setError('');
        setIsLoading(true);

        try {
            if (!user?.id) {
                throw new Error('Usuário não autenticado');
            }

            // Criar organização
            const { data: orgData, error: orgError } = await dbClient
                .from('organizations')
                .insert({
                    name: companyName,
                    cpf_cnpj: cpfCnpj,
                    owner_id: user.id,
                })
                .select('id')
                .single();

            if (orgError || !orgData) throw new Error('Erro ao criar organização');

            // Atualizar usuário
            const { error: updateError } = await dbClient
                .from('users')
                .update({ organization_id: orgData.id })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Criar assinatura padrão (ignorar se falhar)
            try {
                await dbClient
                    .from('subscriptions')
                    .insert({
                        organization_id: orgData.id,
                        status: 'trialing',
                        plan_id: 'plan_free',
                        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    });
            } catch (err) {
                // Continuar mesmo se falhar
                console.error('Erro ao criar assinatura padrão:', err);
            }

            onCreated(orgData.id);
        } catch (err: any) {
            setError(err.message || 'Erro ao criar organização');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Building2 size={24} className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Criar Organização</h2>
                    </div>
                    <button
                        onClick={handleEmergencyLogout}
                        className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Fazer logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

                {/* Conteúdo */}
                {step === 'cpf' && (
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Para começar a usar a plataforma, crie sua organização:
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CPF ou CNPJ
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="00.000.000/0000-00"
                                    value={cpfCnpj}
                                    onChange={(e) => handleCNPJChange(e.target.value)}
                                    disabled={isLoading || isFetchingCNPJ}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                                {isFetchingCNPJ && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Loader2 size={18} className="animate-spin text-blue-600" />
                                    </div>
                                )}
                            </div>
                            {isFetchingCNPJ && (
                                <p className="text-xs text-blue-600 mt-1">Buscando dados da empresa...</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome da Empresa
                                {companyName && !isFetchingCNPJ && (
                                    <span className="text-xs text-green-600 font-normal ml-2">✓ Preenchido automaticamente</span>
                                )}
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: Minha Empresa LTDA"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                disabled={isLoading || isFetchingCNPJ}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle size={18} className="text-red-600" />
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleContinue}
                            disabled={isLoading || isFetchingCNPJ || !cpfCnpj || !companyName}
                            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Carregando...
                                </>
                            ) : (
                                'Continuar'
                            )}
                        </button>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>Empresa:</strong> {companyName}
                            </p>
                            <p className="text-sm text-gray-700">
                                <strong>CNPJ/CPF:</strong> {cpfCnpj}
                            </p>
                        </div>

                        <p className="text-sm text-gray-600">
                            Ao confirmar, sua organização será criada e você terá acesso a um período de teste de 7 dias.
                        </p>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle size={18} className="text-red-600" />
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setStep('cpf');
                                    setError('');
                                }}
                                disabled={isLoading}
                                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleCreateOrganization}
                                disabled={isLoading}
                                className="flex-1 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    'Criar Organização'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateOrganizationModal;
