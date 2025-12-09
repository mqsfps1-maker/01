import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Factory, ShieldCheck } from 'lucide-react';
import { StockItem } from '../types';

interface ManualMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: StockItem[];
    onConfirm: (itemCode: string, movementType: 'entrada' | 'saida', quantity: number, ref: string) => void;
    preselectedItem?: StockItem | null;
}

const ManualMovementModal: React.FC<ManualMovementModalProps> = ({ isOpen, onClose, items, onConfirm, preselectedItem }) => {
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('Correção');

    const selectedItem = items.find(i => i.code === selectedItemCode);
    const isProducible = selectedItem?.kind === 'PRODUTO' || selectedItem?.kind === 'PROCESSADO';
    const isAdjustment = !isProducible && (movementType === 'entrada' || movementType === 'saida');

    useEffect(() => {
        if (isOpen) {
            const initialItem = preselectedItem || items.find(i => i.kind === 'INSUMO') || items[0];
            if (initialItem) {
                setSelectedItemCode(initialItem.code);
                 if(initialItem.kind === 'PRODUTO' || initialItem.kind === 'PROCESSADO') {
                    setMovementType('saida');
                    setReason('Produção Manual');
                 } else {
                    setMovementType('entrada');
                    setReason('Correção');
                 }
            } else {
                setSelectedItemCode('');
            }
            setQuantity(1);
        }
    }, [isOpen, items, preselectedItem]);
    
    useEffect(() => {
        if(isProducible) {
            setMovementType('saida');
            setReason('Produção Manual');
        }
    }, [selectedItemCode, isProducible]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!isFormValid) return;
        const ref = isProducible && movementType === 'saida' ? `Produção Manual: ${reason}` : reason;
        onConfirm(selectedItemCode, movementType, quantity, ref);
    };
    
    const isFormValid = selectedItemCode && quantity > 0 && reason.trim() !== '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <PlusCircle className="mr-2 text-blue-600" />
                        Lançamento Manual
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="item-select" className="text-sm font-medium text-gray-700">Item</label>
                        <select
                            id="item-select"
                            value={selectedItemCode}
                            onChange={(e) => setSelectedItemCode(e.target.value)}
                            disabled={!!preselectedItem}
                            className="mt-1 block w-full border-[var(--color-border)] bg-[var(--color-surface)] rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled>Selecione um item...</option>
                            <optgroup label="Insumos">
                                {items.filter(i => i.kind === 'INSUMO').map(insumo => (
                                    <option key={insumo.id} value={insumo.code}>{insumo.name} ({insumo.code})</option>
                                ))}
                            </optgroup>
                            <optgroup label="Materiais Processados">
                                {items.filter(i => i.kind === 'PROCESSADO').map(p => (
                                    <option key={p.id} value={p.code}>{p.name} ({p.code})</option>
                                ))}
                            </optgroup>
                             <optgroup label="Produtos Finais">
                                {items.filter(i => i.kind === 'PRODUTO').map(produto => (
                                    <option key={produto.id} value={produto.code}>{produto.name} ({produto.code})</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={`text-sm font-medium ${isProducible ? 'text-gray-400' : 'text-gray-700'}`}>Tipo de Movimentação</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setMovementType('entrada')}
                                    disabled={isProducible}
                                    className={`px-4 py-2 border border-gray-300 text-sm font-medium rounded-l-md w-full ${movementType === 'entrada' ? 'bg-blue-600 text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'} disabled:bg-gray-200 disabled:cursor-not-allowed`}
                                >
                                    Entrada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMovementType('saida')}
                                    disabled={isProducible && selectedItem.kind === 'PRODUTO'}
                                    className={`-ml-px px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md w-full ${movementType === 'saida' ? (isProducible ? 'bg-orange-500 text-white' : 'bg-red-600 text-white') : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'} disabled:bg-gray-200 disabled:cursor-not-allowed`}
                                >
                                    {isProducible ? 'Produção' : 'Saída'}
                                </button>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label htmlFor="quantity-input" className="text-sm font-medium text-gray-700">
                                {isProducible ? 'Quantidade a Produzir' : 'Quantidade'} {selectedItem ? `(${selectedItem.unit})` : ''}
                            </label>
                            <input
                                id="quantity-input"
                                type="number"
                                min={isProducible ? "1" : "0.01"}
                                step={isProducible ? "1" : "0.01"}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="mt-1 block w-full border-[var(--color-border)] bg-[var(--color-surface)] rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="reason-select" className="text-sm font-medium text-gray-700">Motivo</label>
                        {isProducible ? (
                             <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Complemente o motivo se necessário"
                                className="mt-1 block w-full border-[var(--color-border)] bg-[var(--color-surface)] rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        ) : (
                             <select
                                id="reason-select"
                                name="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="mt-1 block w-full border-[var(--color-border)] bg-[var(--color-surface)] rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="Correção">Correção</option>
                                <option value="Lançamento Semanal">Lançamento Semanal</option>
                                <option value="Atualização de Estoque(manual)">Atualização de Estoque (manual)</option>
                            </select>
                        )}
                        
                    </div>
                    {isAdjustment && (
                        <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded-md border border-blue-200 mt-2 flex items-start">
                            <ShieldCheck size={24} className="mr-2 flex-shrink-0" />
                            <span>Esta ação será registrada como um <b>Ajuste Manual</b>. Apenas Administradores e Super Administradores podem realizar esta operação.</span>
                        </div>
                    )}
                     {isProducible && <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded-md border border-blue-200 mt-2 flex items-start"><Factory size={24} className="mr-2 flex-shrink-0" /><span>Isto irá acionar a <b>Bill of Materials (BOM)</b>, deduzindo todos os insumos necessários do estoque (incluindo o estoque pesado).</span></p>}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        type="button"
                        disabled={!isFormValid}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar Lançamento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualMovementModal;