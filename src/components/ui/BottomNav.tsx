'use client';

import { cn } from '@/lib/utils';

interface NavProps {
  active: string;
  onChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Inicio', icon: '📊' },
  { id: 'transactions', label: 'Movimientos', icon: '💸' },
  { id: 'budgets', label: 'Presupuesto', icon: '🎯' },
  { id: 'accounts', label: 'Cuentas', icon: '🏦' },
];

export function BottomNav({ active, onChange }: NavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-surface-200 z-40 nav-safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 flex flex-col items-center py-2 pt-2.5 transition-all duration-200',
              active === tab.id ? 'text-brand-700' : 'text-gray-400'
            )}
          >
            <span className={cn('text-xl mb-0.5 transition-transform duration-200', active === tab.id && 'scale-110')}>
              {tab.icon}
            </span>
            <span className={cn('text-[10px] font-medium', active === tab.id && 'font-semibold')}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
