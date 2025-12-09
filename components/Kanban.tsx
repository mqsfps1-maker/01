import React from 'react';
import { OrderItem } from '../types';

type KanbanColumnKey = 'Pendente' | 'Atrasado' | 'BIPADO' | 'ERRO' | 'SOLUCIONADO';

interface KanbanCardProps {
    orderGroup: OrderItem[];
    onClick: () => void;
    isSelected: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ orderGroup, onClick, isSelected }) => {
    const firstOrder = orderGroup[0];
    const totalUnits = orderGroup.reduce((sum, item) => sum + item.qty_final, 0);

    const channelColors: Record<string, string> = {
        ML: 'bg-[var(--color-ml)]',
        SHOPEE: 'bg-[var(--color-shopee)]',
        SITE: 'bg-[var(--color-primary)]',
    };

    return (
        <div 
            onClick={onClick}
            className={`bg-[var(--card-bg)] p-3 rounded-lg border-l-4 shadow-[var(--card-shadow)] cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-[var(--color-primary)]' : 'border-transparent'}`}
        >
            <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-[var(--color-text-primary)] break-all">{firstOrder.orderId}</p>
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${channelColors[firstOrder.canal] || 'bg-gray-400'}`} title={firstOrder.canal}></span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{firstOrder.customer_name || 'Cliente não informado'}</p>
            <div className="mt-3 pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                {orderGroup.length > 1 ? (
                    <span>{orderGroup.length} SKUs, {totalUnits} unidades</span>
                ) : (
                    <span className="font-mono">{firstOrder.sku} (x{totalUnits})</span>
                )}
            </div>
        </div>
    );
};


interface KanbanColumnProps {
    title: KanbanColumnKey;
    orders: OrderItem[][];
    onCardClick: (orderGroup: OrderItem[]) => void;
    selectedGroups: Set<string>;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, orders, onCardClick, selectedGroups }) => {
    const columnStyles: Record<KanbanColumnKey, { bg: string, text: string, border: string }> = {
        'Pendente': { bg: 'bg-[var(--color-info-bg)]', text: 'text-[var(--color-info-text)]', border: 'border-[var(--color-info-border)]' },
        'Atrasado': { bg: 'bg-[var(--color-warning-bg)]', text: 'text-[var(--color-warning-text)]', border: 'border-[var(--color-warning-border)]' },
        'BIPADO': { bg: 'bg-[var(--color-success-bg)]', text: 'text-[var(--color-success-text)]', border: 'border-[var(--color-success-border)]' },
        'ERRO': { bg: 'bg-[var(--color-danger-bg)]', text: 'text-[var(--color-danger-text)]', border: 'border-[var(--color-danger-border)]' },
        'SOLUCIONADO': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-500 dark:border-indigo-700' },
    };

    const style = columnStyles[title];

    return (
        <div className="w-72 flex-shrink-0 kanban-column">
            <div className={`flex flex-col h-full bg-[var(--color-surface-secondary)] rounded-xl`}>
                <div className={`p-3 border-b-2 ${style.border}`}>
                    <h3 className={`font-semibold ${style.text}`}>{title} ({orders.length})</h3>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-grow">
                    {orders.map((group, index) => {
                        const groupKey = group[0].orderId || group[0].tracking;
                        return (
                            <KanbanCard 
                                key={`${groupKey}-${index}`}
                                orderGroup={group} 
                                onClick={() => onCardClick(group)} 
                                isSelected={selectedGroups.has(groupKey)} 
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

interface KanbanBoardProps {
    groupedOrders: Record<KanbanColumnKey, OrderItem[][]>;
    onCardClick: (orderGroup: OrderItem[]) => void;
    selectedGroups: Set<string>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ groupedOrders, onCardClick, selectedGroups }) => {
    const columns: KanbanColumnKey[] = ['Pendente', 'Atrasado', 'BIPADO', 'ERRO', 'SOLUCIONADO'];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollSnapType: 'x mandatory' }}>
            {columns.map(col => (
                <KanbanColumn 
                    key={col}
                    title={col}
                    orders={groupedOrders[col] || []}
                    onCardClick={onCardClick}
                    selectedGroups={selectedGroups}
                />
            ))}
        </div>
    );
};