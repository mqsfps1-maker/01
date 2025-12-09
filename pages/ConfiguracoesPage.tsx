import React, { useState } from 'react';
import { User, UserRole, UserSetor, GeneralSettings } from '../types';
import { Users, Plus, Settings2, ChevronRight, User as UserIcon, KeyRound, Trash2, Loader2, Mail, Edit3, AlertTriangle } from 'lucide-react';
import ConfirmDeleteUserModal from '../components/ConfirmDeleteUserModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import EditAdminModal from '../components/EditAdminModal';
import { dbClient } from '../lib/supabaseClient'; // Import dbClient

interface ConfiguracoesPageProps {
    users: User[];
    setCurrentPage: (page: string) => void;
    onDeleteUser: (userId: string, adminPassword?: string) => Promise<boolean>;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void; // Add addToast
    currentUser: User;
    onUpdateUser: (user: User) => Promise<boolean>;
    generalSettings: GeneralSettings;
}

const ConfiguracoesPage: React.FC<ConfiguracoesPageProps> = ({ users, setCurrentPage, onDeleteUser, addToast, currentUser, onUpdateUser, generalSettings }) => {
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('FUNCIONARIO');
    const [newUserSetores, setNewUserSetores] = useState<UserSetor[]>([]);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [isAddingUser, setIsAddingUser] = useState(false);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isSimpleDeleteModalOpen, setIsSimpleDeleteModalOpen] = useState(false);
    const [isSimpleDeleting, setIsSimpleDeleting] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    
    const handleSetorChange = (setor: UserSetor) => {
        setNewUserSetores(prev => 
            prev.includes(setor) 
                ? prev.filter(s => s !== setor)
                : [...prev, setor]
        );
    };

    const canDelete = (userToDelete: User): boolean => {
        if (!currentUser) return false;
        if (userToDelete.role === 'DONO_SAAS') return false; 
        if (currentUser.role === 'DONO_SAAS') return true; 
        if (currentUser.role === 'CLIENTE_GERENTE' && userToDelete.role === 'FUNCIONARIO') return true; 
        return false;
    };

    const canEdit = (userToEdit: User): boolean => {
        if (!currentUser) return false;
        if (userToEdit.id === currentUser.id) return true;
        if (currentUser.role === 'DONO_SAAS' && userToEdit.role === 'CLIENTE_GERENTE') return true;
        return false;
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingUser(true);
        try {
            // NOTE: This should call an edge function you create named 'invite-user'
            const { error } = await dbClient.functions.invoke('invite-user', {
                body: { 
                    email: newUserEmail, 
                    name: newUserName, 
                    setor: newUserSetores, 
                    role: newUserRole 
                }
            });

            if (error) throw error;
            
            addToast(`Convite enviado para ${newUserEmail}!`, 'success');
            setNewUserName('');
            setNewUserRole('FUNCIONARIO');
            setNewUserSetores([]);
            setNewUserEmail('');

        } catch (err: any) {
            addToast(err.message || "Falha ao enviar convite.", 'error');
        } finally {
            setIsAddingUser(false);
        }
    };

    const openDeleteModal = (user: User) => {
        setUserToDelete(user);
        if (user.role === 'FUNCIONARIO') {
            setIsSimpleDeleteModalOpen(true);
        } else {
            setIsDeleteModalOpen(true);
        }
    };

    const openEditModal = (user: User) => {
        setUserToEdit(user);
        setIsEditModalOpen(true);
    };

    const handleConfirmDeleteWithPassword = async (adminPassword: string) => {
        if (userToDelete) {
            const success = await onDeleteUser(userToDelete.id, adminPassword);
            if (success) {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            }
            return success;
        }
        return false;
    };

    const handleConfirmSimpleDelete = async () => {
        if (userToDelete) {
            setIsSimpleDeleting(true);
            const success = await onDeleteUser(userToDelete.id); // No password
            setIsSimpleDeleting(false);
            if (success) {
                setIsSimpleDeleteModalOpen(false);
                setUserToDelete(null);
            }
        }
    };

    const closeAllDeleteModals = () => {
        setIsDeleteModalOpen(false);
        setIsSimpleDeleteModalOpen(false);
        setUserToDelete(null);
    };
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
                <p className="text-gray-500 mt-1">Gerencie usuários, integrações e outras configurações do sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* User Management Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Users size={20} className="mr-2 text-blue-600" />
                        Gerenciamento de Usuários
                    </h2>
                    
                    <form onSubmit={handleInviteUser} className="space-y-4 mb-4 p-3 bg-slate-50 rounded-lg border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Nome do usuário"
                                className="p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                             <select
                                value={newUserRole}
                                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                                className="p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="FUNCIONARIO">Funcionário (Acesso Limitado)</option>
                                <option value="CLIENTE_GERENTE">Gerente (Acesso Total)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Setores</label>
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-md">
                                {generalSettings.setorList.map(setor => (
                                    <label key={setor} className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={newUserSetores.includes(setor)}
                                            onChange={() => handleSetorChange(setor)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700">{setor}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                             <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                             <input
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="Email para o convite"
                                required
                                className="w-full pl-9 p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <button type="submit" disabled={isAddingUser} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                           {isAddingUser ? <Loader2 className="animate-spin"/> : <Plus size={16}/>} Enviar Convite
                        </button>
                    </form>

                    <div className="space-y-3">
                        {users.map(user => (
                            <div key={user.id} className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email || 'Convite pendente'}</p>
                                </div>
                                 <div className="flex items-center gap-2">
                                    {canEdit(user) && (
                                        <button onClick={() => openEditModal(user)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Editar">
                                            <Edit3 size={16} />
                                        </button>
                                    )}
                                    {canDelete(user) && (
                                        <button onClick={() => openDeleteModal(user)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Excluir">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                         <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <Settings2 size={20} className="mr-2 text-blue-600" />
                            Configurações Gerais
                        </h2>
                        <button onClick={() => setCurrentPage('configuracoes-gerais')} className="w-full flex justify-between items-center p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                            <div>
                                <p className="font-bold">Configurações Avançadas</p>
                                <p className="text-sm text-gray-500">Gerenciar banco de dados, importações e regras de negócio.</p>
                            </div>
                            <ChevronRight />
                        </button>
                    </div>
                    <div className="bg-[var(--color-danger-bg)] p-6 rounded-xl border border-[var(--color-danger-border)] shadow-sm">
                        <h2 className="text-lg font-bold text-[var(--color-danger-text)] mb-4 flex items-center">
                            <AlertTriangle size={20} className="mr-2" />
                            Zona de Perigo
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-[var(--color-danger-text)]">Apagar Todos os Dados da Conta</h3>
                                <p className="text-sm text-[var(--color-danger-text)] opacity-90 mb-2">Ação irreversível. Apaga **todos** os dados da sua organização: pedidos, produtos, clientes, etc. Apenas seu login e assinatura serão mantidos.</p>
                                <a href="#reset" onClick={(e) => { e.preventDefault(); setCurrentPage('reset')}} className="inline-block px-3 py-1.5 text-sm font-bold text-red-800 bg-red-200 rounded-md hover:bg-red-300 shadow-sm">
                                    Apagar Todos os Dados
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isDeleteModalOpen && userToDelete && currentUser && (
                <ConfirmDeleteUserModal
                    isOpen={isDeleteModalOpen}
                    onClose={closeAllDeleteModals}
                    userToDelete={userToDelete}
                    currentUser={currentUser}
                    onConfirmDelete={handleConfirmDeleteWithPassword}
                />
            )}
             {isSimpleDeleteModalOpen && userToDelete && (
                <ConfirmActionModal
                    isOpen={isSimpleDeleteModalOpen}
                    onClose={closeAllDeleteModals}
                    onConfirm={handleConfirmSimpleDelete}
                    title="Confirmar Exclusão"
                    message={<p>Tem certeza que deseja excluir o operador <strong>{userToDelete.name}</strong>?</p>}
                    confirmButtonText="Sim, Excluir"
                    isConfirming={isSimpleDeleting}
                />
            )}
            {isEditModalOpen && userToEdit && (
                <EditAdminModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    userToEdit={userToEdit}
                    onConfirmUpdate={onUpdateUser}
                    generalSettings={generalSettings}
                />
            )}
        </div>
    );
};

export default ConfiguracoesPage;
