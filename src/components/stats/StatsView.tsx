'use client';

import { useMemo } from 'react';
import { MonthSummary } from '@/types';
import { formatCOP, getMonthName, cn, isCurrentMonth } from '@/lib/utils';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  summary: MonthSummary | null;
  prevSummary: MonthSummary | null;
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function StatsView({ summary, prevSummary, month, year, onPrevMonth, onNextMonth }: Props) {
  const isCurrent = isCurrentMonth(month, year);

  const dailyChartData = useMemo(() => {
    if (!summary || summary.dailyExpenses.length === 0) return null;

    const labels = summary.dailyExpenses.map((d) => {
      const day = parseInt(d.date.split('-')[2]);
      return String(day);
    });

    // Only show up to today if current month
    const cutoff = isCurrent ? summary.daysElapsed : summary.daysInMonth;
    const visibleData = summary.dailyExpenses.slice(0, cutoff);
    const avgLine = summary.dailyAvgExpense;

    return {
      labels: labels.slice(0, cutoff),
      datasets: [
        {
          label: 'Gasto diario',
          data: visibleData.map((d) => d.total),
          backgroundColor: visibleData.map((d) =>
            d.total > avgLine * 1.5 ? '#ef4444' : d.total > avgLine ? '#f59e0b' : '#10b981'
          ),
          borderRadius: 4,
          borderSkipped: false as const,
        },
      ],
    };
  }, [summary, isCurrent]);

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3">📈</span>
        <p className="text-gray-400 text-sm">Cargando estadísticas...</p>
      </div>
    );
  }

  const prevExpenses = prevSummary?.totalExpenses || 0;
  const expenseChange = prevExpenses > 0
    ? ((summary.totalExpenses - prevExpenses) / prevExpenses) * 100
    : 0;

  const prevIncome = prevSummary?.totalIncome || 0;
  const incomeChange = prevIncome > 0
    ? ((summary.totalIncome - prevIncome) / prevIncome) * 100
    : 0;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-900">Estadísticas</h2>

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

      {/* Daily Average + Projection Card */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Promedio diario de gasto</h3>

        <div className="flex items-end gap-4">
          <div>
            <p className="text-3xl font-bold font-mono text-gray-900">{formatCOP(summary.dailyAvgExpense)}</p>
            <p className="text-xs text-gray-400 mt-1">por día ({summary.daysElapsed} días transcurridos)</p>
          </div>
        </div>

        {/* Projection */}
        {isCurrent && (
          <div className="bg-surface-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Proyección fin de mes</span>
              <span className="text-sm font-bold font-mono text-gray-800">{formatCOP(summary.projectedMonthExpense)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Gastado hasta hoy</span>
              <span className="text-sm font-bold font-mono text-gray-800">{formatCOP(summary.totalExpenses)}</span>
            </div>
            <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 progress-bar"
                style={{ width: `${Math.min(100, (summary.daysElapsed / summary.daysInMonth) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 text-center">
              Día {summary.daysElapsed} de {summary.daysInMonth}
            </p>
          </div>
        )}
      </div>

      {/* Daily expenses chart */}
      {dailyChartData && (
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Gasto por día</h3>
          <p className="text-[10px] text-gray-400 mb-3">
            🟢 bajo promedio &nbsp; 🟡 sobre promedio &nbsp; 🔴 muy alto
          </p>
          <div className="h-44">
            <Bar
              data={dailyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#1f2937',
                    titleFont: { family: 'DM Sans', size: 11 },
                    bodyFont: { family: 'JetBrains Mono', size: 11 },
                    cornerRadius: 10,
                    padding: 8,
                    callbacks: {
                      title: (ctx) => `Día ${ctx[0].label}`,
                      label: (ctx) => ` ${formatCOP(ctx.parsed.y)}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: {
                      font: { size: 9, family: 'DM Sans' },
                      color: '#adb5bd',
                      maxTicksLimit: 15,
                    },
                    border: { display: false },
                  },
                  y: {
                    grid: { color: '#f1f3f5' },
                    ticks: {
                      font: { size: 9, family: 'JetBrains Mono' },
                      color: '#adb5bd',
                      callback: (val) => {
                        const n = Number(val);
                        return n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
                      },
                    },
                    border: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Savings rate card */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Tasa de ahorro</h3>

        <div className="flex items-center gap-4">
          {/* Big rate circle */}
          <div className={cn(
            'w-20 h-20 rounded-full flex flex-col items-center justify-center flex-shrink-0 border-4',
            summary.savingsRate >= 20
              ? 'border-green-400 bg-green-50'
              : summary.savingsRate >= 0
                ? 'border-yellow-400 bg-yellow-50'
                : 'border-red-400 bg-red-50'
          )}>
            <span className={cn(
              'text-xl font-bold font-mono',
              summary.savingsRate >= 20 ? 'text-green-600' : summary.savingsRate >= 0 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {Math.round(summary.savingsRate)}%
            </span>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Ingresos</span>
              <span className="font-mono font-medium text-green-600">{formatCOP(summary.totalIncome)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Gastos</span>
              <span className="font-mono font-medium text-red-500">{formatCOP(summary.totalExpenses)}</span>
            </div>
            <hr className="border-surface-200" />
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Ahorro</span>
              <span className={cn(
                'font-mono font-bold',
                summary.balance >= 0 ? 'text-green-600' : 'text-red-500'
              )}>
                {formatCOP(summary.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Context message */}
        <div className={cn(
          'rounded-xl px-3 py-2 text-xs',
          summary.savingsRate >= 30 ? 'bg-green-50 text-green-700' :
          summary.savingsRate >= 20 ? 'bg-green-50 text-green-600' :
          summary.savingsRate >= 10 ? 'bg-yellow-50 text-yellow-700' :
          summary.savingsRate >= 0 ? 'bg-yellow-50 text-yellow-600' :
          'bg-red-50 text-red-600'
        )}>
          {summary.savingsRate >= 30 ? '🎉 Excelente. Estás ahorrando más del 30%.' :
           summary.savingsRate >= 20 ? '👍 Buen ritmo de ahorro. La recomendación mínima es 20%.' :
           summary.savingsRate >= 10 ? '⚠️ Ahorro moderado. Intenta llegar al 20%.' :
           summary.savingsRate >= 0 ? '😬 Ahorro bajo. Revisa tus gastos más grandes.' :
           '🚨 Estás gastando más de lo que ganas este mes.'}
        </div>
      </div>

      {/* Comparison with previous month */}
      {prevSummary && (prevSummary.totalExpenses > 0 || prevSummary.totalIncome > 0) && (
        <div className="bg-white rounded-2xl p-5 shadow-card space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">vs. mes anterior</h3>

          <div className="space-y-3">
            {/* Expenses comparison */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Gastos</p>
                <p className="text-sm font-bold font-mono text-gray-800">{formatCOP(summary.totalExpenses)}</p>
              </div>
              <div className="text-right">
                {prevExpenses > 0 && (
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                    expenseChange > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  )}>
                    {expenseChange > 0 ? '↑' : '↓'} {Math.abs(Math.round(expenseChange))}%
                  </span>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">antes: {formatCOP(prevExpenses)}</p>
              </div>
            </div>

            {/* Income comparison */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Ingresos</p>
                <p className="text-sm font-bold font-mono text-gray-800">{formatCOP(summary.totalIncome)}</p>
              </div>
              <div className="text-right">
                {prevIncome > 0 && (
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                    incomeChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  )}>
                    {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(Math.round(incomeChange))}%
                  </span>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">antes: {formatCOP(prevIncome)}</p>
              </div>
            </div>

            {/* Savings rate comparison */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Tasa de ahorro</p>
                <p className="text-sm font-bold font-mono text-gray-800">{Math.round(summary.savingsRate)}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400">antes: {Math.round(prevSummary.savingsRate || 0)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {summary.totalExpenses === 0 && summary.totalIncome === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
          <span className="text-3xl">📈</span>
          <p className="text-gray-400 text-sm mt-2">Sin datos para este mes</p>
        </div>
      )}
    </div>
  );
}
