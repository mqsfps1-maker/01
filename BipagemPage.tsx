

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// FIX: Add missing type imports
import { ScanLogItem, ScanResult, User as UserType, StockItem, GeneralSettings, Device, UserSetor, UserRole, SkuLink, OrderItem, UiSettings } from '../types';
import { playSound } from '../lib/sound';
import { QrCode, X, Check, CheckCheck, History, User as UserIcon, Laptop2, ScanLine, AlertCircle, Ban, Trash2, Edit, PlusCircle, Power, Usb, ShieldCheck, ShieldAlert, Lock, Settings, Save, RefreshCw, Loader2, ArrowDown, ArrowUp, ChevronDown, ChevronRight, Undo, Cloud } from 'lucide-react';
import ConfirmActionModal from '../components/ConfirmActionModal';
import BipagemSettingsModal from '../components/BipagemSettingsModal';

// --- Sub-components ---

const ScanFeedback: React.FC<{ result: ScanResult | null }> = ({ result }) => {
    if (!result) {
        return (
            <div className="h-40 flex flex-col items-center justify-center bg-[var(--color-surface-secondary)] rounded-lg border-2 border-dashed border-[var(--color-border)]">
                <ScanLine size={48} className="text-[var(--color-text-secondary)] opacity-50 mb-4" />
                <p className="text-[var(--color-text-primary)] font-medium">Aguardando bipagem...</p>
                <p className="text-[var(--color-text-secondary)] text-sm">O sistema está pronto para receber dados do scanner.</p>
            </div>
        );
    }

    const getStatusInfo = () => {
        if (result.status === 'DUPLICATE') {
            return {
                icon: <X size={32} />,
                colorClasses: 'bg-[var(--color-danger-bg)] border-[var(--color-danger-border)] text-[var(--color-danger-text)]',
                title: 'Item Duplicado',
            };
        }
        if (result.status === 'OK') {
             if (result.channel === 'SITE') {
                return {
                   icon: <Cloud size={32} />,
                   colorClasses: 'bg-[var(--color-info-bg)] border-[var(--color-info-border)] text-[var(--color-info-text)]',
                   title: 'Sucesso: Pedido do Site',
                }
             }
             if (result.synced_with_list) {
                 return {
                    icon: <CheckCheck size={32} />,
                    colorClasses: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success-text)]',
                    title: 'Sucesso: Bipado e Vinculado',
                 }
             }
             return {
                icon: <div className="flex items-center"><Check size={32} /><AlertCircle size={20} className="text-yellow-600 -ml-2 -mt-2"/></div>,
                colorClasses: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success-text)]',
                title: 'Sucesso: Bipado (Não Vinculado)',
             }
        }
        if (result.status === 'NOT_FOUND') {
            return {
                icon: <History size={32} />,
                colorClasses: 'bg-[var(--color-info-bg)] border-[var(--color-info-border)] text-[var(--color-info-text)]',
                title: 'Aguardando Vinculação',
            }
        }
        // Fallback for ERROR
        return {
            icon: <AlertCircle size={32} />,
            colorClasses: 'bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)]',
            title: 'Erro de Leitura'
        }
    };

    const { icon, colorClasses, title } = getStatusInfo();

    return (
        <div className={`h-40 p-4 flex items-start rounded-lg border-l-4 transition-all ${colorClasses}`}>
            <div className="mr-4 mt-1">{icon}</div>
            <div className="flex-grow">
                <p className={`font-bold text-lg`}>{title}</p>
                {result.status === 'NOT_FOUND' ? (
                    <p className="text-sm">Bipagem registrada. Será vinculada quando o pedido for importado e sincronizado.</p>
                ) : result.status === 'DUPLICATE' && result.first_scan ? (
                    <p className="text-sm">
                        Já bipado por <strong>{result.first_scan.by}</strong> às {result.first_scan.at} no dispositivo {result.first_scan.device}.
                    </p>
                ) : result.status === 'OK' && result.user ? (
                    <p className="text-sm">
                        Registrado para <strong>{result.user.name}</strong> ({result.user.device}).
                    </p>
                ) : (
                    <p className="text-sm">{result.message}</p>
                )}
                <div className="mt-2 text-xs space-y-1 font-mono bg-black bg-opacity-5 rounded-md p-2">
                   <p><strong>Bipado:</strong> {result.input_code}</p>
                   <div className="flex space-x-4 flex-wrap">
                        <p><strong>Pedido:</strong> {result.order_key || '---'}</p>
                        <p><strong>SKU:</strong> {result.sku_key || '---'}</p>
                        <p><strong>Rastreio:</strong> {result.tracking_number || '---'}</p>
                   </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---
interface BipagemPageProps {
    allOrders: OrderItem[];
    onNewScan: (code: string, user?: UserType) => Promise<ScanResult>;
    onBomDeduction: (sku: string, ref: string) => void;
    scanHistory: ScanLogItem[];
    onCancelBipagem: (scanId: string) => void;
    onBulkCancelBipagem: (scanIds: string[]) => Promise<void>;
    onHardDeleteScanLog: (scanId: string) => Promise<void>;
    onBulkHardDeleteScanLog: (scanIds: string[]) => Promise<void>;
    products: StockItem[];
    users: UserType[];
    // FIX: Updated prop type to match AppCore implementation
    onAddNewUser: (name: string, setor: UserSetor[], role: UserRole, email?: string) => Promise<{ success: boolean; message?: string }>;
    onSaveUser: (user: UserType) => Promise<boolean>;
    uiSettings: UiSettings;
    currentUser: UserType;
    onSyncPending: () => Promise<void>;
    skuLinks: SkuLink[];
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    currentPage: string;
    isAutoBipagemActive: boolean;
    generalSettings: GeneralSettings;
    setGeneralSettings: (settings: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => void;
}

const BipagemPage: React.FC<BipagemPageProps> = (props) => {
    const { allOrders, onNewScan, onBomDeduction, scanHistory, onCancelBipagem, onBulkCancelBipagem, onHardDeleteScanLog, onBulkHardDeleteScanLog, users, onSaveUser, uiSettings, currentUser, onSyncPending, skuLinks, addToast, currentPage, isAutoBipagemActive, generalSettings, setGeneralSettings, onAddNewUser } = props;
    
    const [lastScan, setLastScan] = useState<ScanResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // State for filters and modals
    const [filterType, setFilterType] = useState<'recent' | 'date'>('recent');
    const [statusFilter, setStatusFilter] = useState<'ALL' | ScanLogItem['status']>('ALL');
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [idsToCancel, setIdsToCancel] = useState<string[]>([]);
    const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
    const [isHardDeleting, setIsHardDeleting] = useState(false);
    const [idToHardDelete, setIdToHardDelete] = useState<string | null>(null);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [idsToBulkDelete, setIdsToBulkDelete] = useState<string[]>([]);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);


    const lastScanTimerRef = useRef<number | null>(null);

    const embalagemUsers = useMemo(() => users.filter(u => Array.isArray(u.setor) && u.setor.includes('EMBALAGEM')), [users]);
    const scannedCodeBuffer = useRef('');
    const lastKeyPressTime = useRef(0);
    const debounceTime = 50;

    const filteredHistory = useMemo(() => {
        let history = [...scanHistory];

        if (filterType === 'date') {
            const startDate = new Date(`${dateRange.start}T00:00:00`);
            const endDate = new Date(`${dateRange.end}T23:59:59`);
            history = history.filter(item => {
                if (!item.time || isNaN(item.time.getTime())) {
                    return false;
                }
                const itemTime = item.time;
                return itemTime >= startDate && itemTime <= endDate;
            });
        }

        if (statusFilter !== 'ALL') {
            history = history.filter(item => item.status === statusFilter);
        }

        history.sort((a, b) => {
            const timeA = a.time ? a.time.getTime() : NaN;
            const timeB = b.time ? b.time.getTime() : NaN;
            
            if (isNaN(timeA) && isNaN(timeB)) return 0;
            if (isNaN(timeA)) return 1;
            if (isNaN(timeB)) return -1;
    
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return history;
    }, [scanHistory, filterType, dateRange, sortOrder, statusFilter]);

    const handleOpenCancelModal = (scanIds: string[]) => {
        if (scanIds.length === 0) return;
        setIdsToCancel(scanIds);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        await onBulkCancelBipagem(idsToCancel);
        setIsCancelling(false);
        setIsCancelModalOpen(false);
        setIdsToCancel([]);
    };

    const handleOpenHardDeleteModal = (scanId: string) => {
        if (!scanId) return;
        setIdToHardDelete(scanId);
        setIsHardDeleteModalOpen(true);
    };

    const handleConfirmHardDelete = async () => {
        if (!idToHardDelete) return;
        setIsHardDeleting(true);
        await onHardDeleteScanLog(idToHardDelete);
        setIsHardDeleting(false);
        setIsHardDeleteModalOpen(false);
        setIdToHardDelete(null);
    };

    const handleOpenBulkDeleteModal = (scanIds: string[]) => {
        if (scanIds.length === 0) return;
        setIdsToBulkDelete(scanIds);
        setIsBulkDeleteModalOpen(true);
    };

    const handleConfirmBulkDelete = async () => {
        if (idsToBulkDelete.length === 0) return;
        setIsBulkDeleting(true);
        await onBulkHardDeleteScanLog(idsToBulkDelete);
        setIsBulkDeleting(false);
        setIsBulkDeleteModalOpen(false);
        setIdsToBulkDelete([]);
    };
    
    // Effect to auto-clear the scan notification
    useEffect(() => {
        if (lastScanTimerRef.current) {
            clearTimeout(lastScanTimerRef.current);
        }

        if (lastScan) {
            lastScanTimerRef.current = window.setTimeout(() => {
                setLastScan(null);
            }, 10000); // 10 seconds
        }

        return () => {
            if (lastScanTimerRef.current) {
                clearTimeout(lastScanTimerRef.current);
            }
        };
    }, [lastScan]);

    const processAndHandleScan = useCallback(async (code: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        
        const result = await onNewScan(code, currentUser);
        setLastScan(result);

        if (result.status === 'OK' && uiSettings.soundOnSuccess) playSound('success');
        if (result.status === 'DUPLICATE' && uiSettings.soundOnDuplicate) playSound('duplicate');
        if ((result.status === 'ERROR' || result.status === 'NOT_FOUND') && uiSettings.soundOnError) playSound('error');
        
        setIsProcessing(false);
    }, [isProcessing, onNewScan, uiSettings, currentUser]);

    useEffect(() => {
        // This local listener is only active if the global auto scan mode is OFF.
        if (currentPage !== 'bipagem' || isAutoBipagemActive) return;

        const handleLocalKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    
            const currentTime = Date.now();
            if (currentTime - lastKeyPressTime.current > debounceTime) {
                scannedCodeBuffer.current = '';
            }
            lastKeyPressTime.current = currentTime;
    
            if (event.key === 'Enter') {
                if (scannedCodeBuffer.current.length > 2) {
                    processAndHandleScan(scannedCodeBuffer.current);
                }
                scannedCodeBuffer.current = '';
            } else if (event.key.length === 1) {
                scannedCodeBuffer.current += event.key;
            }
        };
    
        window.addEventListener('keydown', handleLocalKeyDown);
        return () => window.removeEventListener('keydown', handleLocalKeyDown);
    }, [processAndHandleScan, debounceTime, currentPage, isAutoBipagemActive]);
    
    const handleSync = async () => {
        setIsSyncing(true);
        await onSyncPending();
        setIsSyncing(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-1 space-y-8">
                <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm relative">
                     {isAutoBipagemActive && (
                        <div className="absolute inset-0 bg-slate-200/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10 p-4 text-center">
                            <Power size={32} className="text-blue-600 mb-2"/>
                            <p className="font-bold text-slate-800">Modo de Auto Bipagem Ativo</p>
                            <p className="text-sm text-slate-600">Bipe em qualquer tela. O resultado aparecerá como notificação.</p>
                        </div>
                    )}
                     <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center justify-between flex-wrap gap-2">
                        <span className="flex items-center"><QrCode size={20} className="mr-2"/> Painel de Bipagem</span>
                        <div className="flex gap-2">
                            <button onClick={handleSync} disabled={isSyncing} className="flex items-center text-sm font-semibold bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary-text-subtle)] px-3 py-1 rounded-lg hover:opacity-80 transition-colors shadow-sm disabled:opacity-50">
                                {isSyncing ? <Loader2 size={16} className="animate-spin mr-2"/> : <RefreshCw size={16} className="mr-2"/>}
                                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                            </button>
                             <button onClick={() => setIsSettingsModalOpen(true)} className="flex items-center text-sm font-semibold bg-[var(--color-surface-secondary)] px-3 py-1 rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors shadow-sm">
                                <Settings size={16}/>
                            </button>
                        </div>
                    </h2>
                    <ScanFeedback result={lastScan} />
                </div>
            </div>

            <div className="lg:col-span-2 min-h-[400px] flex flex-col">
                 <div className="bg-[var(--color-surface)] p-4 rounded-t-xl border-t border-l border-r border-[var(--color-border)] shadow-sm flex-shrink-0">
                    <div className="flex justify-between items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Filtro:</label>
                            <select value={filterType} onChange={e => setFilterType(e.target.value as 'recent' | 'date')} className="p-2 border border-[var(--color-border)] rounded-md text-sm bg-[var(--color-surface)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]">
                                <option value="recent">Mais Recentes</option>
                                <option value="date">Por Data</option>
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="p-2 border border-[var(--color-border)] rounded-md text-sm bg-[var(--color-surface)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]">
                                <option value="ALL">Todos Status</option>
                                <option value="OK">OK</option>
                                <option value="DUPLICATE">Duplicado</option>
                                <option value="NOT_FOUND">Não Encontrado</option>
                                <option value="ADJUSTED">Ajustado</option>
                                <option value="CANCELLED">Cancelado</option>
                            </select>
                        </div>
                        {filterType === 'date' && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="p-2 border border-[var(--color-border)] rounded-md text-sm bg-[var(--color-surface)]" />
                                <span className="text-[var(--color-text-secondary)]">até</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="p-2 border border-[var(--color-border)] rounded-md text-sm bg-[var(--color-surface)]" />
                            </div>
                        )}
                        <button onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] p-2 rounded-md bg-[var(--color-surface-secondary)]">
                            {sortOrder === 'desc' ? <>Mais Recentes <ArrowDown size={14} /></> : <>Mais Antigos <ArrowUp size={14} /></>}
                        </button>
                    </div>
                </div>
                <div className="flex-grow min-h-0">
                    <ScanHistory 
                        history={filteredHistory} 
                        currentUser={currentUser}
                        allOrders={allOrders}
                        onOpenCancelModal={handleOpenCancelModal}
                        onOpenHardDeleteModal={handleOpenHardDeleteModal}
                        onOpenBulkDeleteModal={handleOpenBulkDeleteModal}
                    />
                </div>
            </div>
            
            <ConfirmActionModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title={`Confirmar Cancelamento de ${idsToCancel.length} Bipagens`}
                message={
                    <>
                        <p>Esta ação irá reverter o estoque e remover os registros permanentemente.</p>
                        <p className="font-bold text-red-700">Deseja continuar?</p>
                    </>
                }
                confirmButtonText="Sim, Cancelar Bipagens"
                isConfirming={isCancelling}
            />

            <ConfirmActionModal
                isOpen={isHardDeleteModalOpen}
                onClose={() => setIsHardDeleteModalOpen(false)}
                onConfirm={handleConfirmHardDelete}
                title="Confirmar Exclusão Permanente"
                message={
                    <>
                        <p>Esta ação irá remover o registro de bipagem do histórico permanentemente.</p>
                        <p className="font-bold text-red-700">Não haverá reversão de estoque. Use a função "Cancelar Bipagem" para isso.</p>
                        <p>Deseja continuar?</p>
                    </>
                }
                confirmButtonText="Sim, Excluir Registro"
                isConfirming={isHardDeleting}
            />

            <ConfirmActionModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleConfirmBulkDelete}
                title={`Confirmar Exclusão de ${idsToBulkDelete.length} Bipagens`}
                message={
                    <>
                        <p>Esta ação irá remover os registros de bipagem do histórico permanentemente.</p>
                        <p className="font-bold text-red-700">Não haverá reversão de estoque. Deseja continuar?</p>
                    </>
                }
                confirmButtonText="Sim, Excluir Registros"
                isConfirming={isBulkDeleting}
            />
            {currentUser && <BipagemSettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                users={users}
                onSaveUser={onSaveUser}
                addToast={addToast}
                generalSettings={generalSettings}
                setGeneralSettings={setGeneralSettings}
                onAddNewUser={onAddNewUser}
            />}
        </div>
    );
};

