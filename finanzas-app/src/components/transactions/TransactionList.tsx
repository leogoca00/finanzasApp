'use client';

import { useState } from 'react';
import { Transaction } from '@/types';
import { formatCOP, formatDate, cn } from '@/lib/utils';
import { EmptyState, ConfirmDialog } from '@/components/ui';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string, transferId?: string | null) => Promise<void>;
}

export function TransactionList({ transactions, onDelete }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  if (transactions.length === 0) {
    return <EmptyState icon="📭" message="No hay movimientos aún" />;
  }

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  });

  return (
    <>
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <div className="px-1 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {formatDate(date)}
              </span>
            </div>
            <div className="space-y-1.5">
              {txs.map((t, i) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-card hover:shadow-card-hover transition-shadow duration-200 active:scale-[0.99]"
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => setDeleteTarget(t)}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{
                      backgroundColor: t.transfer_id
                        ? '#eff6ff'
                        : t.category?.color
                          ? `${t.category.color}15`
                          : '#f3f4f6',
                    }}
                  >
                    {t.transfer_id ? '↔️' : t.category?.icon || (t.type === 'income' ? '💰' : '💸')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.transfer_id
                        ? t.description || 'Transferencia'
                        : t.category?.name || t.description || 'Sin categoría'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {t.account?.icon} {t.account?.name}
                      {t.description && !t.transfer_id && t.category?.name ? ` · ${t.description}` : ''}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        'text-sm font-semibold font-mono',
                        t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-500' : 'text-blue-500'
                      )}
                    >
                      {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                      {formatCOP(t.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await onDelete(deleteTarget.id, deleteTarget.transfer_id);
            setDeleteTarget(null);
          }
        }}
        title="Eliminar transacción"
        message={
          deleteTarget?.transfer_id
            ? 'Se eliminarán ambas partes de la transferencia. ¿Continuar?'
            : '¿Estás seguro de eliminar esta transacción?'
        }
      />
    </>
  );
}
