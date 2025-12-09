// lib/estoque.ts
// FIX: Import missing types
import { StockItem, ProdutoCombinado, StockMovement, WeighingBatch, StockMovementOrigin, OrderItem, SkuLink, MaterialItem, ExpeditionSettings, GeneralSettings } from '../types';

/**
 * Calculates the total consumption of a stock item in the last 7 days.
 * @param stockItemCode The code of the item to check.
 * @param movements The list of all stock movements.
 * @returns The total quantity consumed.
 */
export const calculateWeeklyConsumption = (stockItemCode: string, movements: StockMovement[]): number => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const consumption = movements
    .filter(mov =>
        mov.stockItemCode === stockItemCode &&
        (mov.origin === 'BIP' || mov.origin === 'PRODUCAO_MANUAL') &&
        new Date(mov.createdAt) >= sevenDaysAgo &&
        mov.qty_delta < 0
    )
    .reduce((sum, mov) => sum + Math.abs(mov.qty_delta), 0);

    return consumption;
};

export const calculateKitComponents = (
    orders: OrderItem[],
    skuLinks: SkuLink[],
    stockItems: StockItem[],
    produtosCombinados: ProdutoCombinado[]
): MaterialItem[] => {
    const componentUsage = new Map<string, { total: number; orders: Set<string> }>();
    const stockItemMap = new Map<string, StockItem>(stockItems.map(item => [item.code, item]));
    const bomMap = new Map<string, ProdutoCombinado>(produtosCombinados.map(bom => [bom.productSku, bom]));
    const skuLinkMap = new Map<string, string>(skuLinks.map(link => [link.importedSku, link.masterProductSku]));

    orders.forEach(order => {
        const masterSku = skuLinkMap.get(order.sku);
        const masterProduct = masterSku ? stockItemMap.get(masterSku) : undefined;

        if (masterProduct && masterProduct.composition === 'kit') {
            const bom = bomMap.get(masterProduct.code);
            if (bom && Array.isArray(bom.items)) {
                (bom.items as ProdutoCombinado['items']).forEach(bomItem => {
                    const needed = order.qty_final * bomItem.qty_per_pack;
                    const usage = componentUsage.get(bomItem.stockItemCode) || { total: 0, orders: new Set() };
                    usage.total += needed;
                    usage.orders.add(order.orderId);
                    componentUsage.set(bomItem.stockItemCode, usage);
                });
            }
        }
    });

    const materialList: MaterialItem[] = [];
    componentUsage.forEach((usage, code) => {
        const stockItem = stockItemMap.get(code);
        if (stockItem) {
            materialList.push({
                name: stockItem.name,
                quantity: usage.total,
                unit: stockItem.unit,
                salesCount: usage.orders.size,
            });
        }
    });

    return materialList.sort((a, b) => a.name.localeCompare(b.name));
};

