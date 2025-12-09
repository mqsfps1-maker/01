// components/ConfigureLowStockModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { StockItem } from '../types';

interface ConfigureLowStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockItems: StockItem[];
    onSave: (updates: { id: string, min_qty: number }[]) => void;
}

const ConfigureLowStockModal: React.FC<ConfigureLowStockModalProps> = ({ isOpen, onClose, stockItems, onSave }) => {
    const [minQtys, setMinQtys] = useState<Record<string, number>>({});

    const itemsWithoutMinStock = useMemo(() => {
        return stockItems.filter(item => item.kind === 'PRODUTO' && (!item.min_qty || item.min_qty <= 0));
    }, [stockItems]);

    useEffect(() => {
        if (!isOpen) {
            setMinQtys({});
        }
    }, [isOpen]);

    const handleQtyChange = (itemId: string, value: string) => {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setMinQtys(prev => ({ ...prev, [itemId]: numValue }));
        }
    };

    const handleSave = () => {
        const updates = Object.entries(minQtys).map(([id, min_qty]) => ({ id, min_qty }));
        if (updates.length > 0) {
            onSave(updates);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <AlertCircle className="mr-2 text-blue-600" />
                        Configurar Estoque Mínimo
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    Os produtos finais abaixo não têm um estoque mínimo definido. Configure-os para receber alertas quando o estoque estiver baixo.
                </p>

                <div className="flex-grow overflow-y-auto pr-2 border-t border-b py-2">
                    <div className="space-y-2">
                        {itemsWithoutMinStock.length > 0 ? itemsWithoutMinStock.map(item => (
                            <div key={item.id} className="p-2 bg-gray-50 rounded-lg border flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">Estoque Atual: {item.current_qty.toFixed(2)} {item.unit}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor={`min-qty-${item.id}`} className="text-sm">Mínimo:</label>
                                    <input
                                        id={`min-qty-${item.id}`}
                                        type="number"
                                        value={minQtys[item.id] || ''}
                                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                        className="w-24 p-1 border rounded-md"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 py-8">Todos os produtos finais já possuem um estoque mínimo configurado.</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        <Save size={16} /> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigureLowStockModal;