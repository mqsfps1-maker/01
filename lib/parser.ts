// lib/parser.ts
import { OrderItem, ProcessedData, Canal, GeneralSettings } from '../types';
import * as XLSX from 'xlsx';
import { getMultiplicadorFromSku } from './sku';
import { classificarCor } from './sku';

// --- Header Mapping & Helper ---
const normalizeHeader = (header: string) => (header || '').toLowerCase().replace(/\s+/g, ' ').replace(/[.ºª]/g, '').trim();

const findHeader = (headerRow: string[], key: string): string | undefined => {
    if (!key) return undefined;
    const normalizedRow = headerRow.map(normalizeHeader);
    const normalizedKey = normalizeHeader(key);
    const found = normalizedRow.find(h => h.includes(normalizedKey));
    if (found) {
        return headerRow[normalizedRow.indexOf(found)];
    }
    return undefined;
};

const pad = (n: number) => String(n).padStart(2, '0');

const excelSerialToDate = (serial: number): Date => {
    // Excel's epoch starts at 1899-12-31, but JS epoch is 1970-01-01. Use standard conversion.
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400; // seconds
    const date_info = new Date(utc_value * 1000);
    // account for fractional day
    const fractionalDay = serial - Math.floor(serial);
    const secondsInDay = Math.round(fractionalDay * 86400);
    date_info.setSeconds(date_info.getSeconds() + secondsInDay);
    return date_info;
};

const parseBrazilianDate = (dateStr: any): string => {
    if (!dateStr && dateStr !== 0) return new Date().toISOString().split('T')[0]; // fallback to today

    // If Excel provided a numeric serial (sometimes happens), convert it
    if (typeof dateStr === 'number' || (/^\d+(?:\.\d+)?$/.test(String(dateStr)) && !String(dateStr).includes('-') && String(dateStr).length < 8)) {
        const serial = Number(dateStr);
        if (!isNaN(serial)) {
            const d = excelSerialToDate(serial);
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        }
    }

    const str = String(dateStr).trim();
    if (!str) return new Date().toISOString().split('T')[0];

    // Handles formats like DD/MM/YYYY HH:mm or DD/MM/YYYY
    const parts = str.split(' ')[0].split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // If already ISO-like (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        const [_, y, m, d] = isoMatch;
        return `${y}-${pad(Number(m))}-${pad(Number(d))}`;
    }

    // Fallback: try to build from Date object but preserve the local date (avoid toISOString shift)
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    return new Date().toISOString().split('T')[0]; // final fallback
};


/**
 * Parses a Mercado Livre sales spreadsheet to extract order items.
 */
export const parseMlSheet = (fileBuffer: ArrayBuffer, settings: GeneralSettings['importer']['ml'], generalSettings: GeneralSettings['importer']): OrderItem[] => {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const startRow = 5;
    
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: startRow, raw: false });
    const headerRowSheet = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, range: startRow });
    const headers = headerRowSheet.length > 0 ? headerRowSheet[0] : [];
    
    const orderIdHeader = findHeader(headers, settings.orderIdHeader);
    const skuHeader = findHeader(headers, settings.skuHeader);
    const qtyHeader = findHeader(headers, settings.qtyHeader);
    const dataHeader = findHeader(headers, settings.dataHeader);
    const customerNameHeader = findHeader(headers, settings.customerNameHeader);
    const customerIdentifierHeader = findHeader(headers, settings.customerIdentifierHeader);
    const trackingHeader = findHeader(headers, settings.trackingHeader);

    if (!orderIdHeader || !skuHeader || !qtyHeader || !dataHeader) {
        throw new Error(`Planilha do ML inválida. Não foram encontradas as colunas configuradas: "${settings.orderIdHeader}", "${settings.skuHeader}", "${settings.qtyHeader}", "${settings.dataHeader}".`);
    }
    
    const orders: OrderItem[] = [];
    let idCounter = 0;

    for (const row of jsonData) {
        const sku = String(row[skuHeader] || '').trim();
        const orderId = String(row[orderIdHeader] || '');
        const quantity = Number(row[qtyHeader] || 1);
        const dataString = String(row[dataHeader] || '');
        
        if (sku && orderId && !isNaN(quantity)) {
             orders.push({
                id: `imported-${Date.now()}-${idCounter++}`,
                orderId: orderId,
                tracking: trackingHeader ? String(row[trackingHeader] || '') : '', 
                sku: sku,
                quantity: quantity,
                data: parseBrazilianDate(dataString),
                status: 'NORMAL',
                canal: 'ML',
                color: classificarCor(sku),
                multiplicador: getMultiplicadorFromSku(sku),
                qty_original: quantity,
                qty_final: quantity * getMultiplicadorFromSku(sku),
                customer_name: generalSettings.extractCustomerName && customerNameHeader ? String(row[customerNameHeader] || '') : undefined,
                customer_cpf_cnpj: generalSettings.extractCustomerIdentifier && customerIdentifierHeader ? String(row[customerIdentifierHeader] || '') : undefined,
            });
        }
    }

    if (orders.length === 0) {
        throw new Error('Nenhum pedido válido foi encontrado na planilha.');
    }

    return orders;
};


/**
 * Parses a Shopee sales spreadsheet to extract order items.
 */
export const parseShopeeSheet = (fileBuffer: ArrayBuffer, settings: GeneralSettings['importer']['shopee'], generalSettings: GeneralSettings['importer']): OrderItem[] => {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    const headerRowSheet = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    const headers = headerRowSheet.length > 0 ? headerRowSheet[0] : [];
    
    const orderIdHeader = findHeader(headers, settings.orderIdHeader);
    const skuHeader = findHeader(headers, settings.skuHeader);
    const qtyHeader = findHeader(headers, settings.qtyHeader);
    const dataHeader = findHeader(headers, settings.dataHeader);
    const shippingDateHeader = findHeader(headers, settings.shippingDateHeader);
    const customerNameHeader = findHeader(headers, settings.customerNameHeader);
    const customerIdentifierHeader = findHeader(headers, settings.customerIdentifierHeader);
    const trackingHeader = findHeader(headers, settings.trackingHeader);

    if (!orderIdHeader || !skuHeader || !qtyHeader || !dataHeader) {
        throw new Error(`Planilha da Shopee inválida. Não foram encontradas as colunas configuradas: "${settings.orderIdHeader}", "${settings.skuHeader}", "${settings.qtyHeader}", "${settings.dataHeader}".`);
    }
    
    const orders: OrderItem[] = [];
    let idCounter = 0;

    for (const row of jsonData) {
        const sku = String(row[skuHeader] || '').trim();
        const orderId = String(row[orderIdHeader] || '').trim();
        const quantity = Number(row[qtyHeader] || 1);
        const dataString = String(row[dataHeader] || '');
        const shippingDateString = shippingDateHeader ? String(row[shippingDateHeader] || '') : '';
        
        if (sku && orderId && !isNaN(quantity)) {
             orders.push({
                id: `imported-${Date.now()}-${idCounter++}`,
                orderId: orderId,
                tracking: trackingHeader ? String(row[trackingHeader] || '') : '', 
                sku: sku,
                quantity: quantity,
                data: parseBrazilianDate(dataString),
                shippingDate: parseBrazilianDate(shippingDateString),
                status: 'NORMAL',
                canal: 'SHOPEE',
                color: classificarCor(sku),
                multiplicador: getMultiplicadorFromSku(sku),
                qty_original: quantity,
                qty_final: quantity * getMultiplicadorFromSku(sku),
                customer_name: generalSettings.extractCustomerName && customerNameHeader ? String(row[customerNameHeader] || '') : undefined,
                customer_cpf_cnpj: generalSettings.extractCustomerIdentifier && customerIdentifierHeader ? String(row[customerIdentifierHeader] || '') : undefined,
            });
        }
    }

    if (orders.length === 0) {
        throw new Error('Nenhum pedido válido foi encontrado na planilha.');
    }

    return orders;
};

export const parseSheetToOrderItems = (
    fileBuffer: ArrayBuffer,
    fileName: string,
    generalSettings: GeneralSettings
): { orders: OrderItem[], canal: Canal } => {
    let parsedOrders: OrderItem[];
    let canal: Canal;
    const lowerFileName = fileName.toLowerCase();
    const importerSettings = generalSettings.importer;

    if (lowerFileName.includes('shopee')) {
        // Filename suggests Shopee, try that first.
        try {
            parsedOrders = parseShopeeSheet(fileBuffer, importerSettings.shopee, importerSettings);
            canal = 'SHOPEE';
        } catch (shopeeError: unknown) {
            // It was named 'shopee' but failed Shopee parsing. Fallback to ML.
            try {
                parsedOrders = parseMlSheet(fileBuffer, importerSettings.ml, importerSettings);
                canal = 'ML';
            } catch (mlError: unknown) {
                // If both fail, the original assumption was probably right and the file is just invalid.
                // Throw the more specific Shopee error.
                if (shopeeError instanceof Error) {
                    throw shopeeError;
                }
                throw new Error(String(shopeeError));
            }
        }
    } else {
        // Default to ML, but try Shopee as a fallback.
        try {
            parsedOrders = parseMlSheet(fileBuffer, importerSettings.ml, importerSettings);
            canal = 'ML';
        } catch (mlError: unknown) {
            // ML parsing failed. It might be a Shopee file with a generic name.
            try {
                parsedOrders = parseShopeeSheet(fileBuffer, importerSettings.shopee, importerSettings);
                canal = 'SHOPEE';
            } catch (shopeeError: unknown) {
                // Both failed. Throw the original ML error as it was the default attempt.
                if (mlError instanceof Error) {
                    throw mlError;
                }
                throw new Error(String(mlError));
            }
        }
    }
    return { orders: parsedOrders, canal };
};


