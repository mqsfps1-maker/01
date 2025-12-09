
import React, { useMemo, useState } from 'react';
// FIX: Import useNavigate
import { useNavigate } from 'react-router-dom';
import { Tag, Package, CheckCircle, AlertTriangle, UploadCloud, Inbox, Archive, ShoppingCart, Clock, QrCode, RefreshCw } from 'lucide-react';
import { OrderItem, ScanLogItem, StockItem, GeneralSettings, Page, ImportHistoryItem, ActionCardData } from '../types';
import OrderListModal from '../components/OrderListModal';
import InfoListModal from '../components/InfoListModal';
import ConfigureLowStockModal from '../components/ConfigureLowStockModal';
import ActionCard from '../components/ActionCard';

interface DashboardPageProps {
    allOrders: OrderItem[];
    scanHistory: ScanLogItem[];
    stockItems: StockItem[];
    generalSettings: GeneralSettings;
    importHistory: ImportHistoryItem[];
    onBulkUpdateStockItems: (updates: { id: string, min_qty: number }[]) => void;
    subscription?: any;
    // Nova prop para atualizar dados sem recarregar
    onRefresh?: () => Promise<void>;
}

const StatCard: React.FC<{ title: string; value: string; change?: string; icon: React.ReactNode; onClick?: () => void }> = ({ title, value, change, icon, onClick }) => (
    <div 
        className={`bg-[var(--color-surface)] p-5 rounded-lg border border-[var(--color-border)] shadow-sm flex-1 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all' : ''}`}
        onClick={onClick}
    >
        <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
            <div className="text-[var(--color-primary)]">
                {icon}
            </div>
        </div>
        <p className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</p>
        {change && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{change}</p>}
    </div>
);

