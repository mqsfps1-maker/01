

import React, { useState } from 'react';
import { User, AttendanceRecord, UserSetor, UserRole, GeneralSettings } from '../types';
import { Users, Check, X, Calendar, NotebookText, PlusCircle, Paperclip, Clock, Timer, ChevronDown, ChevronRight, Edit3, Trash2, Loader2, ChevronUp } from 'lucide-react';
import MarkAbsenceModal from '../components/MarkAbsenceModal';
import AddFuncionarioModal from '../components/AddFuncionarioModal';
import RecordTimeModal from '../components/RecordTimeModal'; // New component
import EditAdminModal from '../components/EditAdminModal';
import ConfirmDeleteUserModal from '../components/ConfirmDeleteUserModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import { dbClient } from '../lib/supabaseClient'; // Import dbClient

interface FuncionariosPageProps {
    users: User[];
    onSetAttendance: (userId: string, record: { date: string; status: 'PRESENT' | 'ABSENT'; hasDoctorsNote?: boolean; doctorsNoteFile?: File }) => void;
    // FIX: Update prop type to match expected return type from modal
    onAddNewUser: (name: string, setor: UserSetor[], role: UserRole, email?: string) => Promise<{ success: boolean; message?: string; }>;
    onUpdateAttendanceDetails: (userId: string, date: string, detail: 'leftEarly' | 'overtime', time: string | null) => void;
    onUpdateUser: (user: User) => Promise<boolean>;
    generalSettings: GeneralSettings;
    currentUser: User;
    onDeleteUser: (userId: string, adminPassword?: string) => Promise<boolean>;
    subscription: any | null;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const UserCard: React.FC<{
    user: User,
    isExpanded: boolean,
    onToggleExpansion: (userId: string) => void,
    onMarkPresent: (userId: string) => void,
    onOpenAbsenceModal: (user: User) => void,
    onOpenTimeModal: (user: User, type: 'leftEarly' | 'overtime') => void,
    onClearTime: (userId: string, type: 'leftEarly' | 'overtime') => void,
    canEdit: boolean,
    onEdit: (user: User) => void,
    canDelete: boolean,
    onDelete: (user: User) => void
}> = ({ user, isExpanded, onToggleExpansion, onMarkPresent, onOpenAbsenceModal, onOpenTimeModal, onClearTime, canEdit, onEdit, canDelete, onDelete }) => {
    const todayAttendance = user.attendance.find(a => a.date === getTodayString());
    
    let statusNode = <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Aguardando</span>;
    if (todayAttendance?.status === 'PRESENT') {
        statusNode = <span className="flex items-center text-xs font-semibold text-green-600"><Check size={14} className="mr-1"/> Presente</span>;
    } else if (todayAttendance?.status === 'ABSENT') {
        statusNode = <span className={`flex items-center text-xs font-semibold text-red-600`}><X size={14} className="mr-1"/> Faltou{todayAttendance.hasDoctorsNote && <Paperclip size={14} className="ml-2 text-blue-500" />}</span>;
    }

    return (
        <div className="bg-[var(--color-surface-secondary)] p-3 rounded-lg border border-[var(--color-border)]">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-[var(--color-text-primary)]">{user.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{user.role}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(user.setor) && user.setor.map(s => (
                            <span key={s} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{s}</span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {canEdit && <button onClick={() => onEdit(user)} className="p-1.5"><Edit3 size={16}/></button>}
                    {canDelete && <button onClick={() => onDelete(user)} className="p-1.5"><Trash2 size={16}/></button>}
                    <button onClick={() => onToggleExpansion(user.id)} className="p-1.5">{isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">Ponto de Hoje:</span>
                    {statusNode}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onMarkPresent(user.id)} className="w-full text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200">Presente</button>
                    <button onClick={() => onOpenAbsenceModal(user)} className="w-full text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200">Faltou</button>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                     <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">Histórico de Ponto</h4>
                     {/* History can be added here if needed for mobile view */}
                </div>
            )}
        </div>
    );
};


