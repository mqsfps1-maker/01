
// FIX: Import missing type
import { ExtractedZplData, ZplSettings, OrderItem, GeneralSettings } from '../types';
import { getMultiplicadorFromSku } from '../lib/sku';
import { splitZpl, filterAndPairZplPages, simpleHash } from '../utils/zplUtils';
import { renderZpl } from './pdfGenerator';


/**
 * Extracts SKU and Quantity from a single ZPL label.
 * It first tries a specific logic for "SKU - Desc - Qty UN" format.
 * If that fails, it falls back to using the RegEx patterns from settings.
 * @param zplPage The ZPL string for a single label.
 * @param patterns The regex patterns from user settings.
 * @returns An object with extracted data.
 */
export const extractFields = async (zplPage: string, patterns: ZplSettings['regex']): Promise<ExtractedZplData> => {
    const skus: { sku: string; qty: number }[] = [];
    let orderId: string | undefined;

    // This logic is based on user feedback for a specific format:
    // ^FD...SKU - Description - Qty UN...^FS
    const lines = zplPage.split(/\^FS|\^XZ/);
    const itemLineRegex = /\^FD.*UN/i;

    for (const line of lines) {
        if (itemLineRegex.test(line)) {
            // Extract content after ^FD
            const fdIndex = line.toUpperCase().indexOf('^FD');
            if (fdIndex === -1) continue;
            const data = line.substring(fdIndex + 3);

            const parts = data.split(' - ');

            if (parts.length >= 2) {
                const rawSku = parts[0].trim().replace(/\\5f/gi, '_');
                const lastPart = parts[parts.length - 1];
                const qtyMatch = lastPart.match(/([\d,]+)\s*UN/i);

                if (rawSku && qtyMatch && qtyMatch[1]) {
                    const qtyString = qtyMatch[1].replace(',', '.');
                    const qty = parseFloat(qtyString);
                    if (!isNaN(qty)) {
                        skus.push({ sku: rawSku, qty });
                    }
                }
            }
        }
    }

    // Fallback to original regex logic from settings if the new specific pattern finds nothing.
    if (skus.length === 0) {
        try {
            const skuMatches = [...zplPage.matchAll(new RegExp(patterns.sku, 'gi'))];
            const qtyMatches = [...zplPage.matchAll(new RegExp(patterns.quantity, 'gi'))];
            const count = Math.min(skuMatches.length, qtyMatches.length);
    
            for (let i = 0; i < count; i++) {
                const sku = skuMatches[i][1];
                const qty = parseInt(qtyMatches[i][1], 10);
                if (sku && !isNaN(qty)) {
                    skus.push({ sku, qty });
                }
            }
        } catch (e) {
            console.error("Error applying fallback RegEx for extraction:", e);
            // Don't crash the app if regex is invalid
        }
    }

    // Extract Order ID using its specific regex
    try {
        const orderIdMatch = zplPage.match(new RegExp(patterns.orderId, 'i'));
        if (orderIdMatch && orderIdMatch[1]) {
            orderId = orderIdMatch[1].trim();
        }
    } catch (e) {
        console.error("Error applying Order ID RegEx:", e);
    }


    return { orderId, skus };
};


export async function* processZplStream(
    zplInput: string,
    settings: ZplSettings,
    generalSettings: GeneralSettings,
    allOrders: OrderItem[],
    processingMode: 'completo' | 'rapido',
    printedPageHashes: Set<string>
) {
    try {
        if (!zplInput.trim()) {
            yield { type: 'error', message: 'Nenhum código ZPL para processar.' };
            return;
        }

        yield { type: 'progress', message: 'Analisando ZPL...', current: 0, total: 100 };
        const rawPages = splitZpl(zplInput);
        const { pairedZpl, extractedData } = await filterAndPairZplPages(rawPages, settings.regex, allOrders);
        
        const warnings: string[] = [];
        const hasMlWithoutProperDanfe = Array.from(extractedData.values()).some(
            data => data.isMercadoLivre && !data.hasDanfe && !data.containsDanfeInLabel
        );
        if (hasMlWithoutProperDanfe) {
            warnings.push('Aviso: Foram detectadas etiquetas do Mercado Livre sem DANFE. A opção "Incluir DANFE" foi desmarcada automaticamente.');
        }

        const unlinkedMlLabels = Array.from(extractedData.values()).filter(
            data => data.isMercadoLivre && data.skus.length === 0
        );
        if (unlinkedMlLabels.length > 0 && extractedData.size > 0) {
             warnings.push(`Aviso: ${unlinkedMlLabels.length} etiqueta(s) do Mercado Livre não foram vinculadas a um pedido existente. As informações de SKU não serão exibidas no rodapé. Por favor, importe um relatório de vendas mais recente na tela de Importação.`);
        }

        const printedStatus = pairedZpl.map(pageZpl => printedPageHashes.has(simpleHash(pageZpl)));

        yield { type: 'start', zplPages: pairedZpl, extractedData, warnings, hasMlWithoutDanfe: hasMlWithoutProperDanfe, printedStatus };
        
        yield { type: 'progress', message: 'Renderizando pré-visualizações...', current: 0, total: pairedZpl.length };

        // Implementação de CHUNKS (Lotes) para maior velocidade
        const CHUNK_SIZE = 3; 
        
        for (let i = 0; i < pairedZpl.length; i += CHUNK_SIZE) {
            const chunk = pairedZpl.slice(i, i + CHUNK_SIZE);
            
            const promises = chunk.map(async (zpl, chunkIndex) => {
                const globalIndex = i + chunkIndex;
                const isDanfePage = globalIndex % 2 === 0;

                if (processingMode === 'rapido' && isDanfePage) {
                    return { index: globalIndex, preview: 'SKIPPED' };
                }

                try {
                    const preview = await renderZpl(zpl, settings, generalSettings);
                    return { index: globalIndex, preview };
                } catch (error) {
                    console.error(`Falha ao renderizar página ${globalIndex + 1}:`, error);
                    return { index: globalIndex, preview: 'ERROR' };
                }
            });

            const results = await Promise.all(promises);

            for (const result of results) {
                yield { type: 'preview', index: result.index, preview: result.preview };
            }

            // Pequeno delay entre chunks para evitar 429
            if (i + CHUNK_SIZE < pairedZpl.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            yield { 
                type: 'progress', 
                message: `Renderizando... (${Math.min(i + CHUNK_SIZE, pairedZpl.length)}/${pairedZpl.length})`, 
                current: Math.min(i + CHUNK_SIZE, pairedZpl.length), 
                total: pairedZpl.length 
            };
        }

        yield { type: 'done' };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido durante o processamento.';
        yield { type: 'error', message };
    }
}
