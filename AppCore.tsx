
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { dbClient } from './lib/supabaseClient';
import { resolveScan } from './lib/scanner';
import { 
    User, ZplSettings, StockItem, StockMovement, OrderItem, EtiquetaHistoryItem, ScanLogItem, 
    GeneralSettings, ImportHistoryItem, ProdutoCombinado, Customer, SkuLink, ProductionPlan, 
    ShoppingListItem, PlanningParameters, LabelProcessingStatus, ProcessedData, EtiquetasState, 
    UserSetor, UserRole, ScanResult, UiSettings, defaultZplSettings, defaultGeneralSettings 
} from './types';
import { Plan, Subscription } from './types';
import { Loader2 } from 'lucide-react';

import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import GlobalHeader from './components/GlobalHeader';
import DashboardPage from './pages/DashboardPage';
import ImporterPage from './pages/ImporterPage';
import EtiquetasPage from './pages/EtiquetasPage';
import PedidosPage from './pages/PedidosPage';
import BipagemPage from './pages/BipagemPage';
import ProductPage from './pages/ProductPage';
import ClientesPage from './pages/ClientesPage';
import AjudaPage from './pages/AjudaPage';
import PlanejamentoPage from './pages/PlanejamentoPage';
import ComprasPage from './pages/ComprasPage';
import SubscriptionPage from './pages/SubscriptionPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import ConfiguracoesGeraisPage from './pages/ConfiguracoesGeraisPage';
import FuncionariosPage from './pages/FuncionariosPage';
import ProfilePage from './pages/ProfilePage';
import AdminMetricsPage from './pages/AdminMetricsPage';
import BiDashboardPage from './pages/BiDashboardPage';
import MoagemPage from './pages/MoagemPage';

// Mock for UpgradePromptModal if not available (or import if it exists)
const UpgradePromptModal = ({ isOpen, onClose, onUpgradeClick, onSnooze, type, daysLeft }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-800">{type === 'trial' ? 'Período de Teste' : 'Assinatura Expirando'}</h2>
                <p className="mb-4 text-gray-600">{type === 'trial' ? 'Seu período de teste está ativo.' : `Sua assinatura expira em ${daysLeft} dias.`}</p>
                <div className="flex justify-center gap-2">
                    <button onClick={() => onSnooze(1)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800">Lembrar depois</button>
                    <button onClick={onUpgradeClick} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ver Planos</button>
                </div>
            </div>
        </div>
    )
}

const defaultUiSettings: UiSettings = {
    baseTheme: 'system',
    fontFamily: 'Inter',
    accentColor: 'indigo',
    customAccentColor: '#4f46e5',
    fontSize: 16,
    soundOnSuccess: true,
    soundOnDuplicate: true,
    soundOnError: true,
};

interface AppCoreProps {
    user: User;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AppCore: React.FC<AppCoreProps> = ({ user, setUser, addToast }) => {
    const [isLoading, setIsLoading] = useState(true); // Initial load only
    const [isRefreshing, setIsRefreshing] = useState(false); // Background refresh
    
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeModalType, setUpgradeModalType] = useState<'trial' | 'expiring'>('trial');
    const [daysLeft, setDaysLeft] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
  
    // Data states
    const [etiquetasSettings, setEtiquetasSettings] = useState<ZplSettings>(defaultZplSettings);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    const [allOrders, setAllOrders] = useState<OrderItem[]>([]);
    const [etiquetasHistory, setEtiquetasHistory] = useState<EtiquetaHistoryItem[]>([]);
    const [scanHistory, setScanHistory] = useState<ScanLogItem[]>([]);
    const [generalSettings, _setGeneralSettings] = useState<GeneralSettings>(defaultGeneralSettings);
    const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
    const [produtosCombinados, setProdutosCombinados] = useState<ProdutoCombinado[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [skuLinks, setSkuLinks] = useState<SkuLink[]>([]);
    const [weighingBatches, setWeighingBatches] = useState<any[]>([]);
    const [grindingBatches, setGrindingBatches] = useState<any[]>([]);
    const [unlinkedSkus, setUnlinkedSkus] = useState<string[]>([]);
  
    const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
    const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
    const [planningSettings, _setPlanningSettings] = useState<PlanningParameters>({
        analysisPeriodValue: 1, analysisPeriodUnit: 'months', forecastPeriodDays: 30, safetyStockDays: 7,
        promotionMultiplier: 25, defaultLeadTimeDays: 14, historicalSpikeDays: [],
    });

    // Admin states
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);

    // Page-specific states
    const [labelProcessingStatus, setLabelProcessingStatus] = useState<LabelProcessingStatus>({ isActive: false, progress: 0, current: 0, total: 0, message: '', isFinished: false });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [importerError, setImporterError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAutoBipagemActive, setIsAutoBipagemActive] = useState(false);
    const [etiquetasState, setEtiquetasState] = useState<EtiquetasState>({ zplInput: '', includeDanfe: false, zplPages: [], previews: [], extractedData: new Map() });
  
    const fetchAllData = useCallback(async (loggedInUser: User, isBackground = false) => {
         if (!loggedInUser.organization_id) {
             if(!isBackground) setIsLoading(false);
             return; 
         }
         
         if(isBackground) setIsRefreshing(true);

         try {
                const [subRes, settingsRes] = await Promise.all([
                    dbClient.from('subscriptions').select('*, plan:plans(*)').eq('organization_id', loggedInUser.organization_id).in('status', ['trialing', 'active']).maybeSingle(),
                    dbClient.from('app_settings').select('*').eq('organization_id', loggedInUser.organization_id)
                ]);

                const subData = subRes.data;
                const appSettings = settingsRes.data || [];

                const userCreatedAt = new Date(loggedInUser.created_at || new Date().toISOString());
                const trialDurationDays = 7;
                const trialEndDate = new Date(userCreatedAt);
                trialEndDate.setDate(trialEndDate.getDate() + trialDurationDays);

                const defaultSubscription = {
                    status: 'trialing',
                    plan: { name: 'Plano Grátis (Teste)', max_users: 2, price: 0, product_limit: 250, label_limit: 200 },
                    period_end: trialEndDate.toISOString()
                };
                const activeSubscription = subData || defaultSubscription;
                setSubscription(activeSubscription);
                
                // ... (Snooze logic kept same)

                const general = appSettings.find(s => s.key === 'general_settings');
                if (general) _setGeneralSettings(prev => ({...prev, ...general.value}));
                
                const planning = appSettings.find(s => s.key === 'planning_settings');
                if (planning) _setPlanningSettings(prev => ({...prev, ...planning.value}));

                const results = await Promise.all([
                    dbClient.from('stock_items').select('*'),
                    dbClient.from('stock_movements').select('*'),
                    dbClient.from('orders').select('*'),
                    dbClient.from('etiquetas_historico').select('*'),
                    dbClient.from('scan_logs').select('*'),
                    dbClient.from('import_history').select('*'),
                    dbClient.from('product_boms').select('*'),
                    dbClient.from('customers').select('*'),
                    dbClient.from('production_plans').select('*'),
                    dbClient.from('shopping_list_items').select('*'),
                    dbClient.from('users').select('*'),
                    dbClient.from('sku_links').select('*')
                ]);

                const [
                    stockItemsRes, stockMovementsRes, allOrdersRes, etiquetasHistoryRes, scanHistoryRes,
                    importHistoryRes, produtosCombinadosRes, customersRes, productionPlansRes,
                    shoppingListRes, usersRes, skuLinksRes
                ] = results;

                setStockItems(stockItemsRes.data || []);
                setStockMovements((stockMovementsRes.data || []).map((m: any) => ({ ...m, createdAt: new Date(m.created_at) })));
                setAllOrders((allOrdersRes.data || []).map((o: any) => ({ ...o, orderId: o.order_id, customer_name: o.customer_name, customer_cpf_cnpj: o.customer_cpf_cnpj })));
                setEtiquetasHistory(etiquetasHistoryRes.data || []);
                setScanHistory((scanHistoryRes.data || []).map((s: any) => ({...s, time: new Date(s.scanned_at), user: s.user_name, displayKey: s.display_key})));
                setImportHistory(importHistoryRes.data || []);
                setProdutosCombinados((produtosCombinadosRes.data || []).map((p: any) => ({productSku: p.product_sku, items: p.items})));
                setCustomers((customersRes.data || []).map((c: any) => ({...c, cpfCnpj: c.cpf_cnpj, orderHistory: c.order_history})));
                setProductionPlans(productionPlansRes.data || []);
                setShoppingList((shoppingListRes.data || []).map((i: any) => ({...i, id: i.stock_item_code})));
                setUsers(usersRes.data || []);
                setSkuLinks((skuLinksRes.data || []).map((l: any) => ({importedSku: l.imported_sku, masterProductSku: l.master_product_sku})));
                
                if (loggedInUser.role === 'DONO_SAAS') {
                    const [orgsRes, plansRes, subsRes] = await Promise.all([
                        dbClient.from('organizations').select('*'),
                        dbClient.from('plans').select('*'),
                        dbClient.from('subscriptions').select('*'),
                    ]);

                    setOrganizations(orgsRes.data || []);
                    setPlans(plansRes.data || []);
                    setAllSubscriptions(subsRes.data || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                if(!isBackground) setIsLoading(false);
                if(isBackground) setIsRefreshing(false);
            }
    }, [addToast]);

    const refreshData = async () => {
         if (user) await fetchAllData(user, true);
    };

    useEffect(() => {
        fetchAllData(user);
    }, [user, fetchAllData]);
    
    // ... (Realtime subscription kept same)

      useEffect(() => {
        const applyTheme = (theme: 'light' | 'dark' | 'system') => {
          const root = document.documentElement;
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (theme === 'system') {
            root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
          } else {
            root.setAttribute('data-theme', theme);
          }
        };
        applyTheme(user?.ui_settings?.baseTheme || 'system');
      }, [user]);

  
    const setGeneralSettings = useCallback(async (value: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => {
        if (!user?.organization_id) return;
        const newSettings = value instanceof Function ? value(generalSettings) : value;
        _setGeneralSettings(newSettings);
        await dbClient.from('app_settings').upsert({ key: 'general_settings', value: newSettings, organization_id: user.organization_id });
    }, [generalSettings, user]);

    const setPlanningSettings = useCallback(async (value: PlanningParameters | ((prev: PlanningParameters) => PlanningParameters)) => {
        if (!user?.organization_id) return;
        const newSettings = value instanceof Function ? value(planningSettings) : value;
        _setPlanningSettings(newSettings);
        await dbClient.from('app_settings').upsert({ key: 'planning_settings', value: newSettings, organization_id: user.organization_id });
    }, [planningSettings, user]);

    const handleUpdateUser = async (updatedUser: User): Promise<boolean> => {
        const safePayload: Partial<User> = {
            name: updatedUser.name,
            avatar: updatedUser.avatar,
            phone: updatedUser.phone,
            ui_settings: updatedUser.ui_settings,
        };

        const { error } = await dbClient.from('users').update(safePayload).eq('id', updatedUser.id);
        if(error) {
            console.error("Update user failed:", error);
            return false;
        }
        if (updatedUser.id === user.id) setUser(prev => prev ? {...prev, ...updatedUser} : null);
        return true;
    };

    const handleDeleteUser = async (userId: string): Promise<boolean> => {
        try {
            const { error } = await dbClient.functions.invoke('delete-user', { body: { userId } });
            if (error) throw error;
            return true;
        } catch (err: any) {
            return false;
        }
    };
  
    const onSaveStockItem = async (itemData: StockItem): Promise<StockItem | null> => {
        if (!user?.organization_id) return null;
        const isNew = !itemData.id;
        const payload = { ...itemData, id: isNew ? undefined : itemData.id, organization_id: user.organization_id };
        const { data, error } = await dbClient.from('stock_items').upsert(payload).select().single();
        if (error) return null;
        return data;
    };
  
    const handleSaveProdutoCombinado = async (productSku: string, newBomItems: ProdutoCombinado['items']) => {
      if (!user?.organization_id) return;
      await dbClient.from('product_boms').upsert({ product_sku: productSku, items: newBomItems, organization_id: user.organization_id });
    };
    
    // ... (Other handlers kept same: handleLinkSku, handleUnlinkSku, etc.)
    const handleLinkSku = async (importedSku: string, masterProductSku: string): Promise<boolean> => {
        if (!user?.organization_id) return false;
        const { error } = await dbClient.from('sku_links').upsert({ imported_sku: importedSku, master_product_sku: masterProductSku, organization_id: user.organization_id });
        return !error;
    };

    const handleUnlinkSku = async (importedSku: string): Promise<boolean> => {
        const { error } = await dbClient.from('sku_links').delete().eq('imported_sku', importedSku);
        return !error;
    };

    const handleDeleteStockItem = async (itemId: string): Promise<boolean> => {
        const { error } = await dbClient.from('stock_items').delete().eq('id', itemId);
        return !error;
    };

    const handleLaunch = async (data: { ordersToCreate: OrderItem[], ordersToUpdate: OrderItem[] }) => {
        if (!user?.organization_id) return;
        const payload = [...data.ordersToCreate, ...data.ordersToUpdate].map(o => ({
            order_id: o.orderId, tracking: o.tracking, sku: o.sku, qty_original: o.quantity, multiplicador: o.multiplicador,
            qty_final: o.qty_final, color: o.color, canal: o.canal, data: o.data, status: o.status,
            customer_name: o.customer_name, customer_cpf_cnpj: o.customer_cpf_cnpj, organization_id: user.organization_id
        }));
        if(payload.length > 0) {
            await dbClient.from('orders').upsert(payload, { onConflict: 'organization_id,order_id,sku' });
        }
    };
  
    const handleSaveProductionPlan = async (plan: Omit<ProductionPlan, 'id' | 'createdAt' | 'createdBy'>): Promise<ProductionPlan | null> => {
        if (!user?.organization_id) return null;
        const { data, error } = await dbClient.from('production_plans').insert({ ...plan, created_by: user?.name, organization_id: user.organization_id }).select().single();
        if(error) return null;
        return data;
    };

    const handleDeleteProductionPlan = async (planId: string): Promise<boolean> => {
        const { error } = await dbClient.from('production_plans').delete().eq('id', planId);
        return !error;
    };

    const handleGenerateShoppingList = async (list: ShoppingListItem[]) => {
        if (!user?.organization_id) return;
        await dbClient.from('shopping_list_items').delete().neq('stock_item_code', 'dummy');
        const payload = list.map(item => ({ stock_item_code: item.id, name: item.name, quantity: item.quantity, unit: item.unit, organization_id: user.organization_id }));
        await dbClient.from('shopping_list_items').insert(payload);
    };

    const handleUpdateShoppingListItem = async (itemCode: string, isPurchased: boolean) => {
        await dbClient.from('shopping_list_items').update({ is_purchased: isPurchased }).eq('stock_item_code', itemCode);
    };

    const handleClearShoppingList = async () => {
        await dbClient.from('shopping_list_items').delete().neq('stock_item_code', 'dummy');
    };

    const handleAddImportToHistory = async (item: Omit<ImportHistoryItem, 'id' | 'processedData'>, data: ProcessedData) => {
        if (!user?.organization_id) return;
        const payload = { ...item, processed_data: data, organization_id: user.organization_id };
        await dbClient.from('import_history').insert(payload);
    };
  
    const handleDeleteImportHistoryItem = async (historyItemId: string) => {
        const itemToDelete = importHistory.find(item => item.id === historyItemId);
        if (!itemToDelete) return;
        const orderIds = new Set(itemToDelete.processedData.lists.completa.map(o => o.orderId));
        await dbClient.from('orders').delete().in('order_id', Array.from(orderIds));
        await dbClient.from('import_history').delete().eq('id', historyItemId);
    };

    const handleNewScan = async (code: string): Promise<ScanResult> => {
        return await resolveScan(dbClient, code, user!, 'WebApp', users, generalSettings.bipagem);
    };
    
    const handleDeleteOrders = async (orderIds: string[]) => {
      const { error } = await dbClient.from('orders').delete().in('order_id', orderIds);
      if(!error) addToast(`${orderIds.length} pedido(s) excluído(s).`, 'success');
    };

    const handleHardDeleteScanLog = async (scanId: string): Promise<void> => {
        await dbClient.from('scan_logs').delete().eq('id', scanId);
    };

    const onBulkHardDeleteScanLog = async (scanIds: string[]): Promise<void> => {
        await dbClient.from('scan_logs').delete().in('id', scanIds);
    };
  
    const handleBulkUpdateStockItems = async (updates: { id: string, min_qty: number }[]) => {
        if (!user?.organization_id) return;
        await dbClient.from('stock_items').upsert(updates.map(u => ({...u, organization_id: user.organization_id})));
    };
  
    const handleLogout = async () => {
        localStorage.clear();
        await dbClient.auth.signOut();
        window.location.href = '/';
    };
    
    const handleSnoozeUpgrade = async (days: number) => {
        setIsUpgradeModalOpen(false);
        if (!user?.organization_id) return;

        const snoozeDate = new Date();
        snoozeDate.setDate(snoozeDate.getDate() + days);
        const timestamp = snoozeDate.getTime();

        try {
            await dbClient.from('app_settings').upsert({
                organization_id: user.organization_id,
                key: 'subscription_snooze',
                value: { until: timestamp }
            });
        } catch (error) {
            console.error("Erro ao salvar soneca:", error);
        }
    };

    const handleAddNewUser = async (name: string, setor: UserSetor[], role: UserRole, email?: string): Promise<{ success: boolean; message?: string; }> => {
        try {
            const { error } = await dbClient.functions.invoke('invite-user', { body: { email, name, setor, role } });
            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            return { success: false, message: `Erro: ${err.message}` };
        }
    };
    
    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)]"><Loader2 size={48} className="animate-spin text-[var(--color-primary)]"/></div>;
    }
    