const PlanUsageCard: React.FC<{ subscription?: any }> = ({ subscription }) => {
    const planName = subscription?.plan?.name || 'Plano Teste';
    const isFree = planName.includes('Teste') || planName.includes('Grátis');

    const labelCount = subscription?.monthly_label_count || 0;
    const rawLimit = subscription?.plan?.label_limit;
    const labelLimit = typeof rawLimit === 'number' ? rawLimit : (isFree ? 100 : Infinity);
    const limitText = Number.isFinite(labelLimit) ? labelLimit.toLocaleString() : 'Ilimitado';

    const percentage = Number.isFinite(labelLimit) && labelLimit > 0 ? Math.min((labelCount / labelLimit) * 100, 100) : 0;

    const daysRemaining = subscription?.period_end 
        ? Math.ceil((new Date(subscription.period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
        : 0;

    const bonus = subscription?.bonus_balance || 0;

    return (
    <a href="#/app/assinatura" className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)] shadow-sm h-full flex flex-col hover:shadow-md transition-shadow">
        <h3 className="text-md font-semibold text-[var(--color-text-primary)] mb-4">Uso do Plano</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-2">Seu plano atual é o <span className="font-semibold text-[var(--color-primary)]">{planName}</span>.</p>
        {bonus > 0 && (
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">Saldo de bônus: <span className="font-semibold text-[var(--color-primary)]">{bonus.toLocaleString()} etiquetas</span></p>
        )}
        <div className="space-y-4 flex-grow">
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Etiquetas Geradas (Mês)</span>
                    <span className="font-semibold">{labelCount.toLocaleString()} / {limitText}</span>
                </div>
                <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2.5">
                    <div className="bg-[var(--color-primary)] h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Dias Restantes</span>
                    <span className="font-semibold">{daysRemaining} dias</span>
                </div>
                <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2.5">
                    <div className="bg-[var(--color-primary)] h-2.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
            </div>
        </div>
        <button className="w-full mt-4 px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors">
            Gerenciar Assinatura
        </button>
    </a>
)};

const OrderItemCard: React.FC<{ order: OrderItem, color: string }> = ({ order, color }) => (
    <div className={`bg-[var(--color-surface)] p-2 rounded-md border-l-4 shadow-sm`} style={{ borderColor: color }}>
        <p className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">{order.orderId}</p>
        <p className="text-xs text-[var(--color-text-secondary)] truncate">{order.customer_name || 'Cliente não informado'}</p>
        <p className="text-xs text-[var(--color-text-primary)] font-medium">{order.sku} (x{order.qty_final})</p>
    </div>
);

const MultiSkuCard: React.FC<{ group: OrderItem[] }> = ({ group }) => {
    const firstOrder = group[0];
    const isML = firstOrder.canal === 'ML';
    return (
        <div className="flex-shrink-0 w-48 mx-2 bg-[var(--color-surface)] p-2 rounded-lg shadow-md border-l-4 border-[var(--color-multi-sku)]">
            <div className="flex justify-between items-center">
                <p className="font-mono text-xs font-bold truncate text-[var(--color-text-primary)]">{firstOrder.orderId}</p>
                <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                    isML ? 'bg-[var(--color-ml)] text-[var(--color-ml-text)]' 
                         : 'bg-[var(--color-shopee)] text-[var(--color-shopee-text)]'
                }`}>
                    {firstOrder.canal}
                </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{group.length} SKUs, {group.reduce((sum, i) => sum + i.qty_final, 0)} un.</p>
        </div>
    );
};

const DashboardPage: React.FC<DashboardPageProps> = ({ allOrders, scanHistory, stockItems, generalSettings, onBulkUpdateStockItems, subscription, onRefresh }) => {
    const navigate = useNavigate(); 
    
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isConfigureLowStockModalOpen, setIsConfigureLowStockModalOpen] = useState(false);
    const [infoModalState, setInfoModalState] = useState<{
        isOpen: boolean;
        title: string;
        items: { key: string; primary: string; secondary?: string }[];
    }>({ isOpen: false, title: '', items: [] });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const todayString = new Date().toISOString().split('T')[0];

    const todayOrders = useMemo(() => {
        return allOrders.filter(o => {
            const orderDateStr = String(o.data || '').split('T')[0];
            const formattedDate = orderDateStr.split('/').reverse().join('-');
            if (formattedDate.length === 10) {
                 return formattedDate === todayString;
            }
            return orderDateStr === todayString;
        });
    }, [allOrders, todayString]);

    const pedidosImportadosHoje = todayOrders.length;

    const bipadosHojeItems = useMemo(() => {
        return scanHistory
            .filter(s => {
                if (!s.time) return false;
                const scanDate = new Date(s.time).toISOString().split('T')[0];
                return scanDate === todayString && (s.status === 'OK' || s.synced);
            })
            .map(s => ({
                key: s.id,
                primary: `Pedido: ${s.displayKey}`,
                secondary: `Bipado por ${s.user} às ${new Date(s.time).toLocaleTimeString('pt-BR')}`
            }));
    }, [scanHistory, todayString]);

    const pedidosBipadosHoje = bipadosHojeItems.length;

    const lowStockItems = useMemo(() => {
        return stockItems
            .filter(i => i.kind === 'PRODUTO' && i.min_qty > 0 && i.current_qty < i.min_qty)
            .map(i => ({
                key: i.id,
                primary: i.name,
                secondary: `Estoque: ${i.current_qty.toFixed(2)} ${i.unit} (Mínimo: ${i.min_qty.toFixed(2)} ${i.unit})`
            }));
    }, [stockItems]);
    
    const handleLowStockClick = () => {
        if (lowStockItems.length > 0) {
            setInfoModalState({ isOpen: true, title: 'Itens com Estoque Baixo', items: lowStockItems });
        } else {
            setIsConfigureLowStockModalOpen(true);
        }
    };

    const totalProdutosItems = useMemo(() => {
        return stockItems
            .filter(i => i.kind === 'PRODUTO')
            .map(i => ({
                key: i.id,
                primary: i.name,
                secondary: `SKU: ${i.code} | Estoque: ${i.current_qty}`
            }));
    }, [stockItems]);

    const totalProdutos = totalProdutosItems.length;
    const itensEstoqueBaixo = lowStockItems.length;


    const pendingOrdersData = useMemo(() => {
        const pending = allOrders.filter(o => o.status === 'NORMAL');

        const grouped: Record<string, OrderItem[]> = {};
        for (const order of pending) {
            const key = order.orderId;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(order);
        }

        const allGroups = Object.values(grouped);

        const mlSingleSku = allGroups.filter(g => g.length === 1 && g[0].canal === 'ML');
        const shopeeSingleSku = allGroups.filter(g => g.length === 1 && g[0].canal === 'SHOPEE');
        const multiSku = allGroups.filter(g => g.length > 1);

        return { mlSingleSku, shopeeSingleSku, multiSku };
    }, [allOrders]);

    const primaryActionCards: ActionCardData[] = [
        { title: 'Bipar Pedidos', description: 'Scanner de códigos de barras/QR', icon: <QrCode size={24} className="text-blue-600" />, iconBgColor: 'bg-blue-100', page: 'bipagem' },
        { title: 'Importar Pedidos', description: 'Importar planilhas de venda', icon: <UploadCloud size={24} className="text-red-600" />, iconBgColor: 'bg-red-100', page: 'importer' },
    ];
    
    const handleActionClick = (page: string) => {
        navigate(`/app/${page}`);
    };
    
    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            await onRefresh();
            setIsRefreshing(false);
        } else {
            window.location.reload();
        }
    }

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
                        <p className="text-[var(--color-text-secondary)] mt-1">Bem-vindo, aqui está um resumo da sua operação.</p>
                    </div>
                    <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm font-semibold hover:bg-[var(--color-surface-secondary)] shadow-sm disabled:opacity-50">
                        <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? "Atualizando..." : "Atualizar Dados"}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Pedidos Importados (Hoje)" 
                        value={pedidosImportadosHoje.toString()} 
                        icon={<UploadCloud size={20} />} 
                        onClick={() => setIsOrderModalOpen(true)}
                    />
                    {generalSettings.bipagem.enableBipagem && (
                         <StatCard 
                            title="Pedidos Bipados (Hoje)" 
                            value={pedidosBipadosHoje.toString()} 
                            icon={<ShoppingCart size={20} />} 
                            onClick={() => setInfoModalState({ isOpen: true, title: 'Pedidos Bipados Hoje', items: bipadosHojeItems })}
                        />
                    )}
                    <StatCard 
                        title="Total de Produtos" 
                        value={totalProdutos.toString()} 
                        icon={<Package size={20} />} 
                        onClick={() => setInfoModalState({ isOpen: true, title: 'Produtos Cadastrados', items: totalProdutosItems })}
                    />
                    <StatCard 
                        title="Itens c/ Estoque Baixo" 
                        value={itensEstoqueBaixo.toString()} 
                        icon={<Archive size={20} />} 
                        onClick={handleLowStockClick}
                    />
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Ações Rápidas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {primaryActionCards.map(card => (
                            <div key={card.title} onClick={() => handleActionClick(card.page)} className="cursor-pointer">
                                <ActionCard data={card} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <PlanUsageCard subscription={subscription} />
                    </div>
                    <div className="lg:col-span-2 bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)] shadow-sm">
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                            {generalSettings.bipagem.enableBipagem ? 'Pedidos Pendentes para Bipagem' : 'Pedidos para Separar'}
                        </h2>
                        <div className="space-y-4">
                            {/* Mercado Livre */}
                            <div>
                                <h3 className="font-semibold" style={{color: 'var(--color-ml)'}}>Mercado Livre ({pendingOrdersData.mlSingleSku.length})</h3>
                                <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                    {pendingOrdersData.mlSingleSku.length > 0 ? (
                                        pendingOrdersData.mlSingleSku.map(group => (
                                            <OrderItemCard key={group[0].id} order={group[0]} color="var(--color-ml)" />
                                        ))
                                    ) : <p className="text-sm text-center text-[var(--color-text-secondary)] py-4">Nenhum pedido do ML pendente.</p>}
                                </div>
                            </div>

                            {/* Shopee */}
                            <div>
                                <h3 className="font-semibold" style={{color: 'var(--color-shopee)'}}>Shopee ({pendingOrdersData.shopeeSingleSku.length})</h3>
                                <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                    {pendingOrdersData.shopeeSingleSku.length > 0 ? (
                                        pendingOrdersData.shopeeSingleSku.map(group => (
                                            <OrderItemCard key={group[0].id} order={group[0]} color="var(--color-shopee)" />
                                        ))
                                    ) : <p className="text-sm text-center text-[var(--color-text-secondary)] py-4">Nenhum pedido da Shopee pendente.</p>}
                                </div>
                            </div>
                            
                            {/* Multi SKUs */}
                            <div>
                                <h3 className="font-semibold" style={{color: 'var(--color-multi-sku)'}}>Múltiplos SKUs ({pendingOrdersData.multiSku.length})</h3>
                                {pendingOrdersData.multiSku.length > 0 ? (
                                    <div className="marquee-container bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg p-2">
                                        <div className="marquee-content" style={{ animationDuration: `${Math.max(15, pendingOrdersData.multiSku.length * 4)}s` }}>
                                            {[...pendingOrdersData.multiSku, ...pendingOrdersData.multiSku].map((group, index) => (
                                                <MultiSkuCard key={`${group[0].id}-${index}`} group={group} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg p-3">
                                        <p className="text-sm text-center text-[var(--color-text-secondary)] py-4">Nenhum pedido com múltiplos SKUs pendente.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <OrderListModal 
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                orders={todayOrders}
                title="Pedidos Importados Hoje"
            />
            <InfoListModal 
                isOpen={infoModalState.isOpen}
                onClose={() => setInfoModalState({ isOpen: false, title: '', items: [] })}
                title={infoModalState.title}
                items={infoModalState.items}
            />
            <ConfigureLowStockModal
                isOpen={isConfigureLowStockModalOpen}
                onClose={() => setIsConfigureLowStockModalOpen(false)}
                stockItems={stockItems}
                onSave={onBulkUpdateStockItems}
            />
        </>
    );
};

export default DashboardPage;
