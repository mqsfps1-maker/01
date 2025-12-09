
import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { Settings, Printer, Trash2, X, FileText, Loader2, Image as ImageIcon, Zap, Link as LinkIcon, PlusCircle, AlertTriangle, Package, File, Eye, History, UploadCloud, CheckCircle, Inbox } from 'lucide-react';
import { ZplSettings, ExtractedZplData, GeneralSettings, StockItem, User, OrderItem, ZplPlatformSettings, EtiquetaHistoryItem, EtiquetasState, SkuLink, ScanLogItem, LabelProcessingStatus } from '../types';
import { processZplStream } from '../services/zplService';
import { buildPdf } from '../services/pdfGenerator';
import { parseSheetToOrderItems } from '../lib/parser';
import LinkSkuModal from '../components/LinkSkuModal';
import CreateProductFromImportModal from '../components/CreateProductFromImportModal';
import { simpleHash } from '../utils/zplUtils';
import { dbClient } from '../lib/supabaseClient'; // Importar dbClient para chamar a RPC

// --- Types ---
type ProcessingMode = 'completo' | 'rapido';

interface EtiquetasPageProps {
  settings: ZplSettings;
  onSettingsSave: (newSettings: ZplSettings) => void;
  stockItems: StockItem[];
  etiquetasState: EtiquetasState;
  setEtiquetasState: React.Dispatch<React.SetStateAction<EtiquetasState>>;
  currentUser: User;
  allOrders: OrderItem[];
  setAllOrders: (orders: OrderItem[] | ((prev: OrderItem[]) => OrderItem[])) => void;
  etiquetasHistory: EtiquetaHistoryItem[];
  onSaveHistory: (item: Omit<EtiquetaHistoryItem, 'id' | 'created_at'>) => void;
  onSaveStockItem: (item: Omit<StockItem, 'id'>) => Promise<StockItem | null>;
  generalSettings: GeneralSettings;
  setGeneralSettings: (settings: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => void;
  skuLinks: SkuLink[];
  scanHistory: ScanLogItem[];
  labelProcessingStatus: LabelProcessingStatus;
  setLabelProcessingStatus: React.Dispatch<React.SetStateAction<LabelProcessingStatus>>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// ... (DraggableFooterEditor, SettingsModal, ProcessingModeModal mantidos iguais, omitindo para brevidade mas devem estar no arquivo final)
// Vou incluir apenas a função principal alterada para garantir que o contexto seja mantido.
// Assumindo que os componentes auxiliares estão no arquivo original ou serão preservados se eu não os reescrever.
// Para garantir, vou reescrever o arquivo com os imports e a função principal, mas omitindo os componentes auxiliares se eles não mudaram, 
// mas como preciso entregar o arquivo completo, vou incluir tudo.

// --- DraggableFooterEditor ---
const DraggableFooterEditor: React.FC<{
    settings: ZplPlatformSettings['footer'];
    pageWidth_mm: number;
    pageHeight_mm: number;
    imageAreaPercentage: number;
    onChange: (key: keyof ZplPlatformSettings['footer'], value: any) => void;
    previewImageUrl?: string;
}> = ({ settings, pageWidth_mm, pageHeight_mm, imageAreaPercentage, onChange, previewImageUrl }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handlePositionChange = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x_px = e.clientX - rect.left;
        const y_px = e.clientY - rect.top;

        const scaleX = pageWidth_mm / rect.width;
        const scaleY = pageHeight_mm / rect.height;

        onChange('x_position_mm', Math.max(0, x_px * scaleX));
        onChange('y_position_mm', Math.max(0, y_px * scaleY));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        handlePositionChange(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            handlePositionChange(e);
        }
    };

    const handleMouseUp = () => setIsDragging(false);
    
    const containerWidth = 200; // Fixed width for preview
    const containerHeight = (pageHeight_mm / pageWidth_mm) * containerWidth;
    const x_px = (settings.x_position_mm / pageWidth_mm) * containerWidth;
    const y_px = (settings.y_position_mm / pageHeight_mm) * containerHeight;
    const imageAreaHeight_px = containerHeight * (imageAreaPercentage / 100);
    
    const placeholderText = settings.template
        .replace('{sku}', 'SKU-EXEMPLO')
        .replace('{name}', 'PRODUTO EXEMPLO')
        .replace('{qty}', '1');

    return (
        <div className="space-y-2">
            <div
                ref={containerRef}
                className="w-full border-2 border-dashed rounded-lg relative cursor-move bg-gray-200"
                style={{ height: `${containerHeight}px` }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                 {previewImageUrl ? (
                    <img 
                        src={previewImageUrl} 
                        alt="Preview da etiqueta"
                        className="absolute top-0 left-1/2 -translate-x-1/2 object-contain object-top pointer-events-none"
                        style={{ height: `${imageAreaHeight_px}px`, width: '100%' }}
                    />
                ) : (
                    <div className="absolute top-0 left-0 w-full bg-white flex items-center justify-center text-gray-400 text-xs" style={{height: `${imageAreaHeight_px}px`}}>
                        Área da Imagem
                    </div>
                )}
                <div 
                    className="absolute p-1 bg-blue-500 bg-opacity-70 text-white text-xs rounded-sm pointer-events-none whitespace-nowrap"
                    style={{ left: `${x_px}px`, top: `${y_px}px` }}
                >
                    {placeholderText}
                </div>
            </div>
        </div>
    );
};


// --- Settings Modal Component ---
const SettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    currentSettings: ZplSettings;
    onSave: (newSettings: ZplSettings) => void;
    previews: string[];
    extractedData: Map<number, ExtractedZplData>;
}> = ({ isOpen, onClose, currentSettings, onSave, previews, extractedData }) => {
    const [settings, setSettings] = useState<ZplSettings>(currentSettings);
    const [activeTab, setActiveTab] = useState<'general' | 'shopee' | 'mercadoLivre'>('general');

    React.useEffect(() => {
        if (isOpen) setSettings(currentSettings);
    }, [isOpen, currentSettings]);
    
    const previewImageUrl = useMemo(() => {
        if (previews.length === 0 || extractedData.size === 0) return undefined;
        
        const targetIsMercadoLivre = activeTab === 'mercadoLivre';

        for (let i = 0; i < previews.length; i += 2) {
            const pairData = extractedData.get(i);
            if (pairData?.isMercadoLivre === targetIsMercadoLivre) {
                const labelPreview = previews[i + 1];
                if (labelPreview && labelPreview.startsWith('data:image')) {
                    return labelPreview;
                }
            }
        }
        // Fallback to first available label if no match for the active tab
        for (let i = 1; i < previews.length; i += 2) {
            if (previews[i] && previews[i].startsWith('data:image')) return previews[i];
        }

        return undefined;
    }, [activeTab, previews, extractedData]);

    if (!isOpen) return null;

    const handlePlatformChange = (platform: 'shopee' | 'mercadoLivre', key: keyof ZplPlatformSettings, value: any) => {
        setSettings(prev => ({ ...prev, [platform]: { ...prev[platform], [key]: value }}));
    };
    
    const handlePlatformFooterChange = (platform: 'shopee' | 'mercadoLivre', key: keyof ZplPlatformSettings['footer'], value: any) => {
        setSettings(prev => ({...prev, [platform]: { ...prev[platform], footer: { ...prev[platform].footer, [key]: value }}}));
    };
    
    const handlePresetChange = (platform: 'shopee' | 'mercadoLivre', preset: 'below' | 'above' | 'custom') => {
        handlePlatformFooterChange(platform, 'positionPreset', preset);
    };
    
    const renderPlatformSettings = (platform: 'shopee' | 'mercadoLivre') => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-3">Layout da Etiqueta</h3>
                <div className="space-y-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
                    <div><label className="text-sm font-medium">Área da Imagem da Etiqueta (%)</label><input type="number" value={settings[platform].imageAreaPercentage_even} onChange={e => handlePlatformChange(platform, 'imageAreaPercentage_even', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/></div>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-3">Rodapé da Etiqueta</h3>
                <div className="space-y-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
                    <div>
                        <label className="text-sm font-medium">Posição Padrão</label>
                        <select 
                            value={settings[platform].footer.positionPreset}
                            onChange={e => handlePresetChange(platform, e.target.value as any)}
                            className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                        >
                            <option value="below">Abaixo da Etiqueta</option>
                            <option value="above">Acima da Etiqueta</option>
                            <option value="custom">Personalizado (Arrastar)</option>
                        </select>
                    </div>

                    {settings[platform].footer.positionPreset === 'custom' ? (
                        <>
                            <DraggableFooterEditor 
                                settings={settings[platform].footer}
                                pageWidth_mm={settings.pageWidth}
                                pageHeight_mm={settings.pageHeight}
                                imageAreaPercentage={settings[platform].imageAreaPercentage_even}
                                onChange={(key, value) => handlePlatformFooterChange(platform, key, value)}
                                previewImageUrl={previewImageUrl}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Posição X (mm)</label>
                                    <input type="number" value={settings[platform].footer.x_position_mm.toFixed(0)} onChange={e => handlePlatformFooterChange(platform, 'x_position_mm', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/>
                                </div>
                                 <div>
                                    <label className="text-sm font-medium">Posição Y (mm)</label>
                                    <input type="number" value={settings[platform].footer.y_position_mm.toFixed(0)} onChange={e => handlePlatformFooterChange(platform, 'y_position_mm', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/>
                                </div>
                            </div>
                        </>
                    ) : (
                         <div>
                            <label className="text-sm font-medium">Espaçamento (mm)</label>
                            <input type="number" value={settings[platform].footer.spacing_mm} onChange={e => handlePlatformFooterChange(platform, 'spacing_mm', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/>
                             <p className="text-xs text-[var(--color-text-secondary)] mt-1">Distância entre a imagem da etiqueta e o texto do rodapé.</p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium">Tam. Fonte (pt)</label><input type="number" value={settings[platform].footer.fontSize_pt} onChange={e => handlePlatformFooterChange(platform, 'fontSize_pt', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/></div>
                        <div><label className="text-sm font-medium">Espaçamento (pt)</label><input type="number" value={settings[platform].footer.lineSpacing_pt} onChange={e => handlePlatformFooterChange(platform, 'lineSpacing_pt', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/></div>
                    </div>
                    <div><label className="text-sm font-medium">Fonte</label><select value={settings[platform].footer.fontFamily} onChange={e => handlePlatformFooterChange(platform, 'fontFamily', e.target.value as any)} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"><option value="helvetica">Helvetica</option><option value="times">Times</option><option value="courier">Courier</option></select></div>
                    <div>
                        <label className="text-sm font-medium">Alinhamento do Texto</label>
                        <div className="flex gap-2 mt-1">
                            <button onClick={() => handlePlatformFooterChange(platform, 'textAlign', 'left')} className={`px-3 py-1 text-sm rounded-md border ${settings[platform].footer.textAlign === 'left' ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>Esquerda</button>
                            <button onClick={() => handlePlatformFooterChange(platform, 'textAlign', 'center')} className={`px-3 py-1 text-sm rounded-md border ${settings[platform].footer.textAlign === 'center' ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>Centro</button>
                            <button onClick={() => handlePlatformFooterChange(platform, 'textAlign', 'right')} className={`px-3 py-1 text-sm rounded-md border ${settings[platform].footer.textAlign === 'right' ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>Direita</button>
                        </div>
                    </div>
                     <div><label className="flex items-center"><input type="checkbox" checked={settings[platform].footer.multiColumn} onChange={e => handlePlatformFooterChange(platform, 'multiColumn', e.target.checked)} className="h-4 w-4 rounded"/><span className="ml-2 text-sm">Dividir SKUs em colunas se necessário</span></label></div>
                    <div><label className="text-sm font-medium">Template</label><input type="text" value={settings[platform].footer.template} onChange={e => handlePlatformFooterChange(platform, 'template', e.target.value)} className="mt-1 w-full p-2 border rounded-md font-mono text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/><p className="text-xs text-[var(--color-text-secondary)] mt-1">Variáveis: {'{sku}'}, {'{name}'}, {'{qty}'}.</p></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg shadow-2xl p-6 w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Configurações de Etiquetas</h2><button onClick={onClose}><X size={24} /></button></div>
                
                <div className="border-b border-[var(--color-border)]">
                    <div className="flex -mb-px">
                        <button onClick={() => setActiveTab('general')} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${activeTab === 'general' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)]'}`}>Geral</button>
                        <button onClick={() => setActiveTab('shopee')} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${activeTab === 'shopee' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)]'}`}>Shopee</button>
                        <button onClick={() => setActiveTab('mercadoLivre')} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${activeTab === 'mercadoLivre' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)]'}`}>Mercado Livre</button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto space-y-6 pr-4 pt-6">
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Layout da Página</h3>
                                    <div className="space-y-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
                                        <div>
                                            <label className="text-sm font-medium">Layout do Par (DANFE + Etiqueta)</label>
                                            <div className="flex gap-2 mt-1">
                                                <button onClick={() => setSettings(p => ({...p, pairLayout: 'vertical'}))} className={`px-3 py-1 text-sm rounded-md border ${settings.pairLayout === 'vertical' ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>Vertical</button>
                                                <button onClick={() => setSettings(p => ({...p, pairLayout: 'horizontal'}))} className={`px-3 py-1 text-sm rounded-md border ${settings.pairLayout === 'horizontal' ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>Horizontal</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="text-sm font-medium">Largura (mm)</label><input type="number" value={settings.pageWidth} onChange={e => setSettings(p => ({...p, pageWidth: Number(e.target.value)}))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/></div>
                                            <div><label className="text-sm font-medium">Altura (mm)</label><input type="number" value={settings.pageHeight} onChange={e => setSettings(p => ({...p, pageHeight: Number(e.target.value)}))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/></div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Renderização e Processamento</h3>
                                    <div className="space-y-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
                                        <div><label className="text-sm font-medium">Qualidade (DPI)</label><select value={settings.dpi} onChange={e => setSettings(p => ({...p, dpi: e.target.value as ZplSettings['dpi']}))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"><option value="Auto">Auto</option><option value="203">203 DPI</option><option value="300">300 DPI</option></select></div>
                                        <div><label className="text-sm font-medium">Escala da DANFE (%)</label><input type="number" value={settings.sourcePageScale_percent} onChange={e => setSettings(p => ({...p, sourcePageScale_percent: Number(e.target.value)}))} className="mt-1 w-full p-2 border rounded-md bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"/></div>
                                        <div><label className="flex items-center"><input type="checkbox" checked={settings.combineMultiPageDanfe} onChange={e => setSettings(p => ({...p, combineMultiPageDanfe: e.target.checked}))} className="h-4 w-4 rounded"/><span className="ml-2 text-sm">Combinar DANFEs de múltiplas páginas</span></label></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'shopee' && renderPlatformSettings('shopee')}
                    {activeTab === 'mercadoLivre' && renderPlatformSettings('mercadoLivre')}
                </div>
                <div className="mt-6 flex justify-end gap-3 border-t pt-4"><button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--color-surface-secondary)]">Cancelar</button><button onClick={() => {onSave(settings);}} className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold">Salvar</button></div>
            </div>
        </div>
    );
};

const ProcessingModeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelectMode: (mode: ProcessingMode) => void;
}> = ({ isOpen, onClose, onSelectMode }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Escolha o modo de processamento</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">O modo "Rápido" economiza recursos ignorando a pré-visualização da DANFE, ideal para grandes volumes ou conexões lentas.</p>
                <div className="space-y-4">
                    <button
                        onClick={() => onSelectMode('completo')}
                        className="w-full flex items-center p-4 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] transition-all"
                    >
                        <Package size={24} className="mr-4 text-[var(--color-primary)]" />
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">Completo (Etiqueta + DANFE)</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">Modo padrão. Gera a pré-visualização de todas as páginas.</p>
                        </div>
                    </button>
                    <button
                        onClick={() => onSelectMode('rapido')}
                        className="w-full flex items-center p-4 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] transition-all"
                    >
                        <Zap size={24} className="mr-4 text-orange-500" />
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">Rápido (Apenas Etiqueta)</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">Processamento otimizado, ignora a DANFE na pré-visualização.</p>
                        </div>
                    </button>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-4 py-2">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
const EtiquetasPage: React.FC<EtiquetasPageProps> = (props) => {
    const { settings, onSettingsSave, stockItems, etiquetasState, setEtiquetasState, allOrders, setAllOrders, currentUser, onSaveHistory, etiquetasHistory, onSaveStockItem, generalSettings, skuLinks, labelProcessingStatus, setLabelProcessingStatus, addToast } = props;
    const { zplInput, includeDanfe, zplPages, previews, extractedData } = etiquetasState;

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [linkModalState, setLinkModalState] = useState<{isOpen: boolean, skus: string[], color: string}>({isOpen: false, skus: [], color: ''});
    const [createModalState, setCreateModalState] = useState<{isOpen: boolean, data: { sku: string; colorSugerida: string } | null}>({isOpen: false, data: null});
    const [zplWarning, setZplWarning] = useState<string | null>(null);
    const [isModeModalOpen, setIsModeModalOpen] = useState(false);
    const [printedIndices, setPrintedIndices] = useState<Set<number>>(new Set());
    const [isParsingSheet, setIsParsingSheet] = useState(false);
    const [sheetFileName, setSheetFileName] = useState<string | null>(null);

    const zplInputRef = useRef<HTMLInputElement>(null);
    const sheetInputRef = useRef<HTMLInputElement>(null);

    const skuToProductMap = useMemo(() => {
        const map = new Map<string, { product: StockItem, multiplier: number }>();
        stockItems.forEach(product => {
            if (product.linkedSkus) {
                product.linkedSkus.forEach(link => {
                    map.set(link.sku, { product, multiplier: link.multiplier });
                });
            }
        });
        return map;
    }, [stockItems]);

    const unlinkedSkusData = useMemo(() => {
        if (extractedData.size === 0) return [];
        const allExtractedSkus = Array.from(extractedData.values()).flatMap((d: ExtractedZplData) => d.skus.map(s => s.sku));
        const uniqueSkus = Array.from(new Set(allExtractedSkus));
        return uniqueSkus.filter(sku => !skuToProductMap.has(sku)).map(sku => ({ sku, colorSugerida: 'Padrão' }));
    }, [extractedData, skuToProductMap]);

    const startProcessing = useCallback(async (mode: ProcessingMode) => {
        setIsModeModalOpen(false);
        setLabelProcessingStatus({ isActive: true, progress: 0, current: 0, total: 100, message: 'Iniciando...', isFinished: false });
        
        const shouldIncludeDanfe = mode === 'completo';
        setEtiquetasState(prev => ({ ...prev, includeDanfe: shouldIncludeDanfe }));
        
        setZplWarning(null);
        setPrintedIndices(new Set());
        setEtiquetasState(prev => ({ ...prev, zplPages: [], previews: [], extractedData: new Map() }));
        
        const printedHashes = new Set<string>();

        const processor = processZplStream(zplInput, settings, generalSettings, allOrders, mode, printedHashes);

        for await (const result of processor) {
            switch (result.type) {
                case 'progress':
                    setLabelProcessingStatus(prev => ({...prev, progress: (result.current / result.total) * 100, current: result.current, total: result.total, message: result.message}));
                    break;
                case 'start':
                    if (result.warnings.length > 0) setZplWarning(result.warnings.join(' '));
                    setEtiquetasState(prev => ({ ...prev, zplPages: result.zplPages, extractedData: result.extractedData, previews: new Array(result.zplPages.length).fill('') }));
                    
                    const newPrintedIndices = new Set<number>();
                    if (result.printedStatus) result.printedStatus.forEach((isPrinted, index) => { if (isPrinted) newPrintedIndices.add(index); });
                    setPrintedIndices(newPrintedIndices);

                    break;
                case 'preview':
                    setEtiquetasState(prev => {
                        const newPreviews = [...prev.previews];
                        newPreviews[result.index] = result.preview;
                        return { ...prev, previews: newPreviews };
                    });
                    break;
                case 'done':
                    setLabelProcessingStatus(prev => ({...prev, isActive: false, isFinished: true, message: `Etiquetas Processadas! (${prev.total})`}));
                    break;
                case 'error':
                    alert(`Ocorreu um erro: ${result.message}`);
                    setLabelProcessingStatus({ isActive: false, progress: 0, current: 0, total: 0, message: 'Erro', isFinished: true });
                    break;
            }
        }
    }, [zplInput, settings, generalSettings, allOrders, setEtiquetasState, setLabelProcessingStatus]);

    const handleProcessRequest = useCallback(() => {
        if (!zplInput.trim()) return;
        setIsModeModalOpen(true);
    }, [zplInput]);


    const handlePdfAction = useCallback(async () => {
        setLabelProcessingStatus(prev => ({...prev, isActive: true, message: 'Montando PDF...'}));
        try {
            // CORREÇÃO: Salvar histórico ANTES de tentar gerar o PDF.
            // Isso garante que se houver erro na geração ou download, o registro não é perdido.
            if (onSaveHistory && zplPages.length > 0) {
                const pageHashes = zplPages.map(page => simpleHash(page));
                const historyItem: Omit<EtiquetaHistoryItem, 'id' | 'created_at'> = { 
                    created_by_name: currentUser.name, 
                    page_count: zplPages.length, 
                    zpl_content: zplInput, 
                    settings_snapshot: settings, 
                    page_hashes: pageHashes 
                };
                await onSaveHistory(historyItem);
            }

            // Increment label usage in database
            // CORREÇÃO: Contar apenas etiquetas reais, descontando DANFEs se "Incluir DANFE" estiver ativo.
            // Se includeDanfe for true, cada "pedido" gera 2 páginas (DANFE + Etiqueta), então dividimos por 2.
            // Se includeDanfe for false, cada página é uma etiqueta (ou o processamento já filtrou).
            // A lógica aqui assume que zplPages contém pares (DANFE, Label).
            let labelCount = zplPages.length / 2; 
            
            // Se estivermos processando apenas etiquetas (sem DANFE), a contagem deve ser ajustada.
            // Mas o processador sempre gera pares internamente. A contagem de uso deve ser baseada em "envios".
            // 1 Envio = 1 Etiqueta (independente de ter DANFE ou não).
            
             try {
                await dbClient.rpc('increment_label_count', { amount: labelCount });
            } catch (rpcError) {
                console.error("Failed to increment label count:", rpcError);
                // Non-blocking error, proceed with PDF generation
            }

            const pdfBlob = await buildPdf(previews, extractedData, settings, includeDanfe, stockItems, skuLinks);
            const url = URL.createObjectURL(pdfBlob);
            
            window.open(url, '_blank');

            const indicesToMark = new Set<number>();
            previews.forEach((p, index) => {
                if (p && p !== 'SKIPPED' && p !== 'ERROR') {
                     if (includeDanfe) indicesToMark.add(index);
                     else if (index % 2 !== 0) indicesToMark.add(index);
                }
            });
            setPrintedIndices(prev => new Set([...Array.from(prev), ...Array.from(indicesToMark)]));

        } catch (error) { 
            alert(`Falha ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`); 
        } finally { 
            setLabelProcessingStatus(prev => ({...prev, isActive: false, isFinished: true, message: 'PDF Gerado!'}));
        }
    }, [previews, extractedData, settings, includeDanfe, stockItems, skuLinks, onSaveHistory, currentUser, zplInput, zplPages, setLabelProcessingStatus]);

    const handleClearZplInput = () => {
        setEtiquetasState(p => ({ ...p, zplInput: '' }));
    };
    
    const handleSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsParsingSheet(true);
        setSheetFileName(file.name);
        try {
            const buffer = await file.arrayBuffer();
            const { orders: newOrders, canal } = parseSheetToOrderItems(buffer, file.name, generalSettings);
            
            setAllOrders(newOrders);
            alert(`${newOrders.length} pedidos do canal ${canal} foram carregados com sucesso da planilha.`);
        } catch (err) {
            alert(`Erro ao processar a planilha: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
            setSheetFileName(null);
        } finally {
            setIsParsingSheet(false);
            if(sheetInputRef.current) sheetInputRef.current.value = '';
        }
    };


    const handleReloadHistory = (item: EtiquetaHistoryItem) => {
        setEtiquetasState(prev => ({ ...prev, zplInput: item.zpl_content }));
        onSettingsSave(item.settings_snapshot);
        setTimeout(() => document.getElementById('process-button')?.click(), 100);
    };

    const handleConfirmCreateAndLink = async (newItemData: Omit<StockItem, 'id'>) => { 
        const newItem = await onSaveStockItem(newItemData); 
        if (newItem && createModalState.data) {
             // Link logic is handled by onSaveStockItem, just close modal
        }
        setCreateModalState({ isOpen: false, data: null }); 
    };

    const pagesToRender = useMemo(() => {
        return previews
            .map((src, index) => ({ src, index }))
            .filter(({ index }) => includeDanfe || index % 2 !== 0);
    }, [previews, includeDanfe]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Gerador de Etiquetas</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">Cole ou importe seu código ZPL, processe, enriqueça e imprima suas etiquetas de envio.</p>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={() => setIsSettingsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold rounded-md border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-surface-secondary)]">
                        <Settings size={16} /> Configurações
                    </button>
                    <button id="process-button" onClick={handleProcessRequest} disabled={!zplInput.trim() || labelProcessingStatus.isActive} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold rounded-md hover:bg-[var(--color-primary-hover)] disabled:opacity-50">
                        <Zap size={16}/> Gerar Etiquetas
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                 <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm flex flex-col h-full min-h-[400px]">
                     <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Entrada de Dados</h2>
                         {zplInput && (
                            <button onClick={handleClearZplInput} title="Limpar campo" className="p-1 text-[var(--color-text-secondary)] hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        )}
                     </div>
                     <p className="text-sm text-[var(--color-text-secondary)] mb-4">Cole o conteúdo ZPL, importe um arquivo de etiquetas ou uma planilha de vendas para começar.</p>
                    <textarea value={zplInput} onChange={(e) => setEtiquetasState(p => ({ ...p, zplInput: e.target.value }))} placeholder="^XA ... ^XZ" className="flex-grow w-full p-2 font-mono text-xs border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)]"/>
                    <div className="flex items-center gap-2 mt-4">
                        <input type="file" ref={zplInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) file.text().then(text => setEtiquetasState(p => ({...p, zplInput: text}))); if(e.target) e.target.value = ''; }} accept=".txt,.zpl" className="hidden" />
                        <button onClick={() => zplInputRef.current?.click()} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] border border-[var(--color-border)]"><FileText size={14} /> Importar ZPL (.txt)</button>
                        
                        <input type="file" ref={sheetInputRef} onChange={handleSheetUpload} accept=".xlsx" className="hidden"/>
                        <button onClick={() => sheetInputRef.current?.click()} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] border border-[var(--color-border)]" disabled={isParsingSheet}>
                            {isParsingSheet ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14} />}
                            Importar Planilha
                        </button>
                    </div>
                </div>
                 <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm flex flex-col h-full min-h-[400px]">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Histórico de Lotes</h2>
                    <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                        {etiquetasHistory.length > 0 ? etiquetasHistory.map(item => (
                            <div key={item.id} className="bg-[var(--color-surface-secondary)] p-3 rounded-lg border border-[var(--color-border)]">
                                <p className="font-semibold text-sm">Lote de {item.page_count / 2} etiquetas</p>
                                <p className="text-xs text-[var(--color-text-secondary)]">Gerado por {item.created_by_name} em {new Date(item.created_at).toLocaleString('pt-BR')}</p>
                                <button onClick={() => handleReloadHistory(item)} className="mt-2 text-sm font-semibold text-[var(--color-primary)] hover:underline">Recarregar lote</button>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-secondary)]">
                                <Inbox size={32} className="mb-2"/>
                                <p className="font-semibold">Nenhum lote processado ainda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {(previews.length > 0 || labelProcessingStatus.isActive) && (
                <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-border)] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Etiquetas Processadas</h2>
                         <div className="flex items-center gap-2">
                            <div className="flex items-center p-1 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
                                <span className="text-sm font-semibold px-2">Incluir DANFE</span>
                                <button
                                    onClick={() => setEtiquetasState(p => ({...p, includeDanfe: !p.includeDanfe}))}
                                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${includeDanfe ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${includeDanfe ? 'translate-x-6' : 'translate-x-1'}`}/>
                                </button>
                            </div>
                            <button onClick={handlePdfAction} disabled={previews.length === 0 || previews.every(p => !p) || labelProcessingStatus.isActive} className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold disabled:opacity-50"><Printer size={16} /> Gerar PDF</button>
                         </div>
                    </div>
                    {labelProcessingStatus.isActive ? (
                        <div className="text-center p-8 space-y-4">
                            <Loader2 size={32} className="animate-spin text-[var(--color-primary)] mx-auto"/>
                            <p>{labelProcessingStatus.message}</p>
                            <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2.5">
                                <div className="bg-[var(--color-primary)] h-2.5 rounded-full" style={{width: `${labelProcessingStatus.progress}%`}}></div>
                            </div>
                        </div>
                    ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {pagesToRender.map(({ src, index }) => (
                            <div key={index} className="space-y-2 relative border p-2 rounded-md">
                                {printedIndices.has(index) && (<div className="absolute inset-0 bg-green-900 bg-opacity-75 flex items-center justify-center z-10 rounded-lg pointer-events-none"><span className="text-white font-bold text-lg rotate-[-15deg] border-2 border-white px-4 py-1 rounded">IMPRESSO</span></div>)}
                                <div className="bg-[var(--color-surface-secondary)] p-2 rounded-lg flex flex-col aspect-[100/150] justify-center items-center overflow-hidden">
                                    {src === 'SKIPPED' ? <div className="text-[var(--color-text-secondary)] text-center p-4">DANFE Omitida</div> : 
                                     src === 'ERROR' ? <div className="text-red-500 text-center p-4">Erro</div> : 
                                     src ? <img src={src} alt={`Preview ${index + 1}`} className="max-w-full max-h-full object-contain" /> : <Loader2 className="animate-spin text-[var(--color-text-secondary)]" />}
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                </div>
            )}


            <SettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setIsSettingsModalOpen(false)} 
                currentSettings={settings} 
                onSave={(newSettings) => { 
                    onSettingsSave(newSettings);
                    addToast('Configurações de etiquetas salvas!', 'success');
                }} 
                previews={previews} 
                extractedData={extractedData} 
            />
            <ProcessingModeModal isOpen={isModeModalOpen} onClose={() => setIsModeModalOpen(false)} onSelectMode={startProcessing} />
        </div>
    );
}

export default EtiquetasPage;
