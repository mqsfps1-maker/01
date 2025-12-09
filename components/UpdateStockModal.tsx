// components/UpdateStockModal.tsx
import React, { useState, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { StockItem } from '../types';

interface UpdateStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: StockItem;
    onConfirm: (itemCode: string, quantityDelta: number, ref: string) => void;
}

const UpdateStockModal: React.FC<UpdateStockModalProps> = ({ isOpen, onClose, item, onConfirm }) => {
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('Compra Fornecedor');

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setReason('Compra Fornecedor');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!isNaN(quantity) && quantity > 0 && reason.trim()) {
            onConfirm(item.code, quantity, reason);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--modal-bg)] text-[var(--modal-text-primary)] rounded-lg shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center">
                        <PlusCircle className="mr-2 text-blue-600" />
                        Atualizar Estoque (Entrada)
                    </h2>
                    <button onClick={onClose} className="text-[var(--modal-text-secondary)] hover:text-[var(--modal-text-primary)]">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-[var(--modal-text-secondary)]">Item</label>
                        <p className="text-md font-semibold bg-[var(--modal-surface-secondary)] p-2 rounded">{item.name} ({item.code})</p>
                        <p className="text-xs text-[var(--modal-text-secondary)] mt-1">Saldo atual: {item.current_qty.toFixed(2)} {item.unit}</p>
                    </div>

                    <div>
                        <label htmlFor="quantity-input" className="text-sm font-medium">
                           Quantidade a Adicionar ({item.unit})
                        </label>
                        <input
                            id="quantity-input"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-[var(--modal-border)] bg-[var(--modal-surface-secondary)] focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        />
                    </div>
                     <div>
                        <label htmlFor="reason-input" className="text-sm font-medium">Motivo / Referência</label>
                        <input
                            id="reason-input"
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-[var(--modal-border)] bg-[var(--modal-surface-secondary)] focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            placeholder="Ex: Compra Fornecedor X, Inventário"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--modal-surface-secondary)] text-[var(--modal-text-primary)] rounded-md hover:bg-[var(--modal-surface-tertiary)] transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isNaN(quantity) || quantity <= 0 || !reason.trim()}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar Entrada
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateStockModal;