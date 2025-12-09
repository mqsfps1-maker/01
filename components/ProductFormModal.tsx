// components/ProductFormModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, PlusCircle, Trash2, Search, Settings, Tag } from 'lucide-react';
import { StockItem, ProdutoCombinado, GeneralSettings } from '../types';
import CategoryManagerModal from './CategoryManagerModal';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemToEdit: Partial<StockItem> | null;
    onSave: (data: { productData: StockItem, bomData: ProdutoCombinado['items'] | null }) => Promise<boolean>;
    allProducts: StockItem[];
    unlinkedSkus: string[];
    generalSettings: GeneralSettings;
    setGeneralSettings: (settings: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, itemToEdit, onSave, allProducts, unlinkedSkus, generalSettings, setGeneralSettings }) => {
    
    const getInitialState = (): Partial<StockItem> => ({
        id: undefined,
        code: '',
        name: '',
        kind: 'PRODUTO' as const,
        unit: 'un' as const,
        current_qty: 0,
        min_qty: 0,
        category: generalSettings.productCategoryList[0] || '',
        composition: 'simple' as 'simple' | 'kit',
        linkedSkus: [],
    });

    const [productData, setProductData] = useState<Partial<StockItem>>(getInitialState());
    const [bomData, setBomData] = useState<ProdutoCombinado['items']>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [kitComponentSearch, setKitComponentSearch] = useState('');
    const [manualSku, setManualSku] = useState('');
    const [unlinkedSearch, setUnlinkedSearch] = useState('');
    const [selectedUnlinked, setSelectedUnlinked] = useState<Set<string>>(new Set());


    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setProductData({
                    id: itemToEdit.id,
                    code: itemToEdit.code || '',
                    name: itemToEdit.name || '',
                    kind: 'PRODUTO',
                    unit: 'un',
                    current_qty: itemToEdit.current_qty || 0,
                    min_qty: itemToEdit.min_qty || 0,
                    category: itemToEdit.category || '',
                    composition: itemToEdit.composition || 'simple',
                    linkedSkus: itemToEdit.linkedSkus || [],
                });
                // Find and set BOM data if it's a kit. This needs to be passed from parent
            } else {
                setProductData(getInitialState());
                setBomData([]);
            }
            setIsSaving(false);
            setUnlinkedSearch('');
            setSelectedUnlinked(new Set());

        }
    }, [isOpen, itemToEdit, generalSettings.productCategoryList]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['min_qty', 'current_qty'].includes(name);
        setProductData(prev => ({ ...prev, [name]: isNumberField ? Number(value) : value }));
    };
    
    const handleLinkedSkusChange = (skus: { sku: string, multiplier: number }[]) => {
        setProductData(prev => ({...prev, linkedSkus: skus}));
    };

    const handleSave = async () => {
        if(!productData.code || !productData.name) {
            alert("Código e Nome são obrigatórios.");
            return;
        }

        setIsSaving(true);
        const finalProductData = {
            ...getInitialState(),
            ...productData,
            id: productData.id || `prod_${Date.now()}`,
        } as StockItem;

        const finalBomData = productData.composition === 'kit' ? bomData : null;

        const success = await onSave({ productData: finalProductData, bomData: finalBomData });
        setIsSaving(false);
        if (success) {
            onClose();
        }
    };
    
    // Kit component logic
    const availableKitComponents = useMemo(() => {
        const search = kitComponentSearch.toLowerCase();
        const currentComponentCodes = new Set(bomData.map(c => c.stockItemCode));
        return allProducts.filter(p => 
            p.kind === 'PRODUTO' &&
            p.code !== productData.code &&
            !currentComponentCodes.has(p.code) &&
            (!search || p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search))
        );
    }, [kitComponentSearch, allProducts, bomData, productData.code]);
    
    const availableUnlinked = useMemo(() => {
        const search = unlinkedSearch.toLowerCase();
        const currentlyLinked = new Set((productData.linkedSkus || []).map(l => l.sku));
        return unlinkedSkus.filter(u => 
            !currentlyLinked.has(u) && 
            (!search || u.toLowerCase().includes(search))
        );
    }, [unlinkedSkus, productData.linkedSkus, unlinkedSearch]);


    const addKitComponent = (component: StockItem) => {
        setBomData(prev => [...prev, { stockItemCode: component.code, qty_per_pack: 1 }]);
        setKitComponentSearch('');
    };

    const removeKitComponent = (code: string) => {
        setBomData(prev => prev.filter(c => c.stockItemCode !== code));
    };

    const updateKitComponentQty = (code: string, qty: number) => {
        setBomData(prev => prev.map(c => c.stockItemCode === code ? { ...c, qty_per_pack: Math.max(1, qty) } : c));
    };
    
    const handleSaveCategories = (newCategories: string[]) => {
        setGeneralSettings(prev => ({ ...prev, productCategoryList: newCategories }));
    };

    const handleAddSelectedUnlinked = () => {
        const newLinks = Array.from(selectedUnlinked).map(sku => ({ sku, multiplier: 1 }));
        handleLinkedSkusChange([...(productData.linkedSkus || []), ...newLinks]);
        setSelectedUnlinked(new Set());
    };

    const handleToggleUnlinked = (sku: string) => {
        setSelectedUnlinked(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sku)) newSet.delete(sku);
            else newSet.add(sku);
            return newSet;
        });
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--modal-bg)] text-[var(--modal-text-primary)] rounded-lg shadow-2xl p-6 w-full max-w-4xl flex flex-col max-h-[90vh]">
                <div className="flex-shrink-0 flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{itemToEdit ? 'Editar Produto' : 'Criar Novo Produto'}</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm">Código/SKU Principal</label><input name="code" value={productData.code} onChange={handleInputChange} disabled={!!itemToEdit?.id} className="w-full p-2 border rounded bg-[var(--modal-surface-secondary)] border-[var(--modal-border)] disabled:cursor-not-allowed"/></div>
                        <div><label className="text-sm">Nome do Produto</label><input name="name" value={productData.name} onChange={handleInputChange} className="w-full p-2 border rounded bg-[var(--modal-surface-secondary)] border-[var(--modal-border)]"/></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {productData.composition !== 'kit' && (
                            <>
                                <div><label className="text-sm">Estoque Atual</label><input name="current_qty" type="number" value={productData.current_qty} onChange={handleInputChange} className="w-full p-2 border rounded bg-[var(--modal-surface-secondary)] border-[var(--modal-border)]"/></div>
                                <div><label className="text-sm">Estoque Mínimo</label><input name="min_qty" type="number" value={productData.min_qty} onChange={handleInputChange} className="w-full p-2 border rounded bg-[var(--modal-surface-secondary)] border-[var(--modal-border)]"/></div>
                            </>
                        )}
                        <div className={productData.composition === 'kit' ? 'md:col-span-2' : ''}><label className="text-sm">Tipo de Composição</label><select name="composition" value={productData.composition} onChange={handleInputChange} className="w-full p-2 border rounded bg-[var(--modal-surface)] border-[var(--modal-border)]"><option value="simple">Simples</option><option value="kit">Kit</option></select></div>
                        <div className={productData.composition === 'kit' ? 'md:col-span-2' : ''}>
                            <label className="text-sm">Categoria</label>
                            <div className="flex items-center gap-1">
                                <select name="category" value={productData.category} onChange={handleInputChange} className="w-full p-2 border rounded bg-[var(--modal-surface)] border-[var(--modal-border)]"><option value="">Nenhuma</option>{generalSettings.productCategoryList.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                <button onClick={() => setIsCategoryManagerOpen(true)} className="p-2 border rounded hover:bg-[var(--modal-surface-tertiary)] border-[var(--modal-border)]"><Settings size={16}/></button>
                            </div>
                        </div>
                    </div>

                     <div className="p-4 border rounded-lg bg-[var(--modal-surface-secondary)] border-[var(--modal-border)] space-y-4">
                        <h3 className="font-semibold">SKUs Vinculados a este Produto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {productData.linkedSkus?.map(link => (
                                    <div key={link.sku} className="flex items-center gap-2 bg-[var(--modal-bg)] p-1 border border-[var(--modal-border)] rounded">
                                        <span className="flex-grow text-sm font-mono truncate">{link.sku}</span>
                                        <button onClick={() => handleLinkedSkusChange(productData.linkedSkus!.filter(l => l.sku !== link.sku))} className="p-1 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="flex items-end gap-2 mb-2">
                                     <div className="flex-grow"><label className="text-xs">Adicionar SKU Manualmente</label><input value={manualSku} onChange={e => setManualSku(e.target.value)} placeholder="Digite um SKU..." className="w-full p-2 border rounded bg-[var(--modal-bg)] border-[var(--modal-border)]"/></div>
                                     <button onClick={() => { if(manualSku) { handleLinkedSkusChange([...(productData.linkedSkus || []), {sku: manualSku, multiplier: 1}]); setManualSku(''); } }} className="px-3 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"><PlusCircle size={16}/></button>
                                </div>
                                <div className="relative">
                                    <label className="text-xs">Buscar SKUs Pendentes</label>
                                    <input type="text" value={unlinkedSearch} onChange={e => setUnlinkedSearch(e.target.value)} placeholder="Buscar SKU pendente..." className="w-full p-2 border rounded bg-[var(--modal-bg)] border-[var(--modal-border)]" />
                                     <div className="absolute z-10 w-full bg-[var(--modal-bg)] border border-[var(--modal-border)] shadow-lg max-h-32 overflow-y-auto">
                                        {availableUnlinked.map(sku => (
                                            <label key={sku} className="flex items-center gap-2 p-2 text-sm hover:bg-[var(--modal-surface-secondary)] cursor-pointer">
                                                <input type="checkbox" checked={selectedUnlinked.has(sku)} onChange={() => handleToggleUnlinked(sku)} />
                                                {sku}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {selectedUnlinked.size > 0 && <button onClick={handleAddSelectedUnlinked} className="w-full text-xs mt-2 py-1 bg-blue-600/20 text-blue-800 dark:text-blue-200 rounded">Adicionar {selectedUnlinked.size} selecionados</button>}
                            </div>
                        </div>
                    </div>

                    {productData.composition === 'kit' && (
                        <div className="p-4 border rounded-lg bg-[var(--modal-surface-secondary)] border-[var(--modal-border)] space-y-4">
                            <h3 className="font-semibold">Componentes do Kit</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Componentes Adicionados</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {bomData.map(component => {
                                            const details = allProducts.find(p => p.code === component.stockItemCode);
                                            return (
                                                <div key={component.stockItemCode} className="flex items-center gap-2 bg-[var(--modal-bg)] p-1 border border-[var(--modal-border)] rounded">
                                                    <span className="flex-grow text-sm truncate">{details?.name || component.stockItemCode}</span>
                                                    <input type="number" value={component.qty_per_pack} onChange={e => updateKitComponentQty(component.stockItemCode, Number(e.target.value))} className="w-16 p-1 text-center border rounded bg-[var(--modal-surface-secondary)] border-[var(--modal-border)]"/>
                                                    <button onClick={() => removeKitComponent(component.stockItemCode)} className="p-1 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={14}/></button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                 <div className="relative">
                                    <h4 className="text-sm font-medium mb-1">Buscar Produtos para Adicionar</h4>
                                    <input type="text" value={kitComponentSearch} onChange={e => setKitComponentSearch(e.target.value)} placeholder="Buscar..." className="w-full p-2 border rounded bg-[var(--modal-bg)] border-[var(--modal-border)]"/>
                                    {kitComponentSearch && (
                                        <div className="absolute z-10 w-full bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-b-lg shadow-lg max-h-32 overflow-y-auto">
                                            {availableKitComponents.map(p => (
                                                <div key={p.id} onClick={() => addKitComponent(p)} className="p-2 text-sm hover:bg-[var(--modal-surface-secondary)] cursor-pointer">{p.name} ({p.code})</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 flex justify-end space-x-3 border-t pt-4 border-[var(--modal-border)]">
                    <button onClick={onClose} className="px-4 py-2 bg-[var(--modal-surface-secondary)] rounded-md">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold rounded-md flex items-center gap-2"><Save size={16}/> Salvar Produto</button>
                </div>
            </div>
        </div>
        <CategoryManagerModal 
            isOpen={isCategoryManagerOpen}
            onClose={() => setIsCategoryManagerOpen(false)}
            currentCategories={generalSettings.productCategoryList}
            onSave={handleSaveCategories}
        />
        </>
    );
};

export default ProductFormModal;
