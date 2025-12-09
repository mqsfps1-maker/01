// components/BipagemSettingsModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Settings, User as UserIcon, PlusCircle, Loader2, Mail } from 'lucide-react';
import { User, GeneralSettings, UserRole, UserSetor } from '../types';

interface BipagemSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    onSaveUser: (user: User) => Promise<boolean>;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    generalSettings: GeneralSettings;
    setGeneralSettings: (settings: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => void;
    onAddNewUser: (name: string, setor: UserSetor[], role: UserRole, email?: string) => Promise<{ success: boolean; message?: string; }>;
}

const BipagemSettingsModal: React.FC<BipagemSettingsModalProps> = ({ isOpen, onClose, users, onSaveUser, addToast, generalSettings, setGeneralSettings, onAddNewUser }) => {
    const [prefixEdits, setPrefixEdits] = useState<Record<string, string>>({});
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [isAddingUser, setIsAddingUser] = useState(false);
    
    const embalagemUsers = useMemo(() => users.filter(u => Array.isArray(u.setor) && u.setor.includes('EMBALAGEM') && u.role === 'FUNCIONARIO'), [users]);

    useEffect(() => {
        if (isOpen) {
            const initialPrefixes: Record<string, string> = {};
            embalagemUsers.forEach(u => {
                initialPrefixes[u.id] = u.prefix || '';
            });
            setPrefixEdits(initialPrefixes);
        }
    }, [isOpen, embalagemUsers]);

    const handlePrefixChange = (userId: string, newPrefix: string) => {
        setPrefixEdits(prev => ({ ...prev, [userId]: newPrefix.toUpperCase() }));
    };

    const handleSavePrefix = async (user: User) => {
        const newPrefix = (prefixEdits[user.id] || '').trim();
        const updatedUser = { ...user, prefix: newPrefix || undefined };
        const success = await onSaveUser(updatedUser);
        if(success) {
            addToast(`Prefixo para ${user.name} salvo com sucesso!`, 'success');
        } else {
            addToast(`Erro ao salvar prefixo para ${user.name}.`, 'error');
        }
    };
    
    const handleDefaultOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const operatorId = e.target.value;
        setGeneralSettings(prev => ({
            ...prev,
            bipagem: {
                ...prev.bipagem,
                defaultOperatorId: operatorId || null
            }
        }));
        addToast('Operador padrão salvo!', 'success');
    };

    const handleInviteUser = async () => {
        if (!newUserName.trim() || !newUserEmail.trim()) {
            addToast('Nome e Email são obrigatórios.', 'error');
            return;
        }
        setIsAddingUser(true);
        const result = await onAddNewUser(newUserName, ['EMBALAGEM'], 'FUNCIONARIO', newUserEmail);

        if (result.success) {
            addToast(`Convite enviado para ${newUserEmail}!`, 'success');
            setNewUserName('');
            setNewUserEmail('');
        } else {
            addToast(result.message || 'Erro ao enviar convite.', 'error');
        }
        setIsAddingUser(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] rounded-lg shadow-2xl p-6 w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex-shrink-0 flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2"><Settings size={20}/> Configurações de Bipagem</h2>
                    <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"><X size={24} /></button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <div className="p-4 border border-[var(--color-border)] rounded-lg">
                        <h3 className="font-semibold mb-2">Operador Padrão</h3>
                        <p className="text-xs text-[var(--color-text-secondary)] mb-2">Este operador será usado para bipagens sem prefixo. Se nenhum for selecionado, o usuário logado será usado.</p>
                        <select
                            value={generalSettings.bipagem.defaultOperatorId || ''}
                            onChange={handleDefaultOperatorChange}
                            className="w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md"
                        >
                            <option value="">Nenhum</option>
                            {embalagemUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div className="p-4 border border-[var(--color-border)] rounded-lg">
                        <h3 className="font-semibold mb-2">Convidar Novo Operador</h3>
                        <div className="space-y-2">
                             <input
                                type="text"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Nome do Operador (Ex: João da Silva)"
                                className="w-full p-1.5 border border-[var(--color-border)] rounded-md"
                            />
                             <input
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="Email do Operador (para o convite)"
                                className="w-full p-1.5 border border-[var(--color-border)] rounded-md"
                            />
                            <button onClick={handleInviteUser} disabled={isAddingUser} className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold flex-shrink-0 flex items-center justify-center gap-2 disabled:opacity-50">
                                {isAddingUser ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16}/>} Enviar Convite
                            </button>
                        </div>
                    </div>
                     
                    <div className="p-4 border border-[var(--color-border)] rounded-lg">
                        <h3 className="font-semibold mb-2">Prefixos de Operador</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {embalagemUsers.map(user => {
                                const userPrefix = user.prefix || '';
                                const editedPrefix = prefixEdits[user.id] ?? '';
                                const hasChanged = userPrefix !== editedPrefix.trim();
                                
                                return (
                                    <div key={user.id} className="bg-[var(--color-surface-secondary)] p-3 rounded-lg border border-[var(--color-border)]">
                                        <p className="font-semibold text-[var(--color-text-primary)]">{user.name}</p>
                                        <div className="mt-2 flex items-end gap-2">
                                            <div className="flex-grow">
                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Prefixo (formato: (PREFIXO)CODIGO)</label>
                                                <input
                                                    type="text"
                                                    value={editedPrefix}
                                                    onChange={(e) => handlePrefixChange(user.id, e.target.value)}
                                                    className="w-full mt-1 p-1.5 border border-[var(--color-border)] rounded-md text-sm font-mono bg-[var(--color-surface)]"
                                                    placeholder="Nenhum"
                                                />
                                            </div>
                                            {hasChanged && (
                                                <button onClick={() => handleSavePrefix(user)} className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-semibold flex-shrink-0">
                                                    <Save size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default BipagemSettingsModal;