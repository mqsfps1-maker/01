
// pages/SetPasswordPage.tsx
import React, { useState } from 'react';
import { KeyRound, Loader2, AlertTriangle, Save, ShieldCheck } from 'lucide-react';
import { dbClient } from '../lib/supabaseClient';
import { User } from '../types';

interface SetPasswordPageProps {
    user: User;
    onComplete: () => void;
    onInviteComplete: () => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SetPasswordPage: React.FC<SetPasswordPageProps> = ({ user, onComplete, onInviteComplete, addToast }) => {
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

        // 1. Update auth user password
        const { error: updateError } = await dbClient.auth.updateUser({ password });

        if (updateError) {
            setError(`Erro ao definir a senha: ${updateError.message}`);
            setIsLoading(false);
            return;
        }
        
        // 2. Update public user profile flag
        const { error: profileError } = await dbClient
            .from('users')
            .update({ has_set_password: true })
            .eq('id', user.id);
            
        if (profileError) {
             addToast('Senha definida, mas falha ao atualizar o perfil. Tente fazer o login.', 'error');
        } else {
             addToast('Senha definida com sucesso!', 'success');
        }

        setIsLoading(false);
        
        // 3. Decide which flow to follow
        // Ensure we sign out the current session after setting the password
        // This prevents the newly created user from inheriting the inviter's session.
        try {
            await dbClient.auth.signOut();
        } catch (signOutErr) {
            console.error('Erro ao deslogar após definir senha:', signOutErr);
        }

        // Aguarda logout completar e redireciona
        setTimeout(() => {
            if (user.organization_id) {
                onInviteComplete();
            } else {
                onComplete();
            }
        }, 200);
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
                        <ShieldCheck size={48} className="mx-auto text-blue-400 mb-4" />
                        <h1 className="text-3xl font-bold text-white">
                            Passo Final de Segurança
                        </h1>
                        <p className="mt-2 text-sm text-slate-300">
                            Olá, {user.name.split(' ')[0]}! Sua conta foi confirmada. Agora, por favor, defina uma senha para acessá-la.
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
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save size={16} className="mr-2"/> Definir Senha e Acessar</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SetPasswordPage;