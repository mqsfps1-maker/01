
import React, { useState, useMemo } from 'react';
import { ProcessedData, OrderItem, StockItem, SkuLink, ResumidaItem, TotaisPorProdutoItem, MaterialItem, ProdutoCombinado, GeneralSettings, Customer, ProductionGroup, User } from '../types';
import { FileDown, Loader2, Database, CheckCircle, Link as LinkIcon, Edit3, XCircle, PlusCircle, FileWarning, Search, Box, ArrowUp, ArrowDown, Settings, Wrench, ChevronDown, ChevronRight, Eye, EyeOff, AlertTriangle, User as UserIcon, Copy } from 'lucide-react';
import { exportPdf, exportExcel, exportOnlyUnlinked } from '../lib/export';
import { calculateKitComponents } from '../lib/estoque';

type Tab = 'vinculo' | 'completa' | 'resumida' | 'totais' | 'materiais';

// Helper to format miudo quantity for display
const formatMiudoQuantity = (quantity: number, unit: MaterialItem['unit']): string => {
    if (['kg', 'L', 'm'].includes(unit)) {
        return parseFloat(quantity.toFixed(3)).toString();
    }
    return Math.round(quantity).toString();
};


interface ImportResultsProps {
    data: ProcessedData;
    onLaunch: (data: { ordersToCreate: OrderItem[], ordersToUpdate: OrderItem[] }) => void;
    skuLinks: SkuLink[];
    products: StockItem[];
    onLinkSku: (importedSku: string, masterProductSku: string) => void;
    onUnlinkSku: (importedSku: string) => void;
    onOpenLinkModal: (skus: string[], colorSugerida: string) => void;
    onOpenCreateProductModal: (skuData: { sku: string; colorSugerida: string }) => void;
    selectedSkus: Set<string>;
    setSelectedSkus: React.Dispatch<React.SetStateAction<Set<string>>>;
    produtosCombinados: ProdutoCombinado[];
    stockItems: StockItem[];
    generalSettings: GeneralSettings;
    onOpenCategoryConfigModal: () => void; // Novo
    isHistoryView?: boolean;
    customers: Customer[];
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SummaryCard: React.FC<{ title: string, value: string, color: string }> = ({ title, value, color }) => (
    <div style={{ backgroundColor: color, color: '#1E293B' }} className={`p-4 rounded-lg flex-1`}>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);


export const ImportResults: React.FC<ImportResultsProps> = (props) => {
    const { 
        data, onLaunch, skuLinks, products, onLinkSku, onUnlinkSku, 
        onOpenLinkModal, onOpenCreateProductModal, selectedSkus, setSelectedSkus,
        produtosCombinados, stockItems, generalSettings, onOpenCategoryConfigModal,
        isHistoryView = false,
        customers,
        addToast,
    } = props;
    const [activeTab, setActiveTab] = useState<Tab>('vinculo');
    const [isLaunching, setIsLaunching] = useState(false);
    const [hasLaunched, setHasLaunched] = useState(false);
    const [unlinkedSearchTerm, setUnlinkedSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'total_units', direction: 'descending' });
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    
    // State for assigned responsibles
    const [assignedResponsibles, setAssignedResponsibles] = useState<Record<string, string>>({});
    
    const linkedSkusMap = useMemo(() => new Map(skuLinks.map(link => [link.importedSku, link.masterProductSku])), [skuLinks]);
    
    const stockItemMap = useMemo(() => new Map(stockItems.map(item => [item.code, item])), [stockItems]);