// FIX: Add the missing 'calculateMaterialList' function.
export const calculateMaterialList = (
    orders: OrderItem[],
    skuLinks: SkuLink[],
    stockItems: StockItem[],
    produtosCombinados: ProdutoCombinado[],
    expeditionRules: ExpeditionSettings,
    generalSettings: GeneralSettings
): MaterialItem[] => {
    const materialQuantities = new Map<string, number>();
    const stockItemMap = new Map<string, StockItem>(stockItems.map(item => [item.code, item]));
    const bomMap = new Map<string, ProdutoCombinado>(produtosCombinados.map(bom => [bom.productSku, bom]));
    const skuLinkMap = new Map<string, string>(skuLinks.map(link => [link.importedSku, link.masterProductSku]));

    const addMaterial = (code: string, qty: number) => {
        materialQuantities.set(code, (materialQuantities.get(code) || 0) + qty);
    };

    const packagingRules = expeditionRules?.packagingRules || [];
    const miudosPackagingRules = expeditionRules?.miudosPackagingRules || [];

    // Group orders by a unique customer order identifier (orderId or tracking)
    const ordersById = new Map<string, OrderItem[]>();
    orders.forEach(order => {
        const key = order.orderId || order.tracking;
        if (!key) return; // Skip orders without a key
        if (!ordersById.has(key)) ordersById.set(key, []);
        ordersById.get(key)!.push(order);
    });

    // Process each customer order group
    ordersById.forEach(orderGroup => {
        const papelDeParedeItems = orderGroup.filter(order => {
            const masterSku = skuLinkMap.get(order.sku);
            // Heuristic: if it has a base color config, it's a wallpaper-type product
            return masterSku && generalSettings.baseColorConfig[masterSku];
        });

        const miudosItems = orderGroup.filter(order => {
            const masterSku = skuLinkMap.get(order.sku);
            const masterProduct = masterSku ? stockItemMap.get(masterSku) : undefined;
            // It's a "miudo" if it's a product but NOT a wallpaper type
            return masterProduct && !generalSettings.baseColorConfig[masterSku];
        });

        const expeditionItemsForGroup = new Set<string>();

        // Priority 1: Order contains wallpaper -> apply wallpaper packaging rules
        if (papelDeParedeItems.length > 0) {
            const packageCount = papelDeParedeItems.reduce((sum, item) => sum + item.qty_final, 0);
            const packagingRule = packagingRules.find(r => packageCount >= r.from && packageCount <= r.to);
            if (packagingRule) {
                addMaterial(packagingRule.stockItemCode, packagingRule.quantity);
            }
        // Priority 2: Order contains ONLY miudos -> apply miudos packaging rules
        } else if (miudosItems.length > 0) {
            const totalMiudosUnits = miudosItems.reduce((sum, item) => sum + item.qty_final, 0);
            const miudosRule = miudosPackagingRules.find(r => totalMiudosUnits >= r.from && totalMiudosUnits <= r.to);
            if (miudosRule) {
                addMaterial(miudosRule.stockItemCode, miudosRule.quantity);
            }
        }
        
        // Add per-product expedition items and collect their codes to avoid double counting from BOM
        orderGroup.forEach(order => {
            const masterSku = skuLinkMap.get(order.sku);
            const masterProduct = masterSku ? stockItemMap.get(masterSku) : undefined;
            if(masterProduct && masterProduct.expedition_items) {
                masterProduct.expedition_items.forEach(expItem => {
                    addMaterial(expItem.stockItemCode, expItem.qty_per_pack * order.qty_final);
                    expeditionItemsForGroup.add(expItem.stockItemCode);
                });
            }
        });
        
        // This part runs for ALL orders, exploding the BOM for each item
        const explodeBom = (productCode: string, quantity: number) => {
            const bom = bomMap.get(productCode);
            if (!bom) return;
            
            (bom.items as ProdutoCombinado['items']).forEach(bomItem => {
                // If this BOM item is already handled by a per-product expedition rule, skip it.
                if (expeditionItemsForGroup.has(bomItem.stockItemCode)) {
                    return;
                }
                
                const insumo = stockItemMap.get(bomItem.stockItemCode);
                if (!insumo) return;

                const needed = quantity * bomItem.qty_per_pack;
                
                if (insumo.kind === 'PROCESSADO') {
                    explodeBom(insumo.code, needed);
                }
                
                addMaterial(insumo.code, needed);
            });
        };

        orderGroup.forEach(order => {
            const masterSku = skuLinkMap.get(order.sku);
            if (masterSku) {
                explodeBom(masterSku, order.qty_final);
            }
        });
    });

    const materialList: MaterialItem[] = [];
    materialQuantities.forEach((quantity, code) => {
        const stockItem = stockItemMap.get(code);
        if (stockItem) {
            materialList.push({
                name: stockItem.name,
                quantity: quantity,
                unit: stockItem.unit,
            });
        }
    });

    return materialList.sort((a, b) => a.name.localeCompare(b.name));
};