'use client';

import { useState } from 'react';
import { AccountWithBalance } from '@/types';
import { formatCOP } from '@/lib/utils';
import { Modal, Button, Input, EmptyState, ConfirmDialog } from '@/components/ui';

interface Props {
  accounts: AccountWithBalance[];
  onCreateAccount: (data: { name: string; icon: string; color: string }) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
}

const iconOptions = ['💳', '🏦', '💵', '💰', '🐷', '💜', '🏧', '📱', '💎', '🪙'];
const colorOptions = ['#7c3aed', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6'];

export function AccountsView({ accounts, onCreateAccount, onDeleteAccount }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: '💳', color: '#6366f1' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await onCreateAccount(form);
      setForm({ name: '', icon: '💳', color: '#6366f1' });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mis cuentas</h2>
          <p className="text-xs text-gray-400 font-mono">Total: {formatCOP(totalBalance)}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>+ Nueva</Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState icon="🏦" message="No hay cuentas creadas" />
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${acc.color}15` }}
              >
                {acc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{acc.name}</p>
                <p className="text-xs text-gray-400">Balance calculado</p>
              </div>
              <div className="text-right">
                <p className={`text-base font-bold font-mono ${acc.balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                  {formatCOP(acc.balance)}
                </p>
              </div>
              <button
                onClick={() => setDeleteTarget(acc.id)}
                className="text-gray-300 hover:text-red-400 transition-colors p-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva cuenta">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Ej: Nequi"
          />
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
            Crear cuenta
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
