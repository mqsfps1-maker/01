// pages/ResetPage.tsx
import React, { useState } from 'react';
import { ArrowLeft, Loader2, ShieldAlert, KeyRound, AlertTriangle } from 'lucide-react';
import { dbClient } from '../lib/supabaseClient';
import { ToastMessage } from '../types';

interface ResetPageProps {
    onNavigateToSettings: () => void;
    addToast: (message: string, type: ToastMessage['type']) => void;
}

const ResetPage: React.FC<ResetPageProps> = ({ onNavigateToSettings, addToast }) => {
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (confirmText !== 'APAGAR TUDO PERMANENTEMENTE') {
            setError('Você deve digitar a frase de confirmação corretamente.');
            return;
        }
        
        setIsLoading(true);

        try {
            const { data, error: funcError } = await dbClient.functions.invoke('hard-reset-organization-data', {
                body: { password },
            });

            if (funcError) {
                 const errorBody = await funcError.context.json();
                 throw new Error(errorBody.error || 'Erro ao apagar os dados.');
            }
            
            addToast(data.message, 'success');
            // Forçar um reload completo da aplicação para buscar os dados do zero.
            window.location.hash = 'dashboard';
            window.location.reload();

        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-red-900 p-4 font-['Inter'] text-white">
             <div className="relative z-10 w-full max-w-lg">
                <button onClick={onNavigateToSettings} className="absolute -top-12 left-0 text-white/70 hover:text-white transition-colors flex items-center gap-1 text-sm">
                    <ArrowLeft size={16} />
                    Voltar para Configurações
                </button>
                <div className="w-full p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
                    <div className="text-center">
                        <ShieldAlert size={48} className="mx-auto text-red-300 mb-4" />
                        <h1 className="text-3xl font-bold">
                            Apagar Permanentemente Todos os Dados
                        </h1>
                        <p className="mt-2 text-red-200">
                            Esta é uma ação destrutiva e irreversível.
                        </p>
                    </div>

                     <div className="p-4 bg-red-500/20 text-red-200 border border-red-500/30 rounded-lg text-sm space-y-2">
                        <p>Você está prestes a apagar <strong>TODOS</strong> os dados da sua organização, incluindo:</p>
                        <ul className="list-disc list-inside pl-4">
                            <li>Produtos, Insumos e Receitas</li>
                            <li>Pedidos e Clientes</li>
                            <li>Histórico de Bipagens</li>
                            <li>Movimentações de Estoque</li>
                            <li>Histórico de Importações</li>
                            <li>Outros usuários convidados</li>
                        </ul>
                        <p className="font-bold mt-2">Apenas seu login de administrador e sua assinatura serão mantidos.</p>
                    </div>
                    
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="confirmText" className="block text-sm font-medium text-slate-300 mb-1">Para confirmar, digite <strong>APAGAR TUDO PERMANENTEMENTE</strong> abaixo:</label>
                            <input id="confirmText" name="confirmText" type="text" required value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border placeholder-slate-400 bg-white/10 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 sm:text-sm transition" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Digite sua senha para autorizar:</label>
                             <div className="relative">
                                <KeyRound className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none relative block w-full px-4 py-3 pl-9 border placeholder-slate-400 bg-white/10 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 sm:text-sm transition"
                                    placeholder="Sua senha de login" />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center p-3 rounded-md bg-red-500/30 text-white border border-red-500/40">
                                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <button type="submit" disabled={isLoading || confirmText !== 'APAGAR TUDO PERMANENTEMENTE'}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar e Apagar Tudo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPage;
