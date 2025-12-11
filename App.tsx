
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
            <div className="flex flex-col items-center gap-6 p-6 rounded-lg">
                <Loader2 size={48} className="animate-spin text-[var(--color-primary)]" />
                <p className="font-semibold text-[var(--color-text-primary)]">{message}</p>
                <button 
                    onClick={onCancel}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors mt-4 bg-white px-4 py-2 rounded border border-gray-200 shadow-sm"
                >
                    <XCircle size={16} />
                    Cancelar / Sair
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
    if (isLoading) return <div className="flex h-screen justify-center items-center"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const PublicRoute = ({ user, isLoading, children }: { user: User | null, isLoading: boolean, children?: React.ReactNode }) => {
    if (isLoading) return <div className="flex h-screen justify-center items-center"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>;
    if (user) return <Navigate to="/app/dashboard" replace />;
    return <>{children}</>;
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorState, setErrorState] = useState<{ isError: boolean; message: string }>({ isError: false, message: '' });
    const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info'; }[]>([]);
    const [showSuccessSubscriptionModal, setShowSuccessSubscriptionModal] = useState(false);
    
    const currentUserIdRef = useRef<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

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
        const { data, error } = await dbClient.from('users').select('*').eq('id', userId).single();
        if (data) return data as User;
        
        if (error) {
             console.warn("Profile fetch failed:", error.message);
        }
        return null;
    };

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                const { data: { session } } = await dbClient.auth.getSession();
                
                if (session?.user) {
                    if (currentUserIdRef.current === session.user.id && user) {
                         if (mounted) setIsLoading(false);
                         return;
                    }

                    const profile = await fetchUserProfile(session.user.id);
                    if (mounted) {
                        if (profile) {
                            setUser(profile);
                            currentUserIdRef.current = profile.id;
                        } else {
                             console.error("User authenticated but profile not found.");
                        }
                    }
                }
            } catch (err: any) {
                console.error("Session check error:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = dbClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                currentUserIdRef.current = null;
                setIsLoading(false);
            } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                if (currentUserIdRef.current === session.user.id) {
                     return; 
                }
                
                if (currentUserIdRef.current !== session.user.id) {
                    setIsLoading(true);
                    const profile = await fetchUserProfile(session.user.id);
                    if (profile) {
                        setUser(profile);
                        currentUserIdRef.current = profile.id;
                        setErrorState({ isError: false, message: '' });
                    }
                    setIsLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

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

    if (isLoading) {
        return <AppLoader message="Conectando..." onCancel={handleEmergencySignOut} />;
    }

    return (
        <>
            <Routes>
                <Route path="/" element={user ? <Navigate to="/app/dashboard" /> : <LandingPage onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />} />
                
                <Route path="/login" element={<PublicRoute user={user} isLoading={isLoading}><LoginPage onNavigateToRegister={() => navigate('/register')} onNavigateToForgotPassword={() => navigate('/forgot-password')} onNavigateToLanding={() => navigate('/')} /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute user={user} isLoading={isLoading}><RegisterPage onNavigateToLogin={() => navigate('/login')} addToast={addToast} onNavigateToLanding={() => navigate('/')} /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute user={user} isLoading={isLoading}><ForgotPasswordPage onNavigateToLogin={() => navigate('/login')} addToast={addToast} /></PublicRoute>} />
                <Route path="/email-confirmed" element={<EmailConfirmedPage onProceed={() => navigate('/set-password')} />} />
                <Route path="/invite-accepted" element={<InviteAcceptedPage onProceed={() => navigate('/login')} />} />

                <Route path="/onboarding" element={
                    <ProtectedRoute user={user} isLoading={isLoading}>
                        {/* Invited users (with organization_id) skip onboarding and go to set-password */}
                        {user && user.organization_id ? <Navigate to="/set-password" /> : 
                        <OnboardingPage user={user!} onComplete={() => { window.location.reload(); }} addToast={addToast} />
                        }
                    </ProtectedRoute>
                } />
                
                <Route path="/set-password" element={
                    <ProtectedRoute user={user} isLoading={isLoading}>
                        <SetPasswordPage user={user!} onComplete={() => { window.location.reload(); }} onInviteComplete={() => navigate('/invite-accepted')} addToast={addToast} />
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
                        {user && !user.organization_id ? <Navigate to="/onboarding" /> :
                         user && user.has_set_password === false ? <Navigate to="/set-password" /> :
                         <AppCore user={user!} setUser={setUser} addToast={addToast} />
                        }
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
