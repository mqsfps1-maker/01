
import React, { useState, useMemo } from 'react';
import { StockItem, OrderItem, GeneralSettings, ProdutoCombinado } from '../types';
import { Package, Plus, Upload, Trash2, Edit, AlertTriangle, Search, Tag, GripVertical, ChevronDown, ChevronUp, Link } from 'lucide-react';
import ProductFormModal from '../components/ProductFormModal';
import { parseSheetToOrderItems } from '../lib/parser';

interface ProductPageProps {
    stockItems: StockItem[];
    produtosCombinados: ProdutoCombinado[];
    onSaveProdutoCombinado: (productSku: string, newBomItems: ProdutoCombinado['items']) => void;
    unlinkedSkus: string[];
    setUnlinkedSkus: (skus: string[] | ((prev: string[]) => string[])) => void;
    onSaveStockItem: (itemData: StockItem) => Promise<StockItem | null>;
    onDeleteStockItem: (itemId: string) => Promise<boolean>;
    generalSettings: GeneralSettings;
    setGeneralSettings: (settings: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => void;
    subscription: any;
}

const ProductPage: React.FC<ProductPageProps> = ({ stockItems, produtosCombinados, onSaveProdutoCombinado, unlinkedSkus, setUnlinkedSkus, onSaveStockItem, onDeleteStockItem, generalSettings, setGeneralSettings, subscription }) => {
    const [activeTab, setActiveTab] = useState<'products' | 'unlinked'>('products');
    const [productFormState, setProductFormState] = useState<{ isOpen: boolean, item: Partial<StockItem> | null }>({ isOpen: false, item: null });
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const products = useMemo(() => {
        const filtered = stockItems.filter(item => item.kind === 'PRODUTO');
        if (!searchTerm) return filtered;
        return filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [stockItems, searchTerm]);

    const toggleExpansion = (productId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleImportSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportError(null);
        try {
            const buffer = await file.arrayBuffer();
            const { orders: newOrders, canal } = parseSheetToOrderItems(buffer, file.name, generalSettings);
            
            const skusFromSheet = Array.from(new Set(newOrders.map(o => o.sku)));
            
            const existingProductSkus = new Set(products.flatMap(p => p.linkedSkus?.map(l => l.sku) || []));
            const newUnlinked = skusFromSheet.filter(s => !existingProductSkus.has(s));

            setUnlinkedSkus(prev => Array.from(new Set([...prev, ...newUnlinked])));
            alert(`${newUnlinked.length} novos SKUs não vinculados foram extraídos da planilha do canal ${canal}.`);
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Erro desconhecido ao processar a planilha.');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const handleDelete = (item: StockItem) => {
        if (window.confirm(`Tem certeza que deseja excluir o produto "${item.name}"?`)) {
            onDeleteStockItem(item.id);
        }
    };

    const handleSave = async (data: { productData: StockItem, bomData: ProdutoCombinado['items'] | null }) => {
        const savedProduct = await onSaveStockItem(data.productData);
        if (savedProduct && data.bomData) {
            onSaveProdutoCombinado(savedProduct.code, data.bomData);
        }
        if (savedProduct) {
            setProductFormState({ isOpen: false, item: null });
            // Remove from unlinked list if it was there
            if (data.productData.linkedSkus) {
                 const linked = new Set(data.productData.linkedSkus.map(l => l.sku));
                 setUnlinkedSkus(prev => prev.filter(s => !linked.has(s)));
            }
        }
        return !!savedProduct;
    };
    
    const handleNewProduct = () => {
        // Product Limit Check
        const productLimit = subscription?.plan?.product_limit || 250;
        if (products.length >= productLimit) {
            alert(`Você atingiu o limite de ${productLimit} produtos do seu plano. Faça um upgrade para continuar cadastrando.`);
            return;
        }
        setProductFormState({ isOpen: true, item: null });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Produtos</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">Gerencie seu catálogo e a composição de produtos por SKUs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleImportSheet} accept=".xlsx" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-semibold rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-50">
                        <Upload size={16} /> {isImporting ? 'Importando...' : 'Importar SKUs'}
                    </button>
                    <button onClick={handleNewProduct} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold rounded-md hover:bg-[var(--color-primary-hover)]">
                        <Plus size={16} /> Novo Produto
                    </button>
                </div>
            </div>
            
            {importError && <p className="text-red-600">{importError}</p>}
            
             <div className="flex space-x-4 border-b border-[var(--color-border)] mb-4">
                <button 
                    className={`pb-2 px-4 font-medium ${activeTab === 'products' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                    onClick={() => setActiveTab('products')}
                >
                    Catálogo ({products.length})
                </button>
                <button 
                    className={`pb-2 px-4 font-medium ${activeTab === 'unlinked' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                    onClick={() => setActiveTab('unlinked')}
                >
                    SKUs Pendentes ({unlinkedSkus.length})
                </button>
            </div>

            {activeTab === 'products' ? (
                <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-border)] shadow-sm">
                    <div className="mb-4">
                        <div className="relative">
                             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"/>
                             <input 
                                type="text" 
                                placeholder="Buscar produto..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 p-2 border border-[var(--color-border)] bg-[var(--color-surface-secondary)] rounded-md text-sm"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-[var(--color-surface-secondary)]">
                                <tr>
                                    <th className="px-4 py-3 w-10"></th>
                                    {['Nome do Produto', 'SKUs Vinculados', 'Estoque', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {products.map(product => {
                                    const isExpanded = expandedRows.has(product.id);
                                    return (
                                    <React.Fragment key={product.id}>
                                        <tr>
                                            <td className="px-4 py-3">
                                                {product.composition === 'kit' && (
                                                    <button onClick={() => toggleExpansion(product.id)} className="p-1.5 text-gray-400 hover:text-blue-500">
                                                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                                                <div className="flex items-center gap-2">
                                                    {product.name}
                                                    {product.composition === 'kit' && (
                                                        <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Kit</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(product.linkedSkus || []).map(({ sku, multiplier }) => (
                                                        <span key={sku} className="flex items-center bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] text-xs font-mono px-2 py-1 rounded-full">
                                                            <Tag size={12} className="mr-1.5" />
                                                            {sku}
                                                            {multiplier > 1 && <span className="ml-1.5 font-sans font-bold">x {multiplier}</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {product.min_qty > 0 && product.current_qty < product.min_qty && <span title={`Abaixo do estoque de segurança (${product.min_qty})`}><AlertTriangle size={14} className="text-red-500" /></span>}
                                                    <span className={`font-semibold ${product.min_qty > 0 && product.current_qty < product.min_qty ? 'text-red-600' : ''}`}>{product.current_qty}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setProductFormState({ isOpen: true, item: product })} className="p-1.5 text-[var(--color-text-secondary)] hover:text-blue-500"><Edit size={16}/></button>
                                                    <button onClick={() => handleDelete(product)} className="p-1.5 text-[var(--color-text-secondary)] hover:text-red-500"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                         {isExpanded && product.composition === 'kit' && (
                                            <tr>
                                                <td colSpan={5} className="p-3 bg-indigo-50">
                                                    <h4 className="font-semibold text-xs text-indigo-800 mb-2">Componentes do Kit:</h4>
                                                    {(() => {
                                                        const bom = produtosCombinados.find(b => b.productSku === product.code);
                                                        if (!bom || !bom.items || bom.items.length === 0) {
                                                            return <p className="text-xs text-gray-500">Nenhum componente cadastrado para este kit. Configure na tela de Estoque.</p>;
                                                        }
                                                        return (
                                                            <div className="space-y-1">
                                                                {(bom.items as any[]).map(item => {
                                                                    const componentProduct = stockItems.find(p => p.code === item.stockItemCode);
                                                                    return (
                                                                        <div key={item.stockItemCode} className="flex justify-between items-center bg-white p-1.5 rounded border text-xs">
                                                                            <span>{componentProduct?.name || item.stockItemCode}</span>
                                                                            <span className="font-bold">{item.qty_per_pack} un.</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-border)] shadow-sm">
                    {unlinkedSkus.length > 0 ? (
                        <div className="space-y-2">
                            {unlinkedSkus.map(sku => (
                                <div key={sku} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-secondary)]">
                                    <span className="font-mono font-medium text-[var(--color-text-primary)]">{sku}</span>
                                    <button 
                                        onClick={() => setProductFormState({ isOpen: true, item: { code: sku, name: sku.replace(/[-_]/g, ' '), linkedSkus: [{sku, multiplier: 1}] } })}
                                        className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200"
                                    >
                                        <Link size={14}/> Criar Produto
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center py-8 text-[var(--color-text-secondary)]">Nenhum SKU pendente.</p>}
                </div>
            )}

            {productFormState.isOpen && (
                 <ProductFormModal
                    isOpen={productFormState.isOpen}
                    onClose={() => setProductFormState({ isOpen: false, item: null })}
                    itemToEdit={productFormState.item}
                    onSave={handleSave}
                    allProducts={stockItems}
                    unlinkedSkus={unlinkedSkus}
                    generalSettings={generalSettings}
                    setGeneralSettings={setGeneralSettings}
                />
            )}
        </div>
    );
};

export default ProductPage;
