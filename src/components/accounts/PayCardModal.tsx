'use client';

import { useState, useEffect } from 'react';
import { AccountWithBalance, TransactionFormData } from '@/types';
import { formatCOP, getToday } from '@/lib/utils';
import { Modal, Button, Input, Select } from '@/components/ui';

interface Props {
  open: boolean;
  cardId: string | null;
  onClose: () => void;
  accounts: AccountWithBalance[];
  onSubmit: (data: TransactionFormData) => Promise<void>;
}

export function PayCardModal({ open, cardId, onClose, accounts, onSubmit }: Props) {
  const [amount, setAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const card = accounts.find((a) => a.id === cardId);
  const debt = card ? Math.abs(Math.min(0, card.balance)) : 0;

  // Accounts available to pay from (not credit cards, not the card itself)
  const sourceAccounts = accounts.filter(
    (a) => a.account_type !== 'credit_card' && a.id !== cardId
  );

  useEffect(() => {
    if (open) {
      setAmount('');
      setSourceAccountId(sourceAccounts[0]?.id || '');
      setDate(getToday());
      setError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    setError('');
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    if (!sourceAccountId) {
      setError('Selecciona una cuenta de origen');
      return;
    }
    if (!cardId) return;

    setLoading(true);
    try {
      await onSubmit({
        type: 'transfer',
        amount: amount,
        account_id: sourceAccountId,
        destination_account_id: cardId,
        category_id: '',
        date,
        description: `Pago tarjeta ${card?.name || ''}`,
      });
    } catch (err: any) {
      setError(err?.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const handlePayFull = () => {
    if (debt > 0) setAmount(String(debt));
  };

  if (!card) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Pagar ${card.name}`}>
      <div className="space-y-4">
        {/* Card debt info */}
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <p className="text-xs text-red-400 font-medium mb-1">Deuda actual</p>
          <p className="text-2xl font-bold font-mono text-red-600">{formatCOP(debt)}</p>
        </div>

        {/* Source account */}
        <Select
          label="Pagar desde"
          value={sourceAccountId}
          onChange={setSourceAccountId}
          options={sourceAccounts.map((a) => ({
            value: a.id,
            label: `${a.icon} ${a.name} (${formatCOP(a.balance)})`,
          }))}
          placeholder="Seleccionar cuenta"
        />

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-600">Monto a pagar</label>
            {debt > 0 && (
              <button
                onClick={handlePayFull}
                className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors"
              >
                Pagar todo
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">$</span>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-4 py-3.5 bg-surface-50 border border-surface-200 rounded-xl text-gray-900 text-2xl font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Date */}
        <Input
          label="Fecha"
          type="date"
          value={date}
          onChange={setDate}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-xl">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button onClick={handleSubmit} loading={loading} fullWidth size="lg">
          Registrar pago
        </Button>
      </div>
    </Modal>
  );
}
