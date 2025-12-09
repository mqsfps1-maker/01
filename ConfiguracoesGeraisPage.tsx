import React, { useState } from 'react';
import * as XLSX from 'xlsx';
// FIX: Add missing imports
import { GeneralSettings, User, ToastMessage, StockItem, ExpeditionRule } from '../types';
import { ArrowLeft, Database, CheckCircle, Loader2, Save, AlertTriangle, RefreshCw, Copy, Check, Settings2, Edit, List, BrainCircuit, Plus, Trash2, Box, Users, UploadCloud, QrCode } from 'lucide-react';
import { verifyDatabaseSetup, supabaseUrl } from '../lib/supabaseClient';
import { SETUP_SQL_STRING } from '../lib/sql';
// FIX: Correct import path for ConfirmDbResetModal
import ConfirmDbResetModal from '../components/ConfirmResetDbModal';
import SyncDatabaseModal from '../components/SyncDatabaseModal'; // Import the new modal
import ListEditorModal from '../components/ListEditorModal'; // Import list editor
import ConfirmClearHistoryModal from '../components/ConfirmClearHistoryModal'; // Import new modal
import { iconList } from '../components/DynamicIcon';


const CopyCodeButton: React.FC<{ code: string }> = ({ code }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 hover:text-white transition-colors"
            title="Copiar para a área de transferência"
        >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
        </button>
    );
};


interface ConfiguracoesGeraisPageProps {
    setCurrentPage: (page: string) => void;
    generalSettings: GeneralSettings;
    onSaveGeneralSettings: (settings: GeneralSettings) => void;
    currentUser: User | null;
    onBackupData: () => void;
    onResetDatabase: (adminPassword: string) => Promise<{ success: boolean; message?: string }>;
    onClearScanHistory: (adminPassword: string) => Promise<{ success: boolean; message?: string }>;
    addToast: (message: string, type: ToastMessage['type']) => void;
    stockItems: StockItem[];
    users: User[];
}

type SetupStatus = 'idle' | 'setting_up' | 'success' | 'error';
type ModalToEdit = null | 'errorReasons' | 'resolutionTypes' | 'setorList';
type RuleType = 'packagingRules' | 'miudosPackagingRules';


// FIX: Added named export to allow for named import in App.tsx, resolving a module resolution error.
export const ConfiguracoesGeraisPage: React.FC<ConfiguracoesGeraisPageProps> = (props) => {
    const {
        setCurrentPage, generalSettings, onSaveGeneralSettings,
        currentUser, onBackupData, onResetDatabase, addToast, stockItems,
        onClearScanHistory, users
    } = props;

    const [isDbSetupNeeded, setIsDbSetupNeeded] = useState(false);
    const [settings, setSettings] = useState<GeneralSettings>(generalSettings);
    const [setupStatus, setSetupStatus] = useState<SetupStatus>('idle');
    const [setupProgressMessage, setSetupProgressMessage] = useState('');
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
    
    const [isSyncingModalOpen, setIsSyncingModalOpen] = useState(false);
    const [showSqlScript, setShowSqlScript] = useState(false);
    const [dbStatusDetails, setDbStatusDetails] = useState<any | null>(null);
    const [modalToEdit, setModalToEdit] = useState<ModalToEdit>(null);

    // New state for header extractor
    const [extractedHeaders, setExtractedHeaders] = useState<string[]>([]);
    const [isParsingHeaders, setIsParsingHeaders] = useState(false);
    const [headerError, setHeaderError] = useState<string | null>(null);
    const [shopeeExtractedHeaders, setShopeeExtractedHeaders] = useState<string[]>([]);
    const [isParsingShopeeHeaders, setIsParsingShopeeHeaders] = useState(false);
    const [shopeeHeaderError, setShopeeHeaderError] = useState<string | null>(null);


    const rawSetupSql = SETUP_SQL_STRING;


    const handleCheckStatus = async () => {
        setIsCheckingStatus(true);
        setSetupStatus('idle');
        try {
            const { setupNeeded, error, details } = await verifyDatabaseSetup();
            setDbStatusDetails(details);
            if (error) {
                throw new Error(error);
            }
            setIsDbSetupNeeded(setupNeeded);
            if (setupNeeded) {
                setSetupStatus('error');
                setSetupProgressMessage('Conexão OK, mas as tabelas do ERP não foram encontradas. Sincronize o banco de dados para criá-las.');
            } else {
                setSetupStatus('success');
                setSetupProgressMessage('Conexão OK. As tabelas do ERP foram encontradas.');
            }
        } catch (e) {
            setSetupStatus('error');
            setSetupProgressMessage(`Falha na verificação: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
        }
        setIsCheckingStatus(false);
    };

    React.useEffect(() => {
        handleCheckStatus();
    }, []);
    
    const handleOpenSyncModal = async () => {
        setShowSqlScript(false);
        await handleCheckStatus(); // Re-verify status before opening
        setIsSyncingModalOpen(true);
    };

    const handleSaveSettings = () => {
        onSaveGeneralSettings(settings);
        addToast('Configurações salvas com sucesso!', 'success');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };
    
    // FIX: Update type of value to allow string arrays
    const handleNestedInputChange = (parentKey: 'bipagem' | 'productTypeNames' | 'importer' | 'pedidos', childKey: string, value: string | boolean | number | string[]) => {
        // FIX: Handle nested importer settings for ml and shopee
        if (parentKey === 'importer' && (childKey.startsWith('ml.') || childKey.startsWith('shopee.'))) {
            const [platform, prop] = childKey.split('.');
            setSettings(prev => ({
                ...prev,
                importer: {
                    ...prev.importer,
                    [platform as 'ml' | 'shopee']: {
                        ...prev.importer[platform as 'ml' | 'shopee'],
                        [prop]: value
                    }
                }
            }));
        } else {
            setSettings(prev => ({
                ...prev,
                [parentKey]: {
                    ...prev[parentKey],
                    [childKey]: value
                }
            }));
        }
    };
    
    const handleHeaderFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsingHeaders(true);
        setHeaderError(null);
        setExtractedHeaders([]);
        
        try {
            const fileBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Reads only the 6th row (index 5) to get headers
            const headerRowSheet = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, range: 5 });
            
            if (headerRowSheet.length > 0 && headerRowSheet[0].length > 0) {
                const headers = headerRowSheet[0].filter(h => typeof h === 'string' && h.trim() !== '');
                setExtractedHeaders(headers);
            } else {
                throw new Error("Não foi possível encontrar cabeçalhos na sexta linha da planilha.");
            }
        } catch (err) {
            setHeaderError(err instanceof Error ? err.message : "Erro ao ler o arquivo.");
        } finally {
            setIsParsingHeaders(false);
        }
    };
    
    const handleShopeeHeaderFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsingShopeeHeaders(true);
        setShopeeHeaderError(null);
        setShopeeExtractedHeaders([]);

        try {
            const fileBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Reads the 1st row (index 0) to get headers for Shopee
            const headerRowSheet = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, range: 0 });
            
            if (headerRowSheet.length > 0 && headerRowSheet[0].length > 0) {
                const headers = headerRowSheet[0].filter(h => typeof h === 'string' && h.trim() !== '');
                setShopeeExtractedHeaders(headers);
            } else {
                throw new Error("Não foi possível encontrar cabeçalhos na primeira linha da planilha.");
            }
        } catch (err) {
            setShopeeHeaderError(err instanceof Error ? err.message : "Erro ao ler o arquivo.");
        } finally {
            setIsParsingShopeeHeaders(false);
        }
    };


    const handleConfirmReset = async (password: string) => {
        const result = await onResetDatabase(password);
        if (result.success) {
            setIsResetModalOpen(false);
            addToast('Os dados do banco foram limpos com sucesso!', 'success');
        }
        return result; 
    };
    
    const handleConfirmClearHistory = async (password: string) => {
        const result = await onClearScanHistory(password);
        if (result.success) {
            setIsClearHistoryModalOpen(false);
        }
        return result;
    };

    const handleBackup = () => {
        onBackupData();
        addToast('Backup completo em formato .sql foi baixado.', 'success');
    }

    // --- Expedition Rules Logic (FIXED) ---
    const handleAddRule = (type: RuleType, rule: Omit<ExpeditionRule, 'id'>) => {
        setSettings(prev => ({
            ...prev,
            expeditionRules: {
                ...prev.expeditionRules,
                [type]: [...(prev.expeditionRules?.[type] || []), { ...rule, id: `rule_${Date.now()}` }]
            }
        }));
    };

    const handleRemoveRule = (type: RuleType, id: string) => {
        setSettings(prev => ({
            ...prev,
            expeditionRules: {
                ...prev.expeditionRules,
                [type]: (prev.expeditionRules?.[type] || []).filter(r => r.id !== id)
            }
        }));
    };


    const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({title, icon, children}) => (
         <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center">{icon} {title}</h2>
            <div className="space-y-4">{children}</div>
        </div>
    );
    
    const ExpeditionRuleEditor: React.FC<{
        title: string;
        description: string;
        rules: ExpeditionRule[];
        ruleType: RuleType;
        onAdd: (type: RuleType, rule: Omit<ExpeditionRule, 'id'>) => void;
        onRemove: (type: RuleType, id: string) => void;
    }> = ({ title, description, rules, ruleType, onAdd, onRemove }) => {
        const [from, setFrom] = useState(1);
        const [to, setTo] = useState(1);
        const [stockItemCode, setStockItemCode] = useState('');
        const [quantity, setQuantity] = useState(1);
        const insumos = props.stockItems.filter(i => i.kind === 'INSUMO');

        const handleAddClick = () => {
            if (from > 0 && to >= from && stockItemCode && quantity > 0) {
                onAdd(ruleType, { from, to, stockItemCode, quantity });
                // Reset form
                setFrom(to + 1);
                setTo(to + 1);
            }
        };
        
        return (
            <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">{description}</p>
                <div className="flex items-end gap-2 p-2 bg-gray-50 border rounded-md flex-wrap">
                    <div className="flex-shrink-0">
                        <label className="text-xs">De</label>
                        <input type="number" value={from} onChange={e => setFrom(Number(e.target.value))} className="w-16 p-1 border rounded-md"/>
                    </div>
                    <div className="flex-shrink-0">
                        <label className="text-xs">Até</label>
                        <input type="number" value={to} onChange={e => setTo(Number(e.target.value))} className="w-16 p-1 border rounded-md"/>
                    </div>
                    <div className="flex-grow min-w-[150px]">
                        <label className="text-xs">Abater Insumo</label>
                        <select value={stockItemCode} onChange={e => setStockItemCode(e.target.value)} className="w-full p-1 border rounded-md bg-white">
                            <option value="">Selecione...</option>
                            {insumos.map(i => <option key={i.id} value={i.code}>{i.name}</option>)}
                        </select>
                    </div>
                     <div className="flex-shrink-0">
                        <label className="text-xs">Qtd.</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-16 p-1 border rounded-md"/>
                    </div>
                    <button onClick={handleAddClick} className="p-2 bg-blue-500 text-white rounded-md"><Plus size={16}/></button>
                </div>
                 <div className="space-y-1 mt-2 max-h-32 overflow-y-auto pr-1">
                    {(rules || []).map(rule => (
                        <div key={rule.id} className="flex justify-between items-center bg-gray-100 p-1.5 rounded text-xs">
                            <span>Se de <strong>{rule.from}</strong> a <strong>{rule.to}</strong>, abater <strong>{rule.quantity}x</strong> de {stockItems.find(i => i.code === rule.stockItemCode)?.name || rule.stockItemCode}</span>
                            <button onClick={() => onRemove(ruleType, rule.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const ToggleButton: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ label, enabled, onChange }) => (
        <div className="flex justify-between items-center p-3 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
            <span className="font-medium text-[var(--color-text-primary)] text-sm">{label}</span>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                 <a 
                    href="#configuracoes"
                    onClick={(e) => { e.preventDefault(); setCurrentPage('configuracoes'); }}
                    className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-sm hover:bg-[var(--color-surface-secondary)]"
                ><ArrowLeft size={20} /></a>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Configurações Gerais e Banco de Dados</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">Gerencie a conexão, estrutura e dados do seu sistema.</p>
                </div>
            </div>
            

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <div className="space-y-8">
                    <Section title="Configurações da Aplicação" icon={<Settings2 size={20} className="mr-2 text-blue-600" />}>
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-[var(--color-text-secondary)]">Nome da Aplicação</label>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                value={settings.companyName}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2"
                            />
                        </div>
                         <div>
                            <label htmlFor="appIcon" className="block text-sm font-medium text-[var(--color-text-secondary)]">Ícone da Aplicação</label>
                            <select
                                id="appIcon"
                                name="appIcon"
                                value={settings.appIcon}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2"
                            >
                                {iconList.map(iconName => (
                                    <option key={iconName} value={iconName}>
                                        {iconName}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Este ícone aparecerá na barra lateral.</p>
                        </div>

                         <div className="border-t border-[var(--color-border)] pt-4">
                            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Fluxo de Trabalho</h3>
                             <ToggleButton
                                label="Habilitar Módulo de Bipagem"
                                enabled={settings.bipagem.enableBipagem}
                                onChange={(enabled) => handleNestedInputChange('bipagem', 'enableBipagem', enabled)}
                            />
                        </div>
                        
                        <div className="border-t border-[var(--color-border)] pt-4">
                            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Configurações de Bipagem</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Sufixo a Ignorar na Bipagem</label>
                                    <input
                                        type="text"
                                        value={settings.bipagem?.scanSuffix || ''}
                                        onChange={(e) => handleNestedInputChange('bipagem', 'scanSuffix', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2"
                                        placeholder="Ex: [ESPAÇO] ou [ENTER]"
                                    />
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">Caractere que o leitor adiciona ao final (deixe em branco se nenhum).</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Operador Padrão para Bipagem</label>
                                    <select
                                        value={settings.bipagem?.defaultOperatorId || ''}
                                        onChange={(e) => handleNestedInputChange('bipagem', 'defaultOperatorId', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2"
                                    >
                                        <option value="">Nenhum (usa usuário logado)</option>
                                        {users.filter(u => u.role === 'FUNCIONARIO').map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">Atribui a bipagem a este operador se nenhum prefixo for usado.</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-[var(--color-border)] pt-4">
                            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Nomenclaturas</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Nome do Produto Principal</label>
                                    <input
                                        type="text"
                                        value={settings.productTypeNames.papel_de_parede}
                                        onChange={(e) => handleNestedInputChange('productTypeNames', 'papel_de_parede', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2"
                                        placeholder="Ex: Papel de Parede"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Nome para Produtos Secundários</label>
                                    <input
                                        type="text"
                                        value={settings.productTypeNames.miudos}
                                        onChange={(e) => handleNestedInputChange('productTypeNames', 'miudos', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2"
                                        placeholder="Ex: Miúdos, Ferramentas"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-[var(--color-border)] pt-4">
                             <div className="flex justify-between items-center">
                                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Setores da Empresa</h3>
                                <button onClick={() => setModalToEdit('setorList')} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Edit size={12}/> Editar</button>
                            </div>
                             <div className="flex flex-wrap gap-2 mt-2">
                                {settings.setorList.length > 0 ? settings.setorList.map(setor => (
                                    <span key={setor} className="bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">{setor}</span>
                                )) : <p className="text-xs text-gray-500">Nenhum setor cadastrado.</p>}
                            </div>
                        </div>
                        <div className="border-t border-[var(--color-border)] pt-4">
                            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Configurações de Importação</h3>
                            <div className="space-y-3">
                               <label className="flex items-center">
                                    <input type="checkbox" checked={settings.importer.extractCustomerName} onChange={e => handleNestedInputChange('importer', 'extractCustomerName', e.target.checked)} className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"/>
                                    <span className="ml-2 text-sm text-[var(--color-text-secondary)]">Extrair nome do cliente ao importar</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" checked={settings.importer.extractCustomerIdentifier} onChange={e => handleNestedInputChange('importer', 'extractCustomerIdentifier', e.target.checked)} className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"/>
                                    <span className="ml-2 text-sm text-[var(--color-text-secondary)]">Extrair CPF/CNPJ do cliente ao importar</span>
                                </label>
                                <div className="p-3 border rounded-lg space-y-4 bg-[var(--color-surface-secondary)]">
                                    <h4 className="font-semibold text-sm">Nome da Coluna do Cliente (Mercado Livre)</h4>
                                    
                                    <p className="text-xs text-[var(--color-text-secondary)]">Opção 1 (Recomendado): Extrair de um arquivo de exemplo.</p>
                                    <label htmlFor="header-file-upload" className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-white border border-[var(--color-border)] cursor-pointer hover:bg-gray-50 w-fit">
                                        <UploadCloud size={16}/>
                                        Carregar Planilha de Exemplo (ML)
                                    </label>
                                    <input id="header-file-upload" type="file" accept=".xlsx" onChange={handleHeaderFileChange} className="hidden" />
                                    {isParsingHeaders && <Loader2 className="animate-spin" />}
                                    {headerError && <p className="text-xs text-red-600">{headerError}</p>}
                                    {extractedHeaders.length > 0 && (
                                        <select
                                            value={settings.importer.ml.customerNameHeader || ''}
                                            onChange={(e) => handleNestedInputChange('importer', 'ml.customerNameHeader', e.target.value)}
                                            className="block w-full rounded-md border-[var(--color-border)] bg-white shadow-sm sm:text-sm p-2"
                                        >
                                            <option value="">Selecione a coluna correta...</option>
                                            {extractedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                                        </select>
                                    )}

                                    <p className="text-xs text-[var(--color-text-secondary)]">Opção 2: Digite manualmente o nome da coluna.</p>
                                    <input
                                        type="text"
                                        value={settings.importer.ml.customerNameHeader || ''}
                                        onChange={(e) => handleNestedInputChange('importer', 'ml.customerNameHeader', e.target.value)}
                                        className="block w-full rounded-md border-[var(--color-border)] bg-white shadow-sm sm:text-sm p-2"
                                        placeholder="Ex: Nome e sobrenome do destinatário"
                                    />
                                </div>
                                <div className="p-3 border rounded-lg space-y-4 bg-[var(--color-surface-secondary)]">
                                    <h4 className="font-semibold text-sm">Nome da Coluna do Cliente (Shopee)</h4>
                                    <p className="text-xs text-[var(--color-text-secondary)]">Opção 1 (Recomendado): Extrair de um arquivo de exemplo.</p>
                                    <label htmlFor="shopee-header-file-upload" className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-white border border-[var(--color-border)] cursor-pointer hover:bg-gray-50 w-fit">
                                        <UploadCloud size={16}/>
                                        Carregar Planilha de Exemplo (Shopee)
                                    </label>
                                    <input id="shopee-header-file-upload" type="file" accept=".xlsx" onChange={handleShopeeHeaderFileChange} className="hidden" />
                                    {isParsingShopeeHeaders && <Loader2 className="animate-spin" />}
                                    {shopeeHeaderError && <p className="text-xs text-red-600">{shopeeHeaderError}</p>}
                                    {shopeeExtractedHeaders.length > 0 && (
                                        <select
                                            value={settings.importer.shopee.customerNameHeader || ''}
                                            onChange={(e) => handleNestedInputChange('importer', 'shopee.customerNameHeader', e.target.value)}
                                            className="block w-full rounded-md border-[var(--color-border)] bg-white shadow-sm sm:text-sm p-2"
                                        >
                                            <option value="">Selecione a coluna correta...</option>
                                            {shopeeExtractedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                                        </select>
                                    )}

                                    <p className="text-xs text-[var(--color-text-secondary)]">Opção 2: Digite manualmente o nome da coluna.</p>
                                    <input
                                        type="text"
                                        value={settings.importer.shopee.customerNameHeader || ''}
                                        onChange={(e) => handleNestedInputChange('importer', 'shopee.customerNameHeader', e.target.value)}
                                        className="block w-full rounded-md border-[var(--color-border)] bg-white shadow-sm sm:text-sm p-2"
                                        placeholder="Ex: Nome do Destinatário"
                                    />
                                </div>
                            </div>
                        </div>
                         <div className="border-t border-[var(--color-border)] pt-4">
                             <div className="flex justify-between items-center">
                                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Pedidos e Erros</h3>
                            </div>
                             <div className="space-y-3 mt-2">
                                <label className="flex items-center">
                                    <input type="checkbox" checked={settings.pedidos.displayCustomerIdentifier} onChange={e => handleNestedInputChange('pedidos', 'displayCustomerIdentifier', e.target.checked)} className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"/>
                                    <span className="ml-2 text-sm text-[var(--color-text-secondary)]">Mostrar coluna de CPF/CNPJ na tela de Pedidos</span>
                                </label>
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">Motivos de Erro Pré-definidos</h4>
                                    <button onClick={() => setModalToEdit('errorReasons')} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Edit size={12}/> Editar</button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">Tipos de Solução Pré-definidos</h4>
                                    <button onClick={() => setModalToEdit('resolutionTypes')} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Edit size={12}/> Editar</button>
                                </div>
                             </div>
                        </div>
                        <div className="border-t border-[var(--color-border)] pt-4">
                            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Regras de Expedição</h3>
                             <ExpeditionRuleEditor
                                title="Regras de Embalagem (Papel de Parede)"
                                description="Defina qual embalagem usar com base na quantidade de papéis de parede em um pedido."
                                rules={settings.expeditionRules.packagingRules}
                                ruleType="packagingRules"
                                onAdd={handleAddRule}
                                onRemove={handleRemoveRule}
                            />
                             <ExpeditionRuleEditor
                                title={`Regras de Embalagem (${generalSettings.productTypeNames.miudos})`}
                                description={`Defina qual embalagem usar para pedidos que contêm APENAS ${generalSettings.productTypeNames.miudos}.`}
                                rules={settings.expeditionRules.miudosPackagingRules}
                                ruleType="miudosPackagingRules"
                                onAdd={handleAddRule}
                                onRemove={handleRemoveRule}
                            />
                        </div>

                         <div className="flex justify-end mt-4">
                            <button onClick={handleSaveSettings} className="flex items-center text-sm font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                                <Save size={16} className="mr-2"/> Salvar Configurações
                            </button>
                        </div>
                    </Section>
                </div>

                <div className="space-y-8">
                     <Section title="Banco de Dados" icon={<Database size={20} className="mr-2 text-indigo-600" />}>
                        <div className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Status da Conexão</p>
                                    {isCheckingStatus ? (
                                        <div className="flex items-center text-sm text-[var(--color-text-secondary)] mt-1"><Loader2 className="animate-spin h-4 w-4 mr-2" />Verificando...</div>
                                    ) : (
                                        <div className={`flex items-center text-sm font-semibold mt-1 ${setupStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                            {setupStatus === 'success' ? <CheckCircle size={16} className="mr-2"/> : <AlertTriangle size={16} className="mr-2"/>}
                                            {setupProgressMessage}
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleCheckStatus} disabled={isCheckingStatus} className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-sm hover:bg-[var(--color-surface-tertiary)] disabled:opacity-50"><RefreshCw size={16} /></button>
                            </div>
                        </div>
                         <div className="flex flex-wrap gap-2">
                            <button onClick={handleOpenSyncModal} className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors">
                                <BrainCircuit size={16}/> Sincronizar Estrutura do DB
                            </button>
                            <button onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors">
                                <Database size={16}/> Fazer Backup Completo (.sql)
                            </button>
                        </div>
                    </Section>

                     <div className="bg-[var(--color-danger-bg)] p-6 rounded-xl border border-[var(--color-danger-border)] shadow-sm">
                        <h2 className="text-lg font-bold text-[var(--color-danger-text)] mb-4 flex items-center">
                            <AlertTriangle size={20} className="mr-2" />
                            Zona de Perigo
                        </h2>
                        <div className="space-y-3">
                            <div className="border-t border-red-300 pt-3">
                                <h3 className="font-semibold text-[var(--color-danger-text)]">Resetar Dados da Organização</h3>
                                <p className="text-sm text-[var(--color-danger-text)] opacity-90 mb-2">Apaga TODOS os dados operacionais (pedidos, bipagens, etc.) da sua empresa, mantendo a estrutura, produtos e usuários. Use com extremo cuidado.</p>
                                <a href="#reset" onClick={(e) => { e.preventDefault(); setCurrentPage('reset')}} className="inline-block px-3 py-1.5 text-sm font-bold text-red-800 bg-red-200 rounded-md hover:bg-red-300 shadow-sm">Resetar Dados</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDbResetModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirmReset={handleConfirmReset}
            />
             <ConfirmClearHistoryModal
                isOpen={isClearHistoryModalOpen}
                onClose={() => setIsClearHistoryModalOpen(false)}
                onConfirmClear={handleConfirmClearHistory}
            />
            <SyncDatabaseModal
                isOpen={isSyncingModalOpen}
                onClose={() => setIsSyncingModalOpen(false)}
                onFinished={handleCheckStatus}
                dbStatusDetails={dbStatusDetails}
            />
             <ListEditorModal
                isOpen={!!modalToEdit}
                onClose={() => setModalToEdit(null)}
                title={
                    modalToEdit === 'errorReasons' ? 'Editar Motivos de Erro' :
                    modalToEdit === 'resolutionTypes' ? 'Editar Tipos de Solução' :
                    modalToEdit === 'setorList' ? 'Editar Setores' : ''
                }
                items={
                    modalToEdit ? (settings as any)[modalToEdit === 'setorList' ? 'setorList' : 'pedidos'][modalToEdit === 'setorList' ? 'setorList' : modalToEdit] : []
                }
                onSave={(newItems) => {
                    if (modalToEdit) {
                        if (modalToEdit === 'setorList') {
                            setSettings(p => ({...p, setorList: newItems}));
                        } else {
                            handleNestedInputChange('pedidos', modalToEdit, newItems);
                        }
                    }
                }}
            />
        </div>
    );
};