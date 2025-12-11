import React, { useState, useMemo } from 'react';
import { Customer, OrderItem } from '../types';
import { Users, Search, Trash2, X, ShoppingCart, Store, Plus } from 'lucide-react';

interface UnifiedCustomer extends Customer {
  ordersFromImports?: OrderItem[];
}

interface ClientesPageProps {
  customers: Customer[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  allOrders: OrderItem[];
}

const ClientesPage: React.FC<ClientesPageProps> = ({ customers, setCustomers, allOrders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomerCpf, setSelectedCustomerCpf] = useState<string | null>(null);

    // Extract customers from orders with their purchases
    const customersFromOrders = useMemo(() => {
        const unique = new Map<string, { name: string; cpfCnpj: string; orders: OrderItem[] }>();
        allOrders.forEach(order => {
            if (order.customer_name && order.customer_cpf_cnpj) {
                const existing = unique.get(order.customer_cpf_cnpj);
                if (existing) {
                    existing.orders.push(order);
                } else {
                    unique.set(order.customer_cpf_cnpj, {
                        name: order.customer_name,
                        cpfCnpj: order.customer_cpf_cnpj,
                        orders: [order]
                    });
                }
            }
        });
        return Array.from(unique.values());
    }, [allOrders]);

    // Unified customer list - merge cadastrados + from orders
    const unifiedCustomers = useMemo(() => {
        const merged = new Map<string, UnifiedCustomer>();
        
        // Adicionar clientes cadastrados
        customers.forEach(c => {
            merged.set(c.cpfCnpj, { ...c, ordersFromImports: [] });
        });

        // Adicionar/mesclar clientes das importações
        customersFromOrders.forEach(imported => {
            const existing = merged.get(imported.cpfCnpj);
            if (existing) {
                // Cliente já cadastrado - adicionar as compras
                existing.ordersFromImports = imported.orders;
            } else {
                // Novo cliente - criar do zero
                merged.set(imported.cpfCnpj, {
                    id: `imported_${imported.cpfCnpj}`,
                    name: imported.name,
                    cpfCnpj: imported.cpfCnpj,
                    orderHistory: [],
                    ordersFromImports: imported.orders
                });
            }
        });

        return Array.from(merged.values());
    }, [customers, customersFromOrders]);

    // Combined orders for selected customer (cadastradas + from imports)
    const selectedCustomer = useMemo(() => {
        if (!selectedCustomerCpf) return null;
        const customer = unifiedCustomers.find(c => c.cpfCnpj === selectedCustomerCpf);
        if (!customer) return null;

        return {
            ...customer,
            allOrders: [
                ...(customer.orderHistory || []).map(oh => ({ ...oh, source: 'cadastrado' as const })),
                ...(customer.ordersFromImports || []).map(o => ({ ...o, source: 'importado' as const }))
            ].sort((a, b) => {
                const dateA = new Date(a.data || 0).getTime();
                const dateB = new Date(b.data || 0).getTime();
                return dateB - dateA;
            })
        };
    }, [selectedCustomerCpf, unifiedCustomers]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) {
            return unifiedCustomers;
        }
        const lowerSearch = searchTerm.toLowerCase();
        return unifiedCustomers.filter(c =>
            c.name.toLowerCase().includes(lowerSearch) ||
            c.cpfCnpj.toLowerCase().includes(lowerSearch)
        );
    }, [unifiedCustomers, searchTerm]);

    const handleDeleteCustomer = (cpfCnpj: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
            setCustomers(prev => prev.filter(c => c.cpfCnpj !== cpfCnpj));
        }
    };

    const handleAddCustomer = (cpfCnpj: string, name: string) => {
        if (customers.some(c => c.cpfCnpj === cpfCnpj)) {
            alert('Este cliente já está cadastrado.');
            return;
        }
        const newCustomer: Customer = {
            id: `customer_${Date.now()}`,
            name,
            cpfCnpj,
            orderHistory: []
        };
        setCustomers(prev => [...prev, newCustomer]);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Clientes</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Gerencie seus clientes e visualize o histórico de compras.</p>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                        <Users size={20} /> Todos os Clientes
                    </h2>
                    <span className="text-sm text-[var(--color-text-secondary)]">{unifiedCustomers.length} clientes</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">Clique em um cliente para ver todas as suas compras (cadastradas + importadas):</p>
                
                <div className="relative flex-grow max-w-sm mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome ou CPF/CNPJ..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-surface-secondary)] rounded-md"
                    />
                </div>

                <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                    <table className="min-w-full text-sm">
                        <thead className="bg-[var(--color-surface-secondary)]">
                            <tr>
                                {['Nome do Cliente', 'CPF/CNPJ', 'Total de Compras', 'Ação'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => {
                                const totalOrders = (customer.orderHistory?.length || 0) + (customer.ordersFromImports?.length || 0);
                                return (
                                    <tr key={customer.cpfCnpj} className="hover:bg-[var(--color-surface-secondary)] cursor-pointer transition-colors">
                                        <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{customer.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">{customer.cpfCnpj}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] rounded-full text-xs font-bold">
                                                {totalOrders}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <button
                                                onClick={() => setSelectedCustomerCpf(customer.cpfCnpj)}
                                                className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
                                            >
                                                Ver Detalhes
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteCustomer(customer.cpfCnpj)}
                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                                                title="Excluir cliente"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-[var(--color-text-secondary)]">
                                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                                        Nenhum cliente encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalhes do Cliente */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[var(--color-border)]">
                        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{selectedCustomer.name}</h2>
                                <p className="text-sm text-[var(--color-text-secondary)] font-mono">{selectedCustomer.cpfCnpj}</p>
                            </div>
                            <button
                                onClick={() => setSelectedCustomerCpf(null)}
                                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
                            >
                                <X size={24} className="text-[var(--color-text-secondary)]" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4 p-3 bg-[var(--color-surface-secondary)] rounded-lg">
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    <strong>Total de Compras:</strong> <span className="text-lg text-[var(--color-primary)] font-bold">{selectedCustomer.allOrders.length}</span>
                                </p>
                            </div>

                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                <ShoppingCart size={18} /> Histórico Completo de Compras
                            </h3>

                            <div className="space-y-3 max-h-[calc(80vh-300px)] overflow-y-auto">
                                {selectedCustomer.allOrders.map((order, idx) => (
                                    <div key={idx} className="p-4 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-semibold text-[var(--color-text-primary)]">
                                                    {order.sku}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                                    <strong>Pedido:</strong> {order.order_id}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="px-2 py-1 bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] rounded text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                                                    <Store size={14} />
                                                    {order.canal || 'Geral'}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap">
                                                    {order.source === 'importado' ? '📥 Importado' : '✍️ Cadastrado'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
                                            <p><strong>Quantidade:</strong> {order.qty_final || order.quantity}</p>
                                            <p><strong>Data:</strong> {order.data ? new Date(order.data).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                            {order.color && <p><strong>Cor:</strong> {order.color}</p>}
                                            <p><strong>Status:</strong> {order.status || 'Normal'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesPage;