import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Rocket, CheckCircle } from 'lucide-react';

interface SuccessSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SuccessSubscriptionModal: React.FC<SuccessSubscriptionModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            // Dispara os fogos de artifício ao abrir
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative text-center p-8 transform transition-all scale-100">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
                
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Rocket size={40} className="text-green-600" />
                </div>

                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Parabéns! 🚀
                </h2>
                <h3 className="text-xl font-semibold text-green-600 mb-4">
                    Você investiu no seu negócio!
                </h3>
                
                <p className="text-gray-600 mb-8">
                    Sua assinatura foi confirmada. Agora você tem acesso a todas as ferramentas para escalar sua operação com eficiência e controle total.
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-center gap-3 text-left">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                    <div>
                        <p className="font-bold text-green-800">Plano Ativado</p>
                        <p className="text-sm text-green-700">Todos os recursos premium desbloqueados.</p>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 active:scale-95"
                >
                    Começar a Usar Agora
                </button>
            </div>
        </div>
    );
};

export default SuccessSubscriptionModal;