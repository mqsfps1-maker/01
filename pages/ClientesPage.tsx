import React, { useState, useMemo } from 'react';
import { Customer, OrderItem } from '../types';
import { Users, Search, Trash2 } from 'lucide-react';

interface ClientesPageProps {
  customers: Customer[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  allOrders: OrderItem[];
}

const ClientesPage: React.FC<ClientesPageProps> = ({ customers, setCustomers }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) {
            return customers;
        }
        const lowerSearch = searchTerm.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(lowerSearch) ||
            c.cpfCnpj.toLowerCase().includes(lowerSearch)
        );
    }, [customers, searchTerm]);

    const handleDeleteCustomer = (customerId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
            setCustomers(prev => prev.filter(c => c.id !== customerId));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Clientes</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Gerencie seus clientes e visualize o histórico de compras.</p>
            </div>

            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative flex-grow max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome ou CPF/CNPJ..."
                            className="w-full pl-9 pr-3 py-2 text-sm border-[var(--color-border)] bg-[var(--color-surface-secondary)] rounded-md"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                    <table className="min-w-full text-sm">
                        <thead className="bg-[var(--color-surface-secondary)]">
                            <tr>
                                {['Nome do Cliente', 'CPF/CNPJ', 'Total de Pedidos', 'Ações'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{customer.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">{customer.cpfCnpj}</td>
                                    <td className="px-4 py-3 text-center font-bold text-[var(--color-text-primary)]">{customer.orderHistory.length}</td>
                                    <td className="px-4 py-3">
                                        <button 
                                            onClick={() => handleDeleteCustomer(customer.id)}
                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full"
                                            title="Excluir cliente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-[var(--color-text-secondary)]">
                                        <Users size={32} className="mx-auto mb-2" />
                                        Nenhum cliente encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClientesPage;