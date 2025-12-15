import React, { useState } from 'react';
import { Loader2, AlertTriangle, Tags, Mail, ArrowLeft } from 'lucide-react';
import { dbClient } from '../lib/supabaseClient';

interface LoginPageProps {
    onNavigateToRegister: () => void;
    onNavigateToForgotPassword: () => void;
    onNavigateToLanding: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onNavigateToForgotPassword, onNavigateToLanding }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error: signInError } = await dbClient.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError('Email ou senha inválidos. Verifique suas credenciais.');
        } 
        // On success, the onAuthStateChange listener in App.tsx will handle the navigation.

        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        await dbClient.auth.signInWithOAuth({ provider: 'google' });
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-['Inter']">
             <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-069242114a7c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
            ></div>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-md">
                 <button onClick={onNavigateToLanding} className="absolute top-4 left-4 text-white/70 hover:text-white transition-colors flex items-center gap-1 text-sm">
                    <ArrowLeft size={16} />
                    Voltar
                </button>
                 <a href="#" className="flex justify-center items-center space-x-3 mb-8">
                  <Tags className="h-10 w-10 text-blue-500" />
                  <span className="font-bold text-3xl text-white">TagsFlow</span>
                </a>
                <div className="w-full p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white">
                            Bem-vindo de volta!
                        </h1>
                        <p className="mt-2 text-sm text-slate-300">
                            Acesse sua conta para continuar.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/20 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition">
                             <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="h-5 w-5"/>
                             Entrar com Google
                        </button>

                        <div className="relative flex items-center">
                            <div className="flex-grow border-t border-white/20"></div>
                            <span className="flex-shrink mx-4 text-xs text-slate-300">OU</span>
                            <div className="flex-grow border-t border-white/20"></div>
                        </div>
                    </div>
                    
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border placeholder-slate-400 text-white bg-white/10 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition"
                                placeholder="seu@email.com" />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Senha</label>
                            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border placeholder-slate-400 text-white bg-white/10 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition"
                                placeholder="Senha" />
                        </div>
                        
                        <div className="text-right">
                            <button type="button" onClick={onNavigateToForgotPassword} className="text-xs font-medium text-blue-400 hover:underline">
                                Esqueci minha senha
                            </button>
                        </div>

                        {error && (
                            <div className="flex items-center p-3 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <button type="submit" disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition duration-300 ease-in-out transform hover:scale-105">
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar com Email'}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-slate-300">
                        Não tem uma conta?
                        <button onClick={onNavigateToRegister} className="font-medium text-blue-400 hover:underline ml-1">
                            Cadastre-se
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;