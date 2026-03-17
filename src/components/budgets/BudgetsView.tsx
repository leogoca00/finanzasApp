'use client';

import { useState } from 'react';
import { Budget, Category } from '@/types';
import { formatCOP, getMonthName, clampPercentage, cn } from '@/lib/utils';
import { Modal, Button, Select, Input, EmptyState, ConfirmDialog } from '@/components/ui';

interface Props {
  budgets: Budget[];
  categories: Category[];
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onUpsert: (data: { category_id: string; month: number; year: number; amount: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function BudgetsView({ budgets, categories, month, year, onPrevMonth, onNextMonth, onUpsert, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ category_id: '', amount: '' });
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const usedCategoryIds = budgets.map((b) => b.category_id);
  const availableCategories = expenseCategories.filter((c) => !usedCategoryIds.includes(c.id));

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);

  const handleCreate = async () => {
    const amount = parseFloat(form.amount);
    if (!form.category_id || isNaN(amount) || amount <= 0) return;
    setLoading(true);
    try {
      await onUpsert({ category_id: form.category_id, month, year, amount });
      setForm({ category_id: '', amount: '' });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Presupuestos</h2>
        <Button size="sm" onClick={() => setShowForm(true)} disabled={availableCategories.length === 0}>
          + Agregar
        </Button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between px-1">
        <button onClick={onPrevMonth} className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-gray-500 hover:bg-surface-200 active:scale-95 transition-all">
          ‹
        </button>
        <h3 className="text-sm font-semibold text-gray-700 capitalize">
          {getMonthName(month)} {year}
        </h3>
        <button onClick={onNextMonth} className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-gray-500 hover:bg-surface-200 active:scale-95 transition-all">
          ›
        </button>
      </div>

      {/* Summary bar */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Gastado: <span className="font-mono font-semibold text-gray-700">{formatCOP(totalSpent)}</span></span>
            <span>Límite: <span className="font-mono font-semibold text-gray-700">{formatCOP(totalBudget)}</span></span>
          </div>
          <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full progress-bar',
                totalSpent / totalBudget > 0.9 ? 'bg-red-500' : totalSpent / totalBudget > 0.7 ? 'bg-yellow-500' : 'bg-brand-500'
              )}
              style={{ width: `${clampPercentage((totalSpent / totalBudget) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget list */}
      {budgets.length === 0 ? (
        <EmptyState icon="🎯" message="No hay presupuestos para este mes" />
      ) : (
        <div className="space-y-2">
          {budgets.map((budget) => {
            const pct = budget.amount > 0 ? ((budget.spent || 0) / budget.amount) * 100 : 0;
            const remaining = budget.amount - (budget.spent || 0);
            const isOver = remaining < 0;
            const isWarning = pct > 70 && !isOver;

            return (
              <div key={budget.id} className="bg-white rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${budget.category?.color || '#6366f1'}15` }}
                  >
                    {budget.category?.icon || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{budget.category?.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatCOP(budget.spent || 0)} de {formatCOP(budget.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold font-mono', isOver ? 'text-red-500' : 'text-gray-700')}>
                      {isOver ? '-' : ''}{formatCOP(Math.abs(remaining))}
                    </p>
                    <p className="text-[10px] text-gray-400">{isOver ? 'excedido' : 'restante'}</p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(budget.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full progress-bar',
                      isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-brand-500'
                    )}
                    style={{ width: `${clampPercentage(pct)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-right">{Math.round(pct)}%</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create form */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo presupuesto">
        <div className="space-y-4">
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
            options={availableCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
            placeholder="Seleccionar categoría"
          />
          <Input
            label="Límite mensual (COP)"
            type="number"
            value={form.amount}
            onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
            placeholder="500000"
            prefix="$"
          />
          <Button onClick={handleCreate} loading={loading} fullWidth size="lg">
            Crear presupuesto
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await onDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Eliminar presupuesto"
        message="¿Estás seguro de eliminar este presupuesto?"
      />
    </div>
  );
}
