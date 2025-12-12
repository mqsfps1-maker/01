
// components/SyncDatabaseModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle, RefreshCw, Server, Database, Columns, FunctionSquare, Copy, Check } from 'lucide-react';
import { SETUP_SQL_STRING, ERP_TABLES_SQL, FULL_DB_SYNC_SQL, AUTOCREATE_ERP_TABLES_SQL } from '../lib/sql';

interface SyncDatabaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFinished: () => void;
    dbStatusDetails: any | null;
}

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


const SyncDatabaseModal: React.FC<SyncDatabaseModalProps> = ({ isOpen, onClose, onFinished, dbStatusDetails }) => {
    
    if (!isOpen) return null;
    
    const versionMatch = dbStatusDetails?.versionMatch;
    const dbVersion = dbStatusDetails?.dbVersion;
    const expectedVersion = dbStatusDetails?.expectedVersion;
    const pendingChangesCount = (dbStatusDetails?.tables_status?.filter((i: any) => !i.exists).length || 0) + 
                                (dbStatusDetails?.types_status?.filter((i: any) => !i.exists).length || 0) +
                                (dbStatusDetails?.functions_status?.filter((i: any) => !i.exists).length || 0) +
                                (dbStatusDetails?.columns_status?.filter((i: any) => !i.exists).length || 0);

    const isSynced = pendingChangesCount === 0 && versionMatch;

        const [selectedScript, setSelectedScript] = React.useState<'setup'|'erp'|'fullsync'|'autocreate'>('setup');
    const getScriptContent = () => {
        switch(selectedScript) {
            case 'setup': return SETUP_SQL_STRING;
            case 'erp': return ERP_TABLES_SQL;
            case 'fullsync': return FULL_DB_SYNC_SQL;
                case 'autocreate': return AUTOCREATE_ERP_TABLES_SQL;
            default: return SETUP_SQL_STRING;
        }
    };
    const selectedScriptContent = getScriptContent();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Sincronizar Banco de Dados</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="my-4">
                   {isSynced ? (
                        <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg min-h-[200px] flex flex-col justify-center">
                            <div className="text-center">
                                <CheckCircle size={24} className="mx-auto mb-2" />
                                <h3 className="font-semibold">Seu banco de dados está sincronizado!</h3>
                                <p className="text-sm">Versão do App: {expectedVersion} | Versão do DB: {dbVersion}</p>
                            </div>
                        </div>
                   ) : (
                        <div>
                            {!versionMatch && (
                                <div className="p-2 mb-3 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-md text-sm">
                                    <strong>Atenção:</strong> A versão do schema do banco ({dbVersion || 'desconhecida'}) é diferente da esperada ({expectedVersion}). A sincronização irá atualizar o schema.
                                </div>
                            )}
                            <h3 className="font-semibold text-gray-800 mb-2 flex items-center"><AlertTriangle size={16} className="mr-2 text-yellow-600"/>Sincronização necessária.</h3>
                            <p className="text-sm text-gray-600 mb-3">O esquema no banco de dados está desatualizado. Para corrigir, copie e execute o script SQL abaixo no <strong>Editor SQL</strong> do seu projeto Supabase.</p>
                            <div className="flex gap-2 items-center mb-2">
                                <label className="text-sm text-gray-600">Script:</label>
                                <select value={selectedScript} onChange={(e) => setSelectedScript(e.target.value as any)} className="rounded-md p-1 border border-gray-300">
                                    <option value="setup">Full Setup (RESET SQL)</option>
                                    <option value="erp">Criar Tabelas ERP</option>
                                    <option value="fullsync">Full DB Sync (funções & triggers)</option>
                                        <option value="autocreate">Auto-criar Tabelas ERP (checa e cria)</option>
                                </select>
                                <button onClick={() => { const blob = new Blob([selectedScriptContent], { type: 'text/sql' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${selectedScript}.sql`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }} className="ml-auto bg-gray-700 text-white px-3 py-1 rounded-md text-sm">Baixar Script</button>
                            </div>
                            <div className="relative bg-gray-800 text-white p-4 rounded-md font-mono text-xs max-h-60 overflow-auto">
                                <CopyCodeButton code={selectedScriptContent} />
                                <pre><code>{selectedScriptContent}</code></pre>
                            </div>
                        </div>
                   )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Fechar
                    </button>
                    {!isSynced && (
                        <button onClick={() => { onFinished(); onClose(); }} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <RefreshCw size={16}/> Já executei, verificar novamente
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SyncDatabaseModal;
