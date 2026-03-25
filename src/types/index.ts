export type AccountType = 'bank' | 'cash' | 'credit_card';

export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_archived: boolean;
  account_type: AccountType;
  credit_limit: number;
  created_at: string;
}

export interface AccountWithBalance extends Account {
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category_id: string | null;
  date: string;
  description: string | null;
  transfer_id: string | null;
  created_at: string;
  // Joined fields
  account?: Account;
  category?: Category;
}

export interface Budget {
  id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  created_at: string;
  // Joined fields
  category?: Category;
  spent?: number;
}

export interface TransactionFormData {
  type: 'income' | 'expense' | 'transfer';
  amount: string;
  account_id: string;
  category_id: string;
  date: string;
  description: string;
  destination_account_id?: string;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  accountId: string;
  categoryId: string;
  type: string;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: { category: Category; total: number }[];
}
