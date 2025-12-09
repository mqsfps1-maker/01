import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Plus, Trash2, Tag, GripVertical, Search } from 'lucide-react';
import { StockItem } from '../types';

interface ProductEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    productToEdit: StockItem | null;
    onSave: (itemData: StockItem) => Promise<StockItem | null>;
    unlinkedSkus: string[];
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({ isOpen, onClose, productToEdit, onSave, unlinkedSkus }) => {
    const [name, setName] = useState('');
    const [stock, setStock] = useState<number | string>(0);
    const [linkedSkus, setLinkedSkus] = useState<{ sku: string; multiplier: number }[]>([]);
    const [composition, setComposition] = useState<'simple' | 'kit'>('simple');
    
    const [newSku, setNewSku] = useState('');
    const [newMultiplier, setNewMultiplier] = useState(1);
    
    const [selectedUnlinked, setSelectedUnlinked] = useState<Set<string>>(new Set());
    const [unlinkedSearch, setUnlinkedSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setName(productToEdit.name);
                setStock(productToEdit.current_qty);
                setLinkedSkus(productToEdit.linkedSkus || []);
                setComposition(productToEdit.composition || (productToEdit.linkedSkus.length > 1 ? 'kit' : 'simple'));
            } else {
                setName('');
                setStock(0);
                setLinkedSkus([]);
                setComposition('simple');
            }
            setNewSku('');
            setNewMultiplier(1);
            setSelectedUnlinked(new Set());
            setUnlinkedSearch('');
        }
    }, [isOpen, productToEdit]);

    if (!isOpen) return null;
    
    const handleAddManualSku = () => {
        const skuToAdd = newSku.trim();
        if (skuToAdd && !linkedSkus.some(l => l.sku === skuToAdd)) {
            setLinkedSkus(prev => [...prev, { sku: skuToAdd, multiplier: newMultiplier }]);
            setNewSku('');
            setNewMultiplier(1);
        }
    };
    
    const handleAddSelectedUnlinked = () => {
        const skusToAdd = Array.from(selectedUnlinked);
        const newLinks = skusToAdd.map(sku => ({ sku, multiplier: 1 }));
        setLinkedSkus(prev => [...prev, ...newLinks]);
        setSelectedUnlinked(new Set());
    }
    
    const handleRemoveSku = (skuToRemove: string) => {
        setLinkedSkus(prev => prev.filter(l => l.sku !== skuToRemove));
    };
    
    const handleUpdateMultiplier = (skuToUpdate: string, multiplier: number) => {
        setLinkedSkus(prev => prev.map(l => l.sku === skuToUpdate ? { ...l, multiplier } : l));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            alert('O nome do produto é obrigatório.');
            return;
        }

        const itemData: StockItem = {
            id: productToEdit?.id || '',
            code: productToEdit?.code || name.trim().toUpperCase().replace(/\s+/g, '_'),
            name: name.trim(),
            current_qty: Number(stock),
            kind: 'PRODUTO',
            unit: 'un',
            min_qty: 0,
            composition: composition,
            linkedSkus: linkedSkus,
        };
        
        const savedItem = await onSave(itemData);
        if (savedItem) {
            onClose();
        }
    };
    
    const availableUnlinkedSkus = useMemo(() => {
        const currentlyLinked = new Set(linkedSkus.map(l => l.sku));
        const search = unlinkedSearch.toLowerCase();
        return unlinkedSkus.filter(sku => 
            !currentlyLinked.has(sku) && 
            (!search || sku.toLowerCase().includes(search))
        );
    }, [unlinkedSkus, linkedSkus, unlinkedSearch]);

    const handleToggleUnlinkedSelection = (sku: string) => {
        setSelectedUnlinked(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sku)) {
                newSet.delete(sku);
            } else {
                newSet.add(sku);
            }
            return newSet;
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--modal-bg)] rounded-lg shadow-2xl p-6 w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[var(--modal-text-primary)]">
                        {productToEdit ? 'Editar Produto' : 'Criar Novo Produto'}
                    </h2>
                    <button onClick={onClose} className="text-[var(--modal-text-secondary)] hover:text-[var(--modal-text-primary)]"><X size={24} /></button>
                </div>
                <p className="text-sm text-[var(--modal-text-secondary)] mb-6">Cadastre um produto e vincule os SKUs que o compõem. Isso permite que o sistema identifique o conteúdo de cada etiqueta.</p>

                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium text-[var(--modal-text-secondary)]">Nome do Produto</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Kit Caneca + Camiseta" className="mt-1 w-full p-2 border border-[var(--modal-border)] bg-[var(--modal-surface-secondary)] rounded-md"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[var(--modal-text-secondary)]">Estoque</label>
                            <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Ex: 50" className="mt-1 w-full p-2 border border-[var(--modal-border)] bg-[var(--modal-surface-secondary)] rounded-md"/>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-[var(--modal-text-secondary)]">Tipo de Composição</label>
                        <div className="flex gap-4 mt-1">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="compositionType" value="simple" checked={composition === 'simple'} onChange={() => setComposition('simple')} />
                                <span>Produto Simples</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="compositionType" value="kit" checked={composition === 'kit'} onChange={() => setComposition('kit')} />
                                <span>Kit (Produto Combinado)</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SKUs already linked to this product */}
                        <div>
                            <h3 className="text-md font-semibold text-[var(--modal-text-primary)] mb-2">SKUs Vinculados ({linkedSkus.length})</h3>
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-2 border rounded-md p-2 bg-[var(--color-bg)]">
                                {linkedSkus.length > 0 ? linkedSkus.map(({ sku, multiplier }) => (
                                    <div key={sku} className="flex items-center gap-3 p-2 border border-[var(--modal-border)] rounded-md bg-[var(--modal-surface)]">
                                        <GripVertical size={16} className="text-[var(--modal-text-secondary)] cursor-grab flex-shrink-0" />
                                        <span className="flex-grow font-mono text-sm text-[var(--modal-text-primary)] truncate" title={sku}>{sku}</span>
                                        <label className="text-sm text-[var(--modal-text-secondary)]">mult:</label>
                                        <input type="number" value={multiplier} onChange={e => handleUpdateMultiplier(sku, Number(e.target.value))} min="1" className="w-16 p-1 border border-[var(--modal-border)] bg-[var(--modal-surface-secondary)] rounded-md text-center"/>
                                        <button onClick={() => handleRemoveSku(sku)} className="p-1 text-red-500 hover:bg-red-900/50 rounded-full"><X size={16}/></button>
                                    </div>
                                )) : <p className="text-sm text-center text-[var(--modal-text-secondary)] p-4">Nenhum SKU vinculado.</p>}
                            </div>
                        </div>

                        {/* Unlinked SKUs available to be added */}
                        <div>
                            <h3 className="text-md font-semibold text-[var(--modal-text-primary)] mb-2">Vincular SKUs da Importação</h3>
                             <div className="relative mb-2">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--modal-text-secondary)]"/>
                                <input type="text" value={unlinkedSearch} onChange={e => setUnlinkedSearch(e.target.value)} placeholder="Buscar SKU não vinculado..." className="w-full pl-8 p-2 border border-[var(--modal-border)] bg-[var(--modal-surface-secondary)] rounded-md text-sm"/>
                             </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border rounded-md p-2 bg-[var(--color-bg)]">
                                {availableUnlinkedSkus.length > 0 ? availableUnlinkedSkus.map(sku => (
                                    <label key={sku} className="flex items-center gap-3 p-2 border border-[var(--modal-border)] rounded-md bg-[var(--modal-surface)] cursor-pointer hover:bg-[var(--modal-surface-secondary)]">
                                        <input type="checkbox" checked={selectedUnlinked.has(sku)} onChange={() => handleToggleUnlinkedSelection(sku)} className="h-4 w-4 rounded text-blue-500"/>
                                        <span className="font-mono text-sm text-[var(--modal-text-primary)]">{sku}</span>
                                    </label>
                                )) : <p className="text-sm text-center text-[var(--modal-text-secondary)] p-4">Nenhum SKU não vinculado encontrado.</p>}
                            </div>
                             {selectedUnlinked.size > 0 && (
                                <button onClick={handleAddSelectedUnlinked} className="w-full mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 text-sm">
                                    Adicionar {selectedUnlinked.size} SKU(s) selecionado(s)
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold rounded-md hover:bg-[var(--color-primary-hover)]">
                        <Save size={16} /> Salvar Produto
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductEditModal;