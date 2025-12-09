import React from 'react';
import { ProductionSummaryData } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProductionSummaryProps {
    olderData: ProductionSummaryData;
    newerData: ProductionSummaryData | null;
    olderTitle: string;
    newerTitle: string | null;
    productTypeName: string;
    miudosTypeName: string;
}

const DiffDisplay: React.FC<{ current: number, previous: number, reverseColors?: boolean }> = ({ current, previous, reverseColors = false }) => {
    if (previous === 0) {
        if (current > 0) return <span className={`font-semibold ${reverseColors ? 'text-red-600' : 'text-green-600'}`}>(Novo)</span>;
        return null;
    }
    const diff = ((current - previous) / previous) * 100;
    if (Math.abs(diff) < 0.1) return <span className="text-[var(--color-text-secondary)] font-semibold">(=)</span>;

    const isPositive = diff > 0;
    const Arrow = isPositive ? TrendingUp : TrendingDown;
    
    let color = 'text-[var(--color-text-secondary)]';
    if (isPositive) color = reverseColors ? 'text-red-600' : 'text-green-600';
    else color = reverseColors ? 'text-green-600' : 'text-red-600';

    return (
        <span className={`flex items-center text-xs gap-1 font-bold ${color}`}>
            <Arrow size={14} />
            {isPositive && '+'}{diff.toFixed(1)}%
        </span>
    );
};

const StatCard: React.FC<{ title: string, value: string | number, comparisonValue?: string | number, comparisonNode?: React.ReactNode }> = ({ title, value, comparisonValue, comparisonNode }) => (
    <div className="bg-[var(--color-surface-secondary)] p-4 rounded-lg flex-1">
        <p className="text-sm text-[var(--color-text-secondary)]">{title}</p>
        <div className="flex items-baseline justify-between gap-2 mt-1">
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</p>
            {comparisonNode}
        </div>
        {comparisonValue !== undefined && <p className="text-xs text-[var(--color-text-secondary)] mt-1">vs. {comparisonValue} (anterior)</p>}
    </div>
);

const DistributionBar: React.FC<{ label: string, value: number, total: number, colorClass: string, comparisonNode?: React.ReactNode }> = ({ label, value, total, colorClass, comparisonNode }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--color-text-secondary)]">{value}</span>
                    {comparisonNode}
                </div>
            </div>
            <div className="w-full bg-[var(--color-surface-tertiary)] rounded-full h-2.5">
                <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}

const ProductionSummary: React.FC<ProductionSummaryProps> = ({ olderData, newerData, olderTitle, newerTitle, productTypeName, miudosTypeName }) => {
    const data = newerData || olderData;
    const compareWith = newerData ? olderData : null;
    const title = newerData ? newerTitle : olderTitle;
    
    // This total is used for the distribution bars, ensuring they are relative to the overall period total, regardless of channel filter.
    const distributionTotal = data.ml.totalUnidades + data.shopee.totalUnidades;
    
    const allMiudosKeys = Array.from(new Set([...Object.keys(data.total.miudos), ...(compareWith ? Object.keys(compareWith.total.miudos) : [])])).sort();

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">{title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <StatCard 
                    title="Total de Unidades Produzidas"
                    value={data.total.totalUnidades}
                    comparisonValue={compareWith?.total.totalUnidades}
                    comparisonNode={compareWith && <DiffDisplay current={data.total.totalUnidades} previous={compareWith.total.totalUnidades} />}
                />
                <StatCard 
                    title="Total de Pedidos"
                    value={data.total.totalPedidos}
                    comparisonValue={compareWith?.total.totalPedidos}
                    comparisonNode={compareWith && <DiffDisplay current={data.total.totalPedidos} previous={compareWith.total.totalPedidos} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
                    <h3 className="font-bold text-[var(--color-text-primary)]">Distribuição por Canal</h3>
                    <DistributionBar 
                        label="Mercado Livre"
                        value={data.ml.totalUnidades}
                        total={distributionTotal}
                        colorClass="bg-[var(--color-ml)]"
                        comparisonNode={compareWith && <DiffDisplay current={data.ml.totalUnidades} previous={compareWith.ml.totalUnidades} />}
                    />
                    <DistributionBar 
                        label="Shopee"
                        value={data.shopee.totalUnidades}
                        total={distributionTotal}
                        colorClass="bg-[var(--color-shopee)]"
                        comparisonNode={compareWith && <DiffDisplay current={data.shopee.totalUnidades} previous={compareWith.shopee.totalUnidades} />}
                    />
                </div>
                <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
                     <h3 className="font-bold text-[var(--color-text-primary)]">Distribuição por Base ({productTypeName})</h3>
                    <DistributionBar 
                        label="Base Branca"
                        value={Math.round(data.total.totalUnidadesBranca)}
                        total={data.total.totalUnidades}
                        colorClass="bg-slate-400"
                        comparisonNode={compareWith && <DiffDisplay current={data.total.totalUnidadesBranca} previous={compareWith.total.totalUnidadesBranca} />}
                    />
                     <DistributionBar 
                        label="Base Preta"
                        value={Math.round(data.total.totalUnidadesPreta)}
                        total={data.total.totalUnidades}
                        colorClass="bg-gray-800"
                        comparisonNode={compareWith && <DiffDisplay current={data.total.totalUnidadesPreta} previous={compareWith.total.totalUnidadesPreta} />}
                    />
                     <DistributionBar 
                        label="Bases Especiais"
                        value={Math.round(data.total.totalUnidadesEspecial)}
                        total={data.total.totalUnidades}
                        colorClass="bg-amber-400"
                        comparisonNode={compareWith && <DiffDisplay current={data.total.totalUnidadesEspecial} previous={compareWith.total.totalUnidadesEspecial} />}
                    />
                </div>
                <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
                     <h3 className="font-bold text-[var(--color-text-primary)] mb-4">{miudosTypeName}</h3>
                     <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {allMiudosKeys.length > 0 ? allMiudosKeys.map(key => {
                            const currentValue = data.total.miudos[key] || 0;
                            const prevValue = compareWith?.total.miudos[key] || 0;
                            return (
                                <div key={key} className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--color-text-secondary)]">{key}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[var(--color-text-primary)]">{currentValue}</span>
                                        {compareWith && <DiffDisplay current={currentValue} previous={prevValue} />}
                                    </div>
                                </div>
                            );
                        }) : <p className="text-sm text-center text-[var(--color-text-secondary)]">Nenhum {miudosTypeName} no período.</p>}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionSummary;