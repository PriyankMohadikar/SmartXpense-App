'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Download, Trash2, Edit2, X, ChevronLeft, ChevronRight, Receipt, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Net_Banking'];
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#6366f1', Transport: '#10b981', Shopping: '#f59e0b',
  Bills: '#ef4444', Health: '#14b8a6', Entertainment: '#a855f7', Other: '#64748b',
};
const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

interface Expense {
  id: string; amount: number; category: string; payment_method: string;
  description?: string; merchant?: string; is_recurring: boolean; expense_date: string;
}

interface ExpenseForm {
  amount: string; category: string; payment_method: string;
  description: string; merchant: string; is_recurring: boolean; expense_date: string;
}

export default function ExpensesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', category: '', payment_method: '', month: '', year: '', sort_by: 'expense_date', sort_order: 'desc' });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ExpenseForm>();

  useEffect(() => { if (!isLoading && !user) router.push('/login'); }, [isLoading, user, router]);

  const fetchExpenses = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10', ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await api.get(`/api/expenses?${params}`);
      setExpenses(data.expenses);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { if (user) fetchExpenses(); }, [user, fetchExpenses]);

  const openDrawer = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setValue('amount', String(expense.amount));
      setValue('category', expense.category);
      setValue('payment_method', expense.payment_method);
      setValue('description', expense.description || '');
      setValue('merchant', expense.merchant || '');
      setValue('is_recurring', expense.is_recurring);
      setValue('expense_date', expense.expense_date.split('T')[0]);
    } else {
      setEditingExpense(null);
      reset({ amount: '', category: 'Food', payment_method: 'UPI', description: '', merchant: '', is_recurring: false, expense_date: format(new Date(), 'yyyy-MM-dd') });
    }
    setDrawerOpen(true);
  };

  const onSubmit = async (data: ExpenseForm) => {
    try {
      const payload = { ...data, expense_date: new Date(data.expense_date).toISOString() };
      if (editingExpense) {
        await api.put(`/api/expenses/${editingExpense.id}`, payload);
        toast.success('Expense updated');
      } else {
        await api.post('/api/expenses', payload);
        toast.success('Expense added');
      }
      setDrawerOpen(false);
      fetchExpenses();
    } catch (err) {
      toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/expenses/${deleteId}`);
      toast.success('Expense deleted');
      setDeleteId(null);
      fetchExpenses();
    } catch {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      toast.error('Failed to delete');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([k, v]) => v && ['month', 'year', 'category', 'payment_method'].includes(k))));
      const { data } = await api.get(`/api/expenses/export/csv?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a'); a.href = url; a.download = `smartxpense-expenses.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch { toast.error('Export failed'); }
  };

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Expenses</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{pagination.total} transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} />Export CSV
          </button>
          <button onClick={() => openDrawer()} id="add-expense-btn" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative col-span-2 sm:col-span-3 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input className="input pl-9 text-sm" placeholder="Search description or merchant..." value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>
          <select className="input text-sm" value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input text-sm" value={filters.payment_method} onChange={(e) => setFilters(f => ({ ...f, payment_method: e.target.value }))}>
            <option value="">All Methods</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select>
          <select className="input text-sm" value={filters.month} onChange={(e) => setFilters(f => ({ ...f, month: e.target.value }))}>
            <option value="">All Months</option>
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
          <select className="input text-sm" value={filters.sort_by + '_' + filters.sort_order} onChange={(e) => {
            const [field, order] = e.target.value.split('_');
            setFilters(f => ({ ...f, sort_by: field, sort_order: order }));
          }}>
            <option value="expense_date_desc">Date (Newest)</option>
            <option value="expense_date_asc">Date (Oldest)</option>
            <option value="amount_desc">Amount (High→Low)</option>
            <option value="amount_asc">Amount (Low→High)</option>
          </select>
        </div>
      </div>

      {/* Expense List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No expenses found</p>
            <p className="text-sm text-slate-400 mt-1">Add your first expense to get started</p>
            <button onClick={() => openDrawer()} className="btn-primary mt-4 text-sm">Add Expense</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {expenses.map((expense) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group hover:-translate-y-px"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}20` }}>
                  <span className="text-lg">
                    {expense.category === 'Food' ? '🍔' : expense.category === 'Transport' ? '🚗' : expense.category === 'Shopping' ? '🛍️' : expense.category === 'Bills' ? '📋' : expense.category === 'Health' ? '🏥' : expense.category === 'Entertainment' ? '🎬' : '📦'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{expense.description || expense.category}</p>
                    {expense.is_recurring && (
                      <span className="badge bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <RefreshCw size={10} />Recurring
                      </span>
                    )}
                    <span className="badge" style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}15`, color: CATEGORY_COLORS[expense.category] }}>
                      {expense.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {format(new Date(expense.expense_date), 'MMM d, yyyy')} · {expense.payment_method.replace('_', ' ')}
                    {expense.merchant && ` · ${expense.merchant}`}
                  </p>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white shrink-0">{currencySymbol}{Number(expense.amount).toFixed(2)}</p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openDrawer(expense)} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setDeleteId(expense.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => fetchExpenses(pagination.page - 1)} disabled={pagination.page === 1} className="btn-secondary p-2 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => fetchExpenses(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="btn-secondary p-2 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
                <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                <div>
                  <label className="label">Amount ({currencySymbol})</label>
                  <input {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be > 0' } })} type="number" step="0.01" className={`input ${errors.amount ? 'border-red-500' : ''}`} placeholder="0.00" id="drawer-amount" />
                  {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Category</label>
                    <select {...register('category', { required: true })} className="input" id="drawer-category">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Payment Method</label>
                    <select {...register('payment_method', { required: true })} className="input" id="drawer-payment">
                      {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input {...register('expense_date', { required: 'Date is required' })} type="date" className="input" id="drawer-date" />
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <input {...register('description')} className="input" placeholder="e.g. Lunch at office" id="drawer-desc" />
                </div>
                <div>
                  <label className="label">Merchant (optional)</label>
                  <input {...register('merchant')} className="input" placeholder="e.g. Swiggy, Amazon" id="drawer-merchant" />
                </div>
                <div className="flex items-center gap-3">
                  <input {...register('is_recurring')} type="checkbox" id="drawer-recurring" className="w-4 h-4 rounded border-slate-300 text-indigo-500" />
                  <label htmlFor="drawer-recurring" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Recurring expense</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">{editingExpense ? 'Update' : 'Add Expense'}</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} exit={{ scale: 0.9, opacity: 0 }}
                animate={shaking ? { x: [-6, 6, -6, 6, 0] } : { scale: 1, opacity: 1 }}
                className="card p-6 max-w-sm w-full"
              >
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="text-red-500" size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-2">Delete Expense?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-5">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