const ScanHistory: React.FC<{ history: ScanLogItem[], currentUser: UserType, allOrders: OrderItem[], onOpenCancelModal: (ids: string[]) => void, onOpenHardDeleteModal: (id: string) => void, onOpenBulkDeleteModal: (ids: string[]) => void }> = ({ history, currentUser, allOrders, onOpenCancelModal, onOpenHardDeleteModal, onOpenBulkDeleteModal }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setSelectedIds(new Set());
    }, [history]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(new Set(history.map(item => item.id)));
        else setSelectedIds(new Set());
    };

    const statusIcon = (item: ScanLogItem) => {
        if (item.canal === 'SITE' && (item.status === 'OK' || item.synced)) return <Cloud className="text-blue-500" />;
        if (item.status === 'DUPLICATE') return <X className="text-red-500" />;
        if (item.status === 'CANCELLED') return <Ban className="text-[var(--color-text-secondary)] opacity-50" />;
        if (item.status === 'ADJUSTED') return <Edit className="text-blue-600" />;
        if (item.synced || item.status === 'OK') return <CheckCheck className="text-green-600" />;
        return <AlertCircle className="text-yellow-600" />;
    };
    
    return (
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Histórico de Bipagens</h2>
                {/* FIX: Updated UserRole to align with the database schema */}
                {selectedIds.size > 0 && currentUser.role === 'DONO_SAAS' && (
                     <div className="flex items-center gap-2">
                        <button onClick={() => onOpenBulkDeleteModal(Array.from(selectedIds))} className="flex items-center gap-1 text-xs text-red-600 font-semibold hover:text-red-800"><Trash2 size={14}/> Excluir {selectedIds.size}</button>
                    </div>
                )}
            </div>
            
            {/* Mobile View */}
            <div className="md:hidden space-y-3 overflow-y-auto flex-grow">
                {history.map(item => <ScanCard key={item.id} item={item} allOrders={allOrders} onOpenHardDeleteModal={onOpenHardDeleteModal} onOpenCancelModal={onOpenCancelModal} currentUser={currentUser} />)}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-auto flex-grow border rounded-lg">
                 <table className="min-w-full bg-[var(--color-surface)] text-sm">
                    <thead className="bg-[var(--color-surface-secondary)] sticky top-0 z-10">
                        <tr>
                            <th className="p-2"><input type="checkbox" onChange={handleSelectAll} checked={history.length > 0 && selectedIds.size === history.length} /></th>
                            <th></th>
                            {['Horário', 'Operador', 'Dispositivo', 'Item Bipado', 'Ações'].map(h => <th key={h} className="p-2 text-left font-semibold">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {history.map(item => <ScanRow key={item.id} item={item} allOrders={allOrders} isSelected={selectedIds.has(item.id)} onSelect={() => setSelectedIds(p => {const n = new Set(p); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n;})} onOpenHardDeleteModal={onOpenHardDeleteModal} onOpenCancelModal={onOpenCancelModal} currentUser={currentUser} statusIcon={statusIcon} />)}
                    </tbody>
                 </table>
            </div>
        </div>
    );
};

// FIX: Cannot find namespace 'JSX'. Changed JSX.Element to React.ReactNode.
const ScanRow: React.FC<{item: ScanLogItem, isSelected: boolean, onSelect: () => void, statusIcon: (i: ScanLogItem) => React.ReactNode} & any> = ({ item, isSelected, onSelect, statusIcon, ...props }) => {
    const { allOrders, onOpenHardDeleteModal, onOpenCancelModal, currentUser } = props;
    const order = allOrders.find((o: any) => o.orderId === item.displayKey || o.tracking === item.displayKey);
    return (
        <tr className={isSelected ? 'bg-blue-50' : ''}>
            <td className="p-2"><input type="checkbox" checked={isSelected} onChange={onSelect} /></td>
            <td className="p-2">{statusIcon(item)}</td>
            <td className="p-2 whitespace-nowrap">{item.time.toLocaleString('pt-BR')}</td>
            <td className="p-2">{item.user}</td>
            <td className="p-2">{item.device}</td>
            <td className="p-2 font-mono text-xs">{order ? `${order.sku} (Qtd: ${order.qty_final})` : item.displayKey}</td>
            <td className="p-2">
                {/* FIX: Updated UserRole to align with the database schema */}
                {currentUser.role === 'DONO_SAAS' && (
                    <button onClick={() => onOpenHardDeleteModal(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full" title="Excluir Permanentemente (Sem reverter estoque)">
                        <Trash2 size={14} />
                    </button>
                )}
            </td>
        </tr>
    );
};

const ScanCard: React.FC<{item: ScanLogItem} & any> = ({ item, ...props }) => {
    const { allOrders, onOpenHardDeleteModal, onOpenCancelModal, currentUser } = props;
    const order = allOrders.find((o: any) => o.orderId === item.displayKey || o.tracking === item.displayKey);
    return (
        <div className="p-3 bg-[var(--color-surface-secondary)] rounded-lg border">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{order ? `${order.sku} (x${order.qty_final})` : item.displayKey}</p>
                    <p className="text-xs">{item.time.toLocaleString('pt-BR')} por {item.user}</p>
                </div>
                {/* FIX: Updated UserRole to align with the database schema */}
                <div>{currentUser.role === 'DONO_SAAS' && <button onClick={() => onOpenHardDeleteModal(item.id)}><Trash2 size={16} /></button>}</div>
            </div>
        </div>
    );
}

export default BipagemPage;