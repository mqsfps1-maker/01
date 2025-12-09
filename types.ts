
import React from 'react';

export type Page = 'dashboard' | 'importer' | 'etiquetas' | 'pedidos' | 'bipagem' | 'produtos' | 'clientes' | 'ajuda' | 'assinatura' | 'configuracoes' | 'perfil' | 'planejamento' | 'compras' | 'admin-metrics' | 'configuracoes-gerais' | 'equipe' | 'bi-dashboard' | 'estoque';

export type Canal = 'ML' | 'SHOPEE' | 'SITE' | 'ALL';
export type UserRole = 'DONO_SAAS' | 'CLIENTE_GERENTE' | 'FUNCIONARIO';
export type UserSetor = 'ADMINISTRATIVO' | 'EMBALAGEM' | 'PESAGEM' | 'PRODUÇÃO' | 'EXPEDIÇÃO' | 'MOAGEM' | string;

export interface UiSettings {
    baseTheme: 'light' | 'dark' | 'system';
    fontFamily: string;
    accentColor: 'indigo' | 'emerald' | 'fuchsia' | 'orange' | 'slate' | 'custom';
    customAccentColor?: string;
    fontSize: number;
    soundOnSuccess: boolean;
    soundOnDuplicate: boolean;
    soundOnError: boolean;
}

export interface Plan {
    id?: string;
    name: string;
    price?: number;
    max_users?: number;
    label_limit?: number; // máximo de etiquetas por mês para o plano
    product_limit?: number; // limite de produtos para o plano
    [key: string]: any;
}

export interface Subscription {
    id?: string;
    organization_id?: string;
    status?: 'trialing' | 'active' | 'canceled' | string;
    plan?: Plan;
    period_end?: string;
    monthly_label_count?: number; // contador do mês atual
    bonus_balance?: number; // saldo de etiquetas bônus disponíveis
    last_activity_date?: string | null; // ISO date da última atividade/login
    consecutive_days_count?: number; // contador de dias consecutivos
    [key: string]: any;
}

export interface AttendanceRecord {
    date: string;
    status: 'PRESENT' | 'ABSENT';
    hasDoctorsNote?: boolean;
    doctorsNoteFile?: any;
    leftEarly?: string;
    overtime?: string;
}

export interface User {
    id: string;
    name: string;
    email?: string;
    password?: string;
    role: UserRole;
    setor: UserSetor[];
    avatar?: string;
    ui_settings?: UiSettings;
    organization_id?: string;
    cpfCnpj?: string;
    phone?: string;
    prefix?: string;
    attendance: AttendanceRecord[];
    has_set_password?: boolean;
    created_at?: string;
}

export interface Device {
    id: string;
    name: string;
}

export interface Customer {
    id: string;
    name: string;
    cpfCnpj: string;
    orderHistory: string[];
}

export type OrderStatusValue = 'NORMAL' | 'BIPADO' | 'ERRO' | 'SOLUCIONADO';

export interface OrderItem {
    id: string;
    orderId: string;
    tracking: string;
    sku: string;
    quantity: number;
    qty_original: number;
    multiplicador: number;
    qty_final: number;
    data: string;
    shippingDate?: string;
    status: OrderStatusValue;
    canal: Canal;
    color: string;
    customer_name?: string;
    customer_cpf_cnpj?: string;
}

export type StockItemKind = 'INSUMO' | 'PRODUTO' | 'PROCESSADO';

export interface SkuLink {
    importedSku: string;
    masterProductSku: string;
    multiplier: number;
}

export interface StockItem {
    id: string;
    code: string;
    name: string;
    kind: StockItemKind;
    unit: 'kg' | 'un' | 'm' | 'L';
    current_qty: number;
    min_qty: number;
    category?: string;
    color?: string;
    product_type?: string;
    composition?: 'simple' | 'kit';
    linkedSkus?: { sku: string; multiplier: number }[];
    expedition_items?: { stockItemCode: string; qty_per_pack: number }[];
    substitute_product_code?: string;
}

export interface ProdutoCombinado {
    productSku: string;
    items: {
        stockItemCode: string;
        qty_per_pack: number;
        fromWeighing?: boolean;
        substituteCode?: string;
    }[];
}

export type StockMovementOrigin = 'BIP' | 'AJUSTE_MANUAL' | 'IMPORT_XML' | 'IMPORT_PLANILHA' | 'PESAGEM' | 'CANCELAMENTO_BIP' | 'PRODUCAO_MANUAL' | 'PRODUCAO_INTERNA' | 'INVENTARIO_PLANILHA';

export interface StockMovement {
    id: string;
    stockItemCode: string;
    stockItemName: string;
    origin: StockMovementOrigin;
    qty_delta: number;
    ref: string;
    createdAt: Date;
    createdBy?: string;
    fromWeighing?: boolean;
    productSku?: string;
}

export type WeighingType = 'daily' | 'hourly';

export interface WeighingBatch {
    id: string;
    stockItemCode: string;
    stockItemName: string;
    initialQty: number;
    usedQty: number;
    createdAt: Date;
    userId: string;
    createdBy: string;
    weighingType: WeighingType;
}

export interface GrindingBatch {
    id: string;
    createdAt: Date;
    sourceInsumoName: string;
    sourceQtyUsed: number;
    outputInsumoName: string;
    outputQtyProduced: number;
    userName: string;
    userId?: string;
    mode: 'manual' | 'automatico';
}

export interface ScanLogItem {
    id: string;
    time: Date;
    user: string;
    userId: string;
    device: string;
    displayKey: string;
    status: 'OK' | 'DUPLICATE' | 'NOT_FOUND' | 'ADJUSTED' | 'CANCELLED';
    synced: boolean;
    canal?: Canal;
}

export interface ScanResult {
    status: 'OK' | 'DUPLICATE' | 'NOT_FOUND' | 'ERROR';
    message?: string;
    input_code: string;
    display_key: string;
    synced_with_list: boolean;
    channel?: Canal;
    order_key?: string;
    sku_key?: string;
    tracking_number?: string;
    first_scan?: {
        by: string;
        at: string;
        device: string;
    };
    user?: {
        name: string;
        device: string;
    };
    scan?: {
        id: string;
        at: string;
    };
}

export interface ImportHistoryItem {
    id: string;
    fileName: string;
    processedAt: string;
    user: string;
    itemCount: number;
    unlinkedCount: number;
    canal: Canal;
    processedData: ProcessedData;
}

export interface ResumidaItem {
    sku: string;
    color: string;
    distribution: { [packSize: string]: number };
    total_units: number;
}

export interface TotaisPorProdutoItem {
    label: string;
    distribution: { [packSize: string]: number };
    total_units: number;
}

export interface MaterialItem {
    name: string;
    quantity: number;
    unit: string;
    salesCount?: number;
}

export interface ProcessedData {
    canal: Canal;
    lists: {
        completa: OrderItem[];
        resumida: ResumidaItem[];
        totaisPorProduto: TotaisPorProdutoItem[];
        listaDeMateriais: MaterialItem[];
    };
    summary: {
        totalPedidos: number;
        totalPacotes: number;
        totalUnidades: number;
        totalUnidadesBranca: number;
        totalUnidadesPreta: number;
        totalUnidadesEspecial: number;
    };
    skusNaoVinculados: { sku: string; colorSugerida: string }[];
    idempotencia: {
        lancaveis: number;
        jaSalvos: number;
        atualizaveis: number;
    };
    ordersToCreate: OrderItem[];
    ordersToUpdate: OrderItem[];
}

export interface ExpeditionRule {
    id: string;
    from: number;
    to: number;
    stockItemCode: string;
    quantity: number;
    labelOverride?: string; // Texto opcional para exibir entre parênteses na UI
    productType?: string; // opcional: qual tipo de produto esta regra se aplica
}

export interface ExpeditionSettings {
    packagingRules: ExpeditionRule[];
    miudosPackagingRules: ExpeditionRule[];
}

export interface DashboardWidgetConfig {
    showProductionSummary: boolean;
    showMaterialDeductions: boolean;
    showStatCards: boolean;
    showActionCards: boolean;
    showRecentActivity: boolean;
    showSystemAlerts: boolean;
}

export type ProductionGroup = 'group1' | 'group2' | 'group3';

export interface GeneralSettings {
    companyName: string;
    appIcon: string;
    setorList: UserSetor[];
    productCategoryList: string[];
    pedidos: {
        displayCustomerIdentifier: boolean;
        errorReasons: string[];
        resolutionTypes: string[];
    };
    etiquetas: {
        labelaryApiUrl: string;
        renderChunkSize: number;
    };
    bipagem: {
        enableBipagem: boolean;
        scanSuffix: string;
        defaultOperatorId: string | null;
    };
    importer: {
        extractCustomerName: boolean;
        extractCustomerIdentifier: boolean;
        ml: {
            orderIdHeader: string;
            skuHeader: string;
            qtyHeader: string;
            customerNameHeader: string;
            customerIdentifierHeader: string;
            dataHeader: string;
            trackingHeader: string;
        };
        shopee: {
            orderIdHeader: string;
            skuHeader: string;
            qtyHeader: string;
            customerNameHeader: string;
            customerIdentifierHeader: string;
            dataHeader: string;
            shippingDateHeader: string;
            trackingHeader: string;
        };
    };
    estoque: {
        stockProjectionDays: number;
        purchaseSuggestionMultiplier: number;
    };
    expeditionRules: ExpeditionSettings;
    dashboard: DashboardWidgetConfig;
    productTypeNames: {
        papel_de_parede: string;
        miudos: string;
    };
    categoryBaseMapping: { [category: string]: ProductionGroup };
    categoryColorMapping: { [category: string]: string };
    baseColorConfig: { [productCode: string]: { type: 'branca' | 'preta' | 'especial'; specialBaseSku?: string } };
    productCategories: { [productCode: string]: string };
}

export interface ZplPlatformSettings {
    imageAreaPercentage_even: number;
    footer: {
        positionPreset: 'below' | 'above' | 'custom';
        x_position_mm: number;
        y_position_mm: number;
        spacing_mm: number;
        fontSize_pt: number;
        fontFamily: 'helvetica' | 'times' | 'courier';
        textAlign: 'left' | 'center' | 'right';
        multiColumn: boolean;
        lineSpacing_pt: number;
        template: string;
    };
}

export interface ZplSettings {
    pageWidth: number;
    pageHeight: number;
    pairLayout: 'vertical' | 'horizontal';
    dpi: 'Auto' | '203' | '300';
    sourcePageScale_percent: number;
    combineMultiPageDanfe: boolean;
    regex: {
        sku: string;
        quantity: string;
        orderId: string;
    };
    mercadoLivre: ZplPlatformSettings;
    shopee: ZplPlatformSettings;
}

export const defaultZplSettings: ZplSettings = {
    pageWidth: 100,
    pageHeight: 150,
    pairLayout: 'vertical',
    dpi: 'Auto',
    sourcePageScale_percent: 100,
    combineMultiPageDanfe: true,
    regex: {
        sku: 'SKU:\\s*([^\\n]+)',
        quantity: 'Qtde:\\s*(\\d+)',
        orderId: 'Pedido:\\s*([^\\n]+)',
    },
    mercadoLivre: {
        imageAreaPercentage_even: 80,
        footer: {
            positionPreset: 'below',
            x_position_mm: 2,
            y_position_mm: 0,
            spacing_mm: 2,
            fontSize_pt: 10,
            fontFamily: 'helvetica',
            textAlign: 'left',
            multiColumn: false,
            lineSpacing_pt: 12,
            template: 'SKU: {sku} - {name} (x{qty})'
        }
    },
    shopee: {
        imageAreaPercentage_even: 80,
        footer: {
            positionPreset: 'below',
            x_position_mm: 2,
            y_position_mm: 0,
            spacing_mm: 2,
            fontSize_pt: 10,
            fontFamily: 'helvetica',
            textAlign: 'left',
            multiColumn: false,
            lineSpacing_pt: 12,
            template: 'SKU: {sku} - {name} (x{qty})'
        }
    }
};

