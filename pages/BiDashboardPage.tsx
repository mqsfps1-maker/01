import React, { useState, useMemo } from 'react';
import { BiDataItem, User, Canal } from '../types';
import { BarChart4, Box, Clock, Percent, ShoppingCart, User as UserIcon, Filter, ArrowUp, ArrowDown } from 'lucide-react';

interface BiDashboardPageProps {
    biData: BiDataItem[];
    users: User[];
}

const getPeriodDates = (period: 'today' | 'last7days' | 'thisMonth') => {
    const end = new Date();
    const start = new Date();
    switch (period) {
        case 'today':
            break;
        case 'last7days':
            start.setDate(start.getDate() - 6);
            break;
        case 'thisMonth':
            start.setDate(1);
            break;
    }
    const toISODate = (d: Date) => d.toISOString().split('T')[0];
    return { startDate: toISODate(start), endDate: toISODate(end) };
};

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-[var(--color-surface)] p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
        <div className="flex justify-between items-start">
            <p className="text-md font-medium text-[var(--color-text-secondary)]">{title}</p>
            <div className="p-2 bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary-text-subtle)] rounded-lg">{icon}</div>
        </div>
        <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{value}</p>
    </div>
);

const SimpleBarChart: React.FC<{ title: string; data: { label: string; value: number }[] }> = ({ title, data }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
    return (
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">{title}</h3>
            <div className="space-y-4">
                {data.map(({ label, value }) => (
                    <div key={label}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-[var(--color-text-secondary)]">{label}</span>
                            <span className="font-bold text-[var(--color-text-primary)]">{value}</span>
                        </div>
                        <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-4">
                            <div
                                className="bg-[var(--color-primary)] h-4 rounded-full transition-all duration-500"
                                style={{ width: `${(value / maxValue) * 100}%` }}
                                aria-label={`${label}: ${value}`}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BiDashboardPage: React.FC<BiDashboardPageProps> = ({ biData, users }) => {
    const [filters, setFilters] = useState({
        period: 'last7days' as 'today' | 'last7days' | 'thisMonth' | 'custom',
        startDate: getPeriodDates('last7days').startDate,
        endDate: getPeriodDates('last7days').endDate,
        canal: 'ALL' as Canal,
        operator: 'ALL',
    });
    
    const [sortConfig, setSortConfig] = useState<{ key: keyof BiDataItem, direction: 'asc' | 'desc' }>({ key: 'data_bipagem', direction: 'desc' });

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (key === 'period' && value !== 'custom') {
            const { startDate, endDate } = getPeriodDates(value as any);
            newFilters.startDate = startDate;
            newFilters.endDate = endDate;
        }
        setFilters(newFilters);
    };
    
    const filteredData = useMemo(() => {
        const start = new Date(`${filters.startDate}T00:00:00Z`);
        const end = new Date(`${filters.endDate}T23:59:59Z`);

        return biData
            .filter(item => {
                if (filters.canal !== 'ALL' && item.canal !== filters.canal) return false;
                if (filters.operator !== 'ALL' && item.bipado_por !== filters.operator) return false;

                const itemDate = new Date(item.data_pedido + "T12:00:00Z");
                if (isNaN(itemDate.getTime())) return false;
                
                return itemDate >= start && itemDate <= end;
            })
            .sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
    }, [biData, filters, sortConfig]);

    const kpis = useMemo(() => {
        const bipados = filteredData.filter(d => d.data_bipagem);
        const totalBipados = bipados.length;
        
        const totalTempo = bipados.reduce((sum, item) => sum + (item.tempo_separacao_horas || 0), 0);
        const tempoMedio = totalBipados > 0 ? (totalTempo / totalBipados).toFixed(1) : '0';

        const atrasados = bipados.filter(d => d.status_derivado === 'Bipado com Atraso').length;
        const taxaAtraso = totalBipados > 0 ? ((atrasados / totalBipados) * 100).toFixed(1) : '0';

        const totalUnidades = filteredData.reduce((sum, item) => sum + item.quantidade_final, 0);

        return { totalBipados, tempoMedio, taxaAtraso, totalUnidades };
    }, [filteredData]);

    const pedidosPorCanal = useMemo(() => {
        const counts: Record<string, number> = { 'ML': 0, 'SHOPEE': 0, 'SITE': 0 };
        filteredData.forEach(item => {
            if (counts[item.canal] !== undefined) {
                counts[item.canal]++;
            }
        });
        return Object.entries(counts).map(([label, value]) => ({ label, value }));
    }, [filteredData]);

    const desempenhoOperador = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredData.forEach(item => {
            if (item.bipado_por) {
                counts[item.bipado_por] = (counts[item.bipado_por] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
    }, [filteredData]);
    
    const requestSort = (key: keyof BiDataItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ label: string, sortKey: keyof BiDataItem }> = ({ label, sortKey }) => {
        const isSorted = sortConfig.key === sortKey;
        const Icon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
        return <th className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">
            <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1">{label}{isSorted && <Icon size={14}/>}</button>
        </th>;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3"><BarChart4 size={32}/> BI Dashboard</h1>
            
            <div className="flex flex-wrap gap-4 items-center p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm">
                <Filter size={18} className="text-[var(--color-text-secondary)]"/>
                <select value={filters.period} onChange={e => handleFilterChange('period', e.target.value)} className="p-2 text-sm border rounded-md">
                    <option value="last7days">Últimos 7 dias</option>
                    <option value="thisMonth">Este Mês</option>
                    <option value="today">Hoje</option>
                    <option value="custom">Customizado</option>
                </select>
                {filters.period === 'custom' && (<>
                    <input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} className="p-2 text-sm border rounded-md" />
                    <input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} className="p-2 text-sm border rounded-md" />
                </>)}
                <select value={filters.canal} onChange={e => handleFilterChange('canal', e.target.value)} className="p-2 text-sm border rounded-md"><option value="ALL">Todos Canais</option><option value="ML">ML</option><option value="SHOPEE">Shopee</option><option value="SITE">Site</option></select>
                <select value={filters.operator} onChange={e => handleFilterChange('operator', e.target.value)} className="p-2 text-sm border rounded-md"><option value="ALL">Todos Operadores</option>{users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Pedidos Bipados" value={kpis.totalBipados.toString()} icon={<ShoppingCart size={20}/>} />
                <KpiCard title="Tempo Médio de Separação" value={`${kpis.tempoMedio} h`} icon={<Clock size={20}/>} />
                <KpiCard title="Taxa de Atraso" value={`${kpis.taxaAtraso} %`} icon={<Percent size={20}/>} />
                <KpiCard title="Total de Unidades" value={kpis.totalUnidades.toString()} icon={<Box size={20}/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleBarChart title="Pedidos por Canal" data={pedidosPorCanal} />
                <SimpleBarChart title="Desempenho por Operador" data={desempenhoOperador} />
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Dados Detalhados</h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] max-h-[500px]">
                    <table className="min-w-full text-sm">
                        <thead className="bg-[var(--color-surface-secondary)] sticky top-0">
                            <tr>
                                <SortableHeader label="Pedido" sortKey="codigo_pedido" />
                                <SortableHeader label="Data Pedido" sortKey="data_pedido" />
                                <SortableHeader label="Canal" sortKey="canal" />
                                <SortableHeader label="Operador" sortKey="bipado_por" />
                                <SortableHeader label="SKU" sortKey="sku_mestre" />
                                <th className="py-2 px-3 text-left font-semibold text-[var(--color-text-secondary)]">Qtd</th>
                                <SortableHeader label="Status" sortKey="status_derivado" />
                                <SortableHeader label="T. Separação (h)" sortKey="tempo_separacao_horas" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredData.map(item => (
                                <tr key={item.id_pedido} className="hover:bg-[var(--color-surface-secondary)]">
                                    <td className="py-2 px-3 font-mono">{item.codigo_pedido}</td>
                                    <td className="py-2 px-3">{item.data_pedido}</td>
                                    <td className="py-2 px-3">{item.canal}</td>
                                    <td className="py-2 px-3">{item.bipado_por || '-'}</td>
                                    <td className="py-2 px-3">{item.sku_mestre}</td>
                                    <td className="py-2 px-3 text-center">{item.quantidade_final}</td>
                                    <td className="py-2 px-3">{item.status_derivado}</td>
                                    <td className="py-2 px-3 text-center">{item.tempo_separacao_horas?.toFixed(1) || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BiDashboardPage;
