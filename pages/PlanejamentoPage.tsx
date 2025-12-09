
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { StockItem, OrderItem, SkuLink, ProdutoCombinado, ProductionPlan, PlanningParameters, ProductionPlanItem, RequiredInsumo, ShoppingListItem, User, ToastMessage } from '../types';
import { Plus } from 'lucide-react';
import { BarChart2, Calendar, Shield, TrendingUp, CheckCircle, ListTodo, Clipboard, Factory, Package, AlertTriangle, Info, Save, Settings, Loader2, FileDown, History, HelpCircle, ChevronDown, ChevronUp, Trash2, Send, Zap } from 'lucide-react';
import { exportProductionPlanToPdf } from '../lib/export';
import ConfirmActionModal from '../components/ConfirmActionModal';
import InfoModal from '../components/InfoModal';

interface PlanejamentoPageProps {
    stockItems: StockItem[];
    allOrders: OrderItem[];
    skuLinks: SkuLink[];
    produtosCombinados: ProdutoCombinado[];
    productionPlans: ProductionPlan[];
    onSaveProductionPlan: (plan: Omit<ProductionPlan, 'id' | 'createdAt' | 'createdBy'>) => Promise<ProductionPlan | null>;
    onDeleteProductionPlan: (planId: string) => Promise<boolean>;
    onGenerateShoppingList: (list: ShoppingListItem[]) => void;
    currentUser: User;
    planningSettings: PlanningParameters;
    onSavePlanningSettings: (settings: PlanningParameters) => void;
    addToast: (message: string, type: ToastMessage['type']) => void;
}

const StepHeader: React.FC<{ number: number, title: string, isComplete: boolean }> = ({ number, title, isComplete }) => (
    <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold ${isComplete ? 'bg-green-600 text-white' : 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'}`}>
            {isComplete ? <CheckCircle size={20} /> : number}
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{title}</h2>
    </div>
);

const PlanejamentoPage: React.FC<PlanejamentoPageProps> = ({ stockItems, allOrders, skuLinks, produtosCombinados, productionPlans, onSaveProductionPlan, onDeleteProductionPlan, onGenerateShoppingList, currentUser, planningSettings, onSavePlanningSettings, addToast }) => {
    const [mode, setMode] = useState<'automatico' | 'manual'>('automatico');
    const [manualParams, setManualParams] = useState<PlanningParameters>(planningSettings);
    const [autoParams, setAutoParams] = useState<PlanningParameters>(planningSettings);
    const [productionPlan, setProductionPlan] = useState<ProductionPlanItem[]>([]);
    const [requiredInsumos, setRequiredInsumos] = useState<RequiredInsumo[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [planName, setPlanName] = useState(`Plano de ${new Date().toLocaleDateString('pt-br', { month: 'long', year: 'numeric' })}`);
    const [activePlan, setActivePlan] = useState<ProductionPlan | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [infoModalContent, setInfoModalContent] = useState({ title: '', message: '' });
    const [planSaved, setPlanSaved] = useState(false);
    
    const [analysisPeriod, setAnalysisPeriod] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
    const [calculatedSpikeMultiplier, setCalculatedSpikeMultiplier] = useState(1);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [newSpikeDay, setNewSpikeDay] = useState({ date: '', name: '', channel: 'Geral' as 'Geral' | 'ML' | 'SHOPEE' });

    const toISODate = (date: Date) => date.toISOString().split('T')[0];

    useEffect(() => {
        setAutoParams(planningSettings);
        setManualParams(planningSettings);
    }, [planningSettings]);

    const handleCalculate = useCallback(() => {
        if (allOrders.length === 0) {
             addToast('Não há dados de pedidos para analisar.', 'error');
            return;
        }

        setPlanSaved(false);
        setIsCalculating(true);
        setActivePlan(null);

        setTimeout(() => {
            const paramsToUse = mode === 'automatico' ? autoParams : manualParams;
            if (mode === 'manual') {
                onSavePlanningSettings(manualParams);
            }

            const { analysisPeriodValue, analysisPeriodUnit, forecastPeriodDays, safetyStockDays } = paramsToUse;

            const today = new Date();
            let startDate = new Date();
            if (analysisPeriodUnit === 'months') {
                startDate.setMonth(startDate.getMonth() - analysisPeriodValue);
            } else {
                startDate.setDate(startDate.getDate() - analysisPeriodValue);
            }
             if (isNaN(startDate.getTime())) {
                addToast('Data de análise inválida. Verifique os parâmetros.', 'error');
                setIsCalculating(false);
                return;
            }
            
            setAnalysisPeriod({ start: toISODate(startDate), end: toISODate(today) });

            const salesHistory = allOrders.filter(o => {
                const orderDateStr = String(o.data || '').split('/').reverse().join('-');
                if (!/^\d{4}-\d{2}-\d{2}$/.test(orderDateStr)) return false;
                const orderDate = new Date(orderDateStr + "T12:00:00Z");
                if (isNaN(orderDate.getTime())) return false;
                return orderDate >= startDate && orderDate <= today;
            });

            let avgDailySalesMap = new Map<string, number>();
            let finalPromotionMultiplier = 1;

            if (mode === 'automatico') {
                const spikeDays = new Set((paramsToUse.historicalSpikeDays || []).map(d => d.date));
                const getOrderDate = (o: OrderItem) => String(o.data || '').split('/').reverse().join('-');
                
                const normalDaysSales = salesHistory.filter(o => o.data && !spikeDays.has(getOrderDate(o)));
                const spikeDaysSales = salesHistory.filter(o => o.data && spikeDays.has(getOrderDate(o)));

                const normalDaysInPeriod = new Set(normalDaysSales.map(o => o.data));
                const spikeDaysInPeriod = new Set(spikeDaysSales.map(o => o.data));

                const totalNormalSales = normalDaysSales.reduce((sum, o) => sum + o.qty_final, 0);
                const totalSpikeSales = spikeDaysInPeriod.size > 0 ? spikeDaysSales.reduce((sum, o) => sum + o.qty_final, 0) : 0;

                const avgNormalDailySales = normalDaysInPeriod.size > 0 ? totalNormalSales / normalDaysInPeriod.size : 0;
                const avgSpikeDailySales = spikeDaysInPeriod.size > 0 ? totalSpikeSales / spikeDaysInPeriod.size : 0;

                const multiplier = (avgNormalDailySales > 0 && avgSpikeDailySales > 0) ? avgSpikeDailySales / avgNormalDailySales : 1;
                finalPromotionMultiplier = Math.max(1, multiplier);
                setCalculatedSpikeMultiplier(finalPromotionMultiplier);
                
                const productSales = new Map<string, number>();
                const linkedSkusMap = new Map<string, string>(skuLinks.map(l => [l.importedSku, l.masterProductSku]));
                normalDaysSales.forEach(order => {
                    const masterSku = linkedSkusMap.get(order.sku);
                    if (masterSku) productSales.set(masterSku, (productSales.get(masterSku) || 0) + order.qty_final);
                });
                
                productSales.forEach((totalSales, productCode) => {
                    avgDailySalesMap.set(productCode, normalDaysInPeriod.size > 0 ? totalSales / normalDaysInPeriod.size : 0);
                });
            } else { // Manual Mode
                finalPromotionMultiplier = 1 + (paramsToUse.promotionMultiplier / 100);
                const salesDaysCount = new Set(salesHistory.map(o => o.data)).size;
                const linkedSkusMap = new Map<string, string>(skuLinks.map(l => [l.importedSku, l.masterProductSku]));
                const productSales = new Map<string, number>();
                salesHistory.forEach(order => {
                    const masterSku = linkedSkusMap.get(order.sku);
                    if (masterSku) productSales.set(masterSku, (productSales.get(masterSku) || 0) + order.qty_final);
                });

                productSales.forEach((totalSales, productCode) => {
                    avgDailySalesMap.set(productCode, salesDaysCount > 0 ? totalSales / salesDaysCount : 0);
                });
            }

            const finalForecastDays = forecastPeriodDays + safetyStockDays;
            const newProductionPlan: ProductionPlanItem[] = [];

            stockItems.filter(i => i.kind === 'PRODUTO').forEach(product => {
                const avgDailySales = avgDailySalesMap.get(product.code) || 0;
                const forecastedDemand = avgDailySales * finalForecastDays * finalPromotionMultiplier;
                
                const substitute = product.substitute_product_code ? stockItems.find(s => s.code === product.substitute_product_code) : undefined;
                const substituteStock = substitute ? substitute.current_qty : 0;
                
                const requiredProduction = Math.ceil(Math.max(0, forecastedDemand - (product.current_qty + substituteStock)));
                
                let reason = '';
                if (requiredProduction > 0) {
                    if (product.current_qty <= 0 && substituteStock <=0) reason = 'Sem estoque principal ou substituto';
                    else if (product.current_qty <= 0 && substituteStock > 0) reason = 'Usando estoque substituto';
                    else reason = 'Estoque baixo';
                }
                
                newProductionPlan.push({ product, avgDailySales, forecastedDemand, requiredProduction, reason, substitute });
            });
            setProductionPlan(newProductionPlan.sort((a,b) => b.requiredProduction - a.requiredProduction));

            const insumosMap = new Map<string, number>();
            const bomMap = new Map<string, ProdutoCombinado>(produtosCombinados.map(p => [p.productSku, p]));
            const stockMap = new Map<string, StockItem>(stockItems.map(i => [i.code, i]));
            
            const explodeBom = (productCode: string, quantity: number) => {
                const bom = bomMap.get(productCode);
                if (!bom || !Array.isArray(bom.items)) return;
                for (const item of (bom.items as { stockItemCode: string; qty_per_pack: number; }[])) {
                    const insumo = stockMap.get(item.stockItemCode);
                    if (!insumo) continue;
                    const needed = quantity * item.qty_per_pack;
                    if(insumo.kind === 'PROCESSADO') explodeBom(insumo.code, needed);
                    if (insumo.kind === 'INSUMO' || insumo.kind === 'PROCESSADO') insumosMap.set(insumo.code, (insumosMap.get(insumo.code) || 0) + needed);
                }
            };
            newProductionPlan.forEach(planItem => { if (planItem.requiredProduction > 0) explodeBom(planItem.product.code, planItem.requiredProduction); });

            const newRequiredInsumos: RequiredInsumo[] = [];
            insumosMap.forEach((requiredQty, insumoCode) => {
                const insumo = stockItems.find(i => i.code === insumoCode);
                if (insumo) {
                    const deficit = requiredQty - insumo.current_qty;
                    const purchaseBy = new Date();
                    purchaseBy.setDate(purchaseBy.getDate() - (paramsToUse.defaultLeadTimeDays || 14));
                    newRequiredInsumos.push({ insumo, requiredQty, currentStock: insumo.current_qty, deficit, leadTime: paramsToUse.defaultLeadTimeDays || 14, purchaseBy });
                }
            });
            setRequiredInsumos(newRequiredInsumos.sort((a,b) => b.deficit - a.deficit));
            setIsCalculating(false);
        }, 500);
    }, [allOrders, skuLinks, stockItems, produtosCombinados, mode, autoParams, manualParams, addToast, onSavePlanningSettings]);
    
    const handleAutoParamChange = (field: keyof PlanningParameters, value: any) => {
        setAutoParams(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSaveAutoParams = () => {
        onSavePlanningSettings(autoParams);
        setIsSettingsOpen(false);
    };
    
    const handleManualParamChange = (field: keyof PlanningParameters, value: any) => {
        setManualParams(prev => ({ ...prev, [field]: value }));
    };
    
    const handleAddSpikeDay = () => {
        if(newSpikeDay.date && newSpikeDay.name) {
            const updatedSpikeDays = [...(autoParams.historicalSpikeDays || []), newSpikeDay].sort((a,b) => b.date.localeCompare(a.date));
            handleAutoParamChange('historicalSpikeDays', updatedSpikeDays);
            setNewSpikeDay({ date: '', name: '', channel: 'Geral' });
        }
    };
    
    const handleRemoveSpikeDay = (date: string, name: string) => {
        const updatedSpikeDays = (autoParams.historicalSpikeDays || []).filter(d => d.date !== date || d.name !== name);
        handleAutoParamChange('historicalSpikeDays', updatedSpikeDays);
    };

    const handleNewPlan = () => {
        setProductionPlan([]);
        setRequiredInsumos([]);
        setActivePlan(null);
        setPlanSaved(false);
        setPlanName(`Plano de ${new Date().toLocaleDateString('pt-br', { month: 'long', year: 'numeric' })}`);
    };

    const handleUpdateProduction = (productCode: string, newRequired: number) => {
        const value = Math.max(0, newRequired);
        setProductionPlan(prev => prev.map(item => item.product.code === productCode ? {...item, requiredProduction: value} : item));
    };

    const handleSavePlan = async () => {
        setIsActionLoading(true);
        const paramsToSave = mode === 'automatico' ? planningSettings : manualParams;
        const planToSave = {
            name: planName, status: 'Draft' as const, parameters: paramsToSave,
            items: productionPlan.filter(i => i.requiredProduction > 0).map(i => ({ product_sku: i.product.code, product_name: i.product.name, current_stock: i.product.current_qty, avg_daily_consumption: i.avgDailySales, forecasted_demand: i.forecastedDemand, required_production: i.requiredProduction })),
            planDate: new Date().toISOString().split('T')[0]
        };
        const savedPlan = await onSaveProductionPlan(planToSave);
        if(savedPlan) { setActivePlan(savedPlan); setPlanSaved(true); }
        setIsActionLoading(false);
        return savedPlan;
    };

    const handleGenerateList = () => {
        setIsActionLoading(true);
        const shoppingListItems: ShoppingListItem[] = requiredInsumos.filter(i => i.deficit > 0).map(i => ({ id: i.insumo.code, name: i.insumo.name, quantity: i.deficit, unit: i.insumo.unit }));
        onGenerateShoppingList(shoppingListItems);
        setIsActionLoading(false);
    };

    const handleSaveAndGenerate = async () => {
        const savedPlan = await handleSavePlan();
        if (savedPlan) {
            handleGenerateList();
        }
    };

    const handleLoadPlan = (plan: ProductionPlan) => {
        setActivePlan(plan);
        setMode('manual'); // Loading a historic plan puts it in manual mode for editing
        setManualParams(plan.parameters);
        // FIX: Added an explicit return type to the map callback to ensure structural compatibility with ProductionPlanItem, resolving the type predicate error.
        const loadedPlanItems: ProductionPlanItem[] = plan.items
            .map((item): ProductionPlanItem | null => {
                const product = stockItems.find(p => p.code === item.product_sku);
                if (!product) return null;
                const substitute = product.substitute_product_code ? stockItems.find(s => s.code === product.substitute_product_code) : undefined;
                return { product, avgDailySales: item.avg_daily_consumption, forecastedDemand: item.forecasted_demand, requiredProduction: item.required_production, reason: '', substitute };
            })
            .filter((item): item is ProductionPlanItem => item !== null);
        
        setProductionPlan(loadedPlanItems);
    
        const insumosMap = new Map<string, number>();
        const bomMap = new Map<string, ProdutoCombinado>(produtosCombinados.map(p => [p.productSku, p]));
        const stockMap = new Map<string, StockItem>(stockItems.map(i => [i.code, i]));
    
        const explodeBom = (productCode: string, quantity: number) => {
            const bom = bomMap.get(productCode);
            if (!bom || !Array.isArray(bom.items)) return;
            for (const item of (bom.items as { stockItemCode: string; qty_per_pack: number; }[])) {
                const insumo = stockMap.get(item.stockItemCode);
                if (!insumo) continue;
                const needed = quantity * item.qty_per_pack;
                if (insumo.kind === 'PROCESSADO') explodeBom(insumo.code, needed);
                if (insumo.kind === 'INSUMO' || insumo.kind === 'PROCESSADO') insumosMap.set(insumo.code, (insumosMap.get(insumo.code) || 0) + needed);
            }
        };
        loadedPlanItems.forEach(planItem => { if (planItem.requiredProduction > 0) explodeBom(planItem.product.code, planItem.requiredProduction); });
    
        const newRequiredInsumos: RequiredInsumo[] = [];
        insumosMap.forEach((requiredQty, insumoCode) => {
            const insumo = stockItems.find(i => i.code === insumoCode);
            if (insumo) {
                const deficit = requiredQty - insumo.current_qty;
                const purchaseBy = new Date();
                purchaseBy.setDate(purchaseBy.getDate() - (plan.parameters.defaultLeadTimeDays || 14));
                newRequiredInsumos.push({ insumo, requiredQty, currentStock: insumo.current_qty, deficit, leadTime: plan.parameters.defaultLeadTimeDays || 14, purchaseBy });
            }
        });
        setRequiredInsumos(newRequiredInsumos.sort((a,b) => b.deficit - a.deficit));
        setPlanSaved(true);
    };

    const handleDeletePlan = async () => {
        if (activePlan) {
            setIsActionLoading(true);
            const success = await onDeleteProductionPlan(activePlan.id);
            if(success) handleNewPlan();
            setIsActionLoading(false);
            setIsDeleteModalOpen(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Planejamento de Produção e Compras</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">Gere planos de produção baseados no histórico de vendas e crie listas de compras automaticamente.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleNewPlan} className="flex items-center text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus size={16} className="mr-2"/> Novo Plano
                    </button>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                <StepHeader number={1} title="Definir Parâmetros" isComplete={productionPlan.length > 0} />
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-4 mb-4">
                        <label className="font-semibold text-[var(--color-text-primary)]">Modo:</label>
                        <div className="flex items-center p-1 bg-[var(--color-surface-secondary)] rounded-lg">
                            <button onClick={() => setMode('automatico')} className={`px-3 py-1 text-sm rounded-md ${mode === 'automatico' ? 'bg-[var(--color-surface)] shadow-sm font-semibold text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>Automático</button>
                            <button onClick={() => setMode('manual')} className={`px-3 py-1 text-sm rounded-md ${mode === 'manual' ? 'bg-[var(--color-surface)] shadow-sm font-semibold text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>Manual</button>
                        </div>
                    </div>
                    
                    {mode === 'automatico' ? (
                        <div className="p-4 bg-[var(--color-info-bg)] border border-[var(--color-info-border)] rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-[var(--color-info-text)]">Cálculo Automático</p>
                                    <p className="text-sm text-[var(--color-info-text)]">Usará os parâmetros salvos no sistema para calcular a projeção, incluindo análise de picos de venda.</p>
                                </div>
                                <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold rounded-md border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-surface-secondary)]">
                                    <Settings size={16}/> {isSettingsOpen ? 'Fechar' : 'Configurar'}
                                </button>
                            </div>
                            {isSettingsOpen && (
                                <div className="mt-4 pt-4 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-[var(--color-text-primary)]">Parâmetros</h4>
                                        <div><label className="text-sm text-[var(--color-text-secondary)]">Período Análise</label><div className="flex gap-2"><input type="number" value={autoParams.analysisPeriodValue} onChange={e => handleAutoParamChange('analysisPeriodValue', Number(e.target.value))} className="w-20 p-1 border border-[var(--color-border)] bg-[var(--color-surface)] rounded text-[var(--color-text-primary)]"/><select value={autoParams.analysisPeriodUnit} onChange={e => handleAutoParamChange('analysisPeriodUnit', e.target.value)} className="p-1 border border-[var(--color-border)] bg-[var(--color-surface)] rounded text-[var(--color-text-primary)]"><option value="days">dias</option><option value="months">meses</option></select></div></div>
                                        <div><label className="text-sm text-[var(--color-text-secondary)]">Dias Projeção</label><input type="number" value={autoParams.forecastPeriodDays} onChange={e => handleAutoParamChange('forecastPeriodDays', Number(e.target.value))} className="w-full p-1 border border-[var(--color-border)] bg-[var(--color-surface)] rounded text-[var(--color-text-primary)]"/></div>
                                        <div><label className="text-sm text-[var(--color-text-secondary)]">Dias Segur.</label><input type="number" value={autoParams.safetyStockDays} onChange={e => handleAutoParamChange('safetyStockDays', Number(e.target.value))} className="w-full p-1 border border-[var(--color-border)] bg-[var(--color-surface)] rounded text-[var(--color-text-primary)]"/></div>
                                        <div><label className="text-sm text-[var(--color-text-secondary)]">Lead Time (dias)</label><input type="number" value={autoParams.defaultLeadTimeDays} onChange={e => handleAutoParamChange('defaultLeadTimeDays', Number(e.target.value))} className="w-full p-1 border border-[var(--color-border)] bg-[var(--color-surface)] rounded text-[var(--color-text-primary)]"/></div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-[var(--color-text-primary)]">Picos de Venda</h4>
                                        <div className="flex items-end gap-2 p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md flex-wrap">
                                            <div className="flex-grow"><label className="text-xs text-[var(--color-text-secondary)]">Data</label><input type="date" value={newSpikeDay.date} onChange={e => setNewSpikeDay(p => ({...p, date: e.target.value}))} className="w-full p-1 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-[var(--color-text-primary)]"/></div>
                                            <div className="flex-grow"><label className="text-xs text-[var(--color-text-secondary)]">Nome</label><input type="text" value={newSpikeDay.name} onChange={e => setNewSpikeDay(p => ({...p, name: e.target.value}))} placeholder="Ex: Dia das Mães" className="w-full p-1 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-[var(--color-text-primary)]"/></div>
                                            <button onClick={handleAddSpikeDay} className="p-2 bg-blue-500 text-white rounded-md"><Plus size={16}/></button>
                                        </div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">{(autoParams.historicalSpikeDays || []).map((d, i) => (<div key={i} className="flex justify-between items-center bg-[var(--color-surface)] p-1.5 rounded text-xs border border-[var(--color-border)]"><span className="font-semibold text-[var(--color-text-primary)]">{d.name} ({new Date(d.date+'T12:00:00').toLocaleDateString()})</span><button onClick={()=>handleRemoveSpikeDay(d.date, d.name)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={12}/></button></div>))}</div>
                                    </div>
                                     <div className="md:col-span-2 flex justify-end"><button onClick={handleSaveAutoParams} className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold flex items-center gap-2"><Save size={16}/> Salvar Parâmetros</button></div>
                                </div>
                            )}
                        </div>
                    ) : (
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
                            <div><label className="text-sm font-medium text-[var(--color-text-secondary)]">Período Análise</label><div className="flex items-center gap-2 mt-1"><input type="number" value={manualParams.analysisPeriodValue} onChange={e => handleManualParamChange('analysisPeriodValue', Number(e.target.value))} className="w-20 p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-[var(--color-text-primary)]"/><select value={manualParams.analysisPeriodUnit} onChange={e => handleManualParamChange('analysisPeriodUnit', e.target.value)} className="p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-[var(--color-text-primary)]"><option value="days">dias</option><option value="months">meses</option></select></div></div>
                            <div><label className="text-sm font-medium text-[var(--color-text-secondary)]">Dias Projeção</label><input type="number" value={manualParams.forecastPeriodDays} onChange={e => handleManualParamChange('forecastPeriodDays', Number(e.target.value))} className="w-full mt-1 p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-[var(--color-text-primary)]"/></div>
                            <div><label className="text-sm font-medium text-[var(--color-text-secondary)]">Dias Segur.</label><input type="number" value={manualParams.safetyStockDays} onChange={e => handleManualParamChange('safetyStockDays', Number(e.target.value))} className="w-full mt-1 p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-[var(--color-text-primary)]"/></div>
                            <div><label className="text-sm font-medium text-[var(--color-text-secondary)]">Aumento Vendas (%)</label><input type="number" value={manualParams.promotionMultiplier} onChange={e => handleManualParamChange('promotionMultiplier', Number(e.target.value))} className="w-full mt-1 p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-[var(--color-text-primary)]"/></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                <StepHeader number={2} title="Analisar e Ajustar Plano de Produção" isComplete={productionPlan.length > 0} />
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <button onClick={handleCalculate} disabled={isCalculating} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50">
                            {isCalculating ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16}/>} Calcular Plano ({mode === 'automatico' ? 'Automático' : 'Manual'})
                        </button>
                        <div className="text-sm text-right">
                            {analysisPeriod.start && analysisPeriod.end && <p className="text-[var(--color-text-secondary)]">Analisando vendas de <strong className="text-[var(--color-text-primary)]">{new Date(analysisPeriod.start + 'T12:00:00Z').toLocaleDateString()}</strong> até <strong className="text-[var(--color-text-primary)]">{new Date(analysisPeriod.end + 'T12:00:00Z').toLocaleDateString()}</strong>.</p>}
                            {mode === 'automatico' && calculatedSpikeMultiplier > 1 && <p className="text-[var(--color-primary)] font-semibold">Multiplicador de pico aplicado: {calculatedSpikeMultiplier.toFixed(2)}x</p>}
                        </div>
                    </div>
                    {isCalculating ? <div className="text-center p-8"><Loader2 size={32} className="animate-spin text-[var(--color-primary)]"/></div> :
                        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] max-h-96">
                            <table className="min-w-full bg-[var(--color-surface)] text-sm">
                                <thead className="bg-[var(--color-surface-secondary)] sticky top-0"><tr>{['Produto', 'Estoque Atual', 'Venda Média/dia', 'Demanda Projetada', 'Produção Necessária', 'Motivo'].map(h=><th key={h} className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {productionPlan.length > 0 ? productionPlan.map(item => (
                                        <tr key={item.product.id} className={item.requiredProduction > 0 ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]' : ''}>
                                            <td className="py-2 px-3 font-medium text-[var(--color-text-primary)]">
                                                {item.product.name}
                                                {item.substitute && <span className="text-xs block text-blue-600">(Substituto: {item.substitute.name})</span>}
                                            </td>
                                            <td className="py-2 px-3 text-center text-[var(--color-text-primary)]">
                                                {item.product.current_qty}
                                                {item.substitute && <span className="text-xs block text-blue-600">(+{item.substitute.current_qty})</span>}
                                            </td>
                                            <td className="py-2 px-3 text-center text-[var(--color-text-primary)]">{item.avgDailySales.toFixed(2)}</td>
                                            <td className="py-2 px-3 text-center text-[var(--color-text-primary)]">{Math.ceil(item.forecastedDemand)}</td>
                                            <td className="py-2 px-3"><input type="number" value={item.requiredProduction} onChange={e => handleUpdateProduction(item.product.code, Number(e.target.value))} className="w-24 p-1 text-center font-bold border rounded-md bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)]" /></td>
                                            <td className="py-2 px-3">{item.reason}</td>
                                        </tr>
                                    )) : <tr><td colSpan={6} className="text-center p-8 text-[var(--color-text-secondary)]">Calcule a previsão para gerar o plano.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    }
                </div>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                 <StepHeader number={3} title="Analisar Materiais e Gerar Lista de Compras" isComplete={planSaved} />
                 <div className="mt-4 pt-4 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                         <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2"><Package size={18}/> Insumos Necessários</h3>
                         <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] max-h-96">
                            <table className="min-w-full bg-[var(--color-surface)] text-sm">
                                <thead className="bg-[var(--color-surface-secondary)] sticky top-0"><tr>{['Insumo', 'Necessidade', 'Estoque', 'Déficit'].map(h=><th key={h} className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                     {requiredInsumos.length > 0 ? requiredInsumos.map(item => (
                                        <tr key={item.insumo.id} className={item.deficit > 0 ? 'bg-[var(--color-danger-bg)]' : ''}>
                                            <td className="py-2 px-3 font-medium text-[var(--color-text-primary)]">{item.insumo.name}</td>
                                            <td className="py-2 px-3 text-center text-[var(--color-text-primary)]">{item.requiredQty.toFixed(2)}</td>
                                            <td className="py-2 px-3 text-center text-[var(--color-text-primary)]">{item.currentStock.toFixed(2)}</td>
                                            <td className={`py-2 px-3 text-center font-bold ${item.deficit > 0 ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-success-text)]'}`}>{item.deficit.toFixed(2)}</td>
                                        </tr>
                                    )) : <tr><td colSpan={4} className="text-center p-8 text-[var(--color-text-secondary)]">Ajuste o plano para calcular os insumos.</td></tr>}
                                </tbody>
                            </table>
                         </div>
                     </div>
                     <div className="space-y-4">
                         <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2"><ListTodo size={18}/> Ações e Histórico</h3>
                         <div className="p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg space-y-3">
                             <div><label className="text-sm font-medium text-[var(--color-text-secondary)]">Nome do Plano</label><input type="text" value={planName} onChange={e => setPlanName(e.target.value)} className="w-full mt-1 p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-[var(--color-text-primary)]" /></div>
                             <div className="flex gap-2">
                                <button onClick={handleSavePlan} disabled={isActionLoading || productionPlan.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50">
                                    {isActionLoading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {planSaved ? 'Salvar Alterações' : 'Salvar Plano'}
                                </button>
                                <button onClick={() => exportProductionPlanToPdf(productionPlan, manualParams)} disabled={productionPlan.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50">
                                    <FileDown size={16}/> Exportar PDF
                                </button>
                             </div>
                             <button onClick={handleSaveAndGenerate} disabled={isActionLoading || requiredInsumos.filter(i => i.deficit > 0).length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50">
                                {isActionLoading ? <Loader2 size={16} className="animate-spin"/> : <Clipboard size={16}/>} Salvar e Gerar Lista de Compras
                            </button>
                         </div>
                         <div className="p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
                             <h4 className="font-medium text-[var(--color-text-primary)] flex items-center gap-2 mb-2"><History size={16}/> Planos Salvos</h4>
                             <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                 {productionPlans.map(plan => (
                                     <div key={plan.id} className={`flex justify-between items-center p-2 rounded-md ${activePlan?.id === plan.id ? 'bg-[var(--color-primary-bg-subtle)] border border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border border-[var(--color-border)]'}`}>
                                         <div>
                                            <p className="font-semibold text-sm text-[var(--color-text-primary)]">{plan.name}</p>
                                            <p className="text-xs text-[var(--color-text-secondary)]">Criado por {plan.createdBy} em {new Date(plan.createdAt).toLocaleDateString()}</p>
                                        </div>
                                         <div className="flex gap-1">
                                            <button onClick={() => handleLoadPlan(plan)} className="p-1 text-[var(--color-primary-text-subtle)] hover:bg-[var(--color-surface-tertiary)] rounded-full"><Send size={14}/></button>
                                            <button onClick={() => { setActivePlan(plan); setIsDeleteModalOpen(true); }} className="p-1 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={14}/></button>
                                        </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>
                 </div>
            </div>
            {isDeleteModalOpen && activePlan && <ConfirmActionModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeletePlan} title="Excluir Plano" message={<p>Tem certeza que deseja excluir o plano <strong className="text-[var(--modal-text-primary)]">{activePlan.name}</strong>?</p>} confirmButtonText="Excluir" isConfirming={isActionLoading} />}
            <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title={infoModalContent.title} message={<pre className="text-sm whitespace-pre-wrap">{infoModalContent.message}</pre>} />
        </div>
    );
};

export default PlanejamentoPage;
