'use client';

import { useState } from 'react';
import { Account, Category, FilterState } from '@/types';
import { Modal, Button, Select, Input } from '@/components/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  accounts: Account[];
  categories: Category[];
}

export function TransactionFilters({ open, onClose, filters, onApply, accounts, categories }: Props) {
  const [local, setLocal] = useState<FilterState>(filters);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    const reset: FilterState = { dateFrom: '', dateTo: '', accountId: '', categoryId: '', type: '' };
    setLocal(reset);
    onApply(reset);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Filtros">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Desde"
            type="date"
            value={local.dateFrom}
            onChange={(v) => setLocal((f) => ({ ...f, dateFrom: v }))}
          />
          <Input
            label="Hasta"
            type="date"
            value={local.dateTo}
            onChange={(v) => setLocal((f) => ({ ...f, dateTo: v }))}
          />
        </div>

        <Select
          label="Cuenta"
          value={local.accountId}
          onChange={(v) => setLocal((f) => ({ ...f, accountId: v }))}
          options={[{ value: '', label: 'Todas' }, ...accounts.map((a) => ({ value: a.id, label: `${a.icon} ${a.name}` }))]}
        />

        <Select
          label="Tipo"
          value={local.type}
          onChange={(v) => setLocal((f) => ({ ...f, type: v }))}
          options={[
            { value: '', label: 'Todos' },
            { value: 'income', label: 'Ingresos' },
            { value: 'expense', label: 'Gastos' },
          ]}
        />

        <Select
          label="Categoría"
          value={local.categoryId}
          onChange={(v) => setLocal((f) => ({ ...f, categoryId: v }))}
          options={[
            { value: '', label: 'Todas' },
            ...categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
          ]}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={handleReset}>
            Limpiar
          </Button>
          <Button fullWidth onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
