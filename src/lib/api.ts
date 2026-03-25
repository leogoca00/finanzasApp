import { supabase } from './supabase';
import { Account, AccountWithBalance, Category, Transaction, Budget, TransactionFormData, FilterState } from '@/types';
import { generateTransferId, getMonthRange } from './utils';

// ==================== ACCOUNTS ====================

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function getAccountBalances(): Promise<AccountWithBalance[]> {
  const { data, error } = await supabase
    .from('account_balances')
    .select('*');
  if (error) throw error;
  return (data || []).map((a) => ({
    ...a,
    balance: Number(a.balance),
    credit_limit: Number(a.credit_limit || 0),
  }));
}

export async function createAccount(account: { name: string; icon: string; color: string; account_type: string; credit_limit?: number }): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      ...account,
      credit_limit: account.credit_limit || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

// ==================== CATEGORIES ====================

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  let query = supabase.from('categories').select('*').order('name');
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCategory(category: { name: string; type: string; icon: string; color: string }): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ==================== TRANSACTIONS ====================

export async function getTransactions(filters?: Partial<FilterState>): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*, account:accounts(*), category:categories(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('date', filters.dateTo);
  if (filters?.accountId) query = query.eq('account_id', filters.accountId);
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters?.type) query = query.eq('type', filters.type);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((t) => ({ ...t, amount: Number(t.amount) }));
}

export async function createTransaction(form: TransactionFormData): Promise<void> {
  const amount = parseFloat(form.amount);
  if (isNaN(amount) || amount <= 0) throw new Error('Monto inválido');

  if (form.type === 'transfer') {
    if (!form.destination_account_id) throw new Error('Cuenta destino requerida');
    if (form.account_id === form.destination_account_id) throw new Error('Las cuentas deben ser diferentes');

    const transferId = generateTransferId();

    const { error } = await supabase.from('transactions').insert([
      {
        account_id: form.account_id,
        type: 'expense',
        amount,
        category_id: null,
        date: form.date,
        description: form.description || `Transferencia enviada`,
        transfer_id: transferId,
      },
      {
        account_id: form.destination_account_id,
        type: 'income',
        amount,
        category_id: null,
        date: form.date,
        description: form.description || `Transferencia recibida`,
        transfer_id: transferId,
      },
    ]);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('transactions').insert({
      account_id: form.account_id,
      type: form.type,
      amount,
      category_id: form.category_id || null,
      date: form.date,
      description: form.description || null,
    });
    if (error) throw error;
  }
}

export async function deleteTransaction(id: string, transferId?: string | null): Promise<void> {
  if (transferId) {
    // Delete both parts of a transfer
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('transfer_id', transferId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  }
}

// ==================== BUDGETS ====================

export async function getBudgets(month: number, year: number): Promise<Budget[]> {
  const { start, end } = getMonthRange(month, year);

  const { data: budgets, error: bError } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('month', month)
    .eq('year', year);
  if (bError) throw bError;

  // Get spending per category for the month
  const { data: spending, error: sError } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('type', 'expense')
    .gte('date', start)
    .lte('date', end)
    .not('transfer_id', 'is', null)
    .is('transfer_id', null);
  if (sError) throw sError;

  // Actually we need expenses that are NOT transfers
  const { data: expenses, error: eError } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('type', 'expense')
    .gte('date', start)
    .lte('date', end)
    .is('transfer_id', null);
  if (eError) throw eError;

  const spentMap: Record<string, number> = {};
  (expenses || []).forEach((t) => {
    if (t.category_id) {
      spentMap[t.category_id] = (spentMap[t.category_id] || 0) + Number(t.amount);
    }
  });

  return (budgets || []).map((b) => ({
    ...b,
    amount: Number(b.amount),
    spent: spentMap[b.category_id] || 0,
  }));
}

export async function upsertBudget(budget: { category_id: string; month: number; year: number; amount: number }): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .upsert(budget, { onConflict: 'category_id,month,year' });
  if (error) throw error;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

// ==================== DASHBOARD ====================

export async function getMonthSummary(month: number, year: number) {
  const { start, end } = getMonthRange(month, year);

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .gte('date', start)
    .lte('date', end)
    .is('transfer_id', null);
  if (error) throw error;

  const transactions = (data || []).map((t) => ({ ...t, amount: Number(t.amount) }));

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryMap: Record<string, { category: Category; total: number }> = {};
  transactions
    .filter((t) => t.type === 'expense' && t.category)
    .forEach((t) => {
      const catId = t.category_id!;
      if (!categoryMap[catId]) {
        categoryMap[catId] = { category: t.category!, total: 0 };
      }
      categoryMap[catId].total += t.amount;
    });

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    byCategory: Object.values(categoryMap).sort((a, b) => b.total - a.total),
  };
}
