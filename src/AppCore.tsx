
import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { dbClient } from '../lib/supabaseClient';
import { getCacheData, setCacheData, clearAllCache } from '../lib/dataCache';
import { resolveScan } from '../lib/scanner';
import { 
    User, ZplSettings, StockItem, StockMovement, OrderItem, EtiquetaHistoryItem, ScanLogItem, 
    GeneralSettings, ImportHistoryItem, ProdutoCombinado, Customer, SkuLink, ProductionPlan, 
    ShoppingListItem, PlanningParameters, LabelProcessingStatus, ProcessedData, EtiquetasState, 
    UserSetor, UserRole, ScanResult, UiSettings, defaultZplSettings, defaultGeneralSettings 
} from '../types';
import { Plan, Subscription } from '../types';

import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import GlobalHeader from '../components/GlobalHeader';
import InvisibleLoader from '../components/InvisibleLoader';
import DashboardPage from '../pages/DashboardPage';
import ImporterPage from '../pages/ImporterPage';
import EtiquetasPage from '../pages/EtiquetasPage';
import PedidosPage from '../pages/PedidosPage';
import BipagemPage from '../pages/BipagemPage';
import ProductPage from '../pages/ProductPage';
import ClientesPage from '../pages/ClientesPage';
import AjudaPage from '../pages/AjudaPage';
import PlanejamentoPage from '../pages/PlanejamentoPage';
import ComprasPage from '../pages/ComprasPage';
import SubscriptionPage from '../pages/SubscriptionPage';
import ConfiguracoesPage from '../pages/ConfiguracoesPage';
import ConfiguracoesGeraisPage from '../pages/ConfiguracoesGeraisPage';
import FuncionariosPage from '../pages/FuncionariosPage';
import ProfilePage from '../pages/ProfilePage';
import AdminMetricsPage from '../pages/AdminMetricsPage';
import BiDashboardPage from '../pages/BiDashboardPage';
import MoagemPage from '../pages/MoagemPage';
import EstoquePage from '../pages/EstoquePage';

// Mock for UpgradePromptModal if not available
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
    const [isLoading, setIsLoading] = useState(false); // Muda para false para entrar direto
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [remainingLabels, setRemainingLabels] = useState<number | null>(null);
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
  
    const fetchAllData = useCallback(async (loggedInUser: User) => {
         if (!loggedInUser.organization_id) {
             setIsLoading(false);
             return; 
         }
         try {
                const [subRes, settingsRes] = await Promise.all([
                    dbClient.from('subscriptions').select('*, plan:plans(*)').eq('organization_id', loggedInUser.organization_id).in('status', ['trialing', 'active']).maybeSingle(),
                    dbClient.from('app_settings').select('*').eq('organization_id', loggedInUser.organization_id)
                ]);

                const subData = subRes.data;
                const appSettings = settingsRes.data || [];

                // Trial duration: 7 days from NOW (not from creation date)
                const trialDurationDays = 7;
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + trialDurationDays);

                const defaultSubscription = {
                    status: 'trialing',
                    plan: { name: 'Plano Grátis (Teste)', max_users: 2, price: 0, label_limit: 200 },
                    period_end: trialEndDate.toISOString()
                };
                const activeSubscription = subData || defaultSubscription;
                setSubscription(activeSubscription);

                // compute remaining labels (plan limit + bonus - used)
                try {
                    const planLimit = Number(activeSubscription?.plan?.label_limit || 0);
                    const bonus = Number(activeSubscription?.bonus_balance || 0);
                    const used = Number(activeSubscription?.monthly_label_count || 0);
                    const remaining = planLimit + bonus - used;
                    setRemainingLabels(isNaN(remaining) ? null : remaining);
                } catch (err) {
                    setRemainingLabels(null);
                }

                const snoozeSetting = appSettings.find(s => s.key === 'subscription_snooze');
                const snoozeUntil = snoozeSetting?.value?.until || 0;
                const now = new Date().getTime();

                if (now > snoozeUntil) {
                    const periodEnd = new Date(activeSubscription.period_end);
                    const diffTime = periodEnd.getTime() - now;
                    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    // Allow negative days to show expiration status
                    if (isNaN(diffDays)) diffDays = 0;
                    setDaysLeft(diffDays);

                    // Check trial expiration
                    if ((!subData || activeSubscription.status === 'trialing') && now > periodEnd.getTime()) {
                        // Trial ended -> inform user (they can continue but we'll show a popup)
                        setUpgradeModalType('trial');
                        setTimeout(() => setIsUpgradeModalOpen(true), 2000);
                    } else if (diffDays <= 3 && diffDays >= 0) {
                        // show expiring only if within the next 3 days
                        setUpgradeModalType('expiring');
                        setTimeout(() => setIsUpgradeModalOpen(true), 2000);
                    }

                    // Check label quota exhaustion for free plans / limits
                    try {
                        const planLimit = Number(activeSubscription?.plan?.label_limit || 0);
                        const bonus = Number(activeSubscription?.bonus_balance || 0);
                        const used = Number(activeSubscription?.monthly_label_count || 0);
                        const remainingLabels = planLimit + bonus - used;

                        if (planLimit > 0 && remainingLabels <= 0) {
                            // Show informational modal telling user the free-label quota is exhausted.
                            setUpgradeModalType('expiring');
                            setTimeout(() => setIsUpgradeModalOpen(true), 2000);
                        }
                    } catch (err) {
                        // swallow any error calculating labels
                        console.warn('Could not compute remaining labels', err);
                    }
                }

                if (loggedInUser.role === 'DONO_SAAS' || loggedInUser.role === 'CLIENTE_GERENTE') {
                    const welcomeSetting = appSettings.find(s => s.key === 'welcome_shown');
                    if (!welcomeSetting) {
                        addToast('Parabéns por confiar em nós! 🚀', 'success');
                        dbClient.from('app_settings').upsert({
                            organization_id: loggedInUser.organization_id,
                            key: 'welcome_shown',
                            value: { shown: true, at: new Date().toISOString() }
                        });
                    }
                }

                const general = appSettings.find(s => s.key === 'general_settings');
                if (general) _setGeneralSettings(prev => ({...prev, ...general.value}));
                
                const planning = appSettings.find(s => s.key === 'planning_settings');
                if (planning) _setPlanningSettings(prev => ({...prev, ...planning.value}));

                const results = await Promise.all([
                    dbClient.from('stock_items').select('*').limit(500),
                    dbClient.from('stock_movements').select('*').order('created_at', {ascending: false}).limit(1000),
                    dbClient.from('orders').select('*').order('created_at', {ascending: false}).limit(1000),
                    dbClient.from('etiquetas_historico').select('*').order('created_at', {ascending: false}).limit(100),
                    dbClient.from('scan_logs').select('*').order('scanned_at', {ascending: false}).limit(500),
                    dbClient.from('import_history').select('*').order('processed_at', {ascending: false}).limit(100),
                    dbClient.from('product_boms').select('*').limit(500),
                    dbClient.from('customers').select('*').limit(500),
                    dbClient.from('production_plans').select('*').limit(100),
                    dbClient.from('shopping_list_items').select('*').limit(500),
                    dbClient.from('users').select('*').limit(100),
                    dbClient.from('sku_links').select('*').limit(1000)
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
                setImportHistory((importHistoryRes.data || []).map((h: any) => ({
                    id: h.id,
                    fileName: h.file_name,
                    processedAt: h.processed_at,
                    user: h.user_name,
                    itemCount: h.item_count,
                    unlinkedCount: h.unlinked_count,
                    canal: h.canal,
                    processedData: h.processed_data
                })));
                setProdutosCombinados((produtosCombinadosRes.data || []).map((p: any) => ({productSku: p.product_sku, items: p.items})));
                setCustomers((customersRes.data || []).map((c: any) => ({...c, cpfCnpj: c.cpf_cnpj, orderHistory: c.order_history})));
                setProductionPlans(productionPlansRes.data || []);
                setShoppingList((shoppingListRes.data || []).map((i: any) => ({...i, id: i.stock_item_code})));
                setUsers(usersRes.data || []);
                setSkuLinks((skuLinksRes.data || []).map((l: any) => ({importedSku: l.imported_sku, masterProductSku: l.master_product_sku})));
                
                // Carregar planos para admin e gerente
                if (loggedInUser.role === 'DONO_SAAS' || loggedInUser.role === 'CLIENTE_GERENTE') {
                    const [orgsRes, plansRes, subsRes] = await Promise.all([
                        dbClient.from('organizations').select('*'),
                        dbClient.from('plans').select('*').eq('active', true),
                        dbClient.from('subscriptions').select('*'),
                    ]);

                    setOrganizations(orgsRes.data || []);
                    setPlans(plansRes.data || []);
                    setAllSubscriptions(subsRes.data || []);
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setIsLoading(false);
            }
    }, [addToast]);

    const refreshData = async () => {
         if (user) await fetchAllData(user);
    };

    useEffect(() => {
        fetchAllData(user);
    }, [user, fetchAllData]);
    
    useEffect(() => {
        if (!user) return;
        const handleRealtimeChange = <T extends { id: any }>(
            payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
            setState: React.Dispatch<React.SetStateAction<T[]>>,
            transform?: (record: any) => T
        ) => {
             const transformer = transform || ((record: any) => record as T);
            if (payload.eventType === 'INSERT') {
                setState(prev => [...prev, transformer(payload.new)]);
            } else if (payload.eventType === 'UPDATE') {
                setState(prev => prev.map(item => item.id === payload.new.id ? transformer(payload.new) : item));
            } else if (payload.eventType === 'DELETE') {
                setState(prev => prev.filter(item => item.id !== payload.old.id));
            }
        };
        const channel = dbClient.channel(`public-data-for-${user.organization_id}`);
        const subscriptions = {
            stock_items: (p: any) => handleRealtimeChange(p, setStockItems),
            stock_movements: (p: any) => handleRealtimeChange(p, setStockMovements, (r: any) => ({ ...r, createdAt: new Date(r.created_at) })),
            orders: (p: any) => handleRealtimeChange(p, setAllOrders, (r: any) => ({ ...r, orderId: r.order_id, customer_name: r.customer_name, customer_cpf_cnpj: r.customer_cpf_cnpj })),
            scan_logs: (p: any) => handleRealtimeChange(p, setScanHistory, (r: any) => ({ ...r, time: new Date(r.scanned_at), user: r.user_name, displayKey: r.display_key })),
            users: (p: any) => handleRealtimeChange(p, setUsers),
            sku_links: (p: any) => handleRealtimeChange(p, setSkuLinks, (r: any) => ({ ...r, importedSku: r.imported_sku, masterProductSku: r.master_product_sku})),
            customers: (p: any) => handleRealtimeChange(p, setCustomers),
        };
        Object.entries(subscriptions).forEach(([table, handler]) => {
            channel.on('postgres_changes', { event: '*', schema: 'public', table }, handler);
        });
        channel.subscribe();
        // Don't clean up channel on unmount - let it persist for performance
        // Only unsubscribe when user actually logs out (handled in auth listener)
        return () => { /* channel cleanup disabled to prevent gray screen */ };
    }, [user, addToast]);

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
        try {
            const { error } = await dbClient.from('app_settings').upsert({ key: 'general_settings', value: newSettings, organization_id: user.organization_id });
            if (error) {
                console.error('Failed to save general_settings:', error);
                addToast('Erro ao salvar configurações gerais.', 'error');
            }
        } catch (err) {
            console.error('setGeneralSettings error:', err);
            addToast('Erro ao salvar configurações gerais.', 'error');
        }
    }, [generalSettings, user, addToast]);

    const setPlanningSettings = useCallback(async (value: PlanningParameters | ((prev: PlanningParameters) => PlanningParameters)) => {
        if (!user?.organization_id) return;
        const newSettings = value instanceof Function ? value(planningSettings) : value;
        _setPlanningSettings(newSettings);
        try {
            const { error } = await dbClient.from('app_settings').upsert({ key: 'planning_settings', value: newSettings, organization_id: user.organization_id });
            if (error) {
                console.error('Failed to save planning_settings:', error);
                addToast('Erro ao salvar configurações de planejamento.', 'error');
            }
        } catch (err) {
            console.error('setPlanningSettings error:', err);
            addToast('Erro ao salvar configurações de planejamento.', 'error');
        }
    }, [planningSettings, user, addToast]);

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
            if (error) {
                console.error('Failed to delete user:', error);
                addToast('Erro ao deletar usuário.', 'error');
                return false;
            }
            addToast('Usuário deletado com sucesso!', 'success');
            return true;
        } catch (err: any) {
            console.error('handleDeleteUser error:', err);
            addToast('Erro ao deletar usuário.', 'error');
            return false;
        }
    };
  
    const onSaveStockItem = async (itemData: StockItem): Promise<StockItem | null> => {
        if (!user?.organization_id) return null;
        const isNew = !itemData.id;
        
        // Build payload with only valid DB columns
        const payload: any = {
            code: itemData.code,
            name: itemData.name,
            kind: itemData.kind,
            unit: itemData.unit,
            current_qty: itemData.current_qty || 0,
            min_qty: itemData.min_qty || 0,
            category: itemData.category || null,
            color: itemData.color || null,
            composition: itemData.composition || null,
            product_type: itemData.product_type || null,
            expedition_items: itemData.expedition_items || null,
            substitute_product_code: itemData.substitute_product_code || null,
            linked_skus: itemData.linked_skus || null,
            organization_id: user.organization_id
        };
        
        if (!isNew && itemData.id) {
            payload.id = itemData.id;
        }
        
        try {
            const { data, error } = await dbClient
                .from('stock_items')
                .upsert(payload, { onConflict: 'organization_id,code' })
                .select()
                .single();
            if (error) {
                console.error('Failed to save stock_item:', error);
                addToast(`Erro ao salvar produto "${itemData.name}": ${error.message || ''}`, 'error');
                return null;
            }
            addToast(`Produto "${itemData.name}" salvo com sucesso!`, 'success');
            return data;
        } catch (err) {
            console.error('onSaveStockItem error:', err);
            addToast('Erro inesperado ao salvar produto.', 'error');
            return null;
        }
    };
  
    const handleSaveProdutoCombinado = async (productSku: string, newBomItems: ProdutoCombinado['items']) => {
      if (!user?.organization_id) return;
      try {
          const { error } = await dbClient.from('product_boms').upsert({ product_sku: productSku, items: newBomItems, organization_id: user.organization_id });
          if (error) {
              console.error('Failed to save product_boms:', error);
              addToast('Erro ao salvar configuração de produto combinado.', 'error');
          }
      } catch (err) {
          console.error('handleSaveProdutoCombinado error:', err);
          addToast('Erro ao salvar configuração de produto combinado.', 'error');
      }
    };

    const handleLinkSku = async (importedSku: string, masterProductSku: string): Promise<boolean> => {
        if (!user?.organization_id) return false;
        try {
            const { error } = await dbClient.from('sku_links').upsert({ imported_sku: importedSku, master_product_sku: masterProductSku, organization_id: user.organization_id });
            if (error) {
                console.error('Failed to link SKU:', error);
                addToast(`Erro ao vincular SKU: ${error.message || ''}`, 'error');
                return false;
            }
            addToast(`SKU "${importedSku}" vinculado com sucesso!`, 'success');
            return true;
        } catch (err) {
            console.error('handleLinkSku error:', err);
            addToast('Erro ao vincular SKU.', 'error');
            return false;
        }
    };

    const handleUnlinkSku = async (importedSku: string): Promise<boolean> => {
        try {
            const { error } = await dbClient.from('sku_links').delete().eq('imported_sku', importedSku);
            if (error) {
                console.error('Failed to unlink SKU:', error);
                addToast(`Erro ao desvinc ular SKU: ${error.message || ''}`, 'error');
                return false;
            }
            addToast(`SKU "${importedSku}" desvinculado com sucesso!`, 'success');
            return true;
        } catch (err) {
            console.error('handleUnlinkSku error:', err);
            addToast('Erro ao desvincular SKU.', 'error');
            return false;
        }
    };

    const handleDeleteStockItem = async (itemId: string): Promise<boolean> => {
        try {
            const { error } = await dbClient.from('stock_items').delete().eq('id', itemId);
            if (error) {
                console.error('Failed to delete stock_item:', error);
                addToast('Erro ao deletar produto.', 'error');
                return false;
            }
            addToast('Produto deletado com sucesso!', 'success');
            return true;
        } catch (err) {
            console.error('handleDeleteStockItem error:', err);
            addToast('Erro ao deletar produto.', 'error');
            return false;
        }
    };

    const handleLaunch = async (data: { ordersToCreate: OrderItem[], ordersToUpdate: OrderItem[] }) => {
        if (!user?.organization_id) return;
        
        // Prepare orders payload
        const payload = [...data.ordersToCreate, ...data.ordersToUpdate].map(o => ({
            order_id: o.orderId, tracking: o.tracking, sku: o.sku, qty_original: o.quantity, multiplicador: o.multiplicador,
            qty_final: o.qty_final, color: o.color, canal: o.canal, data: o.data, status: o.status,
            customer_name: o.customer_name, customer_cpf_cnpj: o.customer_cpf_cnpj, organization_id: user.organization_id
        }));
        
        // Extract unique customers from orders
        const uniqueCustomers = new Map<string, { name: string; cpf_cnpj: string }>();
        [...data.ordersToCreate, ...data.ordersToUpdate].forEach(order => {
            if (order.customer_cpf_cnpj && order.customer_name) {
                uniqueCustomers.set(order.customer_cpf_cnpj, {
                    name: order.customer_name,
                    cpf_cnpj: order.customer_cpf_cnpj
                });
            }
        });

        // Save orders
        if(payload.length > 0) {
            const { error: orderError } = await dbClient
                .from('orders')
                .upsert(payload, { onConflict: 'organization_id,order_id,sku' });
            if (orderError) {
                console.error('Error saving orders:', orderError);
                addToast('Erro ao salvar pedidos.', 'error');
                return;
            }
            // Update local state with new orders
            setAllOrders(prev => [...payload, ...prev]);
        }

        // Save customers
        if (uniqueCustomers.size > 0) {
            const customerPayload = Array.from(uniqueCustomers.values()).map(c => ({
                name: c.name,
                cpf_cnpj: c.cpf_cnpj,
                organization_id: user.organization_id,
                order_history: []
            }));
            const { error: customerError } = await dbClient
                .from('customers')
                .upsert(customerPayload, { onConflict: 'organization_id,cpf_cnpj' });
            if (customerError) {
                console.error('Error saving customers:', customerError);
                // Don't fail the whole operation for customer save errors
            } else {
                // Update local state with new customers
                setCustomers(prev => {
                    const existing = new Map(prev.map(c => [c.cpf_cnpj, c]));
                    customerPayload.forEach(newCustomer => {
                        if (!existing.has(newCustomer.cpf_cnpj)) {
                            existing.set(newCustomer.cpf_cnpj, { ...newCustomer, id: newCustomer.cpf_cnpj, cpfCnpj: newCustomer.cpf_cnpj, orderHistory: [] });
                        }
                    });
                    return Array.from(existing.values());
                });
            }
        }
        
        addToast(`${payload.length} pedido(s) e clientes salvos com sucesso!`, 'success');
    };
  
    const handleSaveProductionPlan = async (plan: Omit<ProductionPlan, 'id' | 'createdAt' | 'createdBy'>): Promise<ProductionPlan | null> => {
        if (!user?.organization_id) return null;
        try {
            const { data, error } = await dbClient.from('production_plans').insert({ ...plan, created_by: user?.name, organization_id: user.organization_id }).select().single();
            if (error) {
                console.error('Failed to save production plan:', error);
                addToast('Erro ao salvar plano de produção.', 'error');
                return null;
            }
            addToast('Plano de produção salvo com sucesso!', 'success');
            return data;
        } catch (err) {
            console.error('handleSaveProductionPlan error:', err);
            addToast('Erro ao salvar plano de produção.', 'error');
            return null;
        }
    };

    const handleDeleteProductionPlan = async (planId: string): Promise<boolean> => {
        try {
            const { error } = await dbClient.from('production_plans').delete().eq('id', planId);
            if (error) {
                console.error('Failed to delete production plan:', error);
                addToast('Erro ao deletar plano de produção.', 'error');
                return false;
            }
            addToast('Plano de produção deletado com sucesso!', 'success');
            return true;
        } catch (err) {
            console.error('handleDeleteProductionPlan error:', err);
            addToast('Erro ao deletar plano de produção.', 'error');
            return false;
        }
    };

    const handleGenerateShoppingList = async (list: ShoppingListItem[]) => {
        if (!user?.organization_id) return;
        try {
            const { error: deleteError } = await dbClient.from('shopping_list_items').delete().neq('stock_item_code', 'dummy');
            if (deleteError) {
                console.error('Failed to clear shopping list:', deleteError);
                addToast('Erro ao limpar lista de compras anterior.', 'error');
                return;
            }
            
            const payload = list.map(item => ({ stock_item_code: item.id, name: item.name, quantity: item.quantity, unit: item.unit, organization_id: user.organization_id }));
            const { error: insertError } = await dbClient.from('shopping_list_items').insert(payload);
            
            if (insertError) {
                console.error('Failed to generate shopping list:', insertError);
                addToast('Erro ao gerar lista de compras.', 'error');
                return;
            }
            
            addToast(`Lista de compras gerada com ${list.length} item(ns)!`, 'success');
        } catch (err) {
            console.error('handleGenerateShoppingList error:', err);
            addToast('Erro ao gerar lista de compras.', 'error');
        }
    };

    const handleUpdateShoppingListItem = async (itemCode: string, isPurchased: boolean) => {
        try {
            const { error } = await dbClient.from('shopping_list_items').update({ is_purchased: isPurchased }).eq('stock_item_code', itemCode);
            if (error) {
                console.error('Failed to update shopping list item:', error);
                addToast('Erro ao atualizar item da lista de compras.', 'error');
                return;
            }
            addToast(isPurchased ? 'Marcado como comprado!' : 'Marcado como não comprado!', 'success');
        } catch (err) {
            console.error('handleUpdateShoppingListItem error:', err);
            addToast('Erro ao atualizar item da lista de compras.', 'error');
        }
    };

    const handleClearShoppingList = async () => {
        try {
            const { error } = await dbClient.from('shopping_list_items').delete().neq('stock_item_code', 'dummy');
            if (error) {
                console.error('Failed to clear shopping list:', error);
                addToast('Erro ao limpar lista de compras.', 'error');
                return;
            }
            addToast('Lista de compras limpa com sucesso!', 'success');
        } catch (err) {
            console.error('handleClearShoppingList error:', err);
            addToast('Erro ao limpar lista de compras.', 'error');
        }
    };

    const handleAddImportToHistory = async (item: Omit<ImportHistoryItem, 'id' | 'processedData'>, data: ProcessedData) => {
        if (!user?.organization_id) return;
        // Map JS/camelCase fields to DB snake_case column names
        const payload: any = {
            file_name: (item as any).fileName || (item as any).file_name || null,
            processed_at: (item as any).processedAt || (item as any).processed_at || new Date().toISOString(),
            user_name: (item as any).user || (item as any).user_name || user.name,
            item_count: (item as any).itemCount ?? (item as any).item_count ?? null,
            unlinked_count: (item as any).unlinkedCount ?? (item as any).unlinked_count ?? 0,
            canal: (item as any).canal || null,
            processed_data: data,
            organization_id: user.organization_id
        };

        try {
            // 1) Persist customers
            try {
                const customersPayload: any[] = [];
                if (data?.lists?.completa && Array.isArray(data.lists.completa)) {
                    const seen = new Set<string>();
                    for (const o of data.lists.completa) {
                        const cpf = (o as any).customer_cpf_cnpj || (o as any).customerCpfCnpj || null;
                        const name = (o as any).customer_name || (o as any).customerName || null;
                        if (cpf && !seen.has(cpf)) {
                            seen.add(cpf);
                            customersPayload.push({ cpf_cnpj: cpf, name: name || cpf, organization_id: user.organization_id });
                        }
                    }
                }
                if (customersPayload.length > 0) {
                    const { error: custErr } = await dbClient.from('customers').upsert(customersPayload, { onConflict: 'organization_id,cpf_cnpj' });
                    if (custErr) console.warn('Failed to upsert customers during import:', custErr);
                }
            } catch (custErr) {
                console.error('Error persisting customers during import:', custErr);
            }

            // 2) Persist orders
            try {
                if (data?.lists?.completa && Array.isArray(data.lists.completa) && data.lists.completa.length > 0) {
                    const ordersPayload = data.lists.completa.map((o: any) => ({
                        order_id: o.orderId || o.order_id,
                        tracking: o.tracking || null,
                        sku: o.sku,
                        quantity: o.qty_original || o.quantity || 1,
                        qty_original: o.qty_original || o.quantity || 1,
                        multiplicador: o.multiplicador || 1,
                        qty_final: o.qty_final || ((o.qty_original || o.quantity || 1) * (o.multiplicador || 1)),
                        color: o.color || null,
                        canal: data.canal || null,
                        data: o.data || null,
                        status: o.status || null,
                        customer_name: o.customer_name || null,
                        customer_cpf_cnpj: o.customer_cpf_cnpj || null,
                        organization_id: user.organization_id
                    }));
                    const { error: ordersErr } = await dbClient.from('orders').upsert(ordersPayload, { onConflict: 'organization_id,order_id,sku' });
                    if (ordersErr) console.warn('Failed to upsert orders during import:', ordersErr);
                }
            } catch (ordersErr) {
                console.error('Error persisting orders during import:', ordersErr);
            }

            // 3) Insert import_history
            const { data: resData, error } = await dbClient.from('import_history').insert(payload).select().single();
            if (error) {
                console.error('Failed to insert import_history:', JSON.stringify(error, null, 2));
                throw new Error(error.message || 'Erro ao salvar histórico de importação');
            }
            // update local state so UI shows the newly saved item
            setImportHistory(prev => resData ? [resData, ...prev] : prev);
            return resData;
        } catch (err: any) {
            console.error('handleAddImportToHistory error:', err);
            throw err;
        }
    };

    const handleSaveEtiquetaHistory = async (item: Omit<EtiquetaHistoryItem, 'id' | 'created_at'>) => {
        if (!user?.organization_id) return null;
        try {
            // Try RPC first (may not exist). If RPC missing or fails, fallback to direct insert.
            let inserted: any = null;
            try {
                const { data: histId, error } = await dbClient.rpc('save_etiqueta_history', {
                    p_created_by_name: (item as any).created_by_name || user.name,
                    p_page_count: (item as any).page_count || 0,
                    p_zpl_content: (item as any).zpl_content || '',
                    p_settings_snapshot: (item as any).settings_snapshot || {},
                    p_page_hashes: (item as any).page_hashes || []
                });
                if (!error && histId) {
                    const { data: updated } = await dbClient.from('etiquetas_historico').select('*').eq('id', histId).single();
                    if (updated) inserted = updated;
                } else {
                    console.warn('RPC save_etiqueta_history unavailable or returned no id, falling back to insert', error);
                }
            } catch (rpcErr) {
                console.warn('RPC call failed (likely missing):', rpcErr);
            }

            if (!inserted) {
                // direct insert fallback
                const payload = {
                    created_by_name: (item as any).created_by_name || user.name,
                    page_count: (item as any).page_count || 0,
                    zpl_content: (item as any).zpl_content || '',
                    settings_snapshot: (item as any).settings_snapshot || {},
                    page_hashes: (item as any).page_hashes || [],
                    organization_id: user.organization_id
                };
                const { data: resData, error: insertErr } = await dbClient.from('etiquetas_historico').insert(payload).select().single();
                if (insertErr) {
                    console.error('Failed to insert etiqueta history fallback:', insertErr);
                    throw new Error(insertErr.message || 'Erro ao salvar histórico de etiquetas');
                }
                inserted = resData;
            }

            if (inserted) setEtiquetasHistory(prev => [inserted, ...prev]);
            return inserted;
        } catch (err: any) {
            console.error('handleSaveEtiquetaHistory error:', err);
            throw err;
        }
    };
  
    const handleDeleteImportHistoryItem = async (historyItemId: string) => {
        try {
            const itemToDelete = importHistory.find(item => item.id === historyItemId);
            if (!itemToDelete) {
                addToast('Item de histórico não encontrado.', 'error');
                return;
            }
            
            const orderIds = new Set(itemToDelete.processedData.lists.completa.map(o => o.orderId));
            
            const { error: ordersError } = await dbClient.from('orders').delete().in('order_id', Array.from(orderIds));
            if (ordersError) {
                console.error('Failed to delete related orders:', ordersError);
                addToast('Erro ao deletar pedidos relacionados.', 'error');
                return;
            }
            
            const { error: historyError } = await dbClient.from('import_history').delete().eq('id', historyItemId);
            if (historyError) {
                console.error('Failed to delete import history item:', historyError);
                addToast('Erro ao deletar item de histórico.', 'error');
                return;
            }
            
            addToast('Histórico de importação deletado com sucesso!', 'success');
        } catch (err) {
            console.error('handleDeleteImportHistoryItem error:', err);
            addToast('Erro ao deletar histórico de importação.', 'error');
        }
    };

    const handleNewScan = async (code: string): Promise<ScanResult> => {
        return await resolveScan(dbClient, code, user!, 'WebApp', users, generalSettings.bipagem);
    };
    
    const handleDeleteOrders = async (orderIds: string[]) => {
        try {
            const { error } = await dbClient.from('orders').delete().in('order_id', orderIds);
            if (error) {
                console.error('Failed to delete orders:', error);
                addToast('Erro ao deletar pedidos.', 'error');
                return;
            }
            addToast(`${orderIds.length} pedido(s) excluído(s) com sucesso!`, 'success');
        } catch (err) {
            console.error('handleDeleteOrders error:', err);
            addToast('Erro ao deletar pedidos.', 'error');
        }
    };

    const handleHardDeleteScanLog = async (scanId: string): Promise<void> => {
        try {
            const { error } = await dbClient.from('scan_logs').delete().eq('id', scanId);
            if (error) {
                console.error('Failed to delete scan log:', error);
                addToast('Erro ao deletar registro de leitura.', 'error');
                return;
            }
            addToast('Registro de leitura deletado com sucesso!', 'success');
        } catch (err) {
            console.error('handleHardDeleteScanLog error:', err);
            addToast('Erro ao deletar registro de leitura.', 'error');
        }
    };

    const onBulkHardDeleteScanLog = async (scanIds: string[]): Promise<void> => {
        try {
            const { error } = await dbClient.from('scan_logs').delete().in('id', scanIds);
            if (error) {
                console.error('Failed to bulk delete scan logs:', error);
                addToast('Erro ao deletar registros de leitura.', 'error');
                return;
            }
            addToast(`${scanIds.length} registro(s) de leitura deletado(s) com sucesso!`, 'success');
        } catch (err) {
            console.error('onBulkHardDeleteScanLog error:', err);
            addToast('Erro ao deletar registros de leitura.', 'error');
        }
    };
  
    const handleBulkUpdateStockItems = async (updates: { id: string, min_qty: number }[]) => {
        if (!user?.organization_id) return;
        try {
            const { error } = await dbClient.from('stock_items').upsert(updates.map(u => ({...u, organization_id: user.organization_id})));
            if (error) {
                console.error('Failed to bulk update stock_items:', error);
                addToast('Erro ao atualizar quantidades de produtos.', 'error');
            } else {
                addToast(`${updates.length} produto(s) atualizado(s) com sucesso!`, 'success');
            }
        } catch (err) {
            console.error('handleBulkUpdateStockItems error:', err);
            addToast('Erro ao atualizar quantidades de produtos.', 'error');
        }
    };

    const handleBulkInventoryUpdate = async (updates: { code: string, quantity: number }[]): Promise<string> => {
        if (!user?.organization_id) return 'Erro: Usuário não autenticado';
        
        try {
            // 1. Build updates for stock_items upsert
            const stockItemUpdates = updates.map(u => {
                const existingItem = stockItems.find(si => si.code === u.code);
                return {
                    code: u.code,
                    quantity: u.quantity,
                    organization_id: user.organization_id,
                    ...(existingItem && { id: existingItem.id })
                };
            });

            // 2. Upsert stock items
            const { error: upsertError } = await dbClient.from('stock_items').upsert(stockItemUpdates, { onConflict: 'code' });
            
            if (upsertError) {
                console.error('Failed to upsert stock_items:', upsertError);
                addToast('Erro ao atualizar estoque no banco de dados.', 'error');
                return `Erro ao salvar: ${upsertError.message}`;
            }

            // 3. Build movements array for RPC log
            const movements = updates.map(u => ({
                stock_item_id: stockItems.find(si => si.code === u.code)?.id || '',
                quantity_changed: u.quantity,
                movement_type: 'ajuste_planilha',
                notes: `Ajuste de estoque via importação de planilha`
            }));

            // 4. Log movements via RPC
            const { data: logResult, error: logError } = await dbClient.rpc('log_stock_movements_batch', {
                p_movements: movements
            });

            if (logError) {
                console.error('Failed to log stock movements:', logError);
                // Don't fail the operation if logging fails, just warn
                addToast(`${updates.length} produto(s) atualizado(s), mas houve erro ao registrar histórico.`, 'error');
                return `Atualizado com aviso: ${logError.message}`;
            }

            addToast(`${updates.length} produto(s) atualizado(s) com sucesso!`, 'success');
            
            // Refresh stock items to reflect changes
            await fetchAllData();
            
            return `Sucesso: ${updates.length} itens atualizados`;

        } catch (err) {
            console.error('handleBulkInventoryUpdate error:', err);
            const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
            addToast(`Erro ao atualizar estoque: ${errorMsg}`, 'error');
            return `Erro: ${errorMsg}`;
        }
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
    
    
    // Check if trial has expired and user is not on subscription page
    const now = new Date().getTime();
    const isOnSubscriptionOrProfile = location.pathname.startsWith('/app/assinatura') || location.pathname === '/app/perfil';
    
    if (subscription?.status === 'trialing' && subscription?.period_end) {
        const periodEnd = new Date(subscription.period_end).getTime();
        const isTrialExpired = now > periodEnd;
        
        if (isTrialExpired && !isOnSubscriptionOrProfile) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)]">
                    <div className="bg-[var(--color-surface)] p-8 rounded-xl border border-[var(--color-border)] shadow-2xl max-w-md text-center">
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">⏰ Período de Teste Expirado</h2>
                        <p className="text-[var(--color-text-secondary)] mb-6">
                            Seu período de teste de 7 dias terminou. Para continuar usando a plataforma, você precisa assinar um plano.
                        </p>
                        <button 
                            onClick={() => navigate('/app/assinatura')}
                            className="w-full px-6 py-3 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
                        >
                            Ver Planos de Assinatura
                        </button>
                    </div>
                </div>
            );
        }
    }

    // Check if labels quota is exhausted (for any plan)
    const hasNoLabelsLeft = remainingLabels !== null && remainingLabels <= 0;
    if (hasNoLabelsLeft && !isOnSubscriptionOrProfile) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)]">
                <div className="bg-[var(--color-surface)] p-8 rounded-xl border border-[var(--color-border)] shadow-2xl max-w-md text-center">
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">🔒 Cota de Etiquetas Esgotada</h2>
                    <p className="text-[var(--color-text-secondary)] mb-6">
                        Você atingiu o limite de etiquetas do seu plano. Faça upgrade para um plano superior para continuar gerando etiquetas.
                    </p>
                    <button 
                        onClick={() => navigate('/app/assinatura')}
                        className="w-full px-6 py-3 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
                    >
                        Fazer Upgrade Agora
                    </button>
                </div>
            </div>
        );
    }
    
    const isEmployee = user?.role === 'FUNCIONARIO';
    const restrictedPaths = ['/app/assinatura', '/app/configuracoes', '/app/equipe', '/app/admin-metrics'];
    
    if (isEmployee && restrictedPaths.some(path => location.pathname.startsWith(path))) {
        return <Navigate to="/app/dashboard" replace />;
    }

    // Limpar cache automaticamente ao entrar em páginas de dados
    useEffect(() => {
        const pathsThatNeedFreshData = ['/app/pedidos', '/app/importer', '/app/estoque', '/app/bipagem'];
        if (pathsThatNeedFreshData.some(path => location.pathname.startsWith(path))) {
            clearAllCache();
        }
    }, [location.pathname]);
    
    return (
        <div className="flex h-screen bg-[var(--color-bg)]">
            <InvisibleLoader isLoading={isLoading} />
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
                        <Route path="dashboard" element={<DashboardPage allOrders={allOrders} scanHistory={scanHistory} stockItems={stockItems} generalSettings={generalSettings} importHistory={importHistory} onBulkUpdateStockItems={handleBulkUpdateStockItems} subscription={subscription} onRefresh={refreshData} user={user} />} />
                        <Route path="importer" element={<ImporterPage allOrders={allOrders} selectedFile={selectedFile} setSelectedFile={setSelectedFile} processedData={processedData} setProcessedData={setProcessedData} error={importerError} setError={setImporterError} isProcessing={isProcessing} setIsProcessing={setIsProcessing} onLaunch={handleLaunch} skuLinks={skuLinks} onLinkSku={handleLinkSku} onUnlinkSku={handleUnlinkSku} products={stockItems} onSaveStockItem={onSaveStockItem as any} onSaveProdutoCombinado={handleSaveProdutoCombinado} produtosCombinados={produtosCombinados} stockItems={stockItems} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} currentUser={user!} importHistory={importHistory} addImportToHistory={handleAddImportToHistory} clearImportHistory={() => setImportHistory([])} onDeleteImportHistoryItem={handleDeleteImportHistoryItem} addToast={addToast} customers={customers} unlinkedSkus={[]} />} />
                        <Route path="etiquetas" element={<EtiquetasPage settings={etiquetasSettings} onSettingsSave={setEtiquetasSettings} stockItems={stockItems} etiquetasState={etiquetasState} setEtiquetasState={setEtiquetasState} currentUser={user!} allOrders={allOrders} setAllOrders={setAllOrders} etiquetasHistory={etiquetasHistory} onSaveHistory={handleSaveEtiquetaHistory} onSaveStockItem={onSaveStockItem as any} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} skuLinks={skuLinks} scanHistory={scanHistory} labelProcessingStatus={labelProcessingStatus} setLabelProcessingStatus={setLabelProcessingStatus} addToast={addToast} onLabelsUsed={refreshData} remainingLabels={remainingLabels} />} />
                        <Route path="pedidos" element={<PedidosPage allOrders={allOrders} scanHistory={scanHistory} setAllOrders={setAllOrders} setScanHistory={setScanHistory} currentUser={user!} generalSettings={generalSettings} addToast={addToast} onDeleteOrders={handleDeleteOrders} />} />
                        <Route path="bipagem" element={<BipagemPage allOrders={allOrders} onNewScan={handleNewScan} onBomDeduction={()=>{}} scanHistory={scanHistory} onCancelBipagem={()=>{}} onBulkCancelBipagem={async () => {}} onHardDeleteScanLog={handleHardDeleteScanLog} onBulkHardDeleteScanLog={onBulkHardDeleteScanLog} products={stockItems} users={users} onAddNewUser={handleAddNewUser} onSaveUser={handleUpdateUser} uiSettings={user?.ui_settings || defaultUiSettings} currentUser={user!} onSyncPending={async () => {}} skuLinks={skuLinks} addToast={addToast} currentPage={location.pathname.split('/')[2] || 'bipagem'} isAutoBipagemActive={isAutoBipagemActive} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} />} />
                        <Route path="produtos" element={<ProductPage stockItems={stockItems} produtosCombinados={produtosCombinados} onSaveProdutoCombinado={handleSaveProdutoCombinado} unlinkedSkus={[]} setUnlinkedSkus={() => {}} onSaveStockItem={onSaveStockItem as any} onDeleteStockItem={handleDeleteStockItem} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} />} />
                        <Route path="estoque" element={<EstoquePage stockItems={stockItems} produtosCombinados={produtosCombinados} onSaveStockItem={onSaveStockItem as any} onDeleteStockItem={handleDeleteStockItem} onBulkDeleteItems={async () => {}} onDeleteItem={handleDeleteStockItem} generalSettings={generalSettings} setGeneralSettings={setGeneralSettings as any} onSaveExpeditionItems={async () => {}} onConfirmImportFromXml={handleLaunch} onUpdateInsumoCategory={async () => {}} onBulkInventoryUpdate={handleBulkInventoryUpdate} users={users} skuLinks={skuLinks} onLinkSku={handleLinkSku} onUnlinkSku={handleUnlinkSku} unlinkedSkus={[]} onSaveProdutoCombinado={handleSaveProdutoCombinado} />} />
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