export const parseExcelFile = async (
    fileBuffer: ArrayBuffer, 
    fileName: string, 
    allOrders: OrderItem[],
    generalSettings: GeneralSettings
): Promise<ProcessedData> => {
    
    const { orders: parsedOrders, canal } = parseSheetToOrderItems(fileBuffer, fileName, generalSettings);

    const existingOrdersMap = new Map(allOrders.map(o => [`${o.orderId.toUpperCase()}|${o.sku.toUpperCase()}`, o]));
    
    const ordersToCreate: OrderItem[] = [];
    const ordersToUpdate: OrderItem[] = [];
    let jaSalvosCount = 0;

    for (const parsedOrder of parsedOrders) {
        const key = `${parsedOrder.orderId.toUpperCase()}|${parsedOrder.sku.toUpperCase()}`;
        const existingOrder = existingOrdersMap.get(key);

        if (!existingOrder) {
            ordersToCreate.push(parsedOrder);
        } else {
            jaSalvosCount++;
            // Check if an update is needed (e.g., new tracking number)
            const hasNewTracking = parsedOrder.tracking && !existingOrder.tracking;
            // Add more conditions here if needed, e.g., customer name
            if (hasNewTracking) {
                ordersToUpdate.push(parsedOrder);
            }
        }
    }

    // Use ALL parsedOrders for display lists
    const displayOrders = parsedOrders;

    const resumidaMap = new Map<string, any>();
    displayOrders.forEach(item => {
        const entry = resumidaMap.get(item.sku) || { sku: item.sku, color: item.color, distribution: {}, total_units: 0 };
        const packSize = item.qty_final;
// FIX: The 'distribution' object expects a string key, but 'packSize' is a number. Convert 'packSize' to a string to ensure type safety.
        entry.distribution[String(packSize)] = (entry.distribution[String(packSize)] || 0) + 1;
        entry.total_units += item.qty_final;
        resumidaMap.set(item.sku, entry);
    });

    const totaisPorProdutoMap = new Map<string, any>();
    displayOrders.forEach(item => {
        const label = item.sku; // Before linking, SKU is the best product identifier
        const entry = totaisPorProdutoMap.get(label) || { label: label, distribution: {}, total_units: 0 };
        const packSize = item.qty_final;
// FIX: The 'distribution' object expects a string key, but 'packSize' is a number. Convert 'packSize' to a string to ensure type safety.
        entry.distribution[String(packSize)] = (entry.distribution[String(packSize)] || 0) + 1;
        entry.total_units += item.qty_final;
        totaisPorProdutoMap.set(label, entry);
    });

    const skusNaoVinculados = Array.from(new Set(displayOrders.map(i => i.sku))).map(sku => ({
        sku,
        colorSugerida: classificarCor(sku)
    }));

    return {
        canal,
        lists: {
            completa: displayOrders,
            resumida: Array.from(resumidaMap.values()),
            totaisPorProduto: Array.from(totaisPorProdutoMap.values()),
            listaDeMateriais: [], // Will be calculated later
        },
        summary: {
            totalPedidos: new Set(displayOrders.map(o => o.orderId)).size,
            totalPacotes: displayOrders.length,
            totalUnidades: displayOrders.reduce((sum, item) => sum + item.qty_final, 0),
            totalUnidadesBranca: 0, // Will be calculated later
            totalUnidadesPreta: 0, // Will be calculated later
            totalUnidadesEspecial: 0, // Will be calculated later
        },
        skusNaoVinculados,
        idempotencia: {
            lancaveis: ordersToCreate.length,
            jaSalvos: jaSalvosCount - ordersToUpdate.length,
            atualizaveis: ordersToUpdate.length,
        },
        ordersToCreate: ordersToCreate,
        ordersToUpdate: ordersToUpdate,
    };
};