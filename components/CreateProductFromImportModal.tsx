// components/CreateProductFromImportModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
// FIX: Import 'Save' icon from lucide-react to fix 'Cannot find name' error.
import { X, PlusCircle, Search, Trash2, Save } from 'lucide-react';
import { StockItem, GeneralSettings } from '../types';

interface CreateProductFromImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    skuToCreateProductFor: { skus: string[]; colorSugerida: string } | null;
    allUnlinkedSkus: { sku: string; colorSugerida: string }[];
    onConfirm: (item: Omit<StockItem, 'id'>) => void;
    generalSettings: GeneralSettings;
    onManageCategories: () => void;
}

const CreateProductFromImportModal: React.FC<CreateProductFromImportModalProps> = ({
    isOpen,
    onClose,
    skuToCreateProductFor,
    allUnlinkedSkus,
    onConfirm,
    generalSettings,
    onManageCategories
}) => {
    const [name, setName] = useState('');
    const [stock, setStock] = useState<number | string>(0);
    const [linkedSkus, setLinkedSkus] = useState<string[]>([]);
    const [unlinkedSearch, setUnlinkedSearch] = useState('');
    
    const [composition, setComposition] = useState<'simple' | 'kit'>('simple');
    const [category, setCategory] = useState('');


    useEffect(() => {
        if (isOpen && skuToCreateProductFor) {
            const primarySku = skuToCreateProductFor.skus[0] || '';
            const suggestedName = primarySku
                .replace(/_/g, ' ')
                .replace(/-/g, ' ')
                .replace(/PPL/i, 'Papel de Parede Líquido')
                .replace(/\b\w/g, l => l.toUpperCase());

            setName(suggestedName);
            setStock(0);
            setLinkedSkus(skuToCreateProductFor.skus);
            setComposition(skuToCreateProductFor.skus.length > 1 ? 'kit' : 'simple');
            setCategory(generalSettings.productCategoryList.length > 0 ? generalSettings.productCategoryList[0] : '');
            setUnlinkedSearch('');
        }
    }, [isOpen, skuToCreateProductFor, generalSettings.productCategoryList]);

    const availableUnlinked = useMemo(() => {
        const search = unlinkedSearch.toLowerCase();
        return allUnlinkedSkus.filter(u => 
            !linkedSkus.includes(u.sku) && 
            (!search || u.sku.toLowerCase().includes(search))
        );
    }, [allUnlinkedSkus, linkedSkus, unlinkedSearch]);

    if (!isOpen || !skuToCreateProductFor) return null;
    
    const primarySku = skuToCreateProductFor.skus[0];

    const handleConfirm = () => {
        if (!name.trim() || !primarySku) return;

        const newItem: Omit<StockItem, 'id'> = {
            code: primarySku, // First SKU becomes the master code
            name: name.trim(),
            kind: 'PRODUTO',
            unit: 'un',
            current_qty: Number(stock),
            min_qty: 0,
            color: skuToCreateProductFor.colorSugerida,
            category: category,
            composition: composition,
            linkedSkus: linkedSkus.map(sku => ({ sku, multiplier: 1 })),
        };
        onConfirm(newItem);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Criar Novo Produto</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <p className="text-sm text-gray-500 mb-6">Cadastre um produto e vincule os SKUs que o compõem. Isso permite que o sistema identifique o conteúdo de cada etiqueta.</p>

                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Nome do Produto</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Kit Caneca + Camiseta" className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Estoque (Informativo)</label>
                            <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md"/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm font-medium text-gray-700">Tipo de Composição</label>
                            <div className="flex gap-4 mt-1">
                                <label className="flex items-center space-x-2"><input type="radio" name="compositionType" value="simple" checked={composition === 'simple'} onChange={() => setComposition('simple')} /> <span>Produto Simples</span></label>
                                <label className="flex items-center space-x-2"><input type="radio" name="compositionType" value="kit" checked={composition === 'kit'} onChange={() => setComposition('kit')} /> <span>Kit (Combinado)</span></label>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Categoria do Produto</label>
                            <div className="flex items-center gap-2 mt-1">
                                <select value={category} onChange={e => setCategory(e.target.value)} className="flex-grow p-2 border-gray-300 rounded-md"><option value="">Sem Categoria</option>{generalSettings.productCategoryList.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select>
                                <button type="button" onClick={onManageCategories} className="text-sm text-blue-600 hover:underline font-semibold">Gerenciar</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-md font-semibold text-gray-700 mb-2">SKUs Vinculados ({linkedSkus.length})</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50">
                                {linkedSkus.length > 0 ? linkedSkus.map(sku => (
                                    <div key={sku} className="flex items-center justify-between p-2 border bg-white rounded-md">
                                        <span className="font-mono text-sm">{sku}</span>
                                        <button onClick={() => setLinkedSkus(prev => prev.filter(s => s !== sku))} className="p-1 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={16}/></button>
                                    </div>
                                )) : <p className="text-sm text-center text-gray-500 p-4">Nenhum SKU vinculado.</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Vincular SKUs da Importação</h3>
                            <div className="relative mb-2">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" value={unlinkedSearch} onChange={e => setUnlinkedSearch(e.target.value)} placeholder="Buscar SKU não vinculado..." className="w-full pl-8 p-2 border border-gray-300 bg-gray-50 rounded-md text-sm"/>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50">
                                {availableUnlinked.length > 0 ? availableUnlinked.map(u => (
                                    <div key={u.sku} className="flex items-center justify-between p-2 border bg-white rounded-md">
                                        <span className="font-mono text-sm">{u.sku}</span>
                                        <button onClick={() => setLinkedSkus(prev => [...prev, u.sku])} className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"><PlusCircle size={16}/></button>
                                    </div>
                                )) : <p className="text-sm text-center text-gray-500 p-4">Nenhum SKU disponível.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleConfirm} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        <Save size={16} /> Salvar Produto
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProductFromImportModal;