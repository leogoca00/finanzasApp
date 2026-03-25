import { format, startOfMonth, endOfMonth, getDaysInMonth as fnsGetDaysInMonth, differenceInDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return format(new Date(date + 'T12:00:00'), 'dd MMM yyyy', { locale: es });
}

export function formatDateShort(date: string): string {
  return format(new Date(date + 'T12:00:00'), 'dd MMM', { locale: es });
}

export function getMonthName(month: number): string {
  const d = new Date(2024, month - 1, 1);
  return format(d, 'MMMM', { locale: es });
}

export function getCurrentMonth(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getMonthRange(month: number, year: number) {
  const date = new Date(year, month - 1, 1);
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
}

export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateTransferId(): string {
  return crypto.randomUUID();
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function getDaysElapsedInMonth(month: number, year: number): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year === currentYear && month === currentMonth) {
    return now.getDate();
  }
  // Past or future month — return total days
  return fnsGetDaysInMonth(new Date(year, month - 1, 1));
}

export function getTotalDaysInMonth(month: number, year: number): number {
  return fnsGetDaysInMonth(new Date(year, month - 1, 1));
}

export function isCurrentMonth(month: number, year: number): boolean {
  const now = new Date();
  return now.getMonth() + 1 === month && now.getFullYear() === year;
}

export function getAllDatesInMonth(month: number, year: number): string[] {
  const start = new Date(year, month - 1, 1);
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
