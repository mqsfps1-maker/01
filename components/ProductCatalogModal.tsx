// components/ProductCatalogModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Edit, Package } from 'lucide-react';
// FIX: Import LocalProduct type
import { LocalProduct } from '../types';

interface ProductCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: LocalProduct[];
    onAdd: (product: LocalProduct) => Promise<LocalProduct | null>;
    onUpdate: (product: LocalProduct) => Promise<LocalProduct | null>;
    onDelete: (productCode: string) => Promise<boolean>;
}

const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({ isOpen, onClose, products, onAdd, onUpdate, onDelete }) => {
    const [editingProduct, setEditingProduct] = useState<LocalProduct | null>(null);
    const [newProduct, setNewProduct] = useState<Omit<LocalProduct, ''>>({ code: '', name: '', multiplier: 1 });

    useEffect(() => {
        if (!isOpen) {
            setEditingProduct(null);
            setNewProduct({ code: '', name: '', multiplier: 1 });
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    const handleAdd = async () => {
        if (newProduct.code.trim() && newProduct.name.trim()) {
            await onAdd(newProduct as LocalProduct);
            setNewProduct({ code: '', name: '', multiplier: 1 });
        }
    };

    const handleUpdate = async () => {
        if (editingProduct) {
            await onUpdate(editingProduct);
            setEditingProduct(null);
        }
    };
    
    const handleDelete = (code: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o produto ${code}? Todos os vínculos associados a ele serão perdidos.`)) {
            onDelete(code);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] rounded-lg shadow-2xl p-6 w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2"><Package/> Catálogo de Produtos</h2>
                    <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"><X size={24} /></button>
                </div>

                <div className="flex items-end gap-2 p-3 border border-[var(--color-border)] bg-[var(--color-surface-secondary)] rounded-lg mb-4">
                    <div className="flex-grow"><label className="text-xs">Código/SKU Mestre</label><input type="text" value={newProduct.code} onChange={e => setNewProduct(p => ({...p, code: e.target.value.toUpperCase()}))} placeholder="PPL-BRANCO-PREMIUM" className="w-full p-1 border rounded-md"/></div>
                    <div className="flex-grow"><label className="text-xs">Nome do Produto</label><input type="text" value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} placeholder="Papel de Parede Branco Premium" className="w-full p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Multiplicador</label><input type="number" value={newProduct.multiplier} onChange={e => setNewProduct(p => ({...p, multiplier: Number(e.target.value)}))} className="w-20 p-1 border rounded-md"/></div>
                    <button onClick={handleAdd} className="p-2 bg-blue-600 text-white rounded-md"><Plus size={16}/></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 border-t border-b border-[var(--color-border)] py-2">
                    <div className="space-y-2">
                        {products.map(product => (
                            <div key={product.code} className="bg-[var(--color-surface-secondary)] p-2 border border-[var(--color-border)] rounded-md">
                                {editingProduct?.code === product.code ? (
                                    <div className="flex items-end gap-2">
                                        <div className="flex-grow"><label className="text-xs">Nome</label><input type="text" value={editingProduct.name} onChange={e => setEditingProduct(p => p ? {...p, name: e.target.value} : null)} className="w-full p-1 border rounded-md"/></div>
                                        <div><label className="text-xs">Multiplicador</label><input type="number" value={editingProduct.multiplier} onChange={e => setEditingProduct(p => p ? {...p, multiplier: Number(e.target.value)} : null)} className="w-20 p-1 border rounded-md"/></div>
                                        <button onClick={handleUpdate} className="p-2 bg-green-600 text-white rounded-md"><Save size={16}/></button>
                                        <button onClick={() => setEditingProduct(null)} className="p-2 bg-gray-500 text-white rounded-md"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{product.name}</p>
                                            <p className="text-xs text-[var(--color-text-secondary)] font-mono">{product.code} (Multiplicador: {product.multiplier})</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => setEditingProduct(product)} className="p-1.5 text-[var(--color-text-secondary)] hover:text-blue-500"><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(product.code)} className="p-1.5 text-[var(--color-text-secondary)] hover:text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold rounded-md">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default ProductCatalogModal;