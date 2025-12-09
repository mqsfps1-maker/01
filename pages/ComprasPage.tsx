import React, { useState, useMemo } from 'react';
// FIX: Add missing imports
import { ShoppingListItem, StockItem, GeneralSettings, StockItemKind } from '../types';
import { ListPlus, Trash2, Share2, Info, Search, PlusCircle, FileDown, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
// FIX: Changed import to correctly import autoTable as a function.
import autoTable from 'jspdf-autotable';
import ProductFormModal from '../components/ProductFormModal';

interface ComprasPageProps {
    shoppingList: ShoppingListItem[];
    onClearList: () => void;
    onUpdateItem: (itemCode: string, isPurchased: boolean) => void;
    stockItems: StockItem[];
    onSaveStockItem: (itemData: StockItem) => Promise<StockItem | null>;
    unlinkedSkus: string[];
    generalSettings: GeneralSettings;
    setGeneralSettings: (settings: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => void;
}

const ComprasPage: React.FC<ComprasPageProps> = (props) => {
    const { shoppingList, onClearList, onUpdateItem, stockItems, onSaveStockItem, unlinkedSkus, generalSettings, setGeneralSettings } = props;

    // --- State for Manual List ---
    const [manualList, setManualList] = useState<ShoppingListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedInsumo, setSelectedInsumo] = useState<StockItem | null>(null);
    const [productFormState, setProductFormState] = useState<{ isOpen: boolean, item: Partial<StockItem> | null }>({ isOpen: false, item: null });


    // --- Logic for Stock-based List ---
    const listaEstoqueMinimo = useMemo(() => {
        return stockItems
            .filter(item => item.kind === 'INSUMO' && item.min_qty > 0 && item.current_qty < item.min_qty)
            .map(item => ({
                id: item.code,
                name: item.name,
                quantity: item.min_qty - item.current_qty,
                unit: item.unit,
                current_qty: item.current_qty,
                min_qty: item.min_qty
            }))
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [stockItems]);

    const generatePdfForStockList = (action: 'download' | 'print') => {
        if (listaEstoqueMinimo.length === 0) return;
        const doc = new jsPDF();
        doc.text(`Lista de Compras (Estoque Mínimo) - ${new Date().toLocaleDateString('pt-BR')}`, 14, 15);
        
        autoTable(doc, {
            startY: 20,
            head: [['Insumo', 'Estoque Atual', 'Mínimo', 'Comprar']],
            body: listaEstoqueMinimo.map(item => [item.name, `${item.current_qty.toFixed(2)} ${item.unit}`, `${item.min_qty.toFixed(2)} ${item.unit}`, `${item.quantity.toFixed(2)} ${item.unit}`]),
            theme: 'striped',
        });
        
        if (action === 'download') {
            doc.save('lista_compras_estoque_minimo.pdf');
        } else {
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        }
    };

    const handleShareStockList = () => {
        if (listaEstoqueMinimo.length === 0) return;
        let text = `*Lista de Compras (Estoque Mínimo) - ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
        listaEstoqueMinimo.forEach(item => {
            text += `- ${item.name}: Comprar ${item.quantity.toFixed(2)} ${item.unit} (Estoque: ${item.current_qty.toFixed(2)}/${item.min_qty.toFixed(2)})\n`;
        });

        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    };

    // --- Logic for Manual List ---
    const insumos = useMemo(() => stockItems.filter(item => item.kind === 'INSUMO'), [stockItems]);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        const lowerSearchTerm = searchTerm.toLowerCase();
        return insumos.filter(insumo => 
            !manualList.some(item => item.id === insumo.code) &&
            (insumo.name.toLowerCase().includes(lowerSearchTerm) || insumo.code.toLowerCase().includes(lowerSearchTerm))
        ).slice(0, 5); // Limit results for performance
    }, [searchTerm, insumos, manualList]);

    const handleSelectInsumo = (insumo: StockItem) => {
        setSelectedInsumo(insumo);
        setSearchTerm('');
    };

    const handleAddToManualList = () => {
        if (selectedInsumo && quantity > 0) {
            setManualList(prev => [...prev, {
                id: selectedInsumo.code,
                name: selectedInsumo.name,
                quantity: quantity,
                unit: selectedInsumo.unit
            }]);
            setSelectedInsumo(null);
            setQuantity(1);
        }
    };

    const handleRemoveFromManualList = (itemCode: string) => {
        setManualList(prev => prev.filter(item => item.id !== itemCode));
    };

    const handleClearManualList = () => {
        if (window.confirm('Tem certeza que deseja limpar a lista manual?')) {
            setManualList([]);
        }
    };

    const generatePdfForManualList = (action: 'download' | 'print') => {
        if (manualList.length === 0) return;
        const doc = new jsPDF();
        doc.text(`Lista de Compras Manual - ${new Date().toLocaleDateString('pt-BR')}`, 14, 15);
        
        autoTable(doc, {
            startY: 20,
            head: [['Item', 'Quantidade', 'Unidade']],
            body: manualList.map(item => [item.name, item.quantity.toString(), item.unit]),
            theme: 'striped',
        });
        
        if (action === 'download') {
            doc.save('lista_compras_manual.pdf');
        } else {
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        }
    };
    
    const handleShareManual = () => {
        if (manualList.length === 0) return;
        let text = `*Lista de Compras Manual - ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
        manualList.forEach(item => {
            text += `- ${item.name}: ${item.quantity} ${item.unit}\n`;
        });
        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleSaveProduct = async (data: { productData: StockItem, bomData: any }) => {
        const savedItem = await onSaveStockItem(data.productData);
        if (savedItem) {
            setProductFormState({ isOpen: false, item: null });
        }
        return !!savedItem;
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Compras</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Stock-based Shopping List */}
                <div className="space-y-4">
                    <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm w-full">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center">
                                <ListPlus size={20} className="mr-2 text-[var(--color-primary)]" />
                                Lista de Compras (Estoque Mínimo)
                            </h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => generatePdfForStockList('download')} disabled={listaEstoqueMinimo.length === 0} className="flex items-center gap-1 text-xs py-1 px-2 bg-red-100 text-red-700 font-semibold rounded-md hover:bg-red-200 disabled:opacity-50"><FileDown size={14}/> PDF</button>
                                <button onClick={handleShareStockList} disabled={listaEstoqueMinimo.length === 0} className="flex items-center gap-1 text-xs py-1 px-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50">
                                    <Share2 size={14}/> WhatsApp
                                </button>
                            </div>
                        </div>
                        {listaEstoqueMinimo.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] max-h-96">
                                 <table className="min-w-full bg-[var(--color-surface)] text-sm">
                                    <thead className="bg-[var(--color-surface-secondary)] sticky top-0">
                                        <tr>
                                            {['Insumo', 'Estoque Atual / Mínimo', 'Comprar'].map(h => 
                                                <th key={h} className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">{h}</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {listaEstoqueMinimo.map(item => (
                                            <tr key={item.id} className={'bg-[var(--color-warning-bg)]'}>
                                                <td className={`py-2 px-3 font-medium`}>{item.name}</td>
                                                <td className={`py-2 px-3`}>{item.current_qty.toFixed(2)} / {item.min_qty.toFixed(2)} {item.unit}</td>
                                                <td className={`py-2 px-3 font-bold text-red-600`}>{item.quantity.toFixed(2)} {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 px-4 border-2 border-dashed border-[var(--color-border)] rounded-lg">
                                <p className="font-semibold text-[var(--color-text-primary)]">Nenhum insumo abaixo do estoque mínimo.</p>
                                <p className="text-[var(--color-text-secondary)]">Seu estoque de matéria-prima está em dia!</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--color-info-border)] rounded-lg flex items-center gap-3">
                        <Info size={20}/>
                        <p className="text-sm">Esta lista é preenchida automaticamente com os insumos que estão abaixo do estoque mínimo definido na tela de Produtos.</p>
                    </div>
                </div>

                {/* Manual Shopping List */}
                <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm w-full">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center">
                            <PlusCircle size={20} className="mr-2 text-[var(--color-primary)]" />
                            Criar Lista de Compras Manual
                        </h2>
                         <button onClick={() => setProductFormState({isOpen: true, item: { kind: 'INSUMO' }})} className="flex items-center gap-1 text-xs py-1 px-2 bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200">
                           <PlusCircle size={14} /> Cadastrar Novo Insumo
                        </button>
                    </div>
                    
                    <div className="relative mb-4">
                        <div className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg space-y-2">
                             {selectedInsumo ? (
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <label className="text-xs font-medium">Item</label>
                                        <p className="font-semibold p-2 bg-[var(--color-surface)] rounded border border-[var(--color-border)]">{selectedInsumo.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium">Qtd.</label>
                                        <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-24 p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md" min="1"/>
                                    </div>
                                    <button onClick={handleAddToManualList} className="px-3 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"><PlusCircle size={16}/></button>
                                </div>
                             ) : (
                                <div>
                                    <label className="text-xs font-medium">Buscar Insumo</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" placeholder="Digite para buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border-[var(--color-border)] bg-[var(--color-surface)] rounded-md"/>
                                    </div>
                                </div>
                             )}
                        </div>
                         {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {searchResults.map(insumo => (
                                    <div key={insumo.id} className="p-2 hover:bg-[var(--color-surface-secondary)] cursor-pointer border-b" onClick={() => handleSelectInsumo(insumo)}>
                                        <p className="font-semibold">{insumo.name}</p>
                                        <p className="text-xs text-[var(--color-text-secondary)]">{insumo.code}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] max-h-80">
                        <table className="min-w-full bg-[var(--color-surface)] text-sm">
                            <thead className="bg-[var(--color-surface-secondary)] sticky top-0">
                                <tr>
                                    {['Insumo', 'Quantidade', 'Ação'].map(h => <th key={h} className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {manualList.length > 0 ? manualList.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-2 px-3 font-medium">{item.name}</td>
                                        <td className="py-2 px-3 font-bold">{item.quantity} {item.unit}</td>
                                        <td className="py-2 px-3"><button onClick={() => handleRemoveFromManualList(item.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="text-center py-8 text-[var(--color-text-secondary)]">Adicione insumos para criar sua lista.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                       <button onClick={() => generatePdfForManualList('download')} disabled={manualList.length === 0} className="flex items-center gap-1 text-xs py-1 px-2 bg-red-100 text-red-700 font-semibold rounded-md hover:bg-red-200 disabled:opacity-50"><FileDown size={14}/> PDF</button>
                       <button onClick={() => generatePdfForManualList('print')} disabled={manualList.length === 0} className="flex items-center gap-1 text-xs py-1 px-2 bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200 disabled:opacity-50"><Printer size={14}/> Imprimir</button>
                       <button onClick={handleShareManual} disabled={manualList.length === 0} className="flex items-center gap-1 text-xs py-1 px-2 bg-green-100 text-green-700 font-semibold rounded-md hover:bg-green-200 disabled:opacity-50"><Share2 size={14}/> WhatsApp</button>
                       <button onClick={handleClearManualList} disabled={manualList.length === 0} className="flex items-center gap-1 text-xs py-1 px-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 disabled:opacity-50 ml-auto"><Trash2 size={14}/> Limpar</button>
                    </div>
                </div>
            </div>
            {productFormState.isOpen && (
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
            )}
        </div>
    );
};

export default ComprasPage;