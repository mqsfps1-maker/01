// components/OrderListModal.tsx
import React, { useMemo } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { OrderItem } from '../types';

interface OrderListModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: OrderItem[];
    title: string;
}

const OrderListModal: React.FC<OrderListModalProps> = ({ isOpen, onClose, orders, title }) => {
    const { mlOrders, shopeeOrders } = useMemo(() => {
        const ml: Record<string, OrderItem[]> = {};
        const shopee: Record<string, OrderItem[]> = {};
        
        orders.forEach(order => {
            if (order.canal === 'ML') {
                if (!ml[order.orderId]) ml[order.orderId] = [];
                ml[order.orderId].push(order);
            } else if (order.canal === 'SHOPEE') {
                if (!shopee[order.orderId]) shopee[order.orderId] = [];
                shopee[order.orderId].push(order);
            }
        });

        return { mlOrders: Object.values(ml), shopeeOrders: Object.values(shopee) };
    }, [orders]);

    if (!isOpen) return null;

    const OrderGroup: React.FC<{ group: OrderItem[] }> = ({ group }) => {
        const first = group[0];
        const totalUnits = group.reduce((sum, item) => sum + item.qty_final, 0);

        return (
            <div className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md">
                <p className="text-xs font-mono font-semibold">{first.orderId}</p>
                {group.length > 1 ? (
                    <p className="text-xs">{group.length} SKUs, {totalUnits} unidades (Diversos)</p>
                ) : (
                    <p className="text-xs">{first.sku} (x{first.qty_final})</p>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-[var(--color-surface)] rounded-lg shadow-2xl p-6 w-full max-w-5xl flex flex-col max-h-[90vh] transform transition-transform duration-300 scale-95 animate-scale-in">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <ShoppingCart size={20} /> {title}
                    </h2>
                    <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2">
                    <div>
                        <h3 className="font-bold mb-2" style={{color: 'var(--color-ml)'}}>Mercado Livre ({mlOrders.length})</h3>
                        <div className="space-y-2 bg-[var(--color-surface-secondary)] p-2 rounded-lg h-full">
                            {mlOrders.length > 0 ? mlOrders.map(group => (
                                <OrderGroup key={group[0].orderId} group={group} />
                            )) : <p className="text-sm text-center text-[var(--color-text-secondary)] p-4">Nenhum pedido.</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold mb-2" style={{color: 'var(--color-shopee)'}}>Shopee ({shopeeOrders.length})</h3>
                        <div className="space-y-2 bg-[var(--color-surface-secondary)] p-2 rounded-lg h-full">
                             {shopeeOrders.length > 0 ? shopeeOrders.map(group => (
                                <OrderGroup key={group[0].orderId} group={group} />
                            )) : <p className="text-sm text-center text-[var(--color-text-secondary)] p-4">Nenhum pedido.</p>}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold rounded-md">
                        Fechar
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default OrderListModal;