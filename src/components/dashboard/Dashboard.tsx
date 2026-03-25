'use client';

import { useMemo } from 'react';
import { AccountWithBalance, MonthSummary } from '@/types';
import { formatCOP, getMonthName, cn } from '@/lib/utils';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  accounts: AccountWithBalance[];
  summary: MonthSummary | null;
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function Dashboard({ accounts, summary, month, year, onPrevMonth, onNextMonth }: Props) {
  const regularAccounts = accounts.filter((a) => a.account_type !== 'credit_card');
  const creditCards = accounts.filter((a) => a.account_type === 'credit_card');
  const totalBalance = regularAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalDebt = creditCards.reduce((sum, a) => sum + Math.min(0, a.balance), 0);
  const netWorth = totalBalance + totalDebt;

  const chartData = useMemo(() => {
    if (!summary || summary.byCategory.length === 0) return null;
    return {
      labels: summary.byCategory.map((c) => c.category.name),
      datasets: [
        {
          data: summary.byCategory.map((c) => c.total),
          backgroundColor: summary.byCategory.map((c) => c.category.color),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };
  }, [summary]);

  return (
    <div className="space-y-4 pb-4">
      {/* Header with balance */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 rounded-3xl p-5 text-white shadow-float relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <p className="text-brand-200 text-xs font-medium uppercase tracking-wider mb-1">Patrimonio neto</p>
          <p className="text-3xl font-bold font-mono tracking-tight">{formatCOP(netWorth)}</p>

          {/* Regular accounts */}
          {regularAccounts.filter(a => !a.is_archived).length > 0 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {regularAccounts.filter(a => !a.is_archived).map((acc) => (
                <div key={acc.id} className="bg-white/10 rounded-xl px-3 py-2 flex-1 min-w-0">
                  <p className="text-[10px] text-white/60 truncate">{acc.icon} {acc.name}</p>
                  <p className="text-sm font-semibold font-mono mt-0.5">{formatCOP(acc.balance)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Credit cards */}
          {creditCards.filter(a => !a.is_archived).length > 0 && (
            <div className="mt-2 flex gap-3 overflow-x-auto">
              {creditCards.filter(a => !a.is_archived).map((card) => {
                const debt = Math.abs(Math.min(0, card.balance));
                return (
                  <div key={card.id} className="bg-red-500/20 rounded-xl px-3 py-2 flex-1 min-w-0">
                    <p className="text-[10px] text-red-200/70 truncate">{card.icon} {card.name}</p>
                    <p className="text-sm font-semibold font-mono mt-0.5 text-red-200">
                      {debt > 0 ? `-${formatCOP(debt)}` : formatCOP(0)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between px-1">
        <button onClick={onPrevMonth} className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-gray-500 hover:bg-surface-200 active:scale-95 transition-all">
          ‹
        </button>
        <h2 className="text-sm font-semibold text-gray-700 capitalize">
          {getMonthName(month)} {year}
        </h2>
        <button onClick={onNextMonth} className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-gray-500 hover:bg-surface-200 active:scale-95 transition-all">
          ›
        </button>
      </div>

      {/* Income / Expenses summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 text-sm">↑</div>
              <span className="text-xs font-medium text-gray-400">Ingresos</span>
            </div>
            <p className="text-lg font-bold font-mono text-green-600">{formatCOP(summary.totalIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 text-sm">↓</div>
              <span className="text-xs font-medium text-gray-400">Gastos</span>
            </div>
            <p className="text-lg font-bold font-mono text-red-500">{formatCOP(summary.totalExpenses)}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData && (
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Gastos por categoría</h3>
          <div className="flex items-center gap-6">
            <div className="w-36 h-36 flex-shrink-0">
              <Doughnut
                data={chartData}
                options={{
                  cutout: '65%',
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1f2937',
                      titleFont: { family: 'DM Sans' },
                      bodyFont: { family: 'JetBrains Mono', size: 11 },
                      cornerRadius: 12,
                      padding: 10,
                      callbacks: {
                        label: (ctx) => ` ${formatCOP(ctx.parsed)}`,
                      },
                    },
                  },
                  animation: { animateRotate: true, duration: 600 },
                }}
              />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {summary!.byCategory.slice(0, 5).map((item) => (
                <div key={item.category.id} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.category.color }} />
                  <span className="text-xs text-gray-600 truncate flex-1">{item.category.icon} {item.category.name}</span>
                  <span className="text-xs font-mono font-medium text-gray-800">{formatCOP(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {summary && summary.byCategory.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
          <span className="text-3xl">📊</span>
          <p className="text-gray-400 text-sm mt-2">Sin gastos este mes</p>
        </div>
      )}
    </div>
  );
}
