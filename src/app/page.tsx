'use client';

import { useState, useEffect, useCallback } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { Toast } from '@/components/ui';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { PayCardModal } from '@/components/accounts/PayCardModal';
import { AccountsView } from '@/components/accounts/AccountsView';
import { BudgetsView } from '@/components/budgets/BudgetsView';
import { StatsView } from '@/components/stats/StatsView';
import {
  getAccounts,
  getAccountBalances,
  getCategories,
  getTransactions,
  createTransaction,
  deleteTransaction,
  getMonthSummary,
  getPreviousMonthSummary,
  createAccount,
  deleteAccount,
  getBudgets,
  upsertBudget,
  deleteBudget,
} from '@/lib/api';
import { Account, AccountWithBalance, Category, Transaction, Budget, FilterState, MonthSummary, TransactionFormData } from '@/types';
import { getCurrentMonth, exportToCSV, formatCOP } from '@/lib/utils';

export default function Home() {
  const [tab, setTab] = useState('dashboard');
  const [showNewTx, setShowNewTx] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [payCardId, setPayCardId] = useState<string | null>(null);

  // Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<MonthSummary | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({ dateFrom: '', dateTo: '', accountId: '', categoryId: '', type: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  // Month navigation
  const { month: curMonth, year: curYear } = getCurrentMonth();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  // Load base data
  const loadBase = useCallback(async () => {
    try {
      const [accs, cats, bals] = await Promise.all([getAccounts(), getCategories(), getAccountBalances()]);
      setAccounts(accs);
      setCategories(cats);
      setAccountBalances(bals);
    } catch (err) {
      console.error('Error loading base data:', err);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const txs = await getTransactions(hasFilters ? filters : undefined);
      setTransactions(txs);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  }, [filters, hasFilters]);

  const loadSummary = useCallback(async () => {
    try {
      const [s, ps] = await Promise.all([
        getMonthSummary(month, year),
        getPreviousMonthSummary(month, year),
      ]);
      setSummary(s);
      setPrevSummary(ps);
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  }, [month, year]);

  const loadBudgets = useCallback(async () => {
    try {
      const b = await getBudgets(month, year);
      setBudgets(b);
    } catch (err) {
      console.error('Error loading budgets:', err);
    }
  }, [month, year]);

  // Initial load
  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    loadSummary();
    loadBudgets();
  }, [loadSummary, loadBudgets]);

  // Reload all after mutations
  const reloadAll = async () => {
    await Promise.all([loadBase(), loadTransactions(), loadSummary(), loadBudgets()]);
  };

  // Handlers
  const handleCreateTransaction = async (data: TransactionFormData) => {
    await createTransaction(data);
    await reloadAll();
    showToast('Transacción registrada');
  };

  const handleDeleteTransaction = async (id: string, transferId?: string | null) => {
    await deleteTransaction(id, transferId);
    await reloadAll();
    showToast('Transacción eliminada');
  };

  const handleCreateAccount = async (data: { name: string; icon: string; color: string; account_type: string; credit_limit?: number }) => {
    await createAccount(data);
    await loadBase();
    showToast('Cuenta creada');
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteAccount(id);
    await reloadAll();
    showToast('Cuenta eliminada');
  };

  const handleUpsertBudget = async (data: { category_id: string; month: number; year: number; amount: number }) => {
    await upsertBudget(data);
    await loadBudgets();
    showToast('Presupuesto guardado');
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteBudget(id);
    await loadBudgets();
    showToast('Presupuesto eliminado');
  };

  const navigateMonth = (dir: 1 | -1) => {
    setMonth((m) => {
      let newMonth = m + dir;
      let newYear = year;
      if (newMonth > 12) { newMonth = 1; newYear++; }
      if (newMonth < 1) { newMonth = 12; newYear--; }
      setYear(newYear);
      return newMonth;
    });
  };

  const handleExport = () => {
    const data = transactions.map((t) => ({
      fecha: t.date,
      tipo: t.type,
      monto: t.amount,
      cuenta: t.account?.name || '',
      categoría: t.category?.name || '',
      descripción: t.description || '',
    }));
    exportToCSV(data, `finanzas-${new Date().toISOString().slice(0, 10)}`);
    showToast('CSV exportado');
  };

  return (
    <div className="min-h-dvh bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-surface-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            <span className="text-brand-600">₱</span> Finanzas
          </h1>
          {tab === 'transactions' && (
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="w-9 h-9 rounded-xl bg-surface-50 flex items-center justify-center text-gray-500 hover:bg-surface-100 transition-colors text-sm"
                title="Exportar CSV"
              >
                📥
              </button>
              <button
                onClick={() => setShowFilters(true)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-sm ${
                  hasFilters ? 'bg-brand-100 text-brand-700' : 'bg-surface-50 text-gray-500 hover:bg-surface-100'
                }`}
                title="Filtros"
              >
                🔍
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {tab === 'dashboard' && (
          <Dashboard
            accounts={accountBalances}
            summary={summary}
            month={month}
            year={year}
            onPrevMonth={() => navigateMonth(-1)}
            onNextMonth={() => navigateMonth(1)}
          />
        )}

        {tab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onDelete={handleDeleteTransaction}
          />
        )}

        {tab === 'budgets' && (
          <BudgetsView
            budgets={budgets}
            categories={categories}
            month={month}
            year={year}
            onPrevMonth={() => navigateMonth(-1)}
            onNextMonth={() => navigateMonth(1)}
            onUpsert={handleUpsertBudget}
            onDelete={handleDeleteBudget}
          />
        )}

        {tab === 'stats' && (
          <StatsView
            summary={summary}
            prevSummary={prevSummary}
            month={month}
            year={year}
            onPrevMonth={() => navigateMonth(-1)}
            onNextMonth={() => navigateMonth(1)}
          />
        )}

        {tab === 'accounts' && (
          <AccountsView
            accounts={accountBalances}
            onCreateAccount={handleCreateAccount}
            onDeleteAccount={handleDeleteAccount}
            onPayCard={(cardId) => setPayCardId(cardId)}
          />
        )}
      </main>

      {/* FAB - Add transaction */}
      <button
        onClick={() => setShowNewTx(true)}
        className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-[180px] w-14 h-14 bg-brand-700 text-white rounded-full shadow-float-lg flex items-center justify-center text-2xl hover:bg-brand-800 active:scale-90 transition-all duration-200 z-40 safe-bottom"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        +
      </button>

      {/* Bottom navigation */}
      <BottomNav active={tab} onChange={setTab} />

      {/* Modals */}
      <TransactionForm
        open={showNewTx}
        onClose={() => setShowNewTx(false)}
        onSubmit={handleCreateTransaction}
        accounts={accounts}
        categories={categories}
      />

      <TransactionFilters
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
        accounts={accounts}
        categories={categories}
      />

      <PayCardModal
        open={!!payCardId}
        cardId={payCardId}
        onClose={() => setPayCardId(null)}
        accounts={accountBalances}
        onSubmit={async (data) => {
          await createTransaction(data);
          await reloadAll();
          setPayCardId(null);
          showToast('Pago de tarjeta registrado');
        }}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