export const defaultGeneralSettings: GeneralSettings = {
    companyName: 'TagsFlow',
    appIcon: 'Tags',
    setorList: ['ADMINISTRATIVO', 'EMBALAGEM', 'PESAGEM', 'PRODUÇÃO', 'EXPEDIÇÃO'],
    productCategoryList: ['Papel de Parede', 'Ferramentas', 'Brindes'],
    pedidos: {
        displayCustomerIdentifier: false,
        errorReasons: ['ENDERECO_INCORRETO', 'FALTA_ESTOQUE', 'DEFEITO_PRODUTO', 'CLIENTE_CANCELOU'],
        resolutionTypes: ['REEMBOLSO_TOTAL', 'ENVIO_NOVO_PRODUTO', 'REEMBOLSO_PARCIAL']
    },
    etiquetas: {
        labelaryApiUrl: 'https://api.labelary.com/v1/printers/{dpmm}dpmm/labels/{width}x{height}/0/',
        renderChunkSize: 3
    },
    bipagem: {
        enableBipagem: true,
        scanSuffix: '',
        defaultOperatorId: null,
    },
    importer: {
        extractCustomerName: true,
        extractCustomerIdentifier: true,
        ml: {
            orderIdHeader: 'N.º de venda',
            skuHeader: 'SKU',
            qtyHeader: 'Unidades',
            customerNameHeader: 'Nome e sobrenome do comprador',
            customerIdentifierHeader: 'Número de documento do comprador',
            dataHeader: 'Data da venda',
            trackingHeader: 'Código de rastreamento',
        },
        shopee: {
            orderIdHeader: 'ID do pedido',
            skuHeader: 'Número de referência SKU',
            qtyHeader: 'Quantidade',
            customerNameHeader: 'Nome do Destinatário',
            customerIdentifierHeader: 'CPF/CNPJ do Comprador',
            dataHeader: 'Data de criação do pedido',
            shippingDateHeader: 'Data prevista de envio',
            trackingHeader: 'Número de rastreamento',
        }
    },
    estoque: {
        stockProjectionDays: 7,
        purchaseSuggestionMultiplier: 1.2,
    },
    expeditionRules: {
        packagingRules: [],
        miudosPackagingRules: [],
    },
    dashboard: {
        showProductionSummary: true,
        showMaterialDeductions: true,
        showStatCards: true,
        showActionCards: true,
        showRecentActivity: true,
        showSystemAlerts: true,
    },
    productTypeNames: {
        papel_de_parede: 'Papel de Parede',
        miudos: 'Miúdos',
    },
    categoryBaseMapping: {
        'Papel de Parede': 'group1'
    },
    categoryColorMapping: {
        'Papel de Parede': '#A8D8EA'
    },
    baseColorConfig: {},
    productCategories: {},
};

export interface ExtractedZplData {
    orderId?: string;
    skus: { sku: string; qty: number }[];
    hasDanfe?: boolean;
    isMercadoLivre?: boolean;
    containsDanfeInLabel?: boolean;
}

export interface EtiquetaHistoryItem {
    id: string;
    created_at: string;
    created_by_name: string;
    page_count: number;
    zpl_content: string;
    settings_snapshot: ZplSettings;
    page_hashes: string[];
}

export interface EtiquetasState {
    zplInput: string;
    includeDanfe: boolean;
    zplPages: string[];
    previews: string[];
    extractedData: Map<number, ExtractedZplData>;
}

export interface LabelProcessingStatus {
    isActive: boolean;
    progress: number;
    current: number;
    total: number;
    message: string;
    isFinished: boolean;
}

export interface DashboardFilters {
    period: Period | 'custom';
    canal: Canal;
    startDate?: string;
    endDate?: string;
    compare: boolean;
    compareStartDate?: string;
    compareEndDate?: string;
}

export type Period = 'today' | 'last7days' | 'thisMonth';

export interface StatCardData {
    title: string;
    value: string | number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    changeLabel: string;
}

export interface ActionCardData {
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBgColor: string;
    page: Page;
}

export enum ActivityType {
    OrderScanned = 'ORDER_SCANNED',
    StockUpdated = 'STOCK_UPDATED',
    StockAlert = 'STOCK_ALERT',
}

export interface ActivityItemData {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    time: string;
}

export enum AlertLevel {
    Info = 'INFO',
    Warning = 'WARNING',
    Danger = 'DANGER',
}

export interface AlertItemData {
    id: string;
    level: AlertLevel;
    title: string;
    description: string;
    icon: React.ReactNode;
}

export interface AppState {
    users: User[];
    stockItems: StockItem[];
    stockMovements: StockMovement[];
    boms: ProdutoCombinado[];
    weighingBatches: WeighingBatch[];
    allOrders: OrderItem[];
    returns: ReturnItem[];
    scanHistory: ScanLogItem[];
    skuLinks: SkuLink[];
}

export interface ParsedNfeItem {
    code: string;
    name: string;
    quantity: number;
    unit: 'kg' | 'un' | 'm' | 'L';
}

export interface ReturnItem {
    id: string;
    tracking: string;
    customerName: string;
    loggedBy: string;
    loggedById: string;
    loggedAt: Date;
}

export interface ProductionPlanItem {
    product: StockItem;
    avgDailySales: number;
    forecastedDemand: number;
    requiredProduction: number;
    reason: string;
    substitute?: StockItem;
}

export interface PlanningParameters {
    analysisPeriodValue: number;
    analysisPeriodUnit: 'days' | 'months';
    forecastPeriodDays: number;
    safetyStockDays: number;
    promotionMultiplier: number;
    defaultLeadTimeDays: number;
    historicalSpikeDays: { date: string; name: string; channel: 'Geral' | 'ML' | 'SHOPEE' }[];
}

export interface ProductionPlan {
    id: string;
    name: string;
    status: 'Draft' | 'Active' | 'Completed';
    parameters: PlanningParameters;
    items: {
        product_sku: string;
        product_name: string;
        current_stock: number;
        avg_daily_consumption: number;
        forecasted_demand: number;
        required_production: number;
    }[];
    createdAt: string;
    createdBy: string;
    planDate: string;
}

export interface RequiredInsumo {
    insumo: StockItem;
    requiredQty: number;
    currentStock: number;
    deficit: number;
    leadTime: number;
    purchaseBy: Date;
}

export interface ShoppingListItem {
    id: string; // code
    name: string;
    quantity: number;
    unit: string;
    isPurchased?: boolean;
}

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface OrderProduct {
    product: StockItem;
    quantity: number;
}

export type BipStatus = 'OK' | 'DUPLICATE' | 'NOT_FOUND' | 'ADJUSTED' | 'CANCELLED';

export interface ProductBaseConfig {
    type: 'branca' | 'preta' | 'especial';
    specialBaseSku?: string;
}

export interface ProductionSummaryData {
    total: {
        totalUnidades: number;
        totalPedidos: number;
        totalUnidadesBranca: number;
        totalUnidadesPreta: number;
        totalUnidadesEspecial: number;
        miudos: { [key: string]: number };
    };
    ml: {
        totalUnidades: number;
        totalPedidos: number;
    };
    shopee: {
        totalUnidades: number;
        totalPedidos: number;
    };
}

export interface AdminNotice {
    id: string;
    text: string;
    level: 'green' | 'yellow' | 'red';
    type: 'post-it' | 'banner';
    createdAt: string;
    createdBy: string;
}

export interface BiDataItem {
    id_pedido: string;
    codigo_pedido: string;
    data_pedido: string;
    canal: Canal;
    bipado_por: string;
    sku_mestre: string;
    quantidade_final: number;
    status_derivado: string;
    tempo_separacao_horas: number | null;
    data_bipagem?: string;
}

export interface LocalProduct {
    code: string;
    name: string;
    multiplier: number;
}

export interface ReportFilters {
    period: ReportPeriod | 'custom';
    startDate: string;
    endDate: string;
    search: string;
    canal: Canal | 'ALL';
    status: string;
    insumoCode: string;
    operatorId: string;
    stockKindFilter: string;
    orderStatusFilter: string;
}

export type ReportPeriod = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'custom';
