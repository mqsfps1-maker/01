
import React, { useState, useMemo, useEffect } from 'react';
import { OrderItem, ScanLogItem, Canal, GeneralSettings, User, BipStatus } from '../types';
import { Search, ArrowUp, ArrowDown, CheckCheck, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import ConfirmActionModal from '../components/ConfirmActionModal';
import Pagination from '../components/Pagination';
import { dbClient } from '../lib/supabaseClient';

interface PedidosPageProps {
    allOrders: OrderItem[];
    scanHistory: ScanLogItem[];
    setAllOrders: (orders: OrderItem[] | ((prev: OrderItem[]) => OrderItem[])) => void;
    setScanHistory: (scans: ScanLogItem[] | ((prev: ScanLogItem[]) => ScanLogItem[])) => void;
    currentUser: User;
    generalSettings: GeneralSettings;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onDeleteOrders: (orderIds: string[]) => void;
}

type DisplayStatus = 'NORMAL' | 'BIPADO' | 'ATRASADO';

const getDisplayStatus = (order: OrderItem): DisplayStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDateStr = String(order.data || '').split('/').reverse().join('-');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(orderDateStr)) return 'NORMAL';
    const orderDate = new Date(orderDateStr + "T12:00:00Z");
    if (isNaN(orderDate.getTime())) return 'NORMAL';
    orderDate.setHours(0, 0, 0, 0);

    if (order.status === 'NORMAL' && orderDate < today) {
        return 'ATRASADO';
    }
    if (order.status === 'BIPADO') {
        return 'BIPADO';
    }
    return 'NORMAL';
};

const PedidosPage: React.FC<PedidosPageProps> = ({ allOrders, scanHistory, setAllOrders, setScanHistory, currentUser, generalSettings, addToast, onDeleteOrders }) => {
    // Estado padrão inicial
    const defaultFilters = {
        search: '',
        canal: 'ALL' as Canal,
        status: 'ALL' as DisplayStatus | 'ALL',
    };

    const [filters, setFilters] = useState(defaultFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [sortConfig, setSortConfig] = useState<{ key: keyof OrderItem, direction: 'asc' | 'desc' }>({ key: 'data', direction: 'desc' });
    
    // Estados de controle de UI
    const [selectedOrderGroupKeys, setSelectedOrderGroupKeys] = useState<Set<string>>(new Set());
    const [isConfirmBipModalOpen, setIsConfirmBipModalOpen] = useState(false);
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [isConfirmDeleteAllModalOpen, setIsConfirmDeleteAllModalOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [arePrefsLoaded, setArePrefsLoaded] = useState(false);

    // Carregar preferências do Banco de Dados
    useEffect(() => {
        const loadPreferences = async () => {
            if (!currentUser?.organization_id) return;
            try {
                const { data } = await dbClient
                    .from('app_settings')
                    .select('value')
                    .eq('organization_id', currentUser.organization_id)
                    .eq('key', `prefs_pedidos_${currentUser.id}`)
                    .single();

                if (data && data.value) {
                    const prefs = data.value;
                    if (prefs.filters) setFilters(prefs.filters);
                    if (prefs.itemsPerPage) setItemsPerPage(prefs.itemsPerPage);
                    if (prefs.sortConfig) setSortConfig(prefs.sortConfig);
                }
            } catch (error) {
                console.error("Erro ao carregar preferências de pedidos:", error);
            } finally {
                setArePrefsLoaded(true);
            }
        };
        loadPreferences();
    }, [currentUser]);

    // Função para salvar preferências (Debounced)
    const savePreferences = useMemo(() => {
        let timeoutId: any;
        return (newPrefs: any) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                if (!currentUser?.organization_id) return;
                
                const payload = {
                    filters: newPrefs.filters !== undefined ? newPrefs.filters : filters,
                    itemsPerPage: newPrefs.itemsPerPage !== undefined ? newPrefs.itemsPerPage : itemsPerPage,
                    sortConfig: newPrefs.sortConfig !== undefined ? newPrefs.sortConfig : sortConfig
                };

                try {
                    await dbClient.from('app_settings').upsert({
                        organization_id: currentUser.organization_id,
                        key: `prefs_pedidos_${currentUser.id}`,
                        value: payload
                    });
                } catch (error) {
                    console.error("Erro ao salvar preferências:", error);
                }
            }, 1000);
        };
    }, [currentUser, filters, itemsPerPage, sortConfig]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setCurrentPage(1);
        setSelectedOrderGroupKeys(new Set());
        savePreferences({ filters: newFilters });
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVal = Number(e.target.value);
        setItemsPerPage(newVal);
        setCurrentPage(1);
        savePreferences({ itemsPerPage: newVal });
    };

    const requestSort = (key: keyof OrderItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        const newSort = { key, direction };
        setSortConfig(newSort);
        setCurrentPage(1);
        savePreferences({ sortConfig: newSort });
    };

    const groupedAndSortedOrders = useMemo(() => {
        const searchLower = filters.search.toLowerCase();

        const filtered = allOrders.filter(order => {
            const displayStatus = getDisplayStatus(order);
            if (filters.canal !== 'ALL' && order.canal !== filters.canal) return false;
            if (filters.status !== 'ALL' && displayStatus !== filters.status) return false;
            if (searchLower && !(
                order.orderId.toLowerCase().includes(searchLower) ||
                (order.tracking && order.tracking.toLowerCase().includes(searchLower)) ||
                order.sku.toLowerCase().includes(searchLower) ||
                order.customer_name?.toLowerCase().includes(searchLower)
            )) return false;
            return true;
        });

        const groups = new Map<string, OrderItem[]>();
        filtered.forEach(order => {
            const key = order.orderId;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(order);
        });
        const grouped = Array.from(groups.values());

        grouped.sort((groupA, groupB) => {
            const a = groupA[0];
            const b = groupB[0];
            const aVal = a[sortConfig.key] || '';
            const bVal = b[sortConfig.key] || '';
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return a.orderId.localeCompare(b.orderId);
        });
        
        return grouped;
    }, [allOrders, filters, sortConfig]);

    const totalPages = Math.ceil(groupedAndSortedOrders.length / itemsPerPage);
    const paginatedOrderGroups = groupedAndSortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSelectGroup = (orderId: string, isSelected: boolean) => {
        setSelectedOrderGroupKeys(prev => {
            const newSet = new Set(prev);
            if (isSelected) newSet.add(orderId);
            else newSet.delete(orderId);
            return newSet;
        });
    };

    const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedOrderGroupKeys(new Set(paginatedOrderGroups.map(group => group[0].orderId)));
        } else {
            setSelectedOrderGroupKeys(new Set());
        }
    };
    
    const handleMarkAsBipped = async () => {
        setIsConfirmBipModalOpen(false);
        const orderIdsToUpdate = Array.from(selectedOrderGroupKeys);
        
        if (orderIdsToUpdate.length === 0) return;
    
        const ordersToUpdate = allOrders.filter(o => orderIdsToUpdate.includes(o.orderId) && o.status !== 'BIPADO');
    
        const newScansPayload = ordersToUpdate.map(order => ({
            scanned_at: new Date().toISOString(),
            user_id: currentUser.id,
            user_name: currentUser.name,
            device: 'Ação Manual em Lote',
            display_key: String(order.orderId || order.tracking || order.id),
            status: 'OK' as BipStatus,
            synced: true,
            canal: order.canal,
            organization_id: currentUser.organization_id,
        }));
        
        const orderUpdatesPayload = ordersToUpdate.map(o => ({
            id: o.id,
            order_id: o.orderId,
            sku: o.sku,
            organization_id: currentUser.organization_id,
            status: 'BIPADO' as const
        }));
    
        try {
            // Insert scan logs
            const { error: scanError } = await dbClient.from('scan_logs').insert(newScansPayload);
            if (scanError) {
                console.error('Scan log error:', scanError);
                addToast(`Erro ao registrar bipagem. Tente novamente.`, 'error');
                return;
            }

            // Update orders using upsert with proper unique constraint fields
            const { error: orderError } = await dbClient
                .from('orders')
                .upsert(orderUpdatesPayload, {
                    onConflict: 'organization_id,order_id,sku'
                });
            
            if (orderError) {
                console.error('Order update error:', orderError);
                addToast(`Erro ao atualizar pedidos como bipados. Tente novamente.`, 'error');
                return;
            }
            
            addToast(`${orderIdsToUpdate.length} pedido(s) marcado(s) como bipado(s).`, 'success');
            setSelectedOrderGroupKeys(new Set());
        } catch (err: any) {
            console.error('Error marking orders as bipped:', err);
            addToast(`Erro ao marcar pedidos como bipados. Tente novamente.`, 'error');
        }
    };
    
    const handleDeleteSelected = () => {
        onDeleteOrders(Array.from(selectedOrderGroupKeys));
        setSelectedOrderGroupKeys(new Set());
        setIsConfirmDeleteModalOpen(false);
    };

    const handleDeleteAll = async () => {
        if (allOrders.length === 0) {
            addToast('Nenhum pedido para excluir.', 'info');
            return;
        }

        try {
            // Delete all orders for this organization
            const { error } = await dbClient
                .from('orders')
                .delete()
                .eq('organization_id', currentUser.organization_id);
            
            if (error) {
                console.error('Error deleting all orders:', error);
                addToast('Erro ao excluir todos os pedidos. Tente novamente.', 'error');
                return;
            }

            // Also delete related scan logs
            await dbClient
                .from('scan_logs')
                .delete()
                .eq('organization_id', currentUser.organization_id);

            setAllOrders([]);
            setScanHistory([]);
            setSelectedOrderGroupKeys(new Set());
            addToast(`Todos os ${allOrders.length} pedido(s) e registros de bipagem foram excluídos.`, 'success');
        } catch (err: any) {
            console.error('Error deleting all orders:', err);
            addToast('Erro ao excluir pedidos. Tente novamente.', 'error');
        }
    };

    const toggleGroupExpansion = (orderId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const SortableHeader: React.FC<{ label: string, sortKey: keyof OrderItem }> = ({ label, sortKey }) => {
        const isSorted = sortConfig.key === sortKey;
        const Icon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
        return (
            <th className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">
                <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1 hover:text-[var(--color-primary)]">
                    {label}
                    {isSorted && <Icon size={14}/>}
                </button>
            </th>
        );
    };

    const isAllOnPageSelected = paginatedOrderGroups.length > 0 && paginatedOrderGroups.every(g => selectedOrderGroupKeys.has(g[0].orderId));

    if (!arePrefsLoaded) {
        return <div className="p-8 text-center text-gray-500">Carregando preferências...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Consultar Pedidos</h1>
                <p className="text-[var(--color-text-secondary)] mt-1 mb-6">Visualize e filtre todos os pedidos importados no sistema.</p>
            </div>

            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm flex-grow flex flex-col">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-grow min-w-[250px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                            <input type="text" placeholder="Buscar por pedido, SKU, cliente..." value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border-[var(--color-border)] bg-[var(--color-surface-secondary)] rounded-md"/>
                        </div>
                        <select value={filters.canal} onChange={e => handleFilterChange('canal', e.target.value)} className="p-2 text-sm border-[var(--color-border)] rounded-md bg-[var(--color-surface)]">
                            <option value="ALL">Todos Canais</option>
                            <option value="ML">Mercado Livre</option>
                            <option value="SHOPEE">Shopee</option>
                        </select>
                        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="p-2 text-sm border-[var(--color-border)] rounded-md bg-[var(--color-surface)]">
                            <option value="ALL">Todos Status</option>
                            {(['NORMAL', 'ATRASADO', 'BIPADO'] as const).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                         <select 
                            id="items-per-page"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={50}>50 / pág</option>
                            <option value={100}>100 / pág</option>
                            <option value={200}>200 / pág</option>
                            <option value={500}>500 / pág</option>
                            <option value={1000}>1000 / pág</option>
                        </select>
                    </div>
                </div>

                {selectedOrderGroupKeys.size > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                        <span className="font-semibold text-blue-800">{selectedOrderGroupKeys.size} pedido(s) selecionado(s)</span>
                        <div className="flex items-center gap-2">
                            {generalSettings.bipagem.enableBipagem && (
                                <button onClick={() => setIsConfirmBipModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">
                                    <CheckCheck size={16}/> Marcar como Bipados
                                </button>
                            )}
                             {currentUser.role === 'DONO_SAAS' && (
                                <button onClick={() => setIsConfirmDeleteModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700">
                                    <Trash2 size={16}/> Excluir Selecionados
                                </button>
                             )}
                        </div>
                    </div>
                )}

                {allOrders.length > 0 && currentUser.role === 'DONO_SAAS' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                        <span className="font-semibold text-red-800">Zona de Perigo: {allOrders.length} pedido(s) total</span>
                        <button 
                            onClick={() => {
                                if (window.confirm('Tem CERTEZA que deseja excluir TODOS os pedidos e registros de bipagem? Esta ação NÃO pode ser desfeita!')) {
                                    handleDeleteAll();
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-700 text-white font-semibold rounded-md shadow-sm hover:bg-red-900"
                        >
                            <Trash2 size={16}/> Excluir Tudo
                        </button>
                    </div>
                )}
                
                <div className="flex-grow overflow-auto rounded-lg border border-[var(--color-border)] min-h-0">
                    <table className="min-w-full text-sm">
                        <thead className="bg-[var(--color-surface-secondary)] sticky top-0">
                            <tr>
                                <th className="py-2 px-3 w-10"><input type="checkbox" checked={isAllOnPageSelected} onChange={handleSelectAllOnPage} /></th>
                                <SortableHeader label="Data" sortKey="data" />
                                <th className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">Canal</th>
                                <th className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">Pedido</th>
                                <SortableHeader label="Cliente" sortKey="customer_name" />
                                <th className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">SKU</th>
                                <th className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">Qtd.</th>
                                <SortableHeader label="Status" sortKey="status" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                           {paginatedOrderGroups.map(group => {
                                const firstOrder = group[0];
                                const orderId = firstOrder.orderId;
                                const isSelected = selectedOrderGroupKeys.has(orderId);
                                const isExpanded = expandedGroups.has(orderId);
                                const isMultiItem = group.length > 1;
                                
                                return (
                                    <React.Fragment key={orderId}>
                                        <tr className={`hover:bg-[var(--color-surface-secondary)] ${isSelected ? 'bg-blue-50' : ''}`}>
                                            <td className="py-2 px-3"><input type="checkbox" checked={isSelected} onChange={(e) => handleSelectGroup(orderId, e.target.checked)} /></td>
                                            <td className="py-2 px-3">{new Date(firstOrder.data + 'T12:00:00Z').toLocaleDateString('pt-BR')}</td>
                                            <td className="py-2 px-3">{firstOrder.canal}</td>
                                            <td className="py-2 px-3 font-mono text-xs">{orderId}</td>
                                            <td className="py-2 px-3">{firstOrder.customer_name || '-'}</td>
                                            <td className="py-2 px-3">
                                                {isMultiItem ? (
                                                    <button onClick={() => toggleGroupExpansion(orderId)} className="flex items-center text-blue-600 font-semibold">
                                                        {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Múltiplos ({group.length})
                                                    </button>
                                                ) : firstOrder.sku}
                                            </td>
                                            <td className="py-2 px-3 text-center font-bold">{group.reduce((sum, item) => sum + item.qty_final, 0)}</td>
                                            <td className="py-2 px-3 font-semibold">{getDisplayStatus(firstOrder)}</td>
                                        </tr>
                                        {isExpanded && isMultiItem && group.map((item, idx) => (
                                            <tr key={item.id} className={`bg-[var(--color-surface-secondary)] ${isSelected ? 'bg-blue-100' : ''}`}>
                                                <td colSpan={5}></td>
                                                <td className="py-1 px-3 pl-8 text-xs">{item.sku}</td>
                                                <td className="py-1 px-3 text-center text-xs font-semibold">{item.qty_final}</td>
                                                <td></td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                           })}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    currentPage={currentPage}
                    totalItems={groupedAndSortedOrders.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />

                {/* Zona de Perigo */}
                <div className="mt-6 p-4 rounded-lg border border-red-300 bg-red-50">
                    <h3 className="text-lg font-bold text-red-700 mb-3">⚠️ Zona de Perigo</h3>
                    <p className="text-sm text-red-600 mb-4">Excluir todos os pedidos é uma ação irreversível. Todos os pedidos e registros de bipagem serão removidos permanentemente.</p>
                    <button
                        onClick={() => setIsConfirmDeleteAllModalOpen(true)}
                        disabled={allOrders.length === 0}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={16} className="inline mr-2" />
                        Excluir Tudo
                    </button>
                </div>
            </div>

            <ConfirmActionModal
                isOpen={isConfirmBipModalOpen}
                onClose={() => setIsConfirmBipModalOpen(false)}
                onConfirm={handleMarkAsBipped}
                title={`Marcar ${selectedOrderGroupKeys.size} Pedido(s) como Bipado(s)`}
                message={
                    <>
                        <p>Esta ação irá alterar o status dos pedidos selecionados para "BIPADO" e criará um registro de bipagem manual para cada item.</p>
                        <p className="font-bold">O estoque NÃO será deduzido novamente.</p>
                        <p>Deseja continuar?</p>
                    </>
                }
                confirmButtonText="Sim, Marcar como Bipado"
            />
            
             <ConfirmActionModal
                isOpen={isConfirmDeleteModalOpen}
                onClose={() => setIsConfirmDeleteModalOpen(false)}
                onConfirm={handleDeleteSelected}
                title={`Excluir ${selectedOrderGroupKeys.size} Pedido(s)`}
                message={
                    <>
                        <p>Esta ação removerá permanentemente os pedidos selecionados e seus respectivos registros de bipagem.</p>
                        <p className="font-bold text-red-700">Esta ação é irreversível.</p>
                        <p>Deseja continuar?</p>
                    </>
                }
                confirmButtonText="Sim, Excluir Pedidos"
            />

            <ConfirmActionModal
                isOpen={isConfirmDeleteAllModalOpen}
                onClose={() => setIsConfirmDeleteAllModalOpen(false)}
                onConfirm={handleDeleteAll}
                title="Excluir TODOS os Pedidos"
                message={
                    <>
                        <p>Você está prestes a <strong>DELETAR PERMANENTEMENTE</strong> todos os pedidos do seu sistema:</p>
                        <p className="font-bold text-lg text-red-700 my-3">{allOrders.length} Pedidos</p>
                        <p className="text-red-600">Esta ação:</p>
                        <ul className="list-disc ml-6 text-red-600 mb-3">
                            <li>Removerá todos os pedidos importados</li>
                            <li>Apagará todos os registros de bipagem</li>
                            <li>É irreversível e não pode ser desfeita</li>
                        </ul>
                        <p className="font-bold text-red-700">Tem certeza absoluta?</p>
                    </>
                }
                confirmButtonText="Sim, Excluir TUDO"
            />
        </div>
    );
};

export default PedidosPage;
