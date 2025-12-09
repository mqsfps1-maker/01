// components/InfoListModal.tsx
import React from 'react';
import { X, List } from 'lucide-react';

interface InfoListModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: { key: string, primary: string, secondary?: string }[];
    title: string;
}

const InfoListModal: React.FC<InfoListModalProps> = ({ isOpen, onClose, items, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-[var(--color-surface)] rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col max-h-[90vh] transform transition-transform duration-300 scale-95 animate-scale-in">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <List size={20} /> {title}
                    </h2>
                    <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {items.length > 0 ? (
                        <ul className="space-y-2">
                            {items.map(item => (
                                <li key={item.key} className="p-2 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-md">
                                    <p className="font-semibold text-sm text-[var(--color-text-primary)]">{item.primary}</p>
                                    {item.secondary && <p className="text-xs text-[var(--color-text-secondary)]">{item.secondary}</p>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-sm text-[var(--color-text-secondary)] p-8">Nenhum item para exibir.</p>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold rounded-md">
                        Fechar
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default InfoListModal;