import React, { useState, useMemo, useEffect } from 'react';
import { StockItem, StockMovement, ProdutoCombinado, WeighingBatch, WeighingType, StockMovementOrigin, StockItemKind, User, GeneralSettings, ParsedNfeItem, SkuLink } from '../types';
import { Package, Factory, History, Search, PlusCircle, Weight, Cog, SlidersHorizontal, Edit3, Trash2, ChevronDown, ChevronRight, FileUp, ArrowLeft, Settings, Box, Plus, Save, X, Link, ArrowRight, Loader2, ChevronUp } from 'lucide-react';
import PesagemPage from './PesagemPage';

// Modals
import ProductFormModal from '../components/ProductFormModal';
import ManualMovementModal from '../components/ManualMovementModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import ImportXmlModal from '../components/ImportXmlModal';
import CategoryManagerModal from '../components/CategoryManagerModal';
import UpdateStockModal from '../components/UpdateStockModal';
import UpdateStockFromSheetModal from '../components/UpdateStockFromSheetModal';
import UpdateStockFromSheetModalShopee from '../components/UpdateStockFromSheetModalShopee';

// --- New Modal for Expedition Items ---
interface ExpeditionItemsConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: StockItem;
    insumos: StockItem[]; // All 'INSUMO' kind items
    onSave: (productCode: string, items: { stockItemCode: string; qty_per_pack: number }[]) => void;
}

const ExpeditionItemsConfigModal: React.FC<ExpeditionItemsConfigModalProps> = ({ isOpen, onClose, product, insumos, onSave }) => {
    const [editedItems, setEditedItems] = useState<{ stockItemCode: string; qty_per_pack: number }[]>([]);
    const [insumoSearch, setInsumoSearch] = useState('');
    const [selectedInsumo, setSelectedInsumo] = useState<StockItem | null>(null);
    const [newInsumoQty, setNewInsumoQty] = useState<number>(1);

    useEffect(() => {
        if (isOpen) {
            setEditedItems(product.expedition_items || []);
            setInsumoSearch('');
            setSelectedInsumo(null);
            setNewInsumoQty(1);
        }
    }, [isOpen, product]);

    const handleAddItem = () => {
        if (selectedInsumo && newInsumoQty > 0) {
            setEditedItems(prev => [...prev, { stockItemCode: selectedInsumo.code, qty_per_pack: newInsumoQty }]);
            setSelectedInsumo(null);
            setNewInsumoQty(1);
            setInsumoSearch('');
        }
    };
    
    const handleRemoveItem = (stockItemCode: string) => {
        setEditedItems(prev => prev.filter(item => item.stockItemCode !== stockItemCode));
    };

    const handleSave = () => onSave(product.code, editedItems);

    const availableInsumos = useMemo(() => insumos.filter(insumo => !editedItems.some(item => item.stockItemCode === insumo.code)), [insumos, editedItems]);
    const filteredInsumos = useMemo(() => {
        if (!insumoSearch) return [];
        return availableInsumos.filter(i => i.name.toLowerCase().includes(insumoSearch.toLowerCase()) || i.code.toLowerCase().includes(insumoSearch.toLowerCase()));
    }, [insumoSearch, availableInsumos]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Itens de Expedição por Produto</h2>
                        <p className="text-sm text-gray-500">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Itens Inclusos na Expedição</h3>
                    {editedItems.length > 0 ? (
                        <div className="space-y-2">
                            {editedItems.map(item => {
                                const details = insumos.find(i => i.code === item.stockItemCode);
                                return (
                                    <div key={item.stockItemCode} className="bg-gray-50 p-2 rounded-lg border flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-800">{details?.name || item.stockItemCode}</p>
                                            <p className="text-xs text-gray-500">Qtd: {item.qty_per_pack} {details?.unit}</p>
                                        </div>
                                        <button onClick={() => handleRemoveItem(item.stockItemCode)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">Nenhum item de expedição configurado.</p>}
                    
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="text-md font-semibold text-gray-700 mb-2">Adicionar Item</h3>
                         {!selectedInsumo ? (
                             <div className="relative">
                                <input type="text" value={insumoSearch} onChange={e => setInsumoSearch(e.target.value)} placeholder="Buscar insumo (espátula, manual...)" className="w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)]"/>
                                {insumoSearch && (
                                    <div className="absolute z-10 w-full border bg-white rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {filteredInsumos.map(insumo => (
                                            <div key={insumo.id} onClick={() => { setSelectedInsumo(insumo); setInsumoSearch(''); }} className="p-2 hover:bg-blue-50 cursor-pointer border-b">
                                                {insumo.name} ({insumo.code})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="flex items-end gap-2 p-2 bg-blue-50 rounded-lg">
                                <div className="flex-grow"><label className="text-xs">Item</label><p className="font-semibold p-2 bg-white rounded">{selectedInsumo.name}</p></div>
                                <div><label className="text-xs">Qtd.</label><input type="number" value={newInsumoQty} onChange={e => setNewInsumoQty(Number(e.target.value))} className="w-20 p-2 border rounded bg-[var(--color-surface)] border-[var(--color-border)]"/></div>
                                <button onClick={handleAddItem} className="p-2 bg-blue-600 text-white rounded"><Plus size={20}/></button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md flex items-center gap-2"><Save size={16}/> Salvar</button>
                </div>
            </div>
        </div>
    );
};

interface TransferSkuModalProps {
    isOpen: boolean;
    onClose: () => void;
    skuToTransfer: string;
    currentMaster: StockItem;
    allProducts: StockItem[];
    onConfirmTransfer: (newMasterCode: string) => Promise<void>;
}

const TransferSkuModal: React.FC<TransferSkuModalProps> = ({ isOpen, onClose, skuToTransfer, currentMaster, allProducts, onConfirmTransfer }) => {
    const [selectedNewMaster, setSelectedNewMaster] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    const availableProducts = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        return allProducts.filter(p => p.id !== currentMaster.id && (p.name.toLowerCase().includes(searchLower) || p.code.toLowerCase().includes(searchLower)));
    }, [allProducts, currentMaster, searchTerm]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedNewMaster('');
            setSearchTerm('');
            setIsTransferring(false);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        if (!selectedNewMaster) return;
        setIsTransferring(true);
        await onConfirmTransfer(selectedNewMaster);
        setIsTransferring(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-xl font-bold text-gray-800">Transferir SKU de Importação</h2>
                    <button onClick={onClose}><X size={24}/></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">SKU a ser transferido</label>
                        <p className="font-mono bg-gray-100 p-2 rounded">{skuToTransfer}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Produto Mestre Atual</label>
                        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                            <span className="font-semibold">{currentMaster.name}</span>
                            <ArrowRight size={16} className="text-gray-500"/>
                            <span className="font-semibold text-blue-600">{selectedNewMaster ? allProducts.find(p=>p.code===selectedNewMaster)?.name : 'Novo Mestre'}</span>
                        </div>
                    </div>
                    <div>
                         <label className="text-sm font-medium text-gray-700">Buscar Novo Produto Mestre</label>
                         <div className="relative mt-1">
                             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                             <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nome ou SKU..." className="w-full pl-9 pr-3 py-2 text-sm border-[var(--color-border)] rounded-md bg-[var(--color-surface)]"/>
                         </div>
                         <div className="mt-2 border rounded-md h-48 overflow-y-auto">
                            {availableProducts.map(p => (
                                <div key={p.id} onClick={() => setSelectedNewMaster(p.code)} className={`p-2 cursor-pointer ${selectedNewMaster === p.code ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.code}</p>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>

                <div className="flex-shrink-0 mt-6 flex justify-end space-x-3 border-t pt-4">
                    <button onClick={onClose} disabled={isTransferring} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                    <button onClick={handleConfirm} disabled={!selectedNewMaster || isTransferring} className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold flex items-center gap-2 disabled:opacity-50">
                        {isTransferring ? <Loader2 size={16} className="animate-spin"/> : <ArrowRight size={16}/>}
                        Confirmar Transferência
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
interface EstoquePageProps {
    stockItems: StockItem[];
    stockMovements: StockMovement[];
    onStockAdjustment: (stockItemCode: string, quantityDelta: number, ref: string) => Promise<boolean>;
    produtosCombinados: ProdutoCombinado[];
    onSaveProdutoCombinado: (productSku: string, newBomItems: ProdutoCombinado['items']) => void;
    onSaveStockItem: (item: StockItem) => Promise<StockItem | null>;
    weighingBatches: WeighingBatch[];
    onAddNewWeighing: (insumoCode: string, quantity: number, type: WeighingType, userId: string) => void;
    onProductionRun: (itemCode: string, quantity: number, ref: string) => void;
    currentUser: User;
    onDeleteItem: (itemId: string) => Promise<boolean>;
    onBulkDeleteItems: (itemIds: string[]) => Promise<boolean>;
    onDeleteMovement: (movementId: string) => Promise<boolean>;
    onDeleteWeighingBatch: (batchId: string) => Promise<boolean>;
    generalSettings: GeneralSettings;
    setGeneralSettings: (settings: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => void;
    onConfirmImportFromXml: (payload: { itemsToCreate: any[], itemsToUpdate: any[] }) => void;
    onSaveExpeditionItems: (productCode: string, items: { stockItemCode: string; qty_per_pack: number }[]) => void;
    users: User[];
    onUpdateInsumoCategory: (oldName: string, newName: string) => Promise<void>;
    onBulkInventoryUpdate: (updates: { code: string, quantity: number }[]) => Promise<string>;
    skuLinks: SkuLink[];
    onLinkSku: (importedSku: string, masterProductSku: string) => Promise<boolean>;
    onUnlinkSku: (importedSku: string) => Promise<boolean>;
    unlinkedSkus: string[];
}

type Tab = 'insumos' | 'processados' | 'produtos' | 'pesagem' | 'movimentacoes';
type ModalState = {
    productForm: { isOpen: boolean, item: StockItem | null };
    manualMovement: StockItem | null;
    updateStock: StockItem | null;
    importXml: boolean;
    manageCategories: boolean;
    expeditionItemsConfig: StockItem | null;
    updateFromSheet: boolean;
    updateFromSheetShopee: boolean;
};

const TabButton: React.FC<{ tab: Tab, activeTab: Tab, label: string, icon: React.ReactNode, onClick: (tab: Tab) => void }> = ({ tab, activeTab, label, icon, onClick }) => (
    <button
        onClick={() => onClick(tab)}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${activeTab === tab ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-600 hover:text-[var(--color-primary)] hover:border-gray-300'}`}
    >
        {icon} <span className="ml-2">{label}</span>
    </button>
);

const EstoquePage: React.FC<EstoquePageProps> = (props) => {
    const { onBulkDeleteItems, onDeleteItem, generalSettings, setGeneralSettings, onSaveExpeditionItems, users, onConfirmImportFromXml, onSaveStockItem, onUpdateInsumoCategory, onBulkInventoryUpdate, skuLinks, onLinkSku, onUnlinkSku, unlinkedSkus } = props;
    const { stockItems, stockMovements, produtosCombinados, onSaveProdutoCombinado, weighingBatches, onAddNewWeighing, onProductionRun, currentUser, onDeleteMovement, onStockAdjustment, onDeleteWeighingBatch } = props;
    
    const [activeTab, setActiveTab] = useState<Tab>('insumos');
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState<ModalState>({ productForm: {isOpen: false, item: null}, manualMovement: null, updateStock: null, importXml: false, manageCategories: false, expeditionItemsConfig: null, updateFromSheet: false, updateFromSheetShopee: false });
    const [expandedMovements, setExpandedMovements] = useState<Set<string>>(new Set());

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{item: any, type: 'item' | 'movement' | 'weighing_batch'} | null>(null);
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
    const [transferState, setTransferState] = useState<{ sku: string, currentMaster: StockItem } | null>(null);
    const [showOnlyWithoutBom, setShowOnlyWithoutBom] = useState(false);

    const closeModal = () => {
        setModalState({ productForm: {isOpen: false, item: null}, manualMovement: null, updateStock: null, importXml: false, manageCategories: false, expeditionItemsConfig: null, updateFromSheet: false, updateFromSheetShopee: false });
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setTransferState(null);
    }

    const insumos = useMemo(() => stockItems.filter(item => item.kind === 'INSUMO'), [stockItems]);
    const processados = useMemo(() => stockItems.filter(item => item.kind === 'PROCESSADO'), [stockItems]);
    const produtos = useMemo(() => {
        let finalProducts = stockItems.filter(item => item.kind === 'PRODUTO');

        if (showOnlyWithoutBom) {
            const productsWithBom = new Set(produtosCombinados.map(bom => bom.productSku));
            finalProducts = finalProducts.filter(product => !productsWithBom.has(product.code));
        }

        return finalProducts;
    }, [stockItems, showOnlyWithoutBom, produtosCombinados]);
    
    const handleSelect = (id: string, isSelected: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (isSelected) newSet.add(id);
            else newSet.delete(id);
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, items: StockItem[]) => {
        const pageIds = items.map(i => i.id);
        if (e.target.checked) {
            setSelectedIds(prev => new Set([...Array.from(prev), ...pageIds]));
        } else {
            setSelectedIds(prev => {
                const newSet = new Set(prev);
                pageIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        }
    };
    
    const handleDeleteSelected = async () => {
        setIsDeleting(true);
        await onBulkDeleteItems(Array.from(selectedIds));
        setIsDeleteModalOpen(false);
        setSelectedIds(new Set());
        setIsDeleting(false);
    };

    const handleSaveProduct = async (data: { productData: StockItem, bomData: ProdutoCombinado['items'] | null }) => {
        const savedProduct = await onSaveStockItem(data.productData);
        if (savedProduct && data.bomData) {
            onSaveProdutoCombinado(savedProduct.code, data.bomData);
        }
        if (savedProduct) {
            closeModal();
        }
        return !!savedProduct;
    };
    
    const handleConfirmManualMovement = (itemCode: string, movementType: 'entrada' | 'saida', quantity: number, ref: string) => {
        const item = stockItems.find(i => i.code === itemCode);
        if (!item) return;
        const isProduction = (item.kind === 'PRODUTO' || item.kind === 'PROCESSADO') && movementType === 'saida';
        if (isProduction) onProductionRun(itemCode, quantity, ref);
        else onStockAdjustment(itemCode, movementType === 'entrada' ? quantity : -quantity, ref);
        closeModal();
    };

    const handleConfirmUpdateStock = (itemCode: string, quantity: number, ref: string) => {
        onStockAdjustment(itemCode, quantity, ref);
        closeModal();
    }

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const { item, type } = itemToDelete;
        let success = false;
        if (type === 'item') success = await onDeleteItem(item.id);
        else if (type === 'movement') success = await onDeleteMovement(item.id);
        if (success) closeModal();
    };
    
    const handleSaveCategories = (newCategories: string[]) => {
        setGeneralSettings(prev => ({ ...prev, productCategoryList: newCategories }));
    };

    const toggleExpansion = (productId: string) => {
        setExpandedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) newSet.delete(productId);
            else newSet.add(productId);
            return newSet;
        });
    };

    const handleConfirmTransfer = async (newMasterCode: string) => {
        if (!transferState) return;
        await onUnlinkSku(transferState.sku);
        await onLinkSku(transferState.sku, newMasterCode);
    };
    
    const itemTypeForNewItem = useMemo((): StockItemKind => (activeTab === 'insumos' ? 'INSUMO' : activeTab === 'processados' ? 'PROCESSADO' : 'PRODUTO'), [activeTab]);

    const toggleMovementExpansion = (ref: string) => setExpandedMovements(prev => {
        const newSet = new Set(prev);
        if (newSet.has(ref)) newSet.delete(ref);
        else newSet.add(ref);
        return newSet;
    });

    const processedMovements = useMemo(() => {
        const productionGroups = new Map<string, { main: StockMovement, children: StockMovement[] }>();
        const bipGroups = new Map<string, { main: { stockItemName: string, createdAt: Date, createdBy: string, ref: string, productSku: string | undefined }, children: StockMovement[] }>();
        const otherMovements: StockMovement[] = [];

        stockMovements.forEach(mov => {
            if (mov.origin === 'PRODUCAO_MANUAL' && mov.ref) {
                if (!productionGroups.has(mov.ref)) productionGroups.set(mov.ref, { main: null as any, children: [] });
                const group = productionGroups.get(mov.ref)!;
                if (mov.qty_delta > 0) group.main = mov;
                else group.children.push(mov);
            } else if (mov.origin === 'BIP' && mov.ref && mov.productSku) {
                 if (!bipGroups.has(mov.ref)) {
                    const product = stockItems.find(item => item.code === mov.productSku);
                    bipGroups.set(mov.ref, { main: { stockItemName: product?.name || mov.productSku, createdAt: mov.createdAt, createdBy: mov.createdBy, ref: mov.ref, productSku: mov.productSku }, children: [] });
                }
                const group = bipGroups.get(mov.ref)!;
                group.children.push(mov);
                if (new Date(mov.createdAt) > new Date(group.main.createdAt)) {
                    group.main.createdAt = mov.createdAt;
                    group.main.createdBy = mov.createdBy;
                }
            } else {
                otherMovements.push(mov);
            }
        });

        const manualList = Array.from(productionGroups.values()).filter(g => g.main).map(g => ({ ...g, isGroup: true, type: 'manual', ref: g.main.ref }));
        const bipList = Array.from(bipGroups.values()).map(g => ({ ...g, isGroup: true, type: 'bip', ref: g.main.ref }));
        return [...manualList, ...bipList, ...otherMovements].sort((a, b) => (new Date((a as any).isGroup ? (a as any).main.createdAt : (a as StockMovement).createdAt)).getTime() - (new Date((b as any).isGroup ? (b as any).main.createdAt : (b as StockMovement).createdAt)).getTime());
    }, [stockMovements, stockItems]);
    
    const renderContent = () => {
        const commonTableProps = {
            searchTerm, currentUser,
            onEdit: (item: StockItem) => setModalState(prev => ({ ...prev, productForm: {isOpen: true, item} })),
            onDelete: (item: StockItem) => setItemToDelete({ item, type: 'item' }),
            onAdjustStock: (item: StockItem) => setModalState(prev => ({ ...prev, manualMovement: item })),
            onUpdateStock: (item: StockItem) => setModalState(prev => ({ ...prev, updateStock: item })),
        };
        const commonCardProps = {
            ...commonTableProps
        };
        switch (activeTab) {
            case 'insumos': return <ResponsiveStockList items={insumos} {...commonCardProps} showColorColumn={false} />;
            case 'processados': return <ResponsiveStockList items={processados} {...commonCardProps} showColorColumn={true} onConfigureBom={(item) => setModalState(prev => ({...prev, productForm: {isOpen: true, item}}))} onProduce={(item) => setModalState(prev => ({...prev, manualMovement: item}))} />;
            case 'produtos':
                return (
                    <>
                        <div className="mb-4">
                            <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showOnlyWithoutBom}
                                    onChange={(e) => setShowOnlyWithoutBom(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                Mostrar apenas produtos sem receita (BOM) configurada
                            </label>
                        </div>
                        <ResponsiveStockList items={produtos} {...commonCardProps} showColorColumn={true} onConfigureBom={(item) => setModalState(prev => ({...prev, productForm: {isOpen: true, item}}))} onConfigureExpeditionItems={(item) => setModalState(prev => ({...prev, expeditionItemsConfig: item}))} onProduce={(item) => setModalState(prev => ({...prev, manualMovement: item}))} selectedIds={selectedIds} onSelect={handleSelect} onSelectAll={(e) => handleSelectAll(e, produtos)} isProdutos onToggleExpand={toggleExpansion} expandedRows={expandedProducts} skuLinks={skuLinks} onTransferSku={(sku, currentMaster) => setTransferState({ sku, currentMaster })} />
                    </>
                );
            case 'pesagem': return (
                <div>
                   <button onClick={() => setActiveTab('insumos')} className="flex items-center text-sm font-semibold text-blue-600 hover:underline mb-4"><ArrowLeft size={16} className="mr-2" />Voltar para Estoque</button>
                   <PesagemPage stockItems={stockItems} weighingBatches={weighingBatches} onAddNewWeighing={onAddNewWeighing} currentUser={currentUser!} onDeleteBatch={onDeleteWeighingBatch} users={users} />
                </div>
            );
            case 'movimentacoes': return (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-gray-100"><tr><th className="py-2 px-3 w-8"></th>{['Data/Hora', 'Item', 'Origem', 'Ref.', 'Quantidade', 'Operador', 'Ações'].map(h => <th key={h} className="py-2 px-3 text-left font-semibold text-gray-600">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-200">{processedMovements.map((item) => {
                            if ('isGroup' in item) {
                                const { main, children, ref, type } = item as any;
                                const isExpanded = expandedMovements.has(ref);
                                const isManualProd = type === 'manual';
                                return (<React.Fragment key={ref}><tr className={isManualProd ? "bg-blue-50 hover:bg-blue-100" : "bg-cyan-50 hover:bg-cyan-100"}><td className="py-2 px-3 text-center"><button onClick={() => toggleMovementExpansion(ref)} className="text-blue-600">{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></td><td className="py-2 px-3 text-gray-600 font-semibold">{new Date(main.createdAt).toLocaleString('pt-BR')}</td><td className="py-2 px-3 font-bold text-gray-800">{main.stockItemName}</td><td className="py-2 px-3">{isManualProd ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">{main.origin}</span> : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">BIP</span>}</td><td className="py-2 px-3 font-mono text-gray-500 text-xs">{main.ref}</td><td className={`py-2 px-3 font-bold text-center ${isManualProd ? 'text-green-600' : 'text-gray-700'}`}>{isManualProd ? `+${main.qty_delta.toFixed(2)}` : `(${children.length} insumos)`}</td><td className="py-2 px-3 text-gray-700">{main.createdBy}</td><td className="py-2 px-3 text-center">{// FIX: Changed role check from SUPER_ADMIN to DONO_SAAS
 currentUser.role === 'DONO_SAAS' && isManualProd && (<button onClick={() => setItemToDelete({ item: main, type: 'movement' })} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Excluir Movimentação Principal"><Trash2 size={14} /></button>)}</td></tr>{isExpanded && children.map((child: StockMovement) => (<tr key={child.id} className="bg-gray-50"><td className="py-1 px-3"></td><td className="py-1 px-3 pl-8 text-gray-500">{new Date(child.createdAt).toLocaleString('pt-BR')}</td><td className="py-1 px-3 pl-8 text-gray-700">{child.stockItemName}</td><td className="py-1 px-3"></td><td className="py-1 px-3"></td><td className={`py-1 px-3 font-semibold text-center text-red-600`}>{child.qty_delta.toFixed(2)}</td><td className="py-1 px-3 text-gray-600">{child.createdBy}</td><td className="py-1 px-3 text-center">{// FIX: Changed role check from SUPER_ADMIN to DONO_SAAS
 currentUser.role === 'DONO_SAAS' && (<button onClick={() => setItemToDelete({ item: child, type: 'movement' })} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full" title="Excluir Insumo Consumido"><Trash2 size={12} /></button>)}</td></tr>))}</React.Fragment>);
                            } else {
                                const mov = item as StockMovement;
                                return (<tr key={mov.id}><td></td><td className="py-2 px-3 text-gray-600">{new Date(mov.createdAt).toLocaleString('pt-BR')}</td><td className="py-2 px-3 font-medium text-gray-800">{mov.stockItemName}</td><td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mov.origin === 'PESAGEM' ? 'bg-purple-100 text-purple-800' : mov.origin === 'IMPORT_XML' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{mov.origin}</span></td><td className="py-2 px-3 font-mono text-gray-500 text-xs">{mov.ref}</td><td className={`py-2 px-3 font-bold text-center ${mov.qty_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>{mov.qty_delta > 0 ? '+' : ''}{mov.qty_delta.toFixed(2)}</td><td className="py-2 px-3 text-gray-700">{mov.createdBy}</td><td className="py-2 px-3 text-center">{// FIX: Changed role check from SUPER_ADMIN to DONO_SAAS
 currentUser.role === 'DONO_SAAS' && (<button onClick={() => setItemToDelete({ item: mov, type: 'movement' })} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Excluir Movimentação"><Trash2 size={14} /></button>)}</td></tr>);
                            }
                        })}</tbody>
                    </table>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div>
            { activeTab !== 'pesagem' && (
                <>
                <div className="flex justify-between items-start mb-6 flex-wrap gap-4"><div><h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Estoque</h1><p className="text-gray-500 mt-1">Controle de insumos, produtos, receitas e movimentações.</p></div></div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm w-full">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <div className="relative flex-grow max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar item por nome ou código..." className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"/></div>
                        <div className="flex items-center gap-2">
                             {activeTab === 'insumos' && (
                                <>
                                    <button onClick={() => setModalState(prev => ({ ...prev, manageCategories: true }))} className="flex items-center text-sm font-semibold bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"><Settings size={16} className="mr-2"/>Gerenciar Categorias</button>
                                    <button onClick={() => setModalState(prev => ({ ...prev, updateFromSheet: true }))} className="flex items-center text-sm font-semibold bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors shadow-sm"><FileUp size={16} className="mr-2"/>Inventário ML</button>
                                    <button onClick={() => setModalState(prev => ({ ...prev, updateFromSheetShopee: true }))} className="flex items-center text-sm font-semibold bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"><FileUp size={16} className="mr-2"/>Inventário Shopee</button>
                                    <button onClick={() => setModalState(prev => ({ ...prev, importXml: true }))} className="flex items-center text-sm font-semibold bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors shadow-sm"><FileUp size={16} className="mr-2"/>Importar XML</button>
                                </>
                             )}
                             {selectedIds.size > 0 && activeTab === 'produtos' ? (
                                <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center text-sm font-semibold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"><Trash2 size={16} className="mr-2"/>Excluir Selecionados</button>
                             ) : (
                                <button onClick={() => setModalState(prev => ({ ...prev, productForm: {isOpen: true, item: null} }))} className="flex items-center text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><PlusCircle size={16} className="mr-2"/>Adicionar Novo Item</button>
                             )}
                        </div>
                    </div>
                    <div className="border-b border-gray-200"><div className="flex -mb-px flex-wrap"><TabButton tab="insumos" activeTab={activeTab} label="Insumos" icon={<Package size={16} />} onClick={setActiveTab} /><TabButton tab="processados" activeTab={activeTab} label="Processados" icon={<Factory size={16} />} onClick={setActiveTab} /><TabButton tab="produtos" activeTab={activeTab} label="Produtos Finais" icon={<Package size={16} />} onClick={setActiveTab} /><TabButton tab="pesagem" activeTab={activeTab} label="Pesagem" icon={<Weight size={16} />} onClick={setActiveTab} /><TabButton tab="movimentacoes" activeTab={activeTab} label="Movimentações" icon={<History size={16} />} onClick={setActiveTab} /></div></div>
                    <div className="mt-6">{renderContent()}</div>
                </div>
                </>
            )}
            {activeTab === 'pesagem' && renderContent()}
            <ProductFormModal 
                isOpen={modalState.productForm.isOpen}
                onClose={closeModal}
                itemToEdit={modalState.productForm.item}
                onSave={handleSaveProduct}
                allProducts={[...insumos, ...processados, ...produtos]}
                unlinkedSkus={unlinkedSkus}
                generalSettings={generalSettings}
                setGeneralSettings={setGeneralSettings}
            />
            {modalState.expeditionItemsConfig && <ExpeditionItemsConfigModal isOpen={!!modalState.expeditionItemsConfig} onClose={closeModal} product={modalState.expeditionItemsConfig} insumos={insumos} onSave={(productCode, items) => { onSaveExpeditionItems(productCode, items); closeModal(); }} />}
            {modalState.manualMovement && <ManualMovementModal isOpen={!!modalState.manualMovement} onClose={closeModal} items={stockItems} onConfirm={handleConfirmManualMovement} preselectedItem={modalState.manualMovement}/>}
            {modalState.updateStock && <UpdateStockModal isOpen={!!modalState.updateStock} onClose={closeModal} item={modalState.updateStock} onConfirm={handleConfirmUpdateStock} />}
            {modalState.importXml && <ImportXmlModal isOpen={modalState.importXml} onClose={closeModal} existingStockItems={stockItems} onConfirmImport={(payload) => { onConfirmImportFromXml(payload); closeModal(); }} generalSettings={generalSettings} />}
            {modalState.manageCategories && <CategoryManagerModal isOpen={modalState.manageCategories} onClose={closeModal} currentCategories={generalSettings.productCategoryList} onSave={handleSaveCategories}/>}
            {modalState.updateFromSheet && <UpdateStockFromSheetModal isOpen={modalState.updateFromSheet} onClose={closeModal} stockItems={stockItems} onBulkInventoryUpdate={onBulkInventoryUpdate} />}
            {modalState.updateFromSheetShopee && <UpdateStockFromSheetModalShopee isOpen={modalState.updateFromSheetShopee} onClose={closeModal} stockItems={stockItems} onBulkInventoryUpdate={onBulkInventoryUpdate} />}
            {itemToDelete && <ConfirmActionModal isOpen={!!itemToDelete} onClose={closeModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={<><p>Você tem certeza que deseja excluir <strong>{itemToDelete.item.name || itemToDelete.item.stockItemName}</strong>?</p><p className="font-bold text-red-700">Esta ação é irreversível.</p></>} confirmButtonText="Excluir Permanentemente" isConfirming={isDeleting}/>}
            {isDeleteModalOpen && <ConfirmActionModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteSelected} title="Confirmar Exclusão em Massa" message={<><p>Você tem certeza que deseja excluir <strong>{selectedIds.size} produto(s)</strong> selecionado(s)?</p><p className="font-bold text-red-700">Esta ação é irreversível e removerá os registros permanentemente.</p></>} confirmButtonText="Excluir Permanentemente" isConfirming={isDeleting}/>}
            {transferState && <TransferSkuModal isOpen={!!transferState} onClose={closeModal} skuToTransfer={transferState.sku} currentMaster={transferState.currentMaster} allProducts={produtos} onConfirmTransfer={handleConfirmTransfer} />}
        </div>
    );
};

const ResponsiveStockList: React.FC<any> = (props) => {
    const { items, searchTerm, onSelectAll, selectedIds } = props;
    const filteredItems = useMemo(() =>
        items.filter((item: StockItem) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase())
        ), [items, searchTerm]);

    const hasAdjustPermission = props.currentUser.role === 'CLIENTE_GERENTE' || props.currentUser.role === 'DONO_SAAS';

    // Grouping logic for 'insumos'
    const groupedItems = useMemo(() => {
        if (items.length === 0 || items[0].kind !== 'INSUMO') return null;
        const groups = filteredItems.reduce((acc: Record<string, StockItem[]>, item: StockItem) => {
            const category = item.category || 'Sem Categoria';
            if (!acc[category]) { acc[category] = []; }
            acc[category].push(item);
            return acc;
        }, {});
        return Object.keys(groups).sort((a,b) => {
            if (a === 'Sem Categoria') return 1; if (b === 'Sem Categoria') return -1; return a.localeCompare(b);
        }).map(category => ({ category, items: groups[category] }));
    }, [filteredItems, items]);

    return (
        <div>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
                {groupedItems ? (
                    groupedItems.map(({ category, items: categoryItems }) => (
                        <div key={category}>
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] my-2 p-2 bg-[var(--color-surface-secondary)] rounded-md">{category}</h3>
                            {categoryItems.map((item: StockItem) => <StockCard key={item.id} item={item} {...props} hasAdjustPermission={hasAdjustPermission} />)}
                        </div>
                    ))
                ) : (
                    filteredItems.map((item: StockItem) => <StockCard key={item.id} item={item} {...props} hasAdjustPermission={hasAdjustPermission} />)
                )}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--color-border)]">
                <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                        {props.onSelectAll && <th className="py-2 px-3 w-8 text-center"><input type="checkbox" onChange={(e) => onSelectAll(e, filteredItems)} checked={filteredItems.length > 0 && selectedIds && filteredItems.every((i: StockItem) => selectedIds.has(i.id))} /></th>}
                        {props.isProdutos && <th></th>}
                        {['Ações', 'Código', 'Nome do Item', props.showColorColumn && 'Cor', 'Saldo Atual', 'Estoque Mínimo', 'Unidade'].filter(Boolean).map(h => <th key={h as string} className="py-2 px-3 text-left font-semibold text-gray-600">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {groupedItems ? (
                        groupedItems.flatMap(({ category, items: categoryItems }) => [
                            <tr key={category} className="bg-gray-200 sticky top-10"><td colSpan={10} className="py-1 px-3 text-sm font-bold text-gray-700">{category}</td></tr>,
                            ...categoryItems.map((item: StockItem) => <StockRow key={item.id} item={item} {...props} hasAdjustPermission={hasAdjustPermission} />)
                        ])
                    ) : (
                        filteredItems.map((item: StockItem) => <StockRow key={item.id} item={item} {...props} hasAdjustPermission={hasAdjustPermission} />)
                    )}
                </tbody>
                </table>
            </div>
        </div>
    );
};

const StockRow: React.FC<{ item: StockItem, hasAdjustPermission: boolean } & any> = ({ item, hasAdjustPermission, ...props }) => {
    const { onAdjustStock, onUpdateStock, onConfigureBom, onConfigureExpeditionItems, onProduce, onEdit, onDelete, selectedIds, onSelect, isProdutos, expandedRows, onToggleExpand, skuLinks, onTransferSku, currentUser } = props;
    const isBelowMin = item.current_qty < item.min_qty && item.kind !== 'PRODUTO';
    const isSelected = selectedIds && selectedIds.has(item.id);
    const isExpanded = isProdutos && expandedRows && expandedRows.has(item.id);
    const linkedSkusForThisProduct = isProdutos && skuLinks ? skuLinks.filter((link: SkuLink) => link.masterProductSku === item.code) : [];

    return (
        <React.Fragment>
            <tr className={`${isSelected ? 'bg-blue-50' : isBelowMin ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                {onSelect && <td className="py-2 px-3"><input type="checkbox" checked={isSelected} onChange={e => onSelect(item.id, e.target.checked)} /></td>}
                {isProdutos && <td className="py-2 px-3"><button onClick={() => onToggleExpand(item.id)}>{isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</button></td>}
                <td className="py-2 px-3"><div className="flex items-center gap-1.5 flex-wrap">
                    {item.kind === 'INSUMO' && <button onClick={() => onUpdateStock(item)} title="Entrada Rápida"><PlusCircle size={14} /></button>}
                    <button onClick={() => onEdit(item)} title="Editar"><Edit3 size={14} /></button>
                    {hasAdjustPermission && <button onClick={() => onAdjustStock(item)} title="Ajustar Saldo"><SlidersHorizontal size={14} /></button>}
                    {onProduce && <button onClick={() => onProduce(item)} title="Registrar Produção"><Factory size={14} /></button>}
                    {onConfigureBom && <button onClick={() => onConfigureBom(item)} title="Configurar Receita (BOM)"><Cog size={14} /></button>}
                    {onConfigureExpeditionItems && <button onClick={() => onConfigureExpeditionItems(item)} title="Configurar Itens de Expedição"><Box size={14} /></button>}
                    {currentUser.role === 'DONO_SAAS' && <button onClick={() => onDelete(item)} title="Excluir"><Trash2 size={14} /></button>}
                </div></td>
                <td className="py-2 px-3 font-mono">{item.code}</td>
                <td className="py-2 px-3 font-medium">{item.name}</td>
                {props.showColorColumn && <td className="py-2 px-3">{item.color || 'N/A'}</td>}
                <td className={`py-2 px-3 text-center font-bold ${isBelowMin ? 'text-red-600' : ''}`}>{item.current_qty.toFixed(2)}</td>
                <td className="py-2 px-3 text-center">{item.min_qty.toFixed(2)}</td>
                <td className="py-2 px-3 text-center">{item.unit}</td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={10} className="p-3 bg-gray-100">
                        <h4 className="font-semibold text-xs text-gray-700 mb-2">SKUs de Importação Vinculados ({linkedSkusForThisProduct.length})</h4>
                        {linkedSkusForThisProduct.length > 0 ? (
                            <div className="space-y-1 max-h-40 overflow-y-auto pr-2">{linkedSkusForThisProduct.map((link: SkuLink) => (
                                <div key={link.importedSku} className="flex justify-between items-center bg-white p-1.5 rounded border">
                                    <span className="font-mono text-xs text-gray-600">{link.importedSku}</span>
                                    <button onClick={() => onTransferSku(link.importedSku, item)} className="text-xs font-semibold text-blue-600 hover:underline">Transferir</button>
                                </div>
                            ))}</div>
                        ) : <p className="text-xs text-gray-500 text-center">Nenhum SKU de importação vinculado a este produto.</p>}
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

const StockCard: React.FC<{ item: StockItem, hasAdjustPermission: boolean } & any> = ({ item, hasAdjustPermission, ...props }) => {
    const { onAdjustStock, onUpdateStock, onConfigureBom, onConfigureExpeditionItems, onProduce, onEdit, onDelete, isProdutos, expandedRows, onToggleExpand, skuLinks, onTransferSku, currentUser } = props;
    const isBelowMin = item.current_qty < item.min_qty && item.kind !== 'PRODUTO';
    const isExpanded = isProdutos && expandedRows && expandedRows.has(item.id);
    const linkedSkusForThisProduct = isProdutos && skuLinks ? skuLinks.filter((link: SkuLink) => link.masterProductSku === item.code) : [];

    return (
        <div className={`p-4 border rounded-lg ${isBelowMin ? 'bg-red-50 border-red-200' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-[var(--color-text-primary)]">{item.name}</p>
                    <p className="text-sm font-mono text-[var(--color-text-secondary)]">{item.code}</p>
                </div>
                {isProdutos && <button onClick={() => onToggleExpand(item.id)}>{isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</button>}
            </div>
            <div className="flex justify-between items-end mt-2">
                <div>
                    <p className="text-sm">Saldo: <span className={`font-bold ${isBelowMin ? 'text-red-600' : ''}`}>{item.current_qty.toFixed(2)} {item.unit}</span></p>
                    <p className="text-sm">Mínimo: <span>{item.min_qty.toFixed(2)} {item.unit}</span></p>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                    {item.kind === 'INSUMO' && <button onClick={() => onUpdateStock(item)} className="p-2"><PlusCircle size={18} /></button>}
                    <button onClick={() => onEdit(item)} className="p-2"><Edit3 size={18} /></button>
                    {hasAdjustPermission && <button onClick={() => onAdjustStock(item)} className="p-2"><SlidersHorizontal size={18} /></button>}
                    {onProduce && <button onClick={() => onProduce(item)} className="p-2"><Factory size={18} /></button>}
                    {onConfigureBom && <button onClick={() => onConfigureBom(item)} className="p-2"><Cog size={18} /></button>}
                    {onConfigureExpeditionItems && <button onClick={() => onConfigureExpeditionItems(item)} className="p-2"><Box size={18} /></button>}
                    {currentUser.role === 'DONO_SAAS' && <button onClick={() => onDelete(item)} className="p-2"><Trash2 size={18} /></button>}
                </div>
            </div>
            {isExpanded && (
                <div className="mt-2 pt-2 border-t">
                    <h4 className="font-semibold text-xs text-gray-700 mb-2">SKUs Vinculados ({linkedSkusForThisProduct.length})</h4>
                    {linkedSkusForThisProduct.length > 0 ? (
                        <div className="space-y-1">{linkedSkusForThisProduct.map((link: SkuLink) => (
                            <div key={link.importedSku} className="flex justify-between items-center bg-white p-1.5 rounded border">
                                <span className="font-mono text-xs">{link.importedSku}</span>
                                <button onClick={() => onTransferSku(link.importedSku, item)} className="text-xs font-semibold text-blue-600">Transferir</button>
                            </div>
                        ))}</div>
                    ) : <p className="text-xs text-center">Nenhum SKU vinculado.</p>}
                </div>
            )}
        </div>
    );
};


export default EstoquePage;