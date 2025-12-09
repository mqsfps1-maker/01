

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Search, Edit } from 'lucide-react';
import { StockItem, ProdutoCombinado } from '../types';

interface BomConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: StockItem;
    insumos: StockItem[]; // List of all available raw materials
    currentBom: ProdutoCombinado | undefined;
    onSave: (productSku: string, items: ProdutoCombinado['items']) => void;
}

const BomConfigModal: React.FC<BomConfigModalProps> = ({ isOpen, onClose, product, insumos, currentBom, onSave }) => {
    const [editedItems, setEditedItems] = useState<ProdutoCombinado['items']>([]);
    
    // State for multi-adding items
    const [addSearch, setAddSearch] = useState('');
    const [itemsToAdd, setItemsToAdd] = useState<Set<string>>(new Set());
    
    // State for editing a substitute
    const [editingSubstitute, setEditingSubstitute] = useState<{ itemCode: string, search: string } | null>(null);
    

    useEffect(() => {
        setEditedItems(currentBom?.items || []);
        setAddSearch('');
        setItemsToAdd(new Set());
        setEditingSubstitute(null);
    }, [currentBom, isOpen]);

    const handleAddItem = (itemToAdd: ProdutoCombinado['items'][0]) => {
        setEditedItems(prev => [...prev, itemToAdd]);
    };

    const handleAddSelectedItems = () => {
        const newItems = Array.from(itemsToAdd).map(code => {
            const insumo = insumos.find(i => i.code === code);
            const isProcessado = insumo?.kind === 'PROCESSADO';
            return { stockItemCode: code, qty_per_pack: 1, fromWeighing: isProcessado };
        });
        setEditedItems(prev => [...prev, ...newItems]);
        setItemsToAdd(new Set());
        setAddSearch('');
    };

    const handleRemoveItem = (stockItemCode: string) => {
        setEditedItems(prev => prev.filter(item => item.stockItemCode !== stockItemCode));
    };

    const handleQtyChange = (stockItemCode: string, newQty: number) => {
        if (newQty < 0) return;
        setEditedItems(prev => prev.map(item =>
            item.stockItemCode === stockItemCode ? { ...item, qty_per_pack: newQty } : item
        ));
    };
    
    const handleSubstituteChange = (originalCode: string, substituteCode: string | undefined) => {
        setEditedItems(prev => prev.map(item =>
            item.stockItemCode === originalCode ? { ...item, substituteCode } : item
        ));
        setEditingSubstitute(null);
    };

    const handleSetPrimary = (stockItemCode: string) => {
        setEditedItems(prev => prev.map(item => ({
            ...item,
            fromWeighing: item.stockItemCode === stockItemCode
        })));
    };
    
    const handleSave = () => {
        if (product.composition === 'kit' && editedItems.length < 2) {
            alert('Um kit deve ser composto por pelo menos 2 produtos.');
            return;
        }
        onSave(product.code, editedItems);
    };
    
    const availableInsumosForAdding = useMemo(() => {
        const lowerSearch = addSearch.toLowerCase();
        return insumos.filter(insumo => 
            !editedItems.some(item => item.stockItemCode === insumo.code) &&
            (insumo.name.toLowerCase().includes(lowerSearch) || insumo.code.toLowerCase().includes(lowerSearch))
        );
    }, [insumos, editedItems, addSearch]);

    const handleToggleItemToAdd = (code: string) => {
        setItemsToAdd(prev => {
            const newSet = new Set(prev);
            if (newSet.has(code)) newSet.delete(code);
            else newSet.add(code);
            return newSet;
        });
    };

    if (!isOpen) return null;
    
    const isKit = product.composition === 'kit';
    const title = isKit ? 'Configurar Componentes do Kit' : 'Configurar Receita (BOM)';
    const componentsTitle = isKit ? 'Produtos no Kit' : 'Insumos na Receita';
    const addTitle = isKit ? 'Adicionar Produtos ao Kit' : 'Adicionar Insumos à Receita';
    const primaryLabel = isKit ? 'Produto Principal (define o estoque)' : 'Insumo Primário (consumir do estoque pesado)';


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--modal-bg)] text-[var(--modal-text-primary)] rounded-lg shadow-2xl p-6 w-full max-w-4xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 border-b pb-3 border-[var(--modal-border)]">
                    <div>
                        <h2 className="text-xl font-bold">{title}</h2>
                        <p className="text-sm text-[var(--modal-text-secondary)]">{product.name} ({product.code})</p>
                    </div>
                    <button onClick={onClose} className="text-[var(--modal-text-secondary)] hover:text-[var(--modal-text-primary)]"><X size={24} /></button>
                </div>
                
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2">
                    {/* Left Side: Current BOM Items */}
                    <div className="space-y-3">
                        <h3 className="text-md font-semibold">{componentsTitle}</h3>
                        {editedItems.length > 0 ? (
                            editedItems.map(item => {
                                const insumoDetails = insumos.find(i => i.code === item.stockItemCode);
                                const substituteDetails = item.substituteCode ? insumos.find(i => i.code === item.substituteCode) : null;
                                const isEditingThisSub = editingSubstitute?.itemCode === item.stockItemCode;
                                
                                const availableSubstitutes = isEditingThisSub ? insumos.filter(i => 
                                    i.code !== item.stockItemCode &&
                                    i.kind === insumoDetails?.kind &&
                                    (i.name.toLowerCase().includes(editingSubstitute.search.toLowerCase()) || i.code.toLowerCase().includes(editingSubstitute.search.toLowerCase()))
                                ) : [];

                                return (
                                <div key={item.stockItemCode} className="bg-[var(--modal-surface-secondary)] p-3 rounded-lg border border-[var(--modal-border)]">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0"><p className="font-medium truncate" title={insumoDetails?.name}>{insumoDetails?.name || item.stockItemCode}</p><p className="text-xs text-[var(--modal-text-secondary)]">{item.stockItemCode}</p></div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step={isKit ? "1" : "0.01"} value={item.qty_per_pack} onChange={(e) => handleQtyChange(item.stockItemCode, parseFloat(e.target.value))} className="w-24 text-right border-[var(--modal-border)] bg-[var(--modal-bg)] rounded-md"/>
                                            <span className="text-sm text-[var(--modal-text-secondary)] w-8">{insumoDetails?.unit}</span>
                                            <button onClick={() => handleRemoveItem(item.stockItemCode)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-[var(--modal-border)] space-y-2">
                                        {!isKit && (
                                            <label className="flex items-center text-xs text-[var(--modal-text-secondary)] cursor-pointer">
                                                <input type="radio" name={`primary-insumo-radio`} checked={!!item.fromWeighing} onChange={() => handleSetPrimary(item.stockItemCode)} className="h-4 w-4 text-blue-600"/>
                                                <span className="ml-2">{primaryLabel}</span>
                                            </label>
                                        )}
                                        <div className="relative">
                                            {isEditingThisSub ? (
                                                <div className="bg-[var(--modal-bg)] p-2 border border-[var(--modal-border)] rounded-md">
                                                    <input type="text" value={editingSubstitute.search} onChange={e => setEditingSubstitute(p => p ? {...p, search: e.target.value} : null)} placeholder="Buscar substituto..." autoFocus className="w-full p-1 border rounded mb-1 text-xs bg-[var(--modal-surface-secondary)] border-[var(--modal-border)]"/>
                                                    <div className="max-h-24 overflow-y-auto">
                                                        {availableSubstitutes.map(sub => <div key={sub.id} onClick={()=>handleSubstituteChange(item.stockItemCode, sub.code)} className="p-1 text-xs hover:bg-[var(--modal-surface-secondary)] cursor-pointer">{sub.name}</div>)}
                                                    </div>
                                                     <button onClick={()=>handleSubstituteChange(item.stockItemCode, undefined)} className="text-xs text-red-600 mt-1">Remover Substituto</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="text-[var(--modal-text-secondary)]">Substituto: <span className="font-semibold">{substituteDetails?.name || 'Nenhum'}</span></div>
                                                    <button onClick={()=>setEditingSubstitute({itemCode: item.stockItemCode, search: ''})} className="text-blue-600 hover:underline flex items-center gap-1"><Edit size={12}/> {substituteDetails ? 'Alterar' : 'Adicionar'}</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )})
                        ) : <p className="text-sm text-[var(--modal-text-secondary)] text-center py-4 bg-[var(--modal-surface-secondary)] rounded-lg">Nenhum componente adicionado.</p>}
                    </div>

                    {/* Right Side: Add new items */}
                    <div className="space-y-3">
                        <h3 className="text-md font-semibold">{addTitle}</h3>
                         <div className="relative">
                            <Search size={16} className="absolute left-3 top-2.5 text-[var(--modal-text-secondary)]" />
                            <input type="text" value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="Buscar por nome ou código..." className="w-full pl-9 pr-3 py-2 text-sm border-[var(--modal-border)] bg-[var(--modal-surface-secondary)] rounded-md"/>
                        </div>
                        <div className="border border-[var(--modal-border)] rounded-md max-h-[40vh] overflow-y-auto">
                             {availableInsumosForAdding.map(insumo => (
                                <label key={insumo.id} className="flex items-center p-2 border-b border-[var(--modal-border)] cursor-pointer hover:bg-[var(--modal-surface-secondary)]">
                                    <input type="checkbox" checked={itemsToAdd.has(insumo.code)} onChange={() => handleToggleItemToAdd(insumo.code)} className="h-4 w-4 text-blue-600 rounded mr-3"/>
                                    <div>
                                        <p className="font-semibold text-sm">{insumo.name}</p>
                                        <p className="text-xs text-[var(--modal-text-secondary)]">{insumo.code} | Estoque: {insumo.current_qty.toFixed(2)} {insumo.unit}</p>
                                    </div>
                                </label>
                             ))}
                        </div>
                        {itemsToAdd.size > 0 && (
                            <button onClick={handleAddSelectedItems} className="w-full px-3 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Plus size={16}/> Adicionar {itemsToAdd.size} Itens Selecionados
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 border-t border-[var(--modal-border)] pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-[var(--modal-surface-secondary)] text-[var(--modal-text-primary)] rounded-md hover:bg-[var(--modal-surface-tertiary)]">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default BomConfigModal;