

import React, { useState, useMemo, useEffect } from 'react';
import FileUploader from '../components/FileUploader';
// FIX: Changed to a named import to resolve the "no default export" error.
import { ImportResults } from '../components/ImportResults';
import LinkSkuModal from '../components/LinkSkuModal';
import ProductFormModal from '../components/ProductFormModal';
import CategoryBaseConfigModal from '../components/CategoryBaseConfigModal'; // Novo
import DateFilterModal from '../components/DateFilterModal';
import { ProcessedData, OrderItem, SkuLink, StockItem, ProdutoCombinado, GeneralSettings, User, ImportHistoryItem, Canal, Customer, ToastMessage } from '../types';
import { parseExcelFile } from '../lib/parser';
import { getMultiplicadorFromSku, classificarCor } from '../lib/sku';
import { Loader2, Zap, Trash2, Eye, ArrowLeft, History, XCircle } from 'lucide-react';
import ConfirmActionModal from '../components/ConfirmActionModal';

interface ImporterPageProps {
    allOrders: OrderItem[];
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    processedData: ProcessedData | null;
    // FIX: Changed prop type to allow state updater functions, resolving assignment error.
    setProcessedData: React.Dispatch<React.SetStateAction<ProcessedData | null>>;
    error: string | null;
    setError: (error: string | null) => void;
    isProcessing: boolean;
    setIsProcessing: (isProcessing: boolean) => void;
    onLaunch: (data: { ordersToCreate: OrderItem[], ordersToUpdate: OrderItem[] }) => void;
    skuLinks: SkuLink[];
    onLinkSku: (importedSku: string, masterProductSku: string) => Promise<boolean>;
    onUnlinkSku: (importedSku: string) => Promise<boolean>;
    products: StockItem[];
    onSaveStockItem: (item: StockItem) => Promise<StockItem | null>;
    onSaveProdutoCombinado: (productSku: string, newBomItems: ProdutoCombinado['items']) => void;
    produtosCombinados: ProdutoCombinado[];
    stockItems: StockItem[];
    generalSettings: GeneralSettings;
    setGeneralSettings: (settings: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => void;
    currentUser: User;
    importHistory: ImportHistoryItem[];
    addImportToHistory: (item: Omit<ImportHistoryItem, 'id' | 'processedData'>, data: ProcessedData) => Promise<any>;
    clearImportHistory: () => void;
    onDeleteImportHistoryItem: (historyItemId: string) => void;
    addToast: (message: string, type: ToastMessage['type']) => void;
    customers: Customer[];
    unlinkedSkus: string[];
}

const ImporterPage: React.FC<ImporterPageProps> = (props) => {
    const {
        allOrders,
        selectedFile,
        setSelectedFile,
        processedData,
        setProcessedData,
        error,
        setError,
        isProcessing,
        setIsProcessing,
        onLaunch,
        skuLinks,
        onLinkSku,
        onUnlinkSku,
        products,
        onSaveStockItem,
        onSaveProdutoCombinado,
        produtosCombinados,
        stockItems,
        generalSettings,
        setGeneralSettings,
        currentUser,
        importHistory,
        addImportToHistory,
        clearImportHistory,
        onDeleteImportHistoryItem,
        addToast,
        customers,
        unlinkedSkus
    } = props;

    const [linkModalState, setLinkModalState] = useState<{ isOpen: boolean; skus: string[]; color: string }>({ isOpen: false, skus: [], color: '' });
    const [productFormState, setProductFormState] = useState<{ isOpen: boolean, item: Partial<StockItem> | null }>({ isOpen: false, item: null });
    const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
    const [historyViewData, setHistoryViewData] = useState<ProcessedData | null>(null);
    const [categoryConfigModalOpen, setCategoryConfigModalOpen] = useState(false);
    const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
    const [dateRange, setDateRange] = useState<{ min: string, max: string }>({ min: '', max: '' });
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; item: ImportHistoryItem | null }>({ isOpen: false, item: null });


    useEffect(() => {
        if (!selectedFile) {
            setProcessedData(null);
            setError(null);
        }
    }, [selectedFile, setProcessedData, setError]);

    const handleFileSelect = (file: File | null) => {
        setSelectedFile(file);
        setHistoryViewData(null);
    };
    
    const clearFields = () => {
        setSelectedFile(null);
        setProcessedData(null);
        setError(null);
        setHistoryViewData(null);
    };

    const handleProcessFile = async () => {
        if (!selectedFile) return;

        setIsProcessing(true);
        setError(null);
        setProcessedData(null);
        setHistoryViewData(null);
        
        try {
            const buffer = await selectedFile.arrayBuffer();
            let data = await parseExcelFile(buffer, selectedFile.name, allOrders, generalSettings);

            // Adjust multiplicador (multiplier) using skuLinks -> stockItems mapping when available
            const skuLinkMap = new Map<string, string>(skuLinks.map(l => [l.importedSku, l.masterProductSku]));
            const stockItemMap = new Map<string, StockItem>(stockItems.map(s => [s.code, s]));

            data.lists.completa = data.lists.completa.map(o => {
                const existingMultiplier = (o as any).multiplicador || (o as any).multiplicador === 0 ? (o as any).multiplicador : undefined;
                let multiplier = existingMultiplier ?? getMultiplicadorFromSku(o.sku);
                const masterSku = skuLinkMap.get(o.sku);
                if (masterSku) {
                    const masterProduct = stockItemMap.get(masterSku);
                    if (masterProduct && masterProduct.linkedSkus) {
                        const link = masterProduct.linkedSkus.find(ls => ls.sku === o.sku);
                        if (link && link.multiplier) multiplier = link.multiplier;
                    }
                }
                const qty_original = (o as any).qty_original ?? (o as any).quantity ?? 1;
                const qtyFinal = (qty_original || 1) * (multiplier || 1);
                return { ...o, multiplicador: multiplier, qty_original: qty_original, qty_final: qtyFinal } as OrderItem;
            });

            // Recompute summary and skusNaoVinculados after adjustments
            const displayOrders = data.lists.completa;
            data.summary.totalPedidos = new Set(displayOrders.map(o => o.orderId)).size;
            data.summary.totalPacotes = displayOrders.length;
            data.summary.totalUnidades = displayOrders.reduce((sum, item) => sum + (item.qty_final || 0), 0);
            data.skusNaoVinculados = Array.from(new Set(displayOrders.map(i => i.sku))).filter(sku => !skuLinkMap.has(sku)).map(sku => ({ sku, colorSugerida: classificarCor(sku) }));

            if ((data.canal === 'SHOPEE' || data.canal === 'ML') && data.lists.completa.some(o => o.shippingDate || o.data)) {
                 const filteredOrders = await new Promise<OrderItem[]>((resolve) => {
                    const handleConfirm = (start: string, end: string) => {
                        const startDate = new Date(`${start}T00:00:00Z`);
                        const endDate = new Date(`${end}T23:59:59Z`);
                        const filtered = data.lists.completa.filter(o => {
                            const dateToCompare = o.shippingDate ? new Date(o.shippingDate) : new Date(o.data);
                            return dateToCompare >= startDate && dateToCompare <= endDate;
                        });
                        resolve(filtered);
                        setIsDateFilterModalOpen(false);
                    };
                    (window as any).__tempConfirmHandler = handleConfirm;
                    const allDates = data.lists.completa.map(o => new Date(o.shippingDate || o.data).getTime()).filter(t => !isNaN(t));
                    const minDate = new Date(Math.min(...allDates));
                    const maxDate = new Date(Math.max(...allDates));
                    setDateRange({ min: minDate.toISOString().split('T')[0], max: maxDate.toISOString().split('T')[0]});
                    setIsDateFilterModalOpen(true);
                });
                
                // This logic was buggy and redundant. The parseExcelFile function now handles idempotency checks.
                data.lists.completa = filteredOrders;
            }
            
            setProcessedData(data);
            try {
                // ensure history is persisted and surface any errors
                await Promise.resolve(addImportToHistory({
                    fileName: selectedFile.name,
                    processedAt: new Date().toISOString(),
                    user: currentUser.name,
                    itemCount: data.summary.totalPacotes,
                    unlinkedCount: data.skusNaoVinculados.length,
                    canal: data.canal,
                }, data));
                addToast('Histórico de importação salvo.', 'success');
            } catch (histErr) {
                console.error('Falha ao salvar histórico:', histErr);
                addToast('Falha ao salvar histórico de importação.', 'error');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleLaunch = (data: { ordersToCreate: OrderItem[], ordersToUpdate: OrderItem[] }) => {
        onLaunch(data);
        if (processedData) {
            setProcessedData(prev => {
                if (!prev) return null;
                const launchedOrderKeys = new Set(data.ordersToCreate.map(o => `${o.orderId}|${o.sku}`));
                // FIX: Create a separate set of just SKUs to correctly filter skusNaoVinculados.
                const launchedSkus = new Set(data.ordersToCreate.map(o => o.sku));
                return {
                    ...prev,
                    lists: {
                        ...prev.lists,
                        completa: prev.lists.completa.filter(o => !launchedOrderKeys.has(`${o.orderId}|${o.sku}`))
                    },
                    skusNaoVinculados: prev.skusNaoVinculados.filter(skuData => !launchedSkus.has(skuData.sku)),
                    idempotencia: { ...prev.idempotencia, lancaveis: 0 }
                }
            });
        }
    }
    
    const handleConfirmLink = async (masterSku: string) => {
        if (linkModalState.skus.length === 0) return;
        let successCount = 0;
        for (const sku of linkModalState.skus) {
            const success = await onLinkSku(sku, masterSku);
            if(success) successCount++;
        }
        addToast(`${successCount} SKU(s) vinculado(s) com sucesso!`, 'success');
        setLinkModalState({ isOpen: false, skus: [], color: '' });
        setSelectedSkus(new Set());
    };
    
    const handleSaveProduct = async (data: { productData: StockItem, bomData: ProdutoCombinado['items'] | null }) => {
        const savedProduct = await onSaveStockItem(data.productData);
        if (savedProduct && data.bomData) {
            onSaveProdutoCombinado(savedProduct.code, data.bomData);
        }
        if (savedProduct) {
            addToast(`Produto "${savedProduct.name}" salvo com sucesso!`, 'success');
            setProductFormState({ isOpen: false, item: null });
        }
        return !!savedProduct;
    };
    
    const handleOpenCreateModal = (skuData: { sku: string; colorSugerida: string }) => {
        setProductFormState({
            isOpen: true,
            item: {
                code: skuData.sku,
                name: skuData.sku.replace(/-/g, ' ').replace(/_/g, ' '),
                linkedSkus: [{ sku: skuData.sku, multiplier: 1 }],
                kind: 'PRODUTO'
            }
        });
    };

    const handleBulkCreateSelected = () => {
        if (!selectedSkus || selectedSkus.size === 0) return;
        const skus = Array.from(selectedSkus);
        setProductFormState({
            isOpen: true,
            item: {
                code: skus[0],
                name: skus[0].replace(/[-_]/g, ' '),
                linkedSkus: skus.map(s => ({ sku: s, multiplier: 1 })),
                kind: 'PRODUTO'
            }
        });
        setSelectedSkus(new Set());
    };
    
    const handleViewHistory = (item: ImportHistoryItem) => {
        setHistoryViewData(item.processedData);
        setProcessedData(null);
        setSelectedFile(null);
    };

    const handleReturnToImport = () => {
        setHistoryViewData(null);
    };
    
    const sortedHistory = useMemo(() => {
        return [...importHistory].sort((a, b) => {
            const timeA = new Date(a.processedAt).getTime();
            const timeB = new Date(b.processedAt).getTime();
            return timeB - timeA;
        });
    }, [importHistory]);

    const handleConfirmDeleteHistory = () => {
        if (deleteModalState.item) {
            onDeleteImportHistoryItem(deleteModalState.item.id);
        }
        setDeleteModalState({ isOpen: false, item: null });
    };

    const renderContent = () => {
        if (historyViewData) {
            return (
                <div className="mt-8">
                    <button onClick={handleReturnToImport} className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline mb-4">
                        <ArrowLeft size={16} /> Voltar para a Importação
                    </button>
                    <ImportResults
                        data={historyViewData}
                        onLaunch={() => {}}
                        skuLinks={skuLinks}
                        products={products}
                        onLinkSku={() => {}}
                        onUnlinkSku={() => {}}
                        onOpenLinkModal={(skus, color) => setLinkModalState({ isOpen: true, skus, color })}
                        onOpenCreateProductModal={handleOpenCreateModal}
                        selectedSkus={new Set()}
                        setSelectedSkus={() => {}}
                        produtosCombinados={produtosCombinados}
                        stockItems={stockItems}
                        generalSettings={generalSettings}
                        onOpenCategoryConfigModal={() => setCategoryConfigModalOpen(true)}
                        isHistoryView={true}
                        customers={customers}
                        addToast={addToast}
                    />
                </div>
            );
        }

        return (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <FileUploader onFileSelect={handleFileSelect} selectedFile={selectedFile} />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleProcessFile}
                                disabled={!selectedFile || isProcessing}
                                className="w-full flex items-center justify-center text-lg font-bold bg-[var(--color-primary)] text-[var(--color-primary-text)] px-6 py-3 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors shadow-lg disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 size={24} className="animate-spin mr-3"/> : <Zap size={24} className="mr-3"/>}
                                {isProcessing ? 'Processando...' : 'Processar Arquivo'}
                            </button>
                             <button
                                onClick={clearFields}
                                disabled={!selectedFile && !processedData && !error}
                                className="flex-shrink-0 flex items-center justify-center text-lg font-bold bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors shadow-lg disabled:opacity-50"
                                title="Limpar campos"
                            >
                                <XCircle size={24}/>
                            </button>
                        </div>
                        {error && <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">{error}</div>}
                    </div>
                     <div className="lg:col-span-2 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                           <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2"><History size={20}/> Histórico de Importações</h2>
                            <button onClick={clearImportHistory} disabled={importHistory.length === 0} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50 font-semibold"><Trash2 size={14}/> Limpar</button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {sortedHistory.length > 0 ? sortedHistory.map(item => (
                                <div key={item.id} className="bg-[var(--color-surface-secondary)] p-2 rounded-lg border border-[var(--color-border)] flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate max-w-xs">{item.fileName}</p>
                                        <p className="text-xs text-[var(--color-text-secondary)]">{new Date(item.processedAt).toLocaleString('pt-BR')} por {item.user} - {item.itemCount} itens</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleViewHistory(item)} className="flex items-center gap-1 text-xs font-semibold bg-white text-gray-700 px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"><Eye size={14}/> Visualizar</button>
                                        <button 
                                            onClick={() => setDeleteModalState({ isOpen: true, item: item })}
                                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"
                                            title="Excluir importação e pedidos associados"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-center text-[var(--color-text-secondary)] p-8">Nenhuma importação recente.</p>}
                        </div>
                    </div>
                </div>

                {processedData && (
                    <ImportResults
                        data={processedData}
                        onLaunch={handleLaunch}
                        skuLinks={skuLinks}
                        products={products}
                        onLinkSku={() => {}}
                        onUnlinkSku={() => {}}
                        onOpenLinkModal={(skus, color) => setLinkModalState({ isOpen: true, skus, color })}
                        onOpenCreateProductModal={handleOpenCreateModal}
                        onBulkCreateProducts={handleBulkCreateSelected}
                        selectedSkus={selectedSkus}
                        setSelectedSkus={setSelectedSkus}
                        produtosCombinados={produtosCombinados}
                        stockItems={stockItems}
                        generalSettings={generalSettings}
                        onOpenCategoryConfigModal={() => setCategoryConfigModalOpen(true)}
                        customers={customers}
                        addToast={addToast}
                    />
                )}
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Importação de Pedidos</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Envie sua planilha de vendas do ML ou Shopee para iniciar o processo.</p>
            </div>
            {renderContent()}
            <LinkSkuModal
                isOpen={linkModalState.isOpen}
                onClose={() => setLinkModalState({ isOpen: false, skus: [], color: '' })}
                skusToLink={linkModalState.skus}
                colorSugerida={linkModalState.color}
                onConfirmLink={handleConfirmLink}
                products={products}
                onTriggerCreate={() => {
                    const skuData = processedData?.skusNaoVinculados.find(s => s.sku === linkModalState.skus[0]);
                    if (skuData) {
                        setLinkModalState({isOpen: false, skus: [], color: ''});
                        handleOpenCreateModal(skuData);
                    }
                }}
            />
             <ProductFormModal
                isOpen={productFormState.isOpen}
                onClose={() => setProductFormState({ isOpen: false, item: null })}
                itemToEdit={productFormState.item}
                onSave={handleSaveProduct}
                allProducts={stockItems}
                unlinkedSkus={unlinkedSkus}
                generalSettings={generalSettings}
                setGeneralSettings={setGeneralSettings}
            />
            <CategoryBaseConfigModal
                isOpen={categoryConfigModalOpen}
                onClose={() => setCategoryConfigModalOpen(false)}
                categories={generalSettings.productCategoryList}
                currentBaseMapping={generalSettings.categoryBaseMapping}
                currentColorMapping={generalSettings.categoryColorMapping}
                onSave={(newBaseMap, newColorMap) => {
                    setGeneralSettings(prev => ({
                        ...prev,
                        categoryBaseMapping: newBaseMap,
                        categoryColorMapping: newColorMap,
                    }));
                    addToast('Configuração de categorias salva!', 'success');
                }}
            />
            <DateFilterModal 
                isOpen={isDateFilterModalOpen}
                onClose={() => setIsDateFilterModalOpen(false)}
                minDate={dateRange.min}
                maxDate={dateRange.max}
                onConfirm={(start, end) => {
                    if ((window as any).__tempConfirmHandler) {
                        (window as any).__tempConfirmHandler(start, end);
                        delete (window as any).__tempConfirmHandler;
                    }
                }}
            />
            <ConfirmActionModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false, item: null })}
                onConfirm={handleConfirmDeleteHistory}
                title="Confirmar Exclusão de Importação"
                message={
                    <>
                        <p>Tem certeza que deseja excluir o histórico de importação do arquivo <strong>"{deleteModalState.item?.fileName}"</strong>?</p>
                        <p className="font-bold text-red-700 mt-2">Esta ação removerá permanentemente o histórico E TODOS os pedidos que foram importados a partir deste arquivo.</p>
                    </>
                }
                confirmButtonText="Sim, Excluir"
            />
        </div>
    );
};

export default ImporterPage;