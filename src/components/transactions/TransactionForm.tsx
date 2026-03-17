'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { Account, Category, TransactionFormData } from '@/types';
import { getToday, cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  accounts: Account[];
  categories: Category[];
}

const typeOptions = [
  { id: 'expense' as const, label: 'Gasto', icon: '↓', color: 'text-red-500 bg-red-50 border-red-200' },
  { id: 'income' as const, label: 'Ingreso', icon: '↑', color: 'text-green-600 bg-green-50 border-green-200' },
  { id: 'transfer' as const, label: 'Transferencia', icon: '↔', color: 'text-blue-500 bg-blue-50 border-blue-200' },
];

export function TransactionForm({ open, onClose, onSubmit, accounts, categories }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TransactionFormData>({
    type: 'expense',
    amount: '',
    account_id: '',
    category_id: '',
    date: getToday(),
    description: '',
    destination_account_id: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        type: 'expense',
        amount: '',
        account_id: accounts[0]?.id || '',
        category_id: '',
        date: getToday(),
        description: '',
        destination_account_id: accounts[1]?.id || '',
      });
    }
  }, [open, accounts]);

  const filteredCategories = categories.filter((c) =>
    form.type === 'transfer' ? false : c.type === form.type
  );

  const handleSubmit = async () => {
    if (!form.amount || !form.account_id) return;
    if (form.type !== 'transfer' && !form.category_id && filteredCategories.length > 0) return;

    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nueva transacción">
      <div className="space-y-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {typeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setForm((f) => ({ ...f, type: opt.id, category_id: '' }))}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200',
                form.type === opt.id ? opt.color : 'border-transparent bg-surface-50 text-gray-400'
              )}
            >
              <span className="mr-1">{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Monto</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">$</span>
            <input
              type="number"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0"
              className="w-full pl-10 pr-4 py-3.5 bg-surface-50 border border-surface-200 rounded-xl text-gray-900 text-2xl font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-gray-300"
              autoFocus
            />
          </div>
        </div>

        {/* Account */}
        <Select
          label={form.type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}
          value={form.account_id}
          onChange={(v) => setForm((f) => ({ ...f, account_id: v }))}
          options={accounts.map((a) => ({ value: a.id, label: `${a.icon} ${a.name}` }))}
          placeholder="Seleccionar cuenta"
        />

        {/* Destination account for transfers */}
        {form.type === 'transfer' && (
          <Select
            label="Cuenta destino"
            value={form.destination_account_id || ''}
            onChange={(v) => setForm((f) => ({ ...f, destination_account_id: v }))}
            options={accounts
              .filter((a) => a.id !== form.account_id)
              .map((a) => ({ value: a.id, label: `${a.icon} ${a.name}` }))}
            placeholder="Seleccionar destino"
          />
        )}

        {/* Category */}
        {form.type !== 'transfer' && (
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
            options={filteredCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
            placeholder="Seleccionar categoría"
          />
        )}

        {/* Date */}
        <Input
          label="Fecha"
          type="date"
          value={form.date}
          onChange={(v) => setForm((f) => ({ ...f, date: v }))}
        />

        {/* Description */}
        <Input
          label="Descripción (opcional)"
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          placeholder="Ej: Almuerzo con amigos"
        />

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          loading={loading}
          fullWidth
          size="lg"
          className="mt-2"
        >
          {form.type === 'expense' ? 'Registrar gasto' : form.type === 'income' ? 'Registrar ingreso' : 'Registrar transferencia'}
        </Button>
      </div>
    </Modal>
  );
}
