'use client';

import { useState } from 'react';
import { AccountWithBalance } from '@/types';
import { formatCOP, cn } from '@/lib/utils';
import { Modal, Button, Input, Select, EmptyState, ConfirmDialog } from '@/components/ui';

interface Props {
  accounts: AccountWithBalance[];
  onCreateAccount: (data: { name: string; icon: string; color: string; account_type: string; credit_limit?: number }) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onPayCard: (cardId: string) => void;
}

const iconOptions = ['💳', '🏦', '💵', '💰', '🐷', '💜', '🏧', '📱', '💎', '🪙'];
const colorOptions = ['#7c3aed', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6'];

const accountTypeOptions = [
  { value: 'bank', label: '🏦 Cuenta bancaria' },
  { value: 'cash', label: '💵 Efectivo' },
  { value: 'credit_card', label: '💳 Tarjeta de crédito' },
];

export function AccountsView({ accounts, onCreateAccount, onDeleteAccount, onPayCard }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    icon: '🏦',
    color: '#6366f1',
    account_type: 'bank' as string,
    credit_limit: '',
  });
  const [loading, setLoading] = useState(false);

  const regularAccounts = accounts.filter((a) => a.account_type !== 'credit_card');
  const creditCards = accounts.filter((a) => a.account_type === 'credit_card');

  const totalBalance = regularAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalDebt = creditCards.reduce((sum, a) => sum + Math.min(0, a.balance), 0);
  const netWorth = totalBalance + totalDebt;

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await onCreateAccount({
        name: form.name,
        icon: form.icon,
        color: form.color,
        account_type: form.account_type,
        credit_limit: form.account_type === 'credit_card' ? parseFloat(form.credit_limit) || 0 : 0,
      });
      setForm({ name: '', icon: '🏦', color: '#6366f1', account_type: 'bank', credit_limit: '' });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mis cuentas</h2>
          <p className="text-xs text-gray-400 font-mono">Patrimonio neto: {formatCOP(netWorth)}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>+ Nueva</Button>
      </div>

      {/* Regular accounts */}
      {regularAccounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Cuentas</p>
          {regularAccounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${acc.color}15` }}
              >
                {acc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{acc.name}</p>
                <p className="text-xs text-gray-400">
                  {acc.account_type === 'cash' ? 'Efectivo' : 'Cuenta bancaria'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-base font-bold font-mono ${acc.balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                  {formatCOP(acc.balance)}
                </p>
              </div>
              <button onClick={() => setDeleteTarget(acc.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Credit Cards */}
      {creditCards.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Tarjetas de crédito</p>
          {creditCards.map((card) => {
            const debt = Math.abs(Math.min(0, card.balance));
            const available = Math.max(0, card.credit_limit - debt);
            const usagePct = card.credit_limit > 0 ? (debt / card.credit_limit) * 100 : 0;

            return (
              <div key={card.id} className="bg-white rounded-2xl p-4 shadow-card space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{card.name}</p>
                    <p className="text-xs text-gray-400">Tarjeta de crédito</p>
                  </div>
                  <button onClick={() => setDeleteTarget(card.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>

                {/* Debt and available */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-red-400 font-medium">Deuda</p>
                    <p className="text-sm font-bold font-mono text-red-600">{formatCOP(debt)}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-green-500 font-medium">Disponible</p>
                    <p className="text-sm font-bold font-mono text-green-600">{formatCOP(available)}</p>
                  </div>
                </div>

                {/* Usage bar */}
                {card.credit_limit > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Uso del cupo</span>
                      <span className="font-mono">{Math.round(usagePct)}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full progress-bar',
                          usagePct > 80 ? 'bg-red-500' : usagePct > 50 ? 'bg-yellow-500' : 'bg-brand-500'
                        )}
                        style={{ width: `${Math.min(100, usagePct)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right font-mono">
                      Cupo: {formatCOP(card.credit_limit)}
                    </p>
                  </div>
                )}

                {/* Pay button */}
                {debt > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => onPayCard(card.id)}
                  >
                    💸 Pagar tarjeta
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {accounts.length === 0 && (
        <EmptyState icon="🏦" message="No hay cuentas creadas" />
      )}

      {/* Create form */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva cuenta">
        <div className="space-y-4">
          <Select
            label="Tipo de cuenta"
            value={form.account_type}
            onChange={(v) => {
              setForm((f) => ({
                ...f,
                account_type: v,
                icon: v === 'credit_card' ? '💳' : v === 'cash' ? '💵' : '🏦',
              }));
            }}
            options={accountTypeOptions}
          />

          <Input
            label="Nombre"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder={form.account_type === 'credit_card' ? 'Ej: Visa Bancolombia' : 'Ej: Nequi'}
          />

          {form.account_type === 'credit_card' && (
            <Input
              label="Cupo total (COP)"
              type="number"
              value={form.credit_limit}
              onChange={(v) => setForm((f) => ({ ...f, credit_limit: v }))}
              placeholder="3000000"
              prefix="$"
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Ícono</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    form.icon === icon ? 'bg-brand-100 ring-2 ring-brand-500 scale-110' : 'bg-surface-50 hover:bg-surface-100'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Button onClick={handleCreate} loading={loading} fullWidth size="lg">
            {form.account_type === 'credit_card' ? 'Agregar tarjeta' : 'Crear cuenta'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await onDeleteAccount(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Eliminar cuenta"
        message="Se eliminarán todas las transacciones asociadas. ¿Continuar?"
      />
    </div>
  );
}