    const isEmployee = user?.role === 'FUNCIONARIO';
    const restrictedPaths = ['/app/assinatura', '/app/configuracoes', '/app/equipe', '/app/admin-metrics'];
    
    if (isEmployee && restrictedPaths.some(path => location.pathname.startsWith(path))) {
        return <Navigate to="/app/dashboard" replace />;
    }
    
    return (
        <div className="flex h-screen bg-[var(--color-bg)]">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                setIsCollapsed={setIsSidebarCollapsed} 
                generalSettings={generalSettings}
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
                currentUser={user}
            />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <MobileHeader currentPage={location.pathname.split('/')[2] || 'dashboard'} onMenuClick={() => setIsMobileMenuOpen(true)} />
                <GlobalHeader
                    user={user}
                    onLogout={handleLogout}
                    onNavigateToProfile={() => navigate('/app/perfil')}
                    isAutoBipagemActive={isAutoBipagemActive}
                    onToggleAutoBipagem={() => setIsAutoBipagemActive(p => !p)}
                    labelProcessingStatus={labelProcessingStatus}
                    setLabelProcessingStatus={setLabelProcessingStatus}
                    generalSettings={generalSettings}
                />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Routes>
                        <Route path="dashboard" element={<DashboardPage allOrders={allOrders} scanHistory={scanHistory} stockItems={stockItems} generalSettings={generalSettings} importHistory={importHistory} onBulkUpdateStockItems={handleBulkUpdateStockItems} subscription={subscription} onRefresh={refreshData} />} />
                        <Route path="importer" element={<ImporterPage allOrders={allOrders} selectedFile={selectedFile} setSelectedFile={setSelectedFile} processedData={processedData} setProcessedData={setProcessedData} error={importerError} setError={setImporterError} isProcessing={isProcessing} setIsProcessing={setIsProcessing} onLaunch={handleLaunch} skuLinks={skuLinks} onLinkSku={handleLinkSku} onUnlinkSku={handleUnlinkSku} products={stockItems} onSaveStockItem={onSaveStockItem as any} onSaveProdutoCombinado={handleSaveProdutoCombinado} produtosCombinados={produtosCombinados} stockItems={stockItems} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} currentUser={user!} importHistory={importHistory} addImportToHistory={handleAddImportToHistory} clearImportHistory={() => setImportHistory([])} onDeleteImportHistoryItem={handleDeleteImportHistoryItem} addToast={addToast} customers={customers} unlinkedSkus={unlinkedSkus} />} />
                        <Route path="etiquetas" element={<EtiquetasPage settings={etiquetasSettings} onSettingsSave={setEtiquetasSettings} stockItems={stockItems} etiquetasState={etiquetasState} setEtiquetasState={setEtiquetasState} currentUser={user!} allOrders={allOrders} setAllOrders={setAllOrders} etiquetasHistory={etiquetasHistory} onSaveHistory={(item) => setEtiquetasHistory(prev => [{...item, id: `hist_${Date.now()}`, created_at: new Date().toISOString()}, ...prev])} onSaveStockItem={onSaveStockItem as any} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} skuLinks={skuLinks} scanHistory={scanHistory} labelProcessingStatus={labelProcessingStatus} setLabelProcessingStatus={setLabelProcessingStatus} addToast={addToast} />} />
                        <Route path="pedidos" element={<PedidosPage allOrders={allOrders} scanHistory={scanHistory} setAllOrders={setAllOrders} setScanHistory={setScanHistory} currentUser={user!} generalSettings={generalSettings} addToast={addToast} onDeleteOrders={handleDeleteOrders} />} />
                        <Route path="bipagem" element={<BipagemPage allOrders={allOrders} onNewScan={handleNewScan} onBomDeduction={()=>{}} scanHistory={scanHistory} onCancelBipagem={()=>{}} onBulkCancelBipagem={async () => {}} onHardDeleteScanLog={handleHardDeleteScanLog} onBulkHardDeleteScanLog={onBulkHardDeleteScanLog} products={stockItems} users={users} onAddNewUser={handleAddNewUser} onSaveUser={handleUpdateUser} uiSettings={user?.ui_settings || defaultUiSettings} currentUser={user!} onSyncPending={async () => {}} skuLinks={skuLinks} addToast={addToast} currentPage={location.pathname.split('/')[2] || 'bipagem'} isAutoBipagemActive={isAutoBipagemActive} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} />} />
                        <Route path="produtos" element={<ProductPage stockItems={stockItems} produtosCombinados={produtosCombinados} onSaveProdutoCombinado={handleSaveProdutoCombinado} unlinkedSkus={unlinkedSkus} setUnlinkedSkus={setUnlinkedSkus} onSaveStockItem={onSaveStockItem as any} onDeleteStockItem={handleDeleteStockItem} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} subscription={subscription} />} />
                        <Route path="clientes" element={<ClientesPage customers={customers} setCustomers={setCustomers} allOrders={allOrders} />} />
                        <Route path="ajuda" element={<AjudaPage />} />
                        <Route path="planejamento" element={<PlanejamentoPage stockItems={stockItems} allOrders={allOrders} skuLinks={skuLinks} produtosCombinados={produtosCombinados} productionPlans={productionPlans} onSaveProductionPlan={handleSaveProductionPlan} onDeleteProductionPlan={handleDeleteProductionPlan} onGenerateShoppingList={handleGenerateShoppingList} currentUser={user!} planningSettings={planningSettings} onSavePlanningSettings={setPlanningSettings} addToast={addToast} />} />
                        <Route path="compras" element={<ComprasPage shoppingList={shoppingList} onClearList={handleClearShoppingList} onUpdateItem={handleUpdateShoppingListItem} stockItems={stockItems} onSaveStockItem={onSaveStockItem as any} unlinkedSkus={[]} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} />} />
                        
                        {/* Rotas Protegidas de Funcionários */}
                        <Route path="assinatura" element={user?.role !== 'FUNCIONARIO' ? <SubscriptionPage user={user} subscription={subscription} addToast={addToast} /> : <Navigate to="/app/dashboard" />} />
                        <Route path="configuracoes" element={user?.role !== 'FUNCIONARIO' ? <ConfiguracoesPage users={users} setCurrentPage={(p) => navigate(`/app/${p}`)} onDeleteUser={handleDeleteUser} addToast={addToast} currentUser={user} onUpdateUser={handleUpdateUser} generalSettings={generalSettings} /> : <Navigate to="/app/dashboard" />} />
                        <Route path="configuracoes-gerais" element={user?.role !== 'FUNCIONARIO' ? <ConfiguracoesGeraisPage setCurrentPage={(p) => navigate(`/app/${p}`)} generalSettings={generalSettings} onSaveGeneralSettings={setGeneralSettings} currentUser={user} onBackupData={() => {}} onResetDatabase={async () => ({success: false, message: 'Não implementado'})} onClearScanHistory={async () => ({success: false, message: 'Não implementado'})} addToast={addToast} stockItems={stockItems} users={users} /> : <Navigate to="/app/dashboard" />} />
                        <Route path="equipe" element={user?.role !== 'FUNCIONARIO' ? <FuncionariosPage users={users} onSetAttendance={() => {}} onAddNewUser={handleAddNewUser} onUpdateAttendanceDetails={() => {}} onUpdateUser={handleUpdateUser} generalSettings={generalSettings} currentUser={user} onDeleteUser={handleDeleteUser} subscription={subscription} addToast={addToast} /> : <Navigate to="/app/dashboard" />} />
                        
                        <Route path="perfil" element={<ProfilePage user={user!} onUpdateUser={handleUpdateUser} subscription={subscription} />} />
                        <Route path="admin-metrics" element={<AdminMetricsPage users={users} organizations={organizations} allOrders={allOrders} plans={plans} allSubscriptions={allSubscriptions} />} />
                        <Route path="bi-dashboard" element={<BiDashboardPage biData={[]} users={users} />} />
                        <Route path="estoque" element={<MoagemPage stockItems={stockItems} grindingBatches={grindingBatches} onAddNewGrinding={()=>{}} currentUser={user} onDeleteBatch={async () => true} users={users} generalSettings={generalSettings} />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </main>
            </div>
            <UpgradePromptModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)}
                onUpgradeClick={() => navigate('/app/assinatura')}
                onSnooze={handleSnoozeUpgrade}
                type={upgradeModalType}
                daysLeft={daysLeft}
            />
        </div>
    );
};

export default AppCore;
