// components/InsumoCategoryManagerModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Edit } from 'lucide-react';

interface InsumoCategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCategories: string[];
    onSave: (newCategories: string[]) => void;
}

const InsumoCategoryManagerModal: React.FC<InsumoCategoryManagerModalProps> = ({ isOpen, onClose, currentCategories, onSave }) => {
    const [categories, setCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState('');

    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCategories(currentCategories);
        }
    }, [isOpen, currentCategories]);

    if (!isOpen) return null;

    const handleAdd = () => {
        const trimmed = newCategory.trim();
        if (trimmed && !categories.includes(trimmed)) {
            setCategories([...categories, trimmed].sort());
            setNewCategory('');
        }
    };

    const handleRemove = (categoryToRemove: string) => {
        setCategories(categories.filter(c => c !== categoryToRemove));
    };
    
    const handleStartEdit = (category: string) => {
        setEditingCategory(category);
        setEditedName(category);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditedName('');
    };

    const handleSaveEdit = () => {
        const trimmedName = editedName.trim();
        if (!trimmedName || !editingCategory) return;
        if (trimmedName !== editingCategory && categories.includes(trimmedName)) {
            alert('Esta categoria já existe.');
            return;
        }

        setCategories(categories.map(c => c === editingCategory ? trimmedName : c).sort());
        handleCancelEdit();
    };

    const handleSave = () => {
        onSave(categories);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Gerenciar Categorias de Insumos</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleAdd()}
                            placeholder="Nome da nova categoria"
                            className="flex-grow p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md"
                        />
                        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold flex items-center gap-2">
                            <Plus size={16}/> Adicionar
                        </button>
                    </div>

                    <div className="border rounded-lg max-h-60 overflow-y-auto p-2 space-y-2 bg-gray-50">
                        {categories.length > 0 ? categories.map(cat => (
                            <div key={cat} className="flex justify-between items-center bg-white p-2 border rounded-md">
                                {editingCategory === cat ? (
                                    <>
                                        <input 
                                            type="text"
                                            value={editedName}
                                            onChange={e => setEditedName(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && handleSaveEdit()}
                                            autoFocus
                                            className="flex-grow p-1 border border-blue-400 rounded-md text-sm bg-[var(--color-surface)]"
                                        />
                                        <div className="flex ml-2">
                                            <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-800"><Save size={16}/></button>
                                            <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700"><X size={16}/></button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="font-medium text-gray-700">{cat}</span>
                                        <div className="flex">
                                            <button onClick={() => handleStartEdit(cat)} className="p-1 text-gray-500 hover:text-blue-700"><Edit size={16}/></button>
                                            <button onClick={() => handleRemove(cat)} className="p-1 text-gray-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 p-4">Nenhuma categoria cadastrada.</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 flex items-center gap-2">
                        <Save size={16}/> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InsumoCategoryManagerModal;