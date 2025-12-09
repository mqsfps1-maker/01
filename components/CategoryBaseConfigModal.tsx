// components/CategoryBaseConfigModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Settings, Trash2 } from 'lucide-react';
import { GeneralSettings, ProductionGroup } from '../types';

interface CategoryBaseConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    currentBaseMapping: NonNullable<GeneralSettings['categoryBaseMapping']>;
    currentColorMapping: NonNullable<GeneralSettings['categoryColorMapping']>;
    onSave: (
        newBaseMapping: NonNullable<GeneralSettings['categoryBaseMapping']>,
        newColorMapping: NonNullable<GeneralSettings['categoryColorMapping']>
    ) => void;
}

const CategoryBaseConfigModal: React.FC<CategoryBaseConfigModalProps> = ({ isOpen, onClose, categories, currentBaseMapping, currentColorMapping, onSave }) => {
    const [baseMapping, setBaseMapping] = useState(currentBaseMapping);
    const [colorMapping, setColorMapping] = useState(currentColorMapping);

    useEffect(() => {
        if (isOpen) {
            setBaseMapping(currentBaseMapping);
            setColorMapping(currentColorMapping);
        }
    }, [isOpen, currentBaseMapping, currentColorMapping]);

    const handleBaseChange = (category: string, group: ProductionGroup) => {
        setBaseMapping(prev => ({ ...prev, [category]: group }));
    };

    const handleColorChange = (category: string, color: string) => {
        setColorMapping(prev => ({ ...prev, [category]: color }));
    };

    const handleSave = () => {
        onSave(baseMapping, colorMapping);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--modal-bg)] text-[var(--modal-text-primary)] rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center">
                        <Settings className="mr-2 text-blue-600" />
                        Configurar Grupos de Produção por Categoria
                    </h2>
                    <button onClick={onClose} className="text-[var(--modal-text-secondary)] hover:text-[var(--modal-text-primary)]"><X size={24} /></button>
                </div>
                
                <p className="text-sm text-[var(--modal-text-secondary)] mb-4">
                    Associe cada categoria de produto a um grupo de produção e defina uma cor para os resumos no dashboard de importação.
                </p>

                <div className="flex-grow overflow-y-auto pr-2 border-t border-b border-[var(--modal-border)] py-2">
                    <div className="space-y-3">
                       {categories.map(category => (
                            <div key={category} className="p-3 bg-[var(--modal-surface-secondary)] rounded-lg border border-[var(--modal-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <span className="font-semibold">{category}</span>
                                <div className="flex items-center gap-4">
                                     <select
                                        value={baseMapping[category] || 'group1'}
                                        onChange={(e) => handleBaseChange(category, e.target.value as ProductionGroup)}
                                        className="p-1 border border-[var(--modal-border)] rounded-md text-sm bg-[var(--modal-bg)]"
                                    >
                                        <option value="group1">Grupo 1</option>
                                        <option value="group2">Grupo 2</option>
                                        <option value="group3">Grupo 3</option>
                                    </select>
                                    <input
                                        type="color"
                                        value={colorMapping[category] || '#A8D8EA'}
                                        onChange={(e) => handleColorChange(category, e.target.value)}
                                        className="w-8 h-8 p-0 border-none rounded-md cursor-pointer bg-transparent"
                                        title="Selecionar cor para o resumo"
                                    />
                                </div>
                            </div>
                       ))}
                       {categories.length === 0 && (
                            <p className="text-center text-[var(--modal-text-secondary)] py-8">Nenhuma categoria de produto cadastrada. Você pode adicioná-las na tela de cadastro de produto.</p>
                       )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        <Save size={16} /> Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};
export default CategoryBaseConfigModal;