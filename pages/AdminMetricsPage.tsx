// pages/AdminMetricsPage.tsx
import React, { useMemo } from 'react';
import { User, OrderItem } from '../types';
import { DollarSign, Building2, Users, ShoppingCart } from 'lucide-react';

interface AdminMetricsPageProps {
    users: User[];
    organizations: any[];
    allOrders: OrderItem[];
    plans: any[];
    allSubscriptions: any[];
}

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
        <div className="flex justify-between items-start">
            <p className="text-md font-medium text-[var(--color-text-secondary)]">{title}</p>
            <div className="p-2 bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary-text-subtle)] rounded-lg">{icon}</div>
        </div>
        <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{value}</p>
    </div>
);

const SimpleBarChart: React.FC<{ title: string; data: { label: string; value: number }[] }> = ({ title, data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">{title}</h3>
            <div className="space-y-4">
                {data.length > 0 ? data.map(({ label, value }) => (
                    <div key={label}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-[var(--color-text-secondary)]">{label}</span>
                            <span className="font-bold text-[var(--color-text-primary)]">{value}</span>
                        </div>
                        <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-4">
                            <div className="bg-[var(--color-primary)] h-4 rounded-full" style={{ width: `${(value / maxValue) * 100}%` }}></div>
                        </div>
                    </div>
                )) : <p className="text-sm text-center text-[var(--color-text-secondary)] py-8">Nenhum dado para exibir.</p>}
            </div>
        </div>
    );
};


const AdminMetricsPage: React.FC<AdminMetricsPageProps> = ({ users, organizations, allOrders, plans, allSubscriptions }) => {

    const kpis = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const ordersToday = allOrders.filter(o => o.data === today).length;
        
        const totalRevenue = allSubscriptions
            .filter((s: any) => s.status === 'active' || s.status === 'trialing')
            .reduce((sum: number, sub: any) => {
                const plan = plans.find(p => p.id === sub.plan_id);
                return sum + (plan?.price || 0);
            }, 0);

        return {
            totalRevenue: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            activeCompanies: organizations.length,
            totalUsers: users.length,
            ordersToday,
        };
    }, [users, organizations, allOrders, plans, allSubscriptions]);
    
    const planDistribution = useMemo(() => {
        if (!plans.length || !organizations.length) return [];
        
        const planCounts = new Map<number, number>();
        organizations.forEach(org => {
            if (org.plan_id) {
                planCounts.set(org.plan_id, (planCounts.get(org.plan_id) || 0) + 1);
            }
        });
        
        return plans.map(plan => ({
            label: plan.name,
            value: planCounts.get(plan.id) || 0
        })).filter(p => p.value > 0);

    }, [organizations, plans]);

    const newCompaniesData = useMemo(() => {
        const countsByMonth: Record<string, number> = {};
        organizations.forEach(org => {
            if (org.created_at) {
                const month = new Date(org.created_at).toISOString().slice(0, 7); // YYYY-MM
                countsByMonth[month] = (countsByMonth[month] || 0) + 1;
            }
        });

        return Object.entries(countsByMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6) // Last 6 months
            .map(([label, value]) => ({ label, value }));

    }, [organizations]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Métricas do SaaS</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Faturamento Mensal (MRR)" value={kpis.totalRevenue} icon={<DollarSign size={20}/>} />
                <KpiCard title="Empresas Ativas" value={kpis.activeCompanies.toString()} icon={<Building2 size={20}/>} />
                <KpiCard title="Total de Usuários" value={kpis.totalUsers.toString()} icon={<Users size={20}/>} />
                <KpiCard title="Pedidos Processados Hoje" value={kpis.ordersToday.toString()} icon={<ShoppingCart size={20}/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleBarChart title="Distribuição de Empresas por Plano" data={planDistribution} />
                <SimpleBarChart title="Novas Empresas por Mês (Últimos 6 meses)" data={newCompaniesData} />
            </div>
        </div>
    );
};

export default AdminMetricsPage;
