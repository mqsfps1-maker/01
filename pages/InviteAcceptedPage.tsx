
// pages/InviteAcceptedPage.tsx
import React from 'react';
import { PartyPopper, LogIn } from 'lucide-react';

interface InviteAcceptedPageProps {
    onProceed: () => void;
}

const InviteAcceptedPage: React.FC<InviteAcceptedPageProps> = ({ onProceed }) => {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-['Inter']">
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-069242114a7c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
            ></div>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 text-center">
                <PartyPopper size={48} className="mx-auto text-amber-400" />
                <h1 className="text-3xl font-bold text-white">Bem-vindo à equipe!</h1>
                <p className="text-slate-300">
                    Seu cadastro foi concluído com sucesso. Agora você já pode acessar a plataforma.
                </p>
                <button 
                    onClick={onProceed} 
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                    Entrar no Aplicativo <LogIn size={16} />
                </button>
            </div>
        </div>
    );
};

export default InviteAcceptedPage;