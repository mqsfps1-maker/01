// components/AdminNotices.tsx
import React, { useState, useEffect } from 'react';
import { AdminNotice, User } from '../types';
import { Megaphone, Plus, X, Eye, EyeOff, Save } from 'lucide-react';

interface AdminNoticesProps {
    notices: AdminNotice[];
    currentUser: User;
    onSaveNotice: (notice: AdminNotice | Omit<AdminNotice, 'id' | 'createdAt' | 'createdBy'>) => void;
    onDeleteNotice: (id: string) => void;
}

interface NoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (notice: Omit<AdminNotice, 'id' | 'createdAt' | 'createdBy'>) => void;
    noticeToEdit: AdminNotice | null;
}

const NoticeModal: React.FC<NoticeModalProps> = ({ isOpen, onClose, onSave, noticeToEdit }) => {
    const [text, setText] = useState('');
    const [level, setLevel] = useState<'green' | 'yellow' | 'red'>('yellow');
    const [type, setType] = useState<'post-it' | 'banner'>('post-it');

    useEffect(() => {
        if (noticeToEdit) {
            setText(noticeToEdit.text);
            setLevel(noticeToEdit.level);
            setType(noticeToEdit.type);
        } else {
            setText('');
            setLevel('yellow');
            setType('post-it');
        }
    }, [noticeToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (text.trim()) {
            onSave({ text, level, type });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-[var(--color-surface)] rounded-lg p-6 w-full max-w-lg">
                <h2 className="text-lg font-bold mb-4">{noticeToEdit ? 'Editar Aviso' : 'Novo Aviso'}</h2>
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full p-2 border rounded mb-4 bg-[var(--color-surface-secondary)]"
                    rows={4}
                    placeholder="Digite seu aviso..."
                />
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <label className="text-sm font-medium mr-2">Nível:</label>
                        <select value={level} onChange={e => setLevel(e.target.value as any)} className="p-1 border rounded bg-[var(--color-surface)]">
                            <option value="yellow">Aviso</option>
                            <option value="green">Informativo</option>
                            <option value="red">Urgente</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium mr-2">Tipo:</label>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="p-1 border rounded bg-[var(--color-surface)]">
                            <option value="post-it">Post-it</option>
                            <option value="banner">Banner</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Save size={16}/> Salvar</button>
                </div>
            </div>
        </div>
    );
};


const AdminNotices: React.FC<AdminNoticesProps> = ({ notices, currentUser, onSaveNotice, onDeleteNotice }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [noticeToEdit, setNoticeToEdit] = useState<AdminNotice | null>(null);
    const [showNotices, setShowNotices] = useState(true);
    
    if (currentUser.role !== 'DONO_SAAS' && notices.length === 0) return null;

    const handleSave = (noticeData: Omit<AdminNotice, 'id' | 'createdAt' | 'createdBy'>) => {
        onSaveNotice(noticeToEdit ? { ...noticeToEdit, ...noticeData } : noticeData);
        setIsModalOpen(false);
        setNoticeToEdit(null);
    };

    const banners = notices.filter(n => n.type === 'banner');
    const postits = notices.filter(n => n.type === 'post-it');

    const levelClasses = {
        green: 'bg-green-100 border-green-300 text-green-800',
        yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
        red: 'bg-red-100 border-red-300 text-red-800',
    };

    return (
        <div className="my-4">
            {showNotices && banners.map(notice => (
                 <div key={notice.id} className={`p-4 rounded-lg border flex items-center justify-between gap-4 mb-4 ${levelClasses[notice.level]}`}>
                    <div className="flex items-start gap-3">
                        <Megaphone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{notice.text} <span className="text-xs opacity-70"> - {notice.createdBy}</span></p>
                    </div>
                    {currentUser.role === 'DONO_SAAS' && (
                        <button onClick={() => onDeleteNotice(notice.id)} className="p-1 hover:bg-black/10 rounded-full"><X size={14}/></button>
                    )}
                 </div>
            ))}

            {postits.length > 0 || currentUser.role === 'DONO_SAAS' ? (
                <div className="p-4 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-yellow-800 flex items-center gap-2"><Megaphone/> Avisos da Administração</h3>
                         <div className="flex items-center gap-2">
                             {currentUser.role === 'DONO_SAAS' && (
                                <button onClick={() => { setNoticeToEdit(null); setIsModalOpen(true); }} className="p-1.5 bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300"><Plus size={16}/></button>
                             )}
                             <button onClick={() => setShowNotices(!showNotices)} className="p-1.5 bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300">
                                {showNotices ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                         </div>
                    </div>
                    {showNotices && (
                        <div className="space-y-2">
                            {postits.map(notice => (
                                <div key={notice.id} className="text-sm text-yellow-900 bg-yellow-100 p-2 rounded flex justify-between items-start">
                                    <p>{notice.text}</p>
                                    {currentUser.role === 'DONO_SAAS' && (
                                        <button onClick={() => onDeleteNotice(notice.id)} className="p-1 hover:bg-black/10 rounded-full flex-shrink-0 ml-2"><X size={14}/></button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}

            {currentUser.role === 'DONO_SAAS' && (
                <NoticeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} noticeToEdit={noticeToEdit} />
            )}
        </div>
    );
};

export default AdminNotices;