    const correctedData = useMemo(() => {
        if (!data) return null;

        const newCompleta = data.lists.completa.map(order => {
            const masterSku = linkedSkusMap.get(order.sku);
            const masterProduct = masterSku ? stockItemMap.get(masterSku) : undefined;
            return {
                ...order,
                color: masterProduct?.color || order.color,
            };
        });

        const resumidaMap = new Map<string, ResumidaItem>();
        newCompleta.forEach(item => {
            let entry = resumidaMap.get(item.sku);
            if (!entry) {
                entry = { sku: item.sku, color: item.color, distribution: {}, total_units: 0 };
                resumidaMap.set(item.sku, entry);
            }
            const packSize = item.qty_final;
            entry.distribution[String(packSize)] = (entry.distribution[String(packSize)] || 0) + 1;
            entry.total_units += item.qty_final;
        });
        const newResumida = Array.from(resumidaMap.values()).sort((a,b) => a.color.localeCompare(b.color));

        const totaisPorProdutoMap = new Map<string, TotaisPorProdutoItem>();
        
        const ordersByOrderId = new Map<string, OrderItem[]>();
        data.lists.completa.forEach(item => {
            if (!ordersByOrderId.has(item.orderId)) {
                ordersByOrderId.set(item.orderId, []);
            }
            ordersByOrderId.get(item.orderId)!.push(item);
        });

        ordersByOrderId.forEach(orderItems => {
            const orderTotalUnits = orderItems.reduce((sum, item) => sum + item.qty_final, 0);
            let groupKey: string;
            let groupLabel: string;

            if (orderItems.length === 1) {
                const item = orderItems[0];
                const masterSku = linkedSkusMap.get(item.sku);
                const masterProduct = masterSku ? stockItemMap.get(masterSku) : undefined;
                
                groupKey = masterProduct ? masterProduct.code : item.sku;
                groupLabel = masterProduct ? masterProduct.name : item.sku;
            } else {
                const productCounts = new Map<string, number>();
                orderItems.forEach(item => {
                    const masterSku = linkedSkusMap.get(item.sku);
                    const masterProduct = masterSku ? stockItemMap.get(masterSku) : undefined;
                    const name = masterProduct ? masterProduct.name : item.sku;
                    productCounts.set(name, (productCounts.get(name) || 0) + item.qty_final);
                });

                const sortedProductEntries = Array.from(productCounts.entries()).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
                
                groupKey = sortedProductEntries.map(([name]) => name).join(' + ');
                groupLabel = `[MÚLTIPLOS] ${sortedProductEntries.map(([name, count]) => `${count}x ${name}`).join(' + ')}`;
            }
            
            let entry = totaisPorProdutoMap.get(groupKey);
            if (!entry) {
                entry = { label: groupLabel, distribution: {}, total_units: 0 };
            }
            
            const packSize = orderTotalUnits;
            entry.distribution[String(packSize)] = (entry.distribution[String(packSize)] || 0) + 1;
            
            entry.total_units += orderTotalUnits;
            
            totaisPorProdutoMap.set(groupKey, entry);
        });

        const newTotaisPorProduto = Array.from(totaisPorProdutoMap.values());
        
        const newListaDeMateriais = calculateKitComponents(data.lists.completa, skuLinks, stockItems, produtosCombinados);
        
        return {
            ...data,
            lists: {
                ...data.lists,
                completa: newCompleta,
                resumida: newResumida,
                totaisPorProduto: newTotaisPorProduto,
                listaDeMateriais: newListaDeMateriais,
            },
        };
    }, [data, linkedSkusMap, stockItemMap, produtosCombinados, skuLinks, stockItems]);
    
    
    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const sortedTotaisPorProduto = useMemo(() => {
        if (!correctedData?.lists.totaisPorProduto) return [];
        const sortableItems: TotaisPorProdutoItem[] = [...correctedData.lists.totaisPorProduto];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'label') {
                    if (a.label.startsWith('[MÚLTIPLOS]')) return 1;
                    if (b.label.startsWith('[MÚLTIPLOS]')) return -1;
                    const comparison = a.label.localeCompare(b.label);
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                } else if (sortConfig.key === 'total_units') {
                    const comparison = a.total_units - b.total_units;
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [correctedData, sortConfig]);

    const handleLaunch = () => {
        if (!data) return;
        setIsLaunching(true);
        onLaunch({
            ordersToCreate: data.ordersToCreate,
            ordersToUpdate: data.ordersToUpdate,
        });
        setHasLaunched(true);
        setIsLaunching(false);
    };

    const handleSelectAllUnlinked = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedSkus(new Set(filteredUnlinkedSkus.map(s => s.sku)));
        } else {
            setSelectedSkus(new Set());
        }
    };

    const toggleSkuSelection = (sku: string) => {
        setSelectedSkus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sku)) {
                newSet.delete(sku);
            } else {
                newSet.add(sku);
            }
            return newSet;
        });
    };
    
    const handleBulkLink = () => {
        if (selectedSkus.size === 0) return;
        const skus = Array.from(selectedSkus);
        const firstSkuData = data?.skusNaoVinculados.find(s => s.sku === skus[0]);
        onOpenLinkModal(skus, firstSkuData?.colorSugerida || 'Padrão');
    };
    
    const handleAssignResponsible = (itemLabel: string, responsibleName: string) => {
        setAssignedResponsibles(prev => ({
            ...prev,
            [itemLabel]: responsibleName
        }));
    }

    const filteredUnlinkedSkus = useMemo(() => {
        if (!correctedData) return [];
        return correctedData.skusNaoVinculados.filter(skuData => 
            !linkedSkusMap.has(skuData.sku) &&
            skuData.sku.toLowerCase().includes(unlinkedSearchTerm.toLowerCase())
        );
    }, [correctedData, linkedSkusMap, unlinkedSearchTerm]);
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast('Copiado para a área de transferência!', 'success');
    }

    if (!correctedData) {
        return <div className="mt-8 text-center text-gray-500">Nenhum dado processado.</div>;
    }
    
    const allLinked = filteredUnlinkedSkus.length === 0;

    return (
        <div className="mt-8 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <div className="flex-1 bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Resumo da Importação</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard title="Total de Pedidos" value={data.summary.totalPedidos.toString()} color="var(--color-info-bg)" />
                        <SummaryCard title="Total de Pacotes" value={data.summary.totalPacotes.toString()} color="var(--color-info-bg)" />
                        <SummaryCard title="Total de Unidades" value={data.summary.totalUnidades.toString()} color="var(--color-info-bg)" />
                        <SummaryCard title="SKUs não vinculados" value={filteredUnlinkedSkus.length.toString()} color={allLinked ? "var(--color-success-bg)" : "var(--color-warning-bg)"} />
                    </div>
                </div>
                {!isHistoryView && (
                    <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Ações</h2>
                        <div className="space-y-2">
                             <div className="bg-[var(--color-surface-secondary)] p-3 rounded-md text-sm">
                                <p><strong>{data.idempotencia.lancaveis}</strong> pedidos prontos para lançar.</p>
                                <p><strong>{data.idempotencia.jaSalvos}</strong> pedidos já salvos (ignorados).</p>
                                <p><strong>{data.idempotencia.atualizaveis}</strong> pedidos com dados atualizados (rastreio).</p>
                            </div>
                            <button
                                onClick={handleLaunch}
                                disabled={isLaunching || hasLaunched || data.ordersToCreate.length === 0}
                                className="w-full flex items-center justify-center text-lg font-bold bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50"
                            >
                                {isLaunching ? <Loader2 size={24} className="animate-spin mr-3"/> : <Database size={24} className="mr-3"/>}
                                {hasLaunched ? 'Pedidos Lançados' : 'Lançar Pedidos Vinculados'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <div className="flex overflow-x-auto">
                        {['vinculo', 'completa', 'resumida', 'totais', 'materiais'].map((tab) => (
                             <button
                                key={tab}
                                onClick={() => setActiveTab(tab as Tab)}
                                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                    activeTab === tab 
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)]' 
                                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-gray-300'
                                }`}
                            >
                                {tab === 'vinculo' && `Vínculo de SKUs (${filteredUnlinkedSkus.length})`}
                                {tab === 'completa' && 'Lista Completa (Por Pedido)'}
                                {tab === 'resumida' && 'Resumida (Por SKU)'}
                                {tab === 'totais' && 'Totais (Por Produto)'}
                                {tab === 'materiais' && 'Lista de Materiais'}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="p-6">
                    {/* --- ABA VÍNCULO DE SKUS --- */}
                    {activeTab === 'vinculo' && (
                        <div>
                             <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                                    <input type="text" placeholder="Buscar SKU não vinculado..." value={unlinkedSearchTerm} onChange={e => setUnlinkedSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 border rounded-md text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)]" />
                                </div>
                                <div className="flex gap-2">
                                     <button onClick={() => exportOnlyUnlinked(correctedData, skuLinks)} className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
                                        <FileDown size={16} /> Exportar Pendentes (Excel)
                                    </button>
                                     {selectedSkus.size > 0 && (
                                        <button onClick={handleBulkLink} className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-hover)]">
                                            <LinkIcon size={16} /> Vincular {selectedSkus.size} Selecionados
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {filteredUnlinkedSkus.length > 0 ? (
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-[var(--color-surface-secondary)]">
                                            <tr>
                                                <th className="p-3 w-10"><input type="checkbox" onChange={handleSelectAllUnlinked} checked={filteredUnlinkedSkus.length > 0 && selectedSkus.size === filteredUnlinkedSkus.length} /></th>
                                                <th className="p-3 text-left">SKU Importado</th>
                                                <th className="p-3 text-left">Cor Sugerida</th>
                                                <th className="p-3 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--color-border)]">
                                            {filteredUnlinkedSkus.map(item => (
                                                <tr key={item.sku} className={`hover:bg-[var(--color-surface-secondary)] ${selectedSkus.has(item.sku) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                    <td className="p-3"><input type="checkbox" checked={selectedSkus.has(item.sku)} onChange={() => toggleSkuSelection(item.sku)} /></td>
                                                    <td className="p-3 font-mono">{item.sku}</td>
                                                    <td className="p-3">{item.colorSugerida}</td>
                                                    <td className="p-3 flex justify-center gap-2">
                                                        <button onClick={() => onOpenLinkModal([item.sku], item.colorSugerida)} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">Vincular</button>
                                                        <button onClick={() => onOpenCreateProductModal(item)} className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200">Criar</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                                    <p className="text-lg font-medium text-[var(--color-text-primary)]">Tudo certo!</p>
                                    <p className="text-[var(--color-text-secondary)]">Todos os SKUs importados já estão vinculados.</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* --- ABA LISTA COMPLETA (POR PEDIDO) --- */}
                    {activeTab === 'completa' && (
                         <div>
                            <div className="flex justify-end mb-4 gap-2">
                                 <button onClick={() => copyToClipboard(correctedData.lists.completa.map(o => `${o.qty_final}x ${o.sku}`).join('\n'))} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                    <Copy size={16} /> Copiar Lista
                                </button>
                                <button onClick={() => exportPdf('completa', correctedData, skuLinks)} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                                    <FileDown size={16} /> Exportar PDF
                                </button>
                                <button onClick={() => exportExcel(correctedData, skuLinks)} className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
                                    <FileDown size={16} /> Exportar Excel
                                </button>
                            </div>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-[var(--color-surface-secondary)]">
                                        <tr>
                                            <th className="p-3 text-left">Pedido</th>
                                            <th className="p-3 text-left">Rastreio</th>
                                            <th className="p-3 text-left">SKU</th>
                                            <th className="p-3 text-center">Qtd</th>
                                            <th className="p-3 text-left">Cor</th>
                                            <th className="p-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {correctedData.lists.completa.map((order, idx) => {
                                            const isLinked = linkedSkusMap.has(order.sku);
                                            return (
                                                <tr key={idx} className="hover:bg-[var(--color-surface-secondary)]">
                                                    <td className="p-3 font-mono text-xs">{order.orderId}</td>
                                                    <td className="p-3 font-mono text-xs">{order.tracking}</td>
                                                    <td className="p-3">{order.sku}</td>
                                                    <td className="p-3 text-center font-bold">{order.qty_final}</td>
                                                    <td className="p-3">{order.color}</td>
                                                    <td className="p-3 text-center">
                                                        {isLinked ? 
                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Vinculado</span> : 
                                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pendente</span>
                                                        }
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                     {/* --- ABA RESUMIDA --- */}
                    {activeTab === 'resumida' && (
                        <div>
                             <div className="flex justify-end mb-4 gap-2">
                                <button onClick={() => exportPdf('resumida', correctedData, skuLinks)} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                                    <FileDown size={16} /> Exportar PDF
                                </button>
                            </div>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-[var(--color-surface-secondary)]">
                                        <tr>
                                            <th className="p-3 text-left">SKU Importado</th>
                                            <th className="p-3 text-left">Cor</th>
                                            <th className="p-3 text-center">Total Unidades</th>
                                            <th className="p-3 text-left">Distribuição (Pacotes)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {correctedData.lists.resumida.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-[var(--color-surface-secondary)]">
                                                <td className="p-3 font-mono">{item.sku}</td>
                                                <td className="p-3">{item.color}</td>
                                                <td className="p-3 text-center font-bold text-lg">{item.total_units}</td>
                                                <td className="p-3 text-xs text-[var(--color-text-secondary)]">
                                                    {Object.entries(item.distribution).map(([size, count]) => (
                                                        <span key={size} className="mr-2 bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded">
                                                            {count}x {size} un.
                                                        </span>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- ABA TOTAIS (POR PRODUTO) --- */}
                    {activeTab === 'totais' && (
                        <div>
                             <div className="flex justify-end mb-4 gap-2">
                                <button onClick={() => exportPdf('totais', correctedData, skuLinks)} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                                    <FileDown size={16} /> Exportar PDF
                                </button>
                            </div>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-[var(--color-surface-secondary)]">
                                        <tr>
                                            <th className="p-3 text-left">
                                                <button onClick={() => requestSort('label')} className="flex items-center gap-1 font-semibold">Produto <ArrowDown size={14}/></button>
                                            </th>
                                            <th className="p-3 text-center">
                                                 <button onClick={() => requestSort('total_units')} className="flex items-center gap-1 font-semibold mx-auto">Total Unidades <ArrowDown size={14}/></button>
                                            </th>
                                            <th className="p-3 text-left">Distribuição</th>
                                             <th className="p-3 text-left">Responsável</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {sortedTotaisPorProduto.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-[var(--color-surface-secondary)]">
                                                <td className="p-3 font-medium">{item.label}</td>
                                                <td className="p-3 text-center font-bold text-lg">{item.total_units}</td>
                                                <td className="p-3 text-xs text-[var(--color-text-secondary)]">
                                                    {Object.entries(item.distribution).map(([size, count]) => (
                                                        <span key={size} className="mr-2 bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded">
                                                            {count} pacotes de {size}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td className="p-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Nome..." 
                                                        className="p-1 border rounded text-xs w-24"
                                                        value={assignedResponsibles[item.label] || ''}
                                                        onChange={(e) => handleAssignResponsible(item.label, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-[var(--color-surface-tertiary)] font-bold">
                                            <td className="p-3 text-right">TOTAL GERAL:</td>
                                            <td className="p-3 text-center text-xl">{sortedTotaisPorProduto.reduce((sum, i) => sum + i.total_units, 0)}</td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
