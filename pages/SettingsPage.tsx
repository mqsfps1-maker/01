
import React, { useState } from 'react';
import { GeneralSettings } from '../types';
import { Save, FileUp, UploadCloud, Loader2, QrCode } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SettingsPageProps {
    generalSettings: GeneralSettings;
    setGeneralSettings: (settings: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)) => void;
}

const ToggleButton: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ label, enabled, onChange }) => (
    <div className="flex justify-between items-center p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
        <span className="font-medium text-[var(--color-text-primary)] text-sm">{label}</span>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
        </button>
    </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ generalSettings, setGeneralSettings }) => {
    const [settings, setSettings] = useState<GeneralSettings>(generalSettings);

    const [extractedHeaders, setExtractedHeaders] = useState<string[]>([]);
    const [isParsingHeaders, setIsParsingHeaders] = useState(false);
    const [headerError, setHeaderError] = useState<string | null>(null);

    const [shopeeExtractedHeaders, setShopeeExtractedHeaders] = useState<string[]>([]);
    const [isParsingShopeeHeaders, setIsParsingShopeeHeaders] = useState(false);
    const [shopeeHeaderError, setShopeeHeaderError] = useState<string | null>(null);
    
    const handleNestedInputChange = (parentKey: 'bipagem', childKey: 'enableBipagem', value: boolean) => {
        setSettings(prev => ({
            ...prev,
            [parentKey]: {
                ...prev[parentKey],
                [childKey]: value
            }
        }));
    };

    const handleImporterHeaderChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const [platform, child] = name.split('.');
        
        setSettings(prev => ({
            ...prev,
            importer: {
                ...prev.importer,
                [platform as 'ml' | 'shopee']: {
                    ...prev.importer[platform as 'ml' | 'shopee'],
                    [child]: value
                }
            }
        }));
    };

     const handleHeaderFileChange = async (e: React.ChangeEvent<HTMLInputElement>, platform: 'ml' | 'shopee') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const setIsParsing = platform === 'ml' ? setIsParsingHeaders : setIsParsingShopeeHeaders;
        const setError = platform === 'ml' ? setHeaderError : setShopeeHeaderError;
        const setHeaders = platform === 'ml' ? setExtractedHeaders : setShopeeExtractedHeaders;
        const startRow = platform === 'ml' ? 5 : 0;

        setIsParsing(true);
        setError(null);
        setHeaders([]);
        
        try {
            const fileBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const headerRowSheet = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, range: startRow });
            
            if (headerRowSheet.length > 0 && headerRowSheet[0].length > 0) {
                const headers = headerRowSheet[0].filter(h => typeof h === 'string' && h.trim() !== '');
                setHeaders(headers);
            } else {
                throw new Error(`Não foi possível encontrar cabeçalhos na linha ${startRow + 1} da planilha.`);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Erro ao ler o arquivo.";
            setError(errorMessage);
        } finally {
            setIsParsing(false);
            if (e.target) e.target.value = ''; // Reset file input
        }
    };
    
    const handleSave = () => {
        setGeneralSettings(settings);
        alert('Configurações salvas com sucesso!');
    };
    
    const renderHeaderSelector = (platform: 'ml' | 'shopee', field: string, label: string) => {
        const headers = platform === 'ml' ? extractedHeaders : shopeeExtractedHeaders;
        return (
            <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</label>
                 {headers.length > 0 ? (
                    <select name={`${platform}.${field}`} value={settings.importer[platform][field as keyof typeof settings.importer[typeof platform]] as string} onChange={handleImporterHeaderChange} className="mt-1 w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md">
                        <option value="">Selecione a coluna...</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                ) : (
                    <input type="text" name={`${platform}.${field}`} value={settings.importer[platform][field as keyof typeof settings.importer[typeof platform]] as string} onChange={handleImporterHeaderChange} className="mt-1 w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md" placeholder="Digite o nome do cabeçalho"/>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Configurações</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Gerencie as configurações da sua conta e da aplicação.</p>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)] shadow-sm">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><QrCode size={20} className="text-[var(--color-primary)]" /> Configurações de Bipagem</h2>
                 <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-secondary)]">
                    <ToggleButton
                        label="Habilitar Módulo de Bipagem"
                        enabled={settings.bipagem.enableBipagem}
                        onChange={(enabled) => handleNestedInputChange('bipagem', 'enableBipagem', enabled)}
                    />
                </div>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)] shadow-sm">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><FileUp size={20} className="text-[var(--color-primary)]" /> Configurações de Importação</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">Defina os nomes exatos dos cabeçalhos das colunas em suas planilhas de vendas para garantir que a importação de dados funcione corretamente.</p>

                <div className="space-y-6">
                    {/* Mercado Livre Settings */}
                    <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-secondary)]">
                        <h3 className="font-semibold text-lg mb-3">Mercado Livre</h3>
                        <div className="mb-4">
                            <label htmlFor="ml-header-file" className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-white border border-[var(--color-border)] cursor-pointer hover:bg-gray-50 w-fit">
                                {isParsingHeaders ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16} />}
                                Carregar Planilha de Exemplo (ML)
                            </label>
                            <input id="ml-header-file" type="file" accept=".xlsx" onChange={(e) => handleHeaderFileChange(e, 'ml')} className="hidden"/>
                            {headerError && <p className="text-xs text-red-600 mt-1">{headerError}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderHeaderSelector('ml', 'orderIdHeader', 'Cabeçalho ID do Pedido')}
                            {renderHeaderSelector('ml', 'skuHeader', 'Cabeçalho SKU')}
                            {renderHeaderSelector('ml', 'qtyHeader', 'Cabeçalho Quantidade')}
                            {renderHeaderSelector('ml', 'dataHeader', 'Cabeçalho Data')}
                            {renderHeaderSelector('ml', 'trackingHeader', 'Cabeçalho Rastreamento')}
                            {renderHeaderSelector('ml', 'customerNameHeader', 'Cabeçalho Nome do Cliente')}
                            {renderHeaderSelector('ml', 'customerIdentifierHeader', 'Cabeçalho CPF/CNPJ do Cliente')}
                        </div>
                    </div>

                    {/* Shopee Settings */}
                    <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-secondary)]">
                        <h3 className="font-semibold text-lg mb-3">Shopee</h3>
                         <div className="mb-4">
                            <label htmlFor="shopee-header-file" className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-white border border-[var(--color-border)] cursor-pointer hover:bg-gray-50 w-fit">
                                {isParsingShopeeHeaders ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16} />}
                                Carregar Planilha de Exemplo (Shopee)
                            </label>
                            <input id="shopee-header-file" type="file" accept=".xlsx" onChange={(e) => handleHeaderFileChange(e, 'shopee')} className="hidden"/>
                            {shopeeHeaderError && <p className="text-xs text-red-600 mt-1">{shopeeHeaderError}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {renderHeaderSelector('shopee', 'orderIdHeader', 'Cabeçalho ID do Pedido')}
                           {renderHeaderSelector('shopee', 'skuHeader', 'Cabeçalho SKU')}
                           {renderHeaderSelector('shopee', 'qtyHeader', 'Cabeçalho Quantidade')}
                           {renderHeaderSelector('shopee', 'dataHeader', 'Cabeçalho Data')}
                           {renderHeaderSelector('shopee', 'shippingDateHeader', 'Cabeçalho Data de Envio')}
                           {renderHeaderSelector('shopee', 'trackingHeader', 'Cabeçalho Rastreamento')}
                           {renderHeaderSelector('shopee', 'customerNameHeader', 'Cabeçalho Nome do Cliente')}
                           {renderHeaderSelector('shopee', 'customerIdentifierHeader', 'Cabeçalho CPF/CNPJ do Cliente')}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold rounded-lg hover:bg-[var(--color-primary-hover)]">
                        <Save size={16} /> Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
