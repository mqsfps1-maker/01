
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { dbClient } from './lib/supabaseClient';
import { User } from './types';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import AppCore from './AppCore';
import { Loader2, AlertTriangle, LogOut, RefreshCw, XCircle } from 'lucide-react';
import ToastContainer from './components/ToastContainer';
import ResetPage from './pages/ResetPage';
import SetPasswordPage from './pages/SetPasswordPage';
import EmailConfirmedPage from './pages/EmailConfirmedPage';
import InviteAcceptedPage from './pages/InviteAcceptedPage';
import SuccessSubscriptionModal from './components/SuccessSubscriptionModal';

// --- Componentes Auxiliares ---

interface AppLoaderProps {
    message: string;
    onCancel: () => void;
}

const AppLoader: React.FC<AppLoaderProps> = ({ message, onCancel }) => {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)]">
            <div className="flex flex-col items-center gap-4 p-6 rounded-lg">
                <div className="flex items-center gap-2">
                    <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
                    <p className="font-semibold text-[var(--color-text-primary)]">{message}</p>
                </div>
                <button 
                    onClick={onCancel}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 transition-colors mt-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm"
                >
                    <XCircle size={14} />
                    Cancelar
                </button>
            </div>
        </div>
    );
};

interface ProfileErrorScreenProps {
    message: string;
    onRetry: () => void;
    onSignOut: () => void;
}

const ProfileErrorScreen: React.FC<ProfileErrorScreenProps> = ({ message, onRetry, onSignOut }) => (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
            <div className="bg-red-100 p-4 rounded-full inline-flex items-center justify-center mb-6">
                <AlertTriangle size={48} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Problema de Conexão</h2>
            <p className="text-gray-600 mb-6">
                {message || "Não conseguimos carregar seu perfil."}
            </p>
            <div className="flex flex-col gap-3">
                <button 
                    type="button"
                    onClick={onRetry}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:transform active:scale-95"
                >
                    <RefreshCw size={18} /> Tentar Novamente
                </button>
                <button 
                    type="button"
                    onClick={onSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-sm active:transform active:scale-95"
                >
                    <LogOut size={18} /> Sair e Limpar Dados
                </button>
            </div>
        </div>
    </div>
);

const ProtectedRoute = ({ user, isLoading, children }: { user: User | null, isLoading: boolean, children?: React.ReactNode }) => {
    if (isLoading) return <Navigate to="/login" replace />;
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const PublicRoute = ({ user, isLoading, children }: { user: User | null, isLoading: boolean, children?: React.ReactNode }) => {
    if (isLoading) return null;
    if (user) return <Navigate to="/app/dashboard" replace />;
    return <>{children}</>;
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorState, setErrorState] = useState<{ isError: boolean; message: string }>({ isError: false, message: '' });
    const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info'; }[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const currentUserIdRef = useRef<string | null>(null);
    const [showSuccessSubscriptionModal, setShowSuccessSubscriptionModal] = useState(false);

    // Função para limpar dados quando fazer logout
    const clearAllData = () => {
        setUser(null);
        currentUserIdRef.current = null;
        sessionStorage.clear();
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('sb-user-cache');
    };

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const handleEmergencySignOut = useCallback(() => {
        localStorage.clear();
        sessionStorage.clear();
        dbClient.auth.signOut().catch(console.error);
        window.location.href = '/';
    }, []);

    const fetchUserProfile = async (userId: string): Promise<User | null> => {
        try {
            const { data, error } = await dbClient.from('users').select('*').eq('id', userId).single();
            
            if (data) {
                return data as User;
            }
            
            if (error) {
                // Se for erro PGRST116 (não encontrado) ou 403 (RLS)
                if (error.code === 'PGRST116' || error.code === 'PGRST0' || error.message.includes('permission denied') || error.message.includes('No rows found')) {
                    const { data: authUser } = await dbClient.auth.getUser();
                    if (authUser?.user) {
                        const newProfile: User = {
                            id: userId,
                            name: authUser.user.email?.split('@')[0] || 'Usuário',
                            email: authUser.user.email || '',
                            phone: '',
                            role: 'CLIENTE_GERENTE',
                            organization_id: null,
                            cpf_cnpj: '',
                            auth_provider: authUser.user.user_metadata?.provider || 'email',
                            ui_settings: null,
                            setor: [],
                            prefix: '',
                            attendance: null,
                            avatar: '',
                            has_set_password: false,
                            created_at: new Date().toISOString(),
                        };
                        
                        return newProfile;
                    }
                }
            }
            
            return null;
        } catch (err: any) {
            return null;
        }
    };
    
    const createUserProfile = async (userId: string): Promise<void> => {
        try {
            const { data: authUser } = await dbClient.auth.getUser();
            
            if (!authUser?.user) {
                return;
            }
            
            const profileData = {
                id: userId,
                name: authUser.user.email?.split('@')[0] || 'Usuário',
                email: authUser.user.email || '',
                phone: '',
                role: 'CLIENTE_GERENTE',
                organization_id: null,
                cpf_cnpj: '',
                auth_provider: authUser.user.user_metadata?.provider || 'supabase',
                ui_settings: null,
                setor: [],
                prefix: '',
                attendance: null,
                avatar: '',
                has_set_password: false,
            };
            
            const { error } = await dbClient.from('users').upsert(profileData, {
                onConflict: 'id'
            });
            // Continuar independentemente se salvou ou não
        } catch (err: any) {
            // Continuar mesmo se houver erro
        }
    };

    const createAutoOrganization = async (userId: string): Promise<string | null> => {
        // Não cria mais automaticamente
        return null;
    };

    useEffect(() => {
        let mounted = true;
        let redirectTimeout: NodeJS.Timeout;

        const { data: { subscription } } = dbClient.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            
            if (event === 'SIGNED_OUT') {
                clearAllData();
                setIsLoading(false);
                // Redirecionar para landing após logout
                if (mounted) {
                    navigate('/', { replace: true });
                }
            } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
                // Apenas para TOKEN_REFRESHED e INITIAL_SESSION, não setIsLoading(true)
                // Isso evita telas de carregamento inúteis
                if (event !== 'TOKEN_REFRESHED') {
                    setIsLoading(true);
                }
                
                try {
                    const profile = await fetchUserProfile(session.user.id);
                    if (mounted) {
                        if (profile) {
                            // Se usuário não tem organização, NÃO criar automaticamente
                            // Deixar que o dashboard mostre o modal
                            
                            setUser(profile);
                            currentUserIdRef.current = profile.id;
                            setErrorState({ isError: false, message: '' });
                            
                            // Redirecionar automaticamente após login bem-sucedido
                            if (event === 'SIGNED_IN') {
                                if (redirectTimeout) clearTimeout(redirectTimeout);
                                // Sempre vai para dashboard (que vai mostrar modal se sem org)
                                navigate('/app/dashboard', { replace: true });
                            }
                        } else {
                            // Perfil temporário
                            const tempProfile = {
                                id: session.user.id,
                                name: session.user.email?.split('@')[0] || 'Usuário',
                                email: session.user.email || '',
                                phone: '',
                                role: 'CLIENTE_GERENTE',
                                organization_id: null,
                                cpf_cnpj: '',
                                auth_provider: 'email',
                                ui_settings: null,
                                setor: [],
                                prefix: '',
                                attendance: null,
                                avatar: '',
                                has_set_password: false,
                                created_at: new Date().toISOString(),
                            } as User;
                            
                            setUser(tempProfile);
                            currentUserIdRef.current = tempProfile.id;
                            
                            // Redirecionar para dashboard (que mostrará modal de criar org)
                            if (event === 'SIGNED_IN') {
                                navigate('/app/dashboard', { replace: true });
                            }
                        }
                        // Criar perfil em background (não bloqueia)
                        await createUserProfile(session.user.id);
                    }
                } catch (err: any) {
                    if (mounted) {
                        setUser(null);
                        currentUserIdRef.current = null;
                    }
                } finally {
                    if (mounted && event !== 'TOKEN_REFRESHED') {
                        setIsLoading(false);
                    }
                }
            } else {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            if (redirectTimeout) clearTimeout(redirectTimeout);
            subscription?.unsubscribe();
        };
    }, [navigate]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('session_id')) {
            setShowSuccessSubscriptionModal(true);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    if (errorState.isError) {
        return <ProfileErrorScreen message={errorState.message} onRetry={() => window.location.reload()} onSignOut={handleEmergencySignOut} />;
    }

    return (
        <>
            <Routes>
                {/* Apenas usuários autenticados COM organization_id vão para dashboard */}
                <Route path="/" element={
                    (user && user.organization_id) ? <Navigate to="/app/dashboard" /> : <LandingPage onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />
                } />
                
                <Route path="/login" element={<PublicRoute user={user} isLoading={isLoading}><LoginPage onNavigateToRegister={() => navigate('/register')} onNavigateToForgotPassword={() => navigate('/forgot-password')} onNavigateToLanding={() => navigate('/')} /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute user={user} isLoading={isLoading}><RegisterPage onNavigateToLogin={() => navigate('/login')} addToast={addToast} onNavigateToLanding={() => navigate('/')} /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute user={user} isLoading={isLoading}><ForgotPasswordPage onNavigateToLogin={() => navigate('/login')} addToast={addToast} /></PublicRoute>} />
                <Route path="/email-confirmed" element={<EmailConfirmedPage onProceed={() => navigate('/set-password')} />} />
                <Route path="/invite-accepted" element={<InviteAcceptedPage onProceed={() => navigate('/login')} />} />

                <Route path="/onboarding" element={
                    <ProtectedRoute user={user} isLoading={isLoading}>
                        {/* /onboarding não é mais usado - tudo redireciona para dashboard */}
                        <Navigate to="/app/dashboard" replace />
                    </ProtectedRoute>
                } />
                
                <Route path="/set-password" element={
                    <ProtectedRoute user={user} isLoading={isLoading}>
                        <SetPasswordPage user={user!} onComplete={() => { navigate('/app/dashboard'); }} onInviteComplete={() => navigate('/invite-accepted')} addToast={addToast} />
                    </ProtectedRoute>
                } />
                
                 <Route path="/reset" element={
                    <ProtectedRoute user={user} isLoading={isLoading}>
                        <ResetPage onNavigateToSettings={() => navigate('/app/configuracoes')} addToast={addToast} />
                    </ProtectedRoute>
                } />

                <Route path="/update-password" element={<UpdatePasswordPage onPasswordUpdated={() => { addToast('Senha atualizada!', 'success'); navigate('/login'); }} />} />

                <Route path="/app/*" element={
                    <ProtectedRoute user={user} isLoading={isLoading}>
                        {user ? (
                            // User autenticado → mostra dashboard
                            // O dashboard vai pedir para criar organização se não tiver
                            <AppCore user={user} setUser={setUser} addToast={addToast} />
                        ) : (
                            <Navigate to="/login" replace />
                        )}
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <SuccessSubscriptionModal 
                isOpen={showSuccessSubscriptionModal} 
                onClose={() => setShowSuccessSubscriptionModal(false)} 
            />
        </>
    );
};

export default App;
