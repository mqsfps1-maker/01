import React, { useState } from 'react';
import { KeyRound, Loader2, AlertTriangle, Save } from 'lucide-react';
import { dbClient } from '../lib/supabaseClient';

interface UpdatePasswordPageProps {
    onPasswordUpdated: () => void;
}

const UpdatePasswordPage: React.FC<UpdatePasswordPageProps> = ({ onPasswordUpdated }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);

        const { error: updateError } = await dbClient.auth.updateUser({ password });

        if (updateError) {
            setError(`Erro ao atualizar a senha: ${updateError.message}`);
        } else {
            onPasswordUpdated();
        }

        setIsLoading(false);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-['Inter']">
             <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-069242114a7c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
            ></div>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="relative z-10 w-full max-w-md">
                <div className="w-full p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white">
                            Defina sua Nova Senha
                        </h1>
                        <p className="mt-2 text-sm text-slate-300">
                            Escolha uma senha forte e segura.
                        </p>
                    </div>
                    
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="password" className="sr-only">Nova Senha</label>
                            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border placeholder-slate-400 text-white bg-white/10 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition"
                                placeholder="Digite a nova senha" />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="sr-only">Confirmar Nova Senha</label>
                            <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border placeholder-slate-400 text-white bg-white/10 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition"
                                placeholder="Confirme a nova senha" />
                        </div>

                        {error && (
                            <div className="flex items-center p-3 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <button type="submit" disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70">
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save size={16} className="mr-2"/> Salvar Nova Senha</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdatePasswordPage;