const FuncionariosPage: React.FC<FuncionariosPageProps> = ({ users, onSetAttendance, onAddNewUser, onUpdateAttendanceDetails, onUpdateUser, generalSettings, currentUser, onDeleteUser, subscription, addToast }) => {
    const [absenceModalState, setAbsenceModalState] = useState<{ isOpen: boolean, user: User | null }>({ isOpen: false, user: null });
    const [isAddFuncionarioModalOpen, setIsAddFuncionarioModalOpen] = useState(false);
    const [timeModalState, setTimeModalState] = useState<{ isOpen: boolean, user: User | null, type: 'leftEarly' | 'overtime' | null }>({ isOpen: false, user: null, type: null });
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    // State for delete modals
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isSimpleDeleteModalOpen, setIsSimpleDeleteModalOpen] = useState(false);
    const [isSimpleDeleting, setIsSimpleDeleting] = useState(false);

    const userCount = users.length;
    const maxUsers = subscription?.plan?.max_users || 1; // Default to 1 if no active plan

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
        if (currentUser.role === 'DONO_SAAS' && userToEdit.role !== 'DONO_SAAS') return true;
        if (currentUser.role === 'CLIENTE_GERENTE' && userToEdit.role === 'FUNCIONARIO') return true;
        return false;
    };

    const toggleUserExpansion = (userId: string) => {
        setExpandedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleMarkPresent = (userId: string) => {
        onSetAttendance(userId, { date: getTodayString(), status: 'PRESENT' });
    };

    const handleOpenAbsenceModal = (user: User) => {
        setAbsenceModalState({ isOpen: true, user });
    };
    
    const handleConfirmAbsence = (userId: string, date: string, hasDoctorsNote: boolean, file?: File) => {
        onSetAttendance(userId, { 
            date, 
            status: 'ABSENT', 
            hasDoctorsNote,
            doctorsNoteFile: file,
        });
        setAbsenceModalState({ isOpen: false, user: null });
    };

    const handleOpenTimeModal = (user: User, type: 'leftEarly' | 'overtime') => {
        setTimeModalState({ isOpen: true, user, type });
    };

    const handleConfirmTime = (userId: string, type: 'leftEarly' | 'overtime', time: string) => {
        onUpdateAttendanceDetails(userId, getTodayString(), type, time);
        setTimeModalState({ isOpen: false, user: null, type: null });
    };

    const handleClearTime = (userId: string, type: 'leftEarly' | 'overtime') => {
        onUpdateAttendanceDetails(userId, getTodayString(), type, null);
    };
    
    const openEditModal = (user: User) => {
        setUserToEdit(user);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (user: User) => {
        setUserToDelete(user);
        if (user.role === 'FUNCIONARIO') {
            setIsSimpleDeleteModalOpen(true);
        } else {
            setIsDeleteModalOpen(true);
        }
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

    // FIX: Refactor handleInviteUser to use the onAddNewUser prop for consistency.
    const handleInviteUser = async (email: string, name: string, setor: UserSetor[]) => {
        const role: UserRole = 'FUNCIONARIO';
        return onAddNewUser(name, setor, role, email);
    };

    return (
        <div>
            <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Gerenciamento de Funcionários</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">Controle de presença e ponto da equipe.</p>
                </div>
                <button
                    onClick={() => {
                        if (userCount >= maxUsers) {
                            alert(`Limite de ${maxUsers} usuário(s) do seu plano atual foi atingido. Faça um upgrade para adicionar mais.`);
                            window.location.hash = 'assinatura';
                        } else {
                            setIsAddFuncionarioModalOpen(true)
                        }
                    }}
                    className="flex items-center text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-primary-text)] px-4 py-2 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors shadow-sm"
                >
                    <PlusCircle size={16} className="mr-2"/>
                    Convidar Funcionário
                </button>
            </div>
            
            <div className="mt-8 bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm w-full">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center">
                        <Users size={20} className="mr-2 text-[var(--color-primary)]" />
                        Equipe ({userCount}/{maxUsers} usuários)
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Ponto para: <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
                    </p>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {users.map(user => (
                        <UserCard 
                            key={user.id}
                            user={user}
                            isExpanded={expandedUsers.has(user.id)}
                            onToggleExpansion={toggleUserExpansion}
                            onMarkPresent={handleMarkPresent}
                            onOpenAbsenceModal={handleOpenAbsenceModal}
                            onOpenTimeModal={handleOpenTimeModal}
                            onClearTime={handleClearTime}
                            canEdit={canEdit(user)}
                            onEdit={openEditModal}
                            canDelete={canDelete(user)}
                            onDelete={openDeleteModal}
                        />
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--color-border)]">
                    <table className="min-w-full bg-[var(--color-surface)] text-sm">
                        <thead className="bg-[var(--color-surface-secondary)]">
                            <tr>
                                <th className="py-2 px-3 w-12"></th>
                                {['Funcionário', 'Setor', 'Status Hoje', 'Ações'].map(h => 
                                    <th key={h} className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {users.map(user => {
                                const isExpanded = expandedUsers.has(user.id);
                                const todayAttendance = user.attendance.find(a => a.date === getTodayString());
                                let statusNode = <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Aguardando</span>;
                                if (todayAttendance?.status === 'PRESENT') {
                                    statusNode = (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="flex items-center text-xs font-semibold text-green-600"><Check size={14} className="mr-1"/> Presente</span>
                                            {todayAttendance.leftEarly && (
                                                <span className="flex items-center text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                                    Saiu Cedo ({todayAttendance.leftEarly})
                                                    <button onClick={() => handleClearTime(user.id, 'leftEarly')} className="ml-1.5 text-orange-700 hover:text-orange-900"><X size={12}/></button>
                                                </span>
                                            )}
                                            {todayAttendance.overtime && (
                                                <span className="flex items-center text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                                                    Hora Extra ({todayAttendance.overtime})
                                                    <button onClick={() => handleClearTime(user.id, 'overtime')} className="ml-1.5 text-purple-700 hover:text-purple-900"><X size={12}/></button>
                                                </span>
                                            )}
                                        </div>
                                    );
                                } else if (todayAttendance?.status === 'ABSENT') {
                                     statusNode = <span className={`flex items-center text-xs font-semibold text-red-600`}>
                                        <X size={14} className="mr-1"/> Faltou
                                        {todayAttendance.hasDoctorsNote && (
                                            <span title={`Atestado: ${todayAttendance.doctorsNoteFile?.name || 'Sim'}`}>
                                                <Paperclip size={14} className="ml-2 text-blue-500" />
                                            </span>
                                        )}
                                     </span>;
                                }
                                
                                return (
                                    <React.Fragment key={user.id}>
                                        <tr className="hover:bg-[var(--color-surface-secondary)]">
                                            <td className="py-2 px-3 text-center">
                                                <button onClick={() => toggleUserExpansion(user.id)} className="p-1 rounded-full hover:bg-[var(--color-surface-tertiary)]">
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            </td>
                                            <td className="py-2 px-3">
                                                <p className="font-medium text-[var(--color-text-primary)]">{user.name}</p>
                                                <p className="text-xs text-[var(--color-text-secondary)]">{user.role}</p>
                                            </td>
                                            <td className="py-2 px-3">
                                                 <div className="flex flex-wrap gap-1">
                                                    {Array.isArray(user.setor) && user.setor.map(s => (
                                                        <span key={s} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{s}</span>
                                                    ))}
                                                 </div>
                                            </td>
                                            <td className="py-2 px-3">{statusNode}</td>
                                            <td className="py-2 px-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button 
                                                            onClick={() => handleMarkPresent(user.id)}
                                                            className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200"
                                                        >
                                                            <Check size={14} className="mr-1"/> Presente
                                                        </button>
                                                        <button 
                                                            onClick={() => handleOpenAbsenceModal(user)}
                                                            className="flex items-center text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200"
                                                        >
                                                            <Calendar size={14} className="mr-1"/> Faltou
                                                        </button>
                                                        <button 
                                                            onClick={() => handleOpenTimeModal(user, 'leftEarly')}
                                                            disabled={todayAttendance?.status !== 'PRESENT'}
                                                            className="flex items-center text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Clock size={14} className="mr-1"/> Saiu Cedo
                                                        </button>
                                                        <button 
                                                            onClick={() => handleOpenTimeModal(user, 'overtime')}
                                                            disabled={todayAttendance?.status !== 'PRESENT'}
                                                            className="flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Timer size={14} className="mr-1"/> Hora Extra
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {canEdit(user) && (
                                                            <button onClick={() => openEditModal(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Editar Usuário">
                                                                <Edit3 size={16} />
                                                            </button>
                                                        )}
                                                        {canDelete(user) && (
                                                            <button onClick={() => openDeleteModal(user)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full" title="Excluir Usuário">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-[var(--color-surface-secondary)]">
                                                <td colSpan={5} className="p-4">
                                                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">Histórico de Ponto</h4>
                                                    {user.attendance && user.attendance.length > 0 ? (
                                                        <div className="overflow-auto max-h-60 border border-[var(--color-border)] rounded-md">
                                                            <table className="min-w-full bg-[var(--color-surface)]">
                                                                <thead className="bg-[var(--color-surface-tertiary)] sticky top-0">
                                                                    <tr>
                                                                        <th className="py-1 px-2 text-left text-xs font-semibold text-[var(--color-text-secondary)]">Data</th>
                                                                        <th className="py-1 px-2 text-left text-xs font-semibold text-[var(--color-text-secondary)]">Status</th>
                                                                        <th className="py-1 px-2 text-left text-xs font-semibold text-[var(--color-text-secondary)]">Observações</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-[var(--color-border)]">
                                                                    {user.attendance.map((record, index) => {
                                                                        const observations = [];
                                                                        if (record.hasDoctorsNote) observations.push('Atestado');
                                                                        if (record.leftEarly) observations.push(`Saiu Cedo (${record.leftEarly})`);
                                                                        if (record.overtime) observations.push(`Hora Extra (${record.overtime})`);
                                                                        
                                                                        return (
                                                                            <tr key={index}>
                                                                                <td className="py-1.5 px-2 text-xs">{(() => {
                                                                                    if (!record.date) return 'Data inválida';
                                                                                    const d = new Date(record.date + 'T12:00:00Z');
                                                                                    return !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : 'Data inválida';
                                                                                })()}</td>
                                                                                <td className={`py-1.5 px-2 text-xs font-semibold ${record.status === 'PRESENT' ? 'text-green-600' : 'text-red-600'}`}>{record.status === 'PRESENT' ? 'Presente' : 'Falta'}</td>
                                                                                <td className="py-1.5 px-2 text-xs">{observations.join(', ') || '-'}</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">Nenhum registro de ponto encontrado.</p>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {absenceModalState.user && (
                 <MarkAbsenceModal 
                    isOpen={absenceModalState.isOpen}
                    onClose={() => setAbsenceModalState({ isOpen: false, user: null })}
                    user={absenceModalState.user}
                    onConfirm={handleConfirmAbsence}
                />
            )}
             <AddFuncionarioModal
                isOpen={isAddFuncionarioModalOpen}
                onClose={() => setIsAddFuncionarioModalOpen(false)}
                onInviteUser={handleInviteUser}
                generalSettings={generalSettings}
            />
             {timeModalState.user && timeModalState.type && (
                <RecordTimeModal
                    isOpen={timeModalState.isOpen}
                    onClose={() => setTimeModalState({ isOpen: false, user: null, type: null })}
                    user={timeModalState.user}
                    type={timeModalState.type}
                    onConfirm={handleConfirmTime}
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
        </div>
    );
};

export default FuncionariosPage;